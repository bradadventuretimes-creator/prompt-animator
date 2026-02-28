import * as webllm from "@mlc-ai/web-llm";
import { validateRemotionScene } from "./scene-validation";
import type { RemotionScene } from "./scene-types";

let engine: webllm.MLCEngine | null = null;

const SYSTEM_PROMPT = `You are a motion graphics code generator. You output ONLY a JSON object, nothing else.

The JSON has this structure:
{"code":"...","width":1280,"height":720,"fps":30,"durationInFrames":150}

CRITICAL RULES:
- The "code" field is a JavaScript function body (NOT JSX).
- You MUST use React.createElement() instead of JSX tags like <div>. NEVER use < or > for HTML elements.
- The code has access to: useCurrentFrame, useVideoConfig, interpolate, spring, Easing, React
- The code MUST end with a return statement returning React.createElement(...)
- Output ONLY the JSON object. No markdown, no backticks, no explanation.
- Properly escape all strings inside JSON (use \\n for newlines, \\" for quotes).

AVAILABLE APIs:
- useCurrentFrame() returns current frame number
- useVideoConfig() returns { fps, width, height, durationInFrames }
- interpolate(value, inputRange, outputRange, options?) maps values. Options: { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
- spring({ frame, fps, config? }) spring animation. Config: { damping, stiffness, mass }
- React.createElement(type, props, ...children)

EXAMPLE 1 - Fade in text:
{"code":"var frame = useCurrentFrame();\\nvar config = useVideoConfig();\\nvar opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: \\"clamp\\" });\\nreturn React.createElement(\\"div\\", { style: { width: config.width, height: config.height, background: \\"#1a1a2e\\", display: \\"flex\\", alignItems: \\"center\\", justifyContent: \\"center\\" } }, React.createElement(\\"div\\", { style: { fontSize: 48, color: \\"white\\", opacity: opacity } }, \\"Hello World\\"));","width":1280,"height":720,"fps":30,"durationInFrames":90}

EXAMPLE 2 - Moving circle:
{"code":"var frame = useCurrentFrame();\\nvar config = useVideoConfig();\\nvar x = interpolate(frame, [0, config.durationInFrames], [0, config.width - 60], { extrapolateRight: \\"clamp\\" });\\nvar y = Math.sin(frame * 0.1) * 100 + config.height / 2;\\nreturn React.createElement(\\"div\\", { style: { width: config.width, height: config.height, background: \\"#0a0a1a\\", position: \\"relative\\" } }, React.createElement(\\"div\\", { style: { position: \\"absolute\\", left: x, top: y, width: 60, height: 60, borderRadius: \\"50%\\", background: \\"#e6aa3c\\" } }));","width":1280,"height":720,"fps":30,"durationInFrames":150}

EXAMPLE 3 - Multiple elements with spring:
{"code":"var frame = useCurrentFrame();\\nvar config = useVideoConfig();\\nvar s = spring({ frame: frame, fps: config.fps, config: { damping: 12 } });\\nvar op = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: \\"clamp\\" });\\nreturn React.createElement(\\"div\\", { style: { width: config.width, height: config.height, background: \\"linear-gradient(135deg, #1a1a2e, #0f3460)\\", display: \\"flex\\", flexDirection: \\"column\\", alignItems: \\"center\\", justifyContent: \\"center\\" } }, React.createElement(\\"div\\", { style: { width: 100, height: 100, borderRadius: \\"50%\\", background: \\"#e6aa3c\\", transform: \\"scale(\\" + s + \\")\\" } }), React.createElement(\\"div\\", { style: { fontSize: 36, color: \\"white\\", marginTop: 20, opacity: op } }, \\"Spring Animation\\"));","width":1280,"height":720,"fps":30,"durationInFrames":120}

DO NOT output anything except the JSON object.`;

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

/** Extract scene from AI output with multiple fallback strategies */
function parseAIOutput(content: string): RemotionScene | null {
  const trimmed = content.trim();

  // Strategy 1: Direct JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    const scene = validateRemotionScene(parsed);
    if (scene) return scene;
  } catch { /* continue */ }

  // Strategy 2: Extract from markdown fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      const scene = validateRemotionScene(parsed);
      if (scene) return scene;
    } catch { /* continue */ }
  }

  // Strategy 3: Find JSON object in the string
  const jsonMatch = trimmed.match(/\{[\s\S]*"code"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const scene = validateRemotionScene(parsed);
      if (scene) return scene;
    } catch { /* continue */ }
  }

  // Strategy 4: Extract code field via regex
  const codeMatch = trimmed.match(/"code"\s*:\s*"([\s\S]*?)"\s*,\s*"width"/);
  if (codeMatch) {
    const code = codeMatch[1]
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
    const widthMatch = trimmed.match(/"width"\s*:\s*(\d+)/);
    const heightMatch = trimmed.match(/"height"\s*:\s*(\d+)/);
    const fpsMatch = trimmed.match(/"fps"\s*:\s*(\d+)/);
    const durMatch = trimmed.match(/"durationInFrames"\s*:\s*(\d+)/);
    return {
      componentCode: code,
      width: widthMatch ? parseInt(widthMatch[1]) : 1280,
      height: heightMatch ? parseInt(heightMatch[1]) : 720,
      fps: fpsMatch ? parseInt(fpsMatch[1]) : 30,
      durationInFrames: durMatch ? parseInt(durMatch[1]) : 150,
    };
  }

  // Strategy 5: If it looks like raw code with return + React.createElement
  if (trimmed.includes("return") && trimmed.includes("React.createElement")) {
    return {
      componentCode: trimmed,
      width: 1280,
      height: 720,
      fps: 30,
      durationInFrames: 150,
    };
  }

  return null;
}

export async function generateSceneStreaming(
  prompt: string,
  onToken: (accumulated: string) => void
): Promise<RemotionScene> {
  if (!engine) throw new Error("Model not loaded. Go to Settings to download the AI model first.");

  let accumulated = "";

  const chunks = await engine.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 2500,
    stream: true,
  });

  for await (const chunk of chunks) {
    const delta = chunk.choices[0]?.delta?.content || "";
    accumulated += delta;
    onToken(accumulated);
  }

  const scene = parseAIOutput(accumulated);
  if (!scene) {
    throw new Error("Could not parse AI output. Try a simpler prompt.");
  }
  return scene;
}

/** Legacy non-streaming generate (kept for compatibility) */
export async function generateScene(prompt: string): Promise<RemotionScene> {
  if (!engine) throw new Error("Model not loaded. Go to Settings to download the AI model first.");

  const reply = await engine.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 2500,
  });

  const content = reply.choices[0]?.message?.content || "";
  const scene = parseAIOutput(content);
  if (!scene) {
    throw new Error("Could not parse AI output. Try a simpler prompt.");
  }
  return scene;
}

export function isModelLoaded(): boolean {
  return engine !== null;
}
