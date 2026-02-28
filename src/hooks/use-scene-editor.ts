import { useState, useCallback } from "react";
import type { Scene, SceneElement, AnimationType } from "@/lib/scene-types";

export function useSceneEditor(initialScene: Scene) {
  const [scene, setScene] = useState<Scene>(initialScene);

  const updateBackground = useCallback((color: string) => {
    setScene((s) => ({ ...s, background: color }));
  }, []);

  const updateElement = useCallback((index: number, updates: Partial<SceneElement>) => {
    setScene((s) => {
      const elements = [...s.elements];
      elements[index] = { ...elements[index], ...updates };
      return { ...s, elements };
    });
  }, []);

  const updateElementAnimation = useCallback(
    (index: number, updates: Partial<SceneElement["animation"]>) => {
      setScene((s) => {
        const elements = [...s.elements];
        elements[index] = {
          ...elements[index],
          animation: { ...elements[index].animation, ...updates },
        };
        return { ...s, elements };
      });
    },
    []
  );

  const updateDuration = useCallback((duration: number) => {
    setScene((s) => ({ ...s, duration }));
  }, []);

  const replaceScene = useCallback((newScene: Scene) => {
    setScene(newScene);
  }, []);

  return { scene, updateBackground, updateElement, updateElementAnimation, updateDuration, replaceScene };
}
