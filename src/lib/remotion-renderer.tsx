import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";

/**
 * Takes AI-generated component code (function body) and returns a React component
 * that can be passed to Remotion's <Player>.
 */
export function createRemotionComponent(code: string): React.FC {
  return function DynamicComposition() {
    try {
      const fn = new Function(
        "React",
        "useCurrentFrame",
        "useVideoConfig",
        "interpolate",
        "spring",
        "Easing",
        code
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
