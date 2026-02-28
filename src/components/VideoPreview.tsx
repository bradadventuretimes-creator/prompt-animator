import type { Scene } from "@/lib/scene-types";
import { usePlayer } from "@/hooks/use-player";
import { Play, Pause, RotateCcw, Volume2, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface VideoPreviewProps {
  scene: Scene;
  onFrameUpdate?: (frame: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onPlayerReady?: (player: { seek: (f: number) => void; togglePlay: () => void; reset: () => void }) => void;
}

export function VideoPreview({ scene, onFrameUpdate, onPlayingChange, onPlayerReady }: VideoPreviewProps) {
  const { canvasRef, playing, currentFrame, togglePlay, reset, seek } = usePlayer(scene);
  const totalSeconds = scene.duration / scene.fps;
  const currentSeconds = currentFrame / scene.fps;

  useEffect(() => {
    onFrameUpdate?.(currentFrame);
  }, [currentFrame, onFrameUpdate]);

  useEffect(() => {
    onPlayingChange?.(playing);
  }, [playing, onPlayingChange]);

  useEffect(() => {
    onPlayerReady?.({ seek, togglePlay, reset });
  }, [seek, togglePlay, reset, onPlayerReady]);

  return (
    <div className="flex-1 flex flex-col bg-card">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm">Video Player</h2>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 bg-background/50">
        <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black w-full max-w-3xl">
          <canvas ref={canvasRef} width={scene.width} height={scene.height} className="w-full h-auto" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={togglePlay} className="h-8 w-8 text-white hover:text-primary hover:bg-white/10">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Volume2 className="h-4 w-4 text-white/60" />
              <span className="text-xs text-white/80 font-mono ml-auto">
                {currentSeconds.toFixed(2)} / {totalSeconds.toFixed(2)}
              </span>
              <Button variant="ghost" size="icon" onClick={reset} className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Maximize className="h-4 w-4 text-white/60 cursor-pointer hover:text-white" />
            </div>
            <div
              className="mt-2 w-full bg-white/20 rounded-full h-1 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                seek(Math.round(pct * scene.duration));
              }}
            >
              <div className="bg-primary h-full rounded-full transition-all duration-100" style={{ width: `${(currentFrame / scene.duration) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
