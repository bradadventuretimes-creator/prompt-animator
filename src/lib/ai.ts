import * as webllm from "@mlc-ai/web-llm";
import { validateRemotionScene } from "./scene-validation";
import type { RemotionScene } from "./scene-types";

let engine: webllm.MLCEngine | null = null;

const SYSTEM_PROMPT = `You are a motion graphics generator that outputs React component code for Remotion.
You MUST output ONLY valid JSON with NO markdown, NO explanations, NO code blocks.

Output this exact JSON structure:
{
  "code": "...component body code...",
  "width": 1280,
  "height": 720,
  "fps": 30,
  "durationInFrames": 180
}

The "code" field contains the BODY of a React function component. These variables are available:
- useCurrentFrame() - returns current frame number
- useVideoConfig() - returns { fps, width, height, durationInFrames }
- interpolate(value, inputRange, outputRange, options?) - maps values between ranges. Options: { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
- spring({ frame, fps, config? }) - spring animation. Config: { damping, stiffness, mass }
- Easing - easing functions (Easing.bezier, Easing.ease, etc.)
- React - for React.createElement if needed

The code must end with a return statement returning JSX using inline styles.
Use <div> elements with position: absolute for shapes. Use CSS transforms for animation.
Keep durationInFrames reasonable (90-300 frames at 30fps = 3-10 seconds).

Example code value:
const frame = useCurrentFrame();
const { fps, width, height } = useVideoConfig();
const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
const scale = spring({ frame, fps, config: { damping: 12 } });
return (
  <div style={{ width, height, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ fontSize: 48, color: "white", opacity, transform: \`scale(\${scale})\` }}>Hello World</div>
  </div>
);

IMPORTANT: Output ONLY the JSON object. The code field is a string, properly escaped.`;

export async function loadModel(
  onProgress: (progress: number, text: string) => void
): Promise<void> {
  if (engine) return;
  engine = new webllm.MLCEngine();
  engine.setInitProgressCallback((report) => {
    const pct = Math.round(report.progress * 100);
    onProgress(pct, report.text);
  });
  await engine.reload("Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC");
}

export async function generateScene(prompt: string): Promise<RemotionScene> {
  if (!engine) throw new Error("Model not loaded");

  const reply = await engine.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 3000,
  });

  const content = reply.choices[0]?.message?.content || "";

  let jsonStr = content.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("AI returned invalid JSON. Please try rephrasing your prompt.");
  }

  const scene = validateRemotionScene(parsed);
  if (!scene) {
    throw new Error("AI output did not match the expected scene format. Please try again.");
  }

  return scene;
}

export function isModelLoaded(): boolean {
  return engine !== null;
}
