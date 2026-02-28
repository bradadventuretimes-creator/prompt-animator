import type { Scene, SceneElement } from "./scene-types";

function renderElement(el: SceneElement, frame: number, ctx: CanvasRenderingContext2D) {
  const { animation } = el;
  const localFrame = frame - animation.startFrame;

  if (localFrame < 0) return;

  ctx.save();
  ctx.font = `${el.fontSize}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = el.color;

  switch (animation.type) {
    case "typing": {
      const charsToShow = Math.floor(localFrame / animation.speed);
      const visibleText = el.text.slice(0, Math.min(charsToShow, el.text.length));
      if (visibleText.length > 0) {
        ctx.fillText(visibleText, el.x, el.y);
      }
      break;
    }
    case "fadeIn": {
      const progress = Math.min(localFrame / animation.duration, 1);
      ctx.globalAlpha = progress;
      ctx.fillText(el.text, el.x, el.y);
      break;
    }
    case "scaleIn": {
      const progress = Math.min(localFrame / animation.duration, 1);
      const scale = 0.5 + 0.5 * progress;
      ctx.translate(el.x, el.y);
      ctx.scale(scale, scale);
      ctx.fillText(el.text, 0, 0);
      break;
    }
    case "none":
    default:
      ctx.fillText(el.text, el.x, el.y);
      break;
  }

  ctx.restore();
}

export function renderFrame(scene: Scene, frame: number, ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, scene.width, scene.height);
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, scene.width, scene.height);

  for (const el of scene.elements) {
    renderElement(el, frame, ctx);
  }
}
