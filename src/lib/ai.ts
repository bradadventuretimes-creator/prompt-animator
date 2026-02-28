import * as webllm from "@mlc-ai/web-llm";
import { validateScene } from "./scene-validation";
import type { Scene } from "./scene-types";

let engine: webllm.MLCEngine | null = null;

const SYSTEM_PROMPT = `You are a motion graphics scene generator. You MUST output ONLY valid JSON matching this exact schema, with NO markdown, NO explanations, NO code blocks:
{
  "width": number (1280),
  "height": number (720),
  "fps": number (30),
  "duration": number (total frames),
  "background": string (hex color),
  "elements": [
    {
      "type": "text",
      "text": string,
      "x": number (pixel position),
      "y": number (pixel position),
      "fontSize": number,
      "color": string (hex color),
      "animation": {
        "type": "typing" | "fadeIn" | "scaleIn" | "none",
        "startFrame": number,
        "speed": number (frames per character for typing, 1 otherwise),
        "duration": number (frames for the animation)
      }
    }
  ]
}
Output ONLY the JSON object. x,y coordinates are centered (text is drawn centered). Keep animations simple.`;

export async function loadModel(
  onProgress: (progress: number, text: string) => void
): Promise<void> {
  if (engine) return;
  engine = new webllm.MLCEngine();
  engine.setInitProgressCallback((report) => {
    const pct = Math.round(report.progress * 100);
    onProgress(pct, report.text);
  });
  await engine.reload("Qwen2.5-7B-Instruct-q4f16_1-MLC");
}

export async function generateScene(prompt: string): Promise<Scene> {
  if (!engine) throw new Error("Model not loaded");

  const reply = await engine.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2048,
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

  const scene = validateScene(parsed);
  if (!scene) {
    throw new Error("AI output did not match the expected scene format. Please try again.");
  }

  return scene;
}

export function isModelLoaded(): boolean {
  return engine !== null;
}
