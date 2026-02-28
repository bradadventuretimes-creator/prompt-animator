export type AnimationType = "typing" | "fadeIn" | "scaleIn" | "none";

export interface ElementAnimation {
  type: AnimationType;
  startFrame: number;
  speed: number;
  duration: number;
}

export interface SceneElement {
  type: "text";
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  animation: ElementAnimation;
}

export interface Scene {
  width: number;
  height: number;
  fps: number;
  duration: number;
  background: string;
  elements: SceneElement[];
}

export type AppStatus = "idle" | "loading-model" | "generating" | "rendering" | "exporting";
