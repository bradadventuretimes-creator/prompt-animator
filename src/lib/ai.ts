import * as webllm from "@mlc-ai/web-llm";
import { validateRemotionScene } from "./scene-validation";
import type { RemotionScene } from "./scene-types";

let engine: webllm.MLCEngine | null = null;

const GENERATE_SYSTEM_PROMPT = `You are a motion graphics code generator. You output ONLY a JSON object, nothing else.

The JSON has this structure:
{"code":"...","width":1280,"height":720,"fps":30,"durationInFrames":150,"voiceoverText":"optional narration text"}

CRITICAL RULES:
- The "code" field is a JavaScript function body (NOT JSX).
- You MUST use React.createElement() instead of JSX tags like <div>. NEVER use < or > for HTML elements.
- The code has access to: useCurrentFrame, useVideoConfig, interpolate, spring, Easing, React
- The code MUST end with a return statement returning React.createElement(...)
- Output ONLY the JSON object. No markdown, no backticks, no explanation.
- Properly escape all strings inside JSON (use \\n for newlines, \\" for quotes).
- USE THE FULL DURATION. Animate across ALL frames. If the user wants 20 seconds at 30fps, that's 600 frames — spread your animations across ALL 600 frames, not just the first 90.
- Create multiple stages/phases of animation that span the entire duration.
- The "voiceoverText" field should contain narration text suitable for the video if appropriate.

AVAILABLE APIs:
- useCurrentFrame() returns current frame number
- useVideoConfig() returns { fps, width, height, durationInFrames }
- interpolate(value, inputRange, outputRange, options?) maps values. Options: { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
- spring({ frame, fps, config? }) spring animation. Config: { damping, stiffness, mass }
- React.createElement(type, props, ...children)

EXAMPLE - Multi-phase animation across full duration:
{"code":"var frame = useCurrentFrame();\\nvar config = useVideoConfig();\\nvar dur = config.durationInFrames;\\nvar phase1 = interpolate(frame, [0, dur*0.2], [0, 1], { extrapolateRight: \\"clamp\\" });\\nvar phase2 = interpolate(frame, [dur*0.3, dur*0.5], [0, 1], { extrapolateRight: \\"clamp\\" });\\nvar phase3 = interpolate(frame, [dur*0.6, dur*0.8], [0, 1], { extrapolateRight: \\"clamp\\" });\\nreturn React.createElement(\\"div\\", { style: { width: config.width, height: config.height, background: \\"#1a1a2e\\", display: \\"flex\\", flexDirection: \\"column\\", alignItems: \\"center\\", justifyContent: \\"center\\" } }, React.createElement(\\"div\\", { style: { fontSize: 48, color: \\"white\\", opacity: phase1 } }, \\"Title\\"), React.createElement(\\"div\\", { style: { fontSize: 24, color: \\"#aaa\\", opacity: phase2, marginTop: 20 } }, \\"Subtitle\\"), React.createElement(\\"div\\", { style: { fontSize: 18, color: \\"#888\\", opacity: phase3, marginTop: 40 } }, \\"Call to Action\\"));","width":1280,"height":720,"fps":30,"durationInFrames":300,"voiceoverText":"Welcome to our product. Here is what makes it great. Try it today."}

DO NOT output anything except the JSON object.`;

const CHAT_SYSTEM_PROMPT = `You are a creative video production assistant. You help users plan and refine their video ideas.

Your role:
- Ask clarifying questions about the video (tone, style, target audience, key messages, length)
- Suggest creative ideas and improvements
- When the user is ready to generate, tell them to say "generate" or "create it"
- Keep responses concise and helpful (2-3 sentences max)
- If the user gives a vague request, ask 1-2 specific questions before generating

DO NOT output code or JSON. Just have a natural conversation.`;

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

/** Parse duration from user prompt */
export function parseDuration(prompt: string, fps: number): number | null {
  const match = prompt.match(/(\d+)\s*(second|sec|s|minute|min|m)\b/i);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const seconds = unit.startsWith("m") ? num * 60 : num;
  return seconds * fps;
}

/** Extract scene from AI output with multiple fallback strategies */
function parseAIOutput(content: string): { componentCode: string; width: number; height: number; fps: number; durationInFrames: number; voiceoverText?: string } | null {
  const trimmed = content.trim();

  // Strategy 1: Direct JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.code) return buildResult(parsed);
  } catch { /* continue */ }

  // Strategy 2: Extract from markdown fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (parsed.code) return buildResult(parsed);
    } catch { /* continue */ }
  }

  // Strategy 3: Find JSON object in the string
  const jsonMatch = trimmed.match(/\{[\s\S]*"code"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.code) return buildResult(parsed);
    } catch { /* continue */ }
  }

  // Strategy 4: Extract code field via regex
  const codeMatch = trimmed.match(/"code"\s*:\s*"([\s\S]*?)"\s*,\s*"width"/);
  if (codeMatch) {
    const code = codeMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    const widthMatch = trimmed.match(/"width"\s*:\s*(\d+)/);
    const heightMatch = trimmed.match(/"height"\s*:\s*(\d+)/);
    const fpsMatch = trimmed.match(/"fps"\s*:\s*(\d+)/);
    const durMatch = trimmed.match(/"durationInFrames"\s*:\s*(\d+)/);
    const voMatch = trimmed.match(/"voiceoverText"\s*:\s*"([^"]*)"/);
    return {
      componentCode: code,
      width: widthMatch ? parseInt(widthMatch[1]) : 1280,
      height: heightMatch ? parseInt(heightMatch[1]) : 720,
      fps: fpsMatch ? parseInt(fpsMatch[1]) : 30,
      durationInFrames: durMatch ? parseInt(durMatch[1]) : 150,
      voiceoverText: voMatch ? voMatch[1] : undefined,
    };
  }

  // Strategy 5: If it looks like raw code
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

function buildResult(parsed: Record<string, unknown>): { componentCode: string; width: number; height: number; fps: number; durationInFrames: number; voiceoverText?: string } | null {
  const validated = validateRemotionScene(parsed);
  if (!validated) return null;
  return {
    ...validated,
    voiceoverText: typeof parsed.voiceoverText === "string" ? parsed.voiceoverText : undefined,
  };
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

/** Conversational chat — no code generation */
export async function chatWithAI(
  messages: ChatHistoryMessage[],
  onToken: (accumulated: string) => void
): Promise<string> {
  if (!engine) throw new Error("Model not loaded. Go to Settings to download the AI model first.");

  const chatMessages: webllm.ChatCompletionMessageParam[] = [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  let accumulated = "";
  const chunks = await engine.chat.completions.create({
    messages: chatMessages,
    temperature: 0.7,
    max_tokens: 500,
    stream: true,
  });

  for await (const chunk of chunks) {
    const delta = chunk.choices[0]?.delta?.content || "";
    accumulated += delta;
    onToken(accumulated);
  }

  return accumulated;
}

/** Generate scene code — context-aware, duration-aware */
export async function generateSceneStreaming(
  prompt: string,
  onToken: (accumulated: string) => void,
  options?: {
    existingCode?: string;
    messageHistory?: ChatHistoryMessage[];
    forceDurationFrames?: number;
    fps?: number;
  }
): Promise<RemotionScene & { voiceoverText?: string }> {
  if (!engine) throw new Error("Model not loaded. Go to Settings to download the AI model first.");

  const fps = options?.fps || 30;
  const requestedDuration = options?.forceDurationFrames || parseDuration(prompt, fps);

  let systemPrompt = GENERATE_SYSTEM_PROMPT;

  if (requestedDuration) {
    const secs = requestedDuration / fps;
    systemPrompt += `\n\nIMPORTANT: The user requested a ${secs} second video. Set durationInFrames to ${requestedDuration}. Spread animations across ALL ${requestedDuration} frames.`;
  }

  if (options?.existingCode) {
    systemPrompt += `\n\nHere is the CURRENT code for this scene. MODIFY it based on the user's request — do not start from scratch:\n\`\`\`\n${options.existingCode}\n\`\`\``;
  }

  const messages: webllm.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  if (options?.messageHistory) {
    for (const m of options.messageHistory.slice(-6)) {
      messages.push({ role: m.role as "user" | "assistant", content: m.content });
    }
  }

  messages.push({ role: "user", content: prompt });

  let accumulated = "";
  const chunks = await engine.chat.completions.create({
    messages,
    temperature: 0.2,
    max_tokens: 3000,
    stream: true,
  });

  for await (const chunk of chunks) {
    const delta = chunk.choices[0]?.delta?.content || "";
    accumulated += delta;
    onToken(accumulated);
  }

  const parsed = parseAIOutput(accumulated);
  if (!parsed) {
    throw new Error("Could not parse AI output. Try a simpler prompt.");
  }

  if (requestedDuration) {
    parsed.durationInFrames = requestedDuration;
  }

  const scene: RemotionScene = {
    id: crypto.randomUUID(),
    name: prompt.slice(0, 40),
    componentCode: parsed.componentCode,
    width: parsed.width,
    height: parsed.height,
    fps: parsed.fps,
    durationInFrames: parsed.durationInFrames,
  };

  return {
    ...scene,
    voiceoverText: parsed.voiceoverText,
  };
}

export function isModelLoaded(): boolean {
  return engine !== null;
}
