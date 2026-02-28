import { useRef, useEffect } from "react";
import type { Scene } from "@/lib/scene-types";
import { usePlayer } from "@/hooks/use-player";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CanvasPreviewProps {
  scene: Scene;
}

export function CanvasPreview({ scene }: CanvasPreviewProps) {
  const { canvasRef, playing, currentFrame, togglePlay, reset } = usePlayer(scene);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative rounded-lg overflow-hidden border border-border shadow-lg bg-black">
        <canvas
          ref={canvasRef}
          width={scene.width}
          height={scene.height}
          className="max-w-full h-auto"
          style={{ maxHeight: "400px" }}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={togglePlay}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground font-mono">
          Frame {currentFrame} / {scene.duration} ({Math.round(currentFrame / scene.fps * 10) / 10}s)
        </span>
      </div>
    </div>
  );
}
