import type { RemotionScene } from "./scene-types";

export const DEFAULT_REMOTION_SCENE: RemotionScene = {
  width: 1280,
  height: 720,
  fps: 30,
  durationInFrames: 180,
  componentCode: `var frame = useCurrentFrame();
var config = useVideoConfig();

var titleOpacity = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: "clamp" });
var titleY = interpolate(frame, [10, 40], [40, 0], { extrapolateRight: "clamp" });
var subtitleOpacity = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" });
var circleScale = spring({ frame: frame - 20, fps: config.fps, config: { damping: 12 } });

return React.createElement("div", {
  style: {
    width: config.width, height: config.height,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    fontFamily: "system-ui, sans-serif", position: "relative", overflow: "hidden"
  }
},
  React.createElement("div", {
    style: {
      position: "absolute", width: 120, height: 120, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(230,170,60,0.4) 0%, transparent 70%)",
      transform: "scale(" + circleScale + ")", top: "25%", left: "15%"
    }
  }),
  React.createElement("div", {
    style: {
      position: "absolute", width: 80, height: 80, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(140,80,220,0.3) 0%, transparent 70%)",
      transform: "scale(" + (circleScale * 0.8) + ")", bottom: "20%", right: "20%"
    }
  }),
  React.createElement("div", {
    style: {
      fontSize: 52, fontWeight: 700, color: "#e0e0ff",
      opacity: titleOpacity, transform: "translateY(" + titleY + "px)",
      textShadow: "0 2px 20px rgba(230,170,60,0.3)"
    }
  }, "Welcome to JavaMotion"),
  React.createElement("div", {
    style: {
      fontSize: 24, color: "#8888cc", marginTop: 16,
      opacity: subtitleOpacity
    }
  }, "Describe your animation and let AI create it")
);`,
  metadata: {
    title: "Welcome",
    description: "Default welcome animation",
  },
};
