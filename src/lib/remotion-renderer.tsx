import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";

/**
 * Balance parentheses/brackets in code to prevent "missing ) after argument list" errors.
 */
function balanceBrackets(code: string): string {
  let parens = 0;
  let brackets = 0;
  let braces = 0;
  let inString = false;
  let stringChar = "";
  let escaped = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (inString) {
      if (ch === stringChar) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inString = true; stringChar = ch; continue; }
    if (ch === "(") parens++;
    else if (ch === ")") parens--;
    else if (ch === "[") brackets++;
    else if (ch === "]") brackets--;
    else if (ch === "{") braces++;
    else if (ch === "}") braces--;
  }

  let result = code;
  while (parens > 0) { result += ")"; parens--; }
  while (brackets > 0) { result += "]"; brackets--; }
  while (braces > 0) { result += "}"; braces--; }
  return result;
}

/**
 * Simple JSX-to-createElement transform for common patterns.
 */
function naiveJsxTransform(code: string): string {
  let result = code.replace(
    /<(\w+)\s+([^>]*?)\/>/g,
    (_, tag, attrs) => {
      const props = transformAttrs(attrs);
      return `React.createElement("${tag.toLowerCase()}", ${props})`;
    }
  );

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
  const styleMatch = attrs.match(/style=\{(\{[\s\S]*?\})\}/);
  if (styleMatch) {
    return `{ style: ${styleMatch[1]} }`;
  }
  return "null";
}

/**
 * Takes AI-generated component code (function body) and returns a React component.
 */
export function createRemotionComponent(code: string): React.FC {
  return function DynamicComposition() {
    try {
      let processedCode = code;

      // Detect JSX and attempt transform
      if (processedCode.includes("<") && (processedCode.includes("/>") || processedCode.match(/<\w+[\s>]/))) {
        try {
          processedCode = naiveJsxTransform(processedCode);
        } catch {
          // If transform fails, try original
        }
      }

      // Balance unmatched brackets/parens
      processedCode = balanceBrackets(processedCode);

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
        style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#ff6b6b", fontFamily: "monospace", fontSize: 13, padding: 20, textAlign: "center", gap: 8 }
      },
        React.createElement("div", null, `Render error: ${message}`),
        React.createElement("div", { style: { fontSize: 10, color: "#888", maxWidth: 400 } }, "Try regenerating with a simpler prompt.")
      );
    }
  };
}
