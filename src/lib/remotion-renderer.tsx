import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";

/**
 * Simple JSX-to-createElement transform for common patterns.
 * Handles self-closing and paired tags with style props.
 */
function naiveJsxTransform(code: string): string {
  // Replace self-closing tags: <TagName ... />
  let result = code.replace(
    /<(\w+)\s+([^>]*?)\/>/g,
    (_, tag, attrs) => {
      const props = transformAttrs(attrs);
      return `React.createElement("${tag.toLowerCase()}", ${props})`;
    }
  );

  // Replace opening + closing tags (non-greedy, innermost first)
  let prev = "";
  let iterations = 0;
  while (prev !== result && iterations < 20) {
    prev = result;
    iterations++;
    result = result.replace(
      /<(\w+)(\s[^>]*)?>([^<]*)<\/\1>/g,
      (_, tag, attrs, children) => {
        const props = attrs ? transformAttrs(attrs) : "null";
        const trimmed = children.trim();
        if (!trimmed) return `React.createElement("${tag.toLowerCase()}", ${props})`;
        // Check if children look like code (React.createElement) or just text
        if (trimmed.startsWith("React.createElement") || trimmed.includes("{")) {
          return `React.createElement("${tag.toLowerCase()}", ${props}, ${trimmed})`;
        }
        return `React.createElement("${tag.toLowerCase()}", ${props}, "${trimmed.replace(/"/g, '\\"')}")`;
      }
    );
  }

  return result;
}

function transformAttrs(attrs: string): string {
  if (!attrs || !attrs.trim()) return "null";
  // Simple: if it has style={...} or className={...}, keep as-is in object form
  // For the common case of style={{...}}, extract it
  const styleMatch = attrs.match(/style=\{(\{[\s\S]*?\})\}/);
  if (styleMatch) {
    return `{ style: ${styleMatch[1]} }`;
  }
  return "null";
}

/**
 * Takes AI-generated component code (function body) and returns a React component
 * that can be passed to Remotion's <Player>.
 */
export function createRemotionComponent(code: string): React.FC {
  return function DynamicComposition() {
    try {
      let processedCode = code;

      // Detect JSX and attempt transform
      if (processedCode.includes("<") && processedCode.includes("/>") || processedCode.match(/<\w+[\s>]/)) {
        try {
          processedCode = naiveJsxTransform(processedCode);
        } catch {
          // If transform fails, try original
        }
      }

      const fn = new Function(
        "React",
        "useCurrentFrame",
        "useVideoConfig",
        "interpolate",
        "spring",
        "Easing",
        processedCode
      );
      const result = fn(React, useCurrentFrame, useVideoConfig, interpolate, spring, Easing);
      if (React.isValidElement(result)) {
        return result;
      }
      return React.createElement("div", {
        style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#ff6b6b", fontFamily: "monospace", fontSize: 14, padding: 20 }
      }, "Component did not return valid JSX.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return React.createElement("div", {
        style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#ff6b6b", fontFamily: "monospace", fontSize: 14, padding: 20, textAlign: "center" }
      }, `Render error: ${message}`);
    }
  };
}
