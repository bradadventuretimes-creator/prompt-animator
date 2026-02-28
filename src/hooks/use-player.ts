import { useRef, useState, useCallback, useEffect } from "react";
import type { Scene } from "@/lib/scene-types";
import { renderFrame } from "@/lib/renderer";

export function usePlayer(scene: Scene | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  const draw = useCallback((frame: number) => {
    if (!scene || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    renderFrame(scene, frame, ctx);
  }, [scene]);

  // Draw current frame when scene changes
  useEffect(() => {
    draw(frameRef.current);
  }, [draw]);

  const tick = useCallback((timestamp: number) => {
    if (!scene) return;
    const interval = 1000 / scene.fps;
    if (timestamp - lastTimeRef.current >= interval) {
      lastTimeRef.current = timestamp;
      frameRef.current = (frameRef.current + 1) % scene.duration;
      setCurrentFrame(frameRef.current);
      draw(frameRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [scene, draw]);

  const play = useCallback(() => {
    if (!scene) return;
    setPlaying(true);
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [scene, tick]);

  const pause = useCallback(() => {
    setPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const togglePlay = useCallback(() => {
    if (playing) pause(); else play();
  }, [playing, play, pause]);

  const reset = useCallback(() => {
    frameRef.current = 0;
    setCurrentFrame(0);
    draw(0);
  }, [draw]);

  // Cleanup
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Stop when scene changes
  useEffect(() => {
    pause();
    frameRef.current = 0;
    setCurrentFrame(0);
  }, [scene, pause]);

  return { canvasRef, playing, currentFrame, togglePlay, reset, draw };
}
