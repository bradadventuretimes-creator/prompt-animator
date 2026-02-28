import type { RemotionScene } from "./scene-types";

export const DEFAULT_REMOTION_SCENE: RemotionScene = {
  width: 1280,
  height: 720,
  fps: 30,
  durationInFrames: 180,
  componentCode: `const frame = useCurrentFrame();
const { fps, width, height } = useVideoConfig();

const titleOpacity = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: "clamp" });
const titleY = interpolate(frame, [10, 40], [40, 0], { extrapolateRight: "clamp" });

const subtitleOpacity = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" });
const subtitleY = interpolate(frame, [60, 90], [30, 0], { extrapolateRight: "clamp" });

const circleScale = spring({ frame: frame - 20, fps, config: { damping: 12 } });

return (
  <div style={{
    width, height, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    fontFamily: "system-ui, sans-serif", position: "relative", overflow: "hidden"
  }}>
    <div style={{
      position: "absolute", width: 120, height: 120, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(230,170,60,0.4) 0%, transparent 70%)",
      transform: \`scale(\${circleScale})\`, top: "25%", left: "15%"
    }} />
    <div style={{
      position: "absolute", width: 80, height: 80, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(140,80,220,0.3) 0%, transparent 70%)",
      transform: \`scale(\${circleScale * 0.8})\`, bottom: "20%", right: "20%"
    }} />
    <h1 style={{
      fontSize: 52, fontWeight: 700, color: "#e0e0ff",
      opacity: titleOpacity, transform: \`translateY(\${titleY}px)\`,
      textShadow: "0 2px 20px rgba(230,170,60,0.3)"
    }}>
      Welcome to JavaMotion
    </h1>
    <p style={{
      fontSize: 24, color: "#8888cc", marginTop: 16,
      opacity: subtitleOpacity, transform: \`translateY(\${subtitleY}px)\`
    }}>
      Describe your animation and let AI create it
    </p>
  </div>
);`,
  metadata: {
    title: "Welcome",
    description: "Default welcome animation",
  },
};
