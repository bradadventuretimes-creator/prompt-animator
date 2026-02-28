import type { Scene } from "./scene-types";

export const DEFAULT_SCENE: Scene = {
  width: 1280,
  height: 720,
  fps: 30,
  duration: 180,
  background: "#1a1a2e",
  elements: [
    {
      type: "text",
      text: "Welcome to AI Motion Editor",
      x: 640,
      y: 320,
      fontSize: 48,
      color: "#e0e0ff",
      animation: {
        type: "typing",
        startFrame: 10,
        speed: 3,
        duration: 90,
      },
    },
    {
      type: "text",
      text: "Describe your animation and let AI create it",
      x: 640,
      y: 400,
      fontSize: 24,
      color: "#8888cc",
      animation: {
        type: "fadeIn",
        startFrame: 100,
        speed: 1,
        duration: 40,
      },
    },
  ],
};
