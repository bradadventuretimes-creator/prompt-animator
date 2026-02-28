import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import type { RemotionScene } from "@/lib/scene-types";
import { createRemotionComponent } from "@/lib/remotion-renderer";
import type { PlayerRef } from "@remotion/player";

export function usePlayer(scene: RemotionScene) {
  const playerRef = useRef<PlayerRef>(null);
  const [playing, setPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  const DynamicComponent = useMemo(
    () => createRemotionComponent(scene.componentCode),
    [scene.componentCode]
  );

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      p.pause();
    } else {
      p.play();
    }
  }, [playing]);

  const reset = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    p.pause();
    p.seekTo(0);
    setCurrentFrame(0);
    setPlaying(false);
  }, []);

  const seek = useCallback((frame: number) => {
    const p = playerRef.current;
    if (!p) return;
    const clamped = Math.max(0, Math.min(frame, scene.durationInFrames - 1));
    p.seekTo(clamped);
    setCurrentFrame(clamped);
  }, [scene.durationInFrames]);

  // Stop when scene changes
  useEffect(() => {
    setPlaying(false);
    setCurrentFrame(0);
    playerRef.current?.seekTo(0);
  }, [scene.componentCode]);

  return {
    playerRef,
    DynamicComponent,
    playing,
    setPlaying,
    currentFrame,
    setCurrentFrame,
    togglePlay,
    reset,
    seek,
  };
}
