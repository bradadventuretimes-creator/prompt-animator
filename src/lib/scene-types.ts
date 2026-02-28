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

/** Remotion-based scene */
export interface RemotionScene {
  id: string;
  name: string;
  componentCode: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  metadata?: {
    title?: string;
    description?: string;
  };
  voiceover?: {
    text: string;
    audioUrl: string;
  };
}

export interface ProjectFile {
  id: string;
  path: string;
  content: string;
  sceneId?: string;
  type: "scene" | "audio" | "config";
}

export interface VideoProject {
  id: string;
  name: string;
  createdAt: number;
  scenes: RemotionScene[];
  files: ProjectFile[];
  activeSceneIndex: number;
  globalSettings: {
    width: number;
    height: number;
    fps: number;
  };
}

export type AppStatus = "idle" | "loading-model" | "generating" | "rendering" | "exporting" | "generating-voice" | "scripting" | "generating-audio" | "generating-visuals";
