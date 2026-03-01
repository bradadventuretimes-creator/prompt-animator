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
- USE THE FULL DURATION. Animate across ALL frames.
- Create multiple stages/phases of animation that span the entire duration.
- The "voiceoverText" field should contain narration text suitable for the video if appropriate.

AVAILABLE APIs:
- useCurrentFrame() returns current frame number
- useVideoConfig() returns { fps, width, height, durationInFrames }
- interpolate(value, inputRange, outputRange, options?) maps values. Options: { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
- spring({ frame, fps, config? }) spring animation. Config: { damping, stiffness, mass }
- React.createElement(type, props, ...children)

DESIGN PRINCIPLES — CREATE RICH MOTION GRAPHICS:
- Use geometric shapes (circles, rectangles, lines) as visual elements using div with borderRadius, gradients
- Layer multiple elements: background layer, midground shapes, foreground text
- Use advanced animations: spring-based entrances, parallax movement, scaling, rotation via CSS transform
- Use linear-gradient and radial-gradient backgrounds for visual depth
- Create logo-like elements using styled divs (circles with initials, abstract shapes)
- Animate position, scale, rotation, and opacity TOGETHER for richness
- Use spring() for natural-feeling entrances, interpolate for smooth transitions
- Spread animations across the ENTIRE duration in multiple phases

HELPER FUNCTIONS — You can define reusable helpers before the return:
  var makeCircle = function(x, y, size, color, delay) {
    var s = spring({ frame: frame - delay, fps: fps, config: { damping: 12 } });
    return React.createElement("div", { style: { position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: color, transform: "scale(" + s + ")", opacity: s } });
  };

EXAMPLE 1 — Logo reveal with shapes:
{"code":"var frame = useCurrentFrame();\\nvar config = useVideoConfig();\\nvar dur = config.durationInFrames;\\nvar logoScale = spring({ frame: frame, fps: config.fps, config: { damping: 10, stiffness: 80 } });\\nvar textOp = interpolate(frame, [dur*0.2, dur*0.35], [0, 1], { extrapolateLeft: \\"clamp\\", extrapolateRight: \\"clamp\\" });\\nvar lineW = interpolate(frame, [dur*0.3, dur*0.5], [0, 200], { extrapolateLeft: \\"clamp\\", extrapolateRight: \\"clamp\\" });\\nvar tagOp = interpolate(frame, [dur*0.5, dur*0.7], [0, 1], { extrapolateLeft: \\"clamp\\", extrapolateRight: \\"clamp\\" });\\nvar bgShift = interpolate(frame, [0, dur], [0, 30], { extrapolateRight: \\"clamp\\" });\\nreturn React.createElement(\\"div\\", { style: { width: config.width, height: config.height, background: \\"linear-gradient(135deg, #0f0c29, #302b63, #24243e)\\", display: \\"flex\\", flexDirection: \\"column\\", alignItems: \\"center\\", justifyContent: \\"center\\", position: \\"relative\\", overflow: \\"hidden\\" } }, React.createElement(\\"div\\", { style: { position: \\"absolute\\", top: -50 + bgShift, right: -50, width: 300, height: 300, borderRadius: \\"50%\\", background: \\"radial-gradient(circle, rgba(99,102,241,0.3), transparent)\\", filter: \\"blur(40px)\\" } }), React.createElement(\\"div\\", { style: { width: 100, height: 100, borderRadius: \\"50%\\", background: \\"linear-gradient(135deg, #6366f1, #8b5cf6)\\", display: \\"flex\\", alignItems: \\"center\\", justifyContent: \\"center\\", transform: \\"scale(\\" + logoScale + \\")\\", boxShadow: \\"0 20px 60px rgba(99,102,241,0.4)\\" } }, React.createElement(\\"div\\", { style: { fontSize: 40, fontWeight: \\"bold\\", color: \\"white\\" } }, \\"A\\")), React.createElement(\\"div\\", { style: { fontSize: 48, fontWeight: \\"bold\\", color: \\"white\\", marginTop: 30, opacity: textOp } }, \\"Acme Studio\\"), React.createElement(\\"div\\", { style: { width: lineW, height: 3, background: \\"linear-gradient(90deg, transparent, #6366f1, transparent)\\", marginTop: 15 } }), React.createElement(\\"div\\", { style: { fontSize: 20, color: \\"rgba(255,255,255,0.7)\\", marginTop: 20, opacity: tagOp, letterSpacing: 4 } }, \\"DESIGN · BUILD · SHIP\\"));","width":1280,"height":720,"fps":30,"durationInFrames":180,"voiceoverText":"Introducing Acme Studio. Design, build, and ship with confidence."}

EXAMPLE 2 — Info scene with shapes and data:
{"code":"var frame = useCurrentFrame();\\nvar config = useVideoConfig();\\nvar dur = config.durationInFrames;\\nvar makeBar = function(x, h, color, delay) { var s = spring({ frame: frame - delay, fps: config.fps, config: { damping: 12 } }); return React.createElement(\\"div\\", { style: { position: \\"absolute\\", bottom: 200, left: x, width: 60, height: h * s, background: color, borderRadius: \\"8px 8px 0 0\\" } }); };\\nvar titleOp = interpolate(frame, [0, dur*0.15], [0, 1], { extrapolateLeft: \\"clamp\\", extrapolateRight: \\"clamp\\" });\\nvar statsOp = interpolate(frame, [dur*0.4, dur*0.55], [0, 1], { extrapolateLeft: \\"clamp\\", extrapolateRight: \\"clamp\\" });\\nvar ctaOp = interpolate(frame, [dur*0.7, dur*0.85], [0, 1], { extrapolateLeft: \\"clamp\\", extrapolateRight: \\"clamp\\" });\\nreturn React.createElement(\\"div\\", { style: { width: config.width, height: config.height, background: \\"linear-gradient(180deg, #1a1a2e, #16213e)\\", position: \\"relative\\", overflow: \\"hidden\\" } }, React.createElement(\\"div\\", { style: { position: \\"absolute\\", top: 60, left: 80, fontSize: 42, fontWeight: \\"bold\\", color: \\"white\\", opacity: titleOp } }, \\"Growth Metrics\\"), makeBar(200, 180, \\"#6366f1\\", 15), makeBar(300, 260, \\"#8b5cf6\\", 25), makeBar(400, 320, \\"#a78bfa\\", 35), makeBar(500, 220, \\"#c4b5fd\\", 45), React.createElement(\\"div\\", { style: { position: \\"absolute\\", bottom: 80, right: 100, fontSize: 64, fontWeight: \\"bold\\", color: \\"#6366f1\\", opacity: statsOp } }, \\"+127%\\"), React.createElement(\\"div\\", { style: { position: \\"absolute\\", bottom: 60, left: 80, fontSize: 22, color: \\"rgba(255,255,255,0.6)\\", opacity: ctaOp } }, \\"Year over year revenue growth\\"));","width":1280,"height":720,"fps":30,"durationInFrames":210,"voiceoverText":"Our growth metrics speak for themselves. Revenue is up 127 percent year over year."}

DO NOT output anything except the JSON object.`;

const CHAT_SYSTEM_PROMPT = `You are a creative video production assistant. You help users plan and refine their video ideas.

Your role:
- Ask clarifying questions about the video (tone, style, target audience, key messages, length)
- Suggest creative ideas and improvements
- When the user is ready to generate, tell them to say "generate" or "create it"
- Keep responses concise and helpful (2-3 sentences max)
- If the user gives a vague request, ask 1-2 specific questions before generating

DO NOT output code or JSON. Just have a natural conversation.`;

const SCRIPT_SYSTEM_PROMPT = `You are a video scriptwriter. Given a topic, write a structured video script.
Output ONLY a JSON array, nothing else. No markdown, no backticks, no explanation.

Format:
[{"title":"Scene Title","narration":"What the narrator says","visualDescription":"What to show visually","durationSeconds":5}]

Rules:
- Each scene should be 3-8 seconds
- Total duration should match user's requested length (default 15 seconds if not specified)
- Narration should be natural spoken text
- Visual descriptions should be detailed enough for a motion graphics generator
- Output ONLY the JSON array`;

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

export interface ScriptScene {
  title: string;
  narration: string;
  visualDescription: string;
  durationSeconds: number;
}

/** Generate a video script (JSON array of scenes) */
export async function generateScript(
  prompt: string,
  onToken: (accumulated: string) => void
): Promise<ScriptScene[]> {
  if (!engine) throw new Error("Model not loaded. Go to Settings to download the AI model first.");

  const requestedDuration = parseDuration(prompt, 1); // just get seconds
  const durationHint = requestedDuration ? `Total video duration: ${requestedDuration} seconds.` : "Total video duration: 15 seconds.";

  const messages: webllm.ChatCompletionMessageParam[] = [
    { role: "system", content: SCRIPT_SYSTEM_PROMPT + "\n\n" + durationHint },
    { role: "user", content: prompt },
  ];

  let accumulated = "";
  const chunks = await engine.chat.completions.create({
    messages,
    temperature: 0.3,
    max_tokens: 2000,
    stream: true,
  });

  for await (const chunk of chunks) {
    const delta = chunk.choices[0]?.delta?.content || "";
    accumulated += delta;
    onToken(accumulated);
  }

  // Parse the script JSON
  const trimmed = accumulated.trim();
  let parsed: ScriptScene[];

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    // Try extracting from fences
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      parsed = JSON.parse(fenceMatch[1].trim());
    } else {
      const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        parsed = JSON.parse(arrayMatch[0]);
      } else {
        throw new Error("Could not parse script output.");
      }
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Script output is empty or invalid.");
  }

  return parsed;
}

export interface WorkflowCallbacks {
  onStepChange: (step: string, detail: string) => void;
  onScriptToken: (text: string) => void;
  onCodeToken: (code: string) => void;
  onSceneReady: (scene: RemotionScene) => void;
  onChatMessage: (content: string) => void;
  fps: number;
  width: number;
  height: number;
}

/** Full workflow: Script -> Audio -> Visuals */
export async function generateVideoWorkflow(
  prompt: string,
  callbacks: WorkflowCallbacks
): Promise<RemotionScene[]> {
  const { fps, width, height } = callbacks;
  const scenes: RemotionScene[] = [];

  // Step 1: Generate Script
  callbacks.onStepChange("scripting", "Writing video script...");
  const script = await generateScript(prompt, callbacks.onScriptToken);
  callbacks.onChatMessage(`📝 Script ready — ${script.length} scene(s):\n${script.map((s, i) => `${i + 1}. **${s.title}** (${s.durationSeconds}s) — "${s.narration}"`).join("\n")}`);

  // Step 2: Generate Audio for each scene
  callbacks.onStepChange("generating-audio", "Generating voiceovers...");
  const audioUrls: (string | null)[] = [];
  for (let i = 0; i < script.length; i++) {
    const s = script[i];
    if (s.narration && s.narration.trim()) {
      callbacks.onStepChange("generating-audio", `Generating voiceover for scene ${i + 1}/${script.length}...`);
      try {
        const tts = await import("@/lib/tts");
        const audioUrl = await tts.generateVoiceover(s.narration, (pct, msg) => {
          callbacks.onStepChange("generating-audio", `TTS scene ${i + 1}: ${msg} (${pct}%)`);
        });
        audioUrls.push(audioUrl);
      } catch {
        audioUrls.push(null);
      }
    } else {
      audioUrls.push(null);
    }
  }
  callbacks.onChatMessage(`🎙 Voiceovers generated for ${audioUrls.filter(Boolean).length}/${script.length} scenes.`);

  // Step 3: Generate visuals for each scene
  callbacks.onStepChange("generating-visuals", "Creating visuals...");
  for (let i = 0; i < script.length; i++) {
    const s = script[i];
    const durationInFrames = s.durationSeconds * fps;

    callbacks.onStepChange("generating-visuals", `Creating visuals for scene ${i + 1}/${script.length}: ${s.title}...`);

    const visualPrompt = `Create a motion graphics scene with rich visual elements.
Title: "${s.title}"
Visual concept: ${s.visualDescription}
Narration: "${s.narration}"
Duration: ${s.durationSeconds}s at ${fps}fps = ${durationInFrames} frames.

Include animated geometric shapes, backgrounds with gradients, and styled text elements.
Spread animations across ALL ${durationInFrames} frames in multiple phases.
Use spring() for entrances and interpolate() for smooth transitions.`;

    const result = await generateSceneStreaming(visualPrompt, callbacks.onCodeToken, {
      forceDurationFrames: durationInFrames,
      fps,
    });

    const scene: RemotionScene = {
      id: result.id,
      name: s.title,
      componentCode: result.componentCode,
      width,
      height,
      fps,
      durationInFrames,
    };

    if (audioUrls[i]) {
      scene.voiceover = { text: s.narration, audioUrl: audioUrls[i]! };
    }

    scenes.push(scene);
    callbacks.onSceneReady(scene);
  }

  callbacks.onChatMessage(`✅ Done! ${scenes.length} scene(s) created with ${audioUrls.filter(Boolean).length} voiceover(s).`);
  callbacks.onStepChange("", "");

  return scenes;
}

export function isModelLoaded(): boolean {
  return engine !== null;
}
