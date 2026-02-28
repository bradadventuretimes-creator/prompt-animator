import { useState, useCallback } from "react";
import type { RemotionScene } from "@/lib/scene-types";

export function useSceneEditor(initialScene: RemotionScene) {
  const [scene, setScene] = useState<RemotionScene>(initialScene);

  const updateCode = useCallback((code: string) => {
    setScene((s) => ({ ...s, componentCode: code }));
  }, []);

  const updateDimensions = useCallback((width: number, height: number) => {
    setScene((s) => ({ ...s, width, height }));
  }, []);

  const updateFps = useCallback((fps: number) => {
    setScene((s) => ({ ...s, fps }));
  }, []);

  const updateDuration = useCallback((durationInFrames: number) => {
    setScene((s) => ({ ...s, durationInFrames }));
  }, []);

  const replaceScene = useCallback((newScene: RemotionScene) => {
    setScene(newScene);
  }, []);

  return { scene, updateCode, updateDimensions, updateFps, updateDuration, replaceScene };
}
