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

/** Legacy canvas-based scene */
export interface Scene {
  width: number;
  height: number;
  fps: number;
  duration: number;
  background: string;
  elements: SceneElement[];
}

/** New Remotion-based scene */
export interface RemotionScene {
  componentCode: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  metadata?: {
    title?: string;
    description?: string;
  };
}

export type AppStatus = "idle" | "loading-model" | "generating" | "rendering" | "exporting";
