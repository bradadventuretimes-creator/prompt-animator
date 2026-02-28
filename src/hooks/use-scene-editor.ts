import { useState, useCallback } from "react";
import type { RemotionScene, VideoProject } from "@/lib/scene-types";

function createDefaultScene(width: number, height: number, fps: number): RemotionScene {
  return {
    id: crypto.randomUUID(),
    name: "Scene 1",
    width,
    height,
    fps,
    durationInFrames: 150,
    componentCode: `var frame = useCurrentFrame();\nvar config = useVideoConfig();\nreturn React.createElement("div", {\n  style: { width: config.width, height: config.height, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }\n}, React.createElement("div", {\n  style: { color: "#e0e0ff", fontSize: 32, fontFamily: "system-ui" }\n}, "New Scene"));`,
  };
}

export function useProjectEditor(initialProject: VideoProject) {
  const [project, setProject] = useState<VideoProject>(initialProject);

  const activeScene = project.scenes[project.activeSceneIndex] || project.scenes[0];

  const setActiveIndex = useCallback((index: number) => {
    setProject((p) => ({ ...p, activeSceneIndex: Math.max(0, Math.min(index, p.scenes.length - 1)) }));
  }, []);

  const updateActiveScene = useCallback((partial: Partial<RemotionScene>) => {
    setProject((p) => {
      const scenes = [...p.scenes];
      const idx = p.activeSceneIndex;
      scenes[idx] = { ...scenes[idx], ...partial };
      return { ...p, scenes };
    });
  }, []);

  const addScene = useCallback((scene?: RemotionScene) => {
    setProject((p) => {
      const newScene = scene || createDefaultScene(p.globalSettings.width, p.globalSettings.height, p.globalSettings.fps);
      const scenes = [...p.scenes, newScene];
      return { ...p, scenes, activeSceneIndex: scenes.length - 1 };
    });
  }, []);

  const removeScene = useCallback((index: number) => {
    setProject((p) => {
      if (p.scenes.length <= 1) return p;
      const scenes = p.scenes.filter((_, i) => i !== index);
      const activeSceneIndex = Math.min(p.activeSceneIndex, scenes.length - 1);
      return { ...p, scenes, activeSceneIndex };
    });
  }, []);

  const duplicateScene = useCallback((index: number) => {
    setProject((p) => {
      const original = p.scenes[index];
      const dup: RemotionScene = { ...original, id: crypto.randomUUID(), name: original.name + " (copy)" };
      const scenes = [...p.scenes];
      scenes.splice(index + 1, 0, dup);
      return { ...p, scenes, activeSceneIndex: index + 1 };
    });
  }, []);

  const reorderScenes = useCallback((fromIndex: number, toIndex: number) => {
    setProject((p) => {
      const scenes = [...p.scenes];
      const [moved] = scenes.splice(fromIndex, 1);
      scenes.splice(toIndex, 0, moved);
      let activeSceneIndex = p.activeSceneIndex;
      if (p.activeSceneIndex === fromIndex) activeSceneIndex = toIndex;
      return { ...p, scenes, activeSceneIndex };
    });
  }, []);

  const replaceProject = useCallback((newProject: VideoProject) => {
    setProject(newProject);
  }, []);

  return {
    project,
    activeScene,
    setActiveIndex,
    updateActiveScene,
    addScene,
    removeScene,
    duplicateScene,
    reorderScenes,
    replaceProject,
  };
}
