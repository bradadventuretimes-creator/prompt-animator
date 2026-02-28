import type { Scene, SceneElement, AnimationType, RemotionScene } from "./scene-types";

const VALID_ANIMATIONS: AnimationType[] = ["typing", "fadeIn", "scaleIn", "none"];

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function isValidColor(color: string): boolean {
  return /^#[0-9a-fA-F]{3,8}$/.test(color) || /^(rgb|hsl)a?\(/.test(color) || /^[a-zA-Z]+$/.test(color);
}

function sanitizeString(str: unknown): string {
  if (typeof str !== "string") return "";
  return str.slice(0, 500);
}

function validateElement(el: unknown): SceneElement | null {
  if (!el || typeof el !== "object") return null;
  const e = el as Record<string, unknown>;

  const anim = (e.animation && typeof e.animation === "object" ? e.animation : {}) as Record<string, unknown>;
  const animType = VALID_ANIMATIONS.includes(anim.type as AnimationType) ? (anim.type as AnimationType) : "none";

  return {
    type: "text",
    text: sanitizeString(e.text) || "Hello",
    x: clamp(Number(e.x) || 0, 0, 3840),
    y: clamp(Number(e.y) || 0, 0, 2160),
    fontSize: clamp(Number(e.fontSize) || 32, 8, 200),
    color: isValidColor(String(e.color || "")) ? String(e.color) : "#ffffff",
    animation: {
      type: animType,
      startFrame: clamp(Number(anim.startFrame) || 0, 0, 9999),
      speed: clamp(Number(anim.speed) || 1, 0.1, 100),
      duration: clamp(Number(anim.duration) || 30, 1, 9999),
    },
  };
}

/** Validate legacy canvas scene */
export function validateScene(raw: unknown): Scene | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const elements: SceneElement[] = [];
  if (Array.isArray(r.elements)) {
    for (const el of r.elements) {
      const validated = validateElement(el);
      if (validated) elements.push(validated);
    }
  }
  if (elements.length === 0) return null;

  return {
    width: clamp(Number(r.width) || 1280, 320, 3840),
    height: clamp(Number(r.height) || 720, 240, 2160),
    fps: clamp(Number(r.fps) || 30, 1, 120),
    duration: clamp(Number(r.duration) || 180, 1, 18000),
    background: isValidColor(String(r.background || "")) ? String(r.background) : "#1a1a2e",
    elements,
  };
}

/** Validate Remotion scene from AI output */
export function validateRemotionScene(raw: unknown): RemotionScene | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const code = typeof r.code === "string" ? r.code : typeof r.componentCode === "string" ? r.componentCode : null;
  if (!code || code.trim().length < 10) return null;

  return {
    componentCode: code,
    width: clamp(Number(r.width) || 1280, 320, 3840),
    height: clamp(Number(r.height) || 720, 240, 2160),
    fps: clamp(Number(r.fps) || 30, 1, 120),
    durationInFrames: clamp(Number(r.durationInFrames) || Number(r.duration) || 180, 1, 18000),
    metadata: {
      title: sanitizeString((r.metadata as Record<string, unknown>)?.title) || undefined,
      description: sanitizeString((r.metadata as Record<string, unknown>)?.description) || undefined,
    },
  };
}
