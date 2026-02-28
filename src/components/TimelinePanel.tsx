import type { RemotionScene } from "@/lib/scene-types";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useCallback } from "react";

interface TimelinePanelProps {
  scene: RemotionScene;
  currentFrame: number;
  playing?: boolean;
  onSeek?: (frame: number) => void;
  onTogglePlay?: () => void;
  onReset?: () => void;
}

export function TimelinePanel({ scene, currentFrame, playing, onSeek, onTogglePlay, onReset }: TimelinePanelProps) {
  const totalSeconds = scene.durationInFrames / scene.fps;
  const tickCount = Math.ceil(totalSeconds);
  const playheadPct = (currentFrame / scene.durationInFrames) * 100;
  const trackAreaRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!trackAreaRef.current || !onSeek) return;
    const rect = trackAreaRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(Math.round(pct * (scene.durationInFrames - 1)));
  }, [onSeek, scene.durationInFrames]);

  return (
    <div className="bg-card border-t border-border flex flex-col" style={{ height: "220px" }}>
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border text-xs">
        <span className="font-mono text-muted-foreground">
          {(currentFrame / scene.fps).toFixed(2)} / {totalSeconds.toFixed(2)}
        </span>
        <div className="flex items-center gap-0.5 ml-4">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSeek?.(Math.max(0, currentFrame - scene.fps))}><ChevronLeft className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onReset}><SkipBack className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onTogglePlay}>
            {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSeek?.(Math.min(scene.durationInFrames - 1, currentFrame + scene.fps))}><SkipForward className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSeek?.(Math.min(scene.durationInFrames - 1, currentFrame + 1))}><ChevronRight className="h-3 w-3" /></Button>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6"><ZoomOut className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6"><ZoomIn className="h-3 w-3" /></Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div ref={trackAreaRef} className="flex-1 overflow-x-auto relative cursor-pointer" onClick={handleTimelineClick}>
          <div className="h-6 border-b border-border flex items-end relative">
            {Array.from({ length: tickCount + 1 }, (_, i) => (
              <div key={i} className="absolute bottom-0 text-[9px] text-muted-foreground" style={{ left: `${(i / totalSeconds) * 100}%` }}>
                <div className="h-2 w-px bg-border mb-0.5 mx-auto" />
                <span className="ml-0.5">{i}s</span>
              </div>
            ))}
          </div>

          <div className="absolute top-0 bottom-0 w-px bg-destructive z-10 pointer-events-none" style={{ left: `${playheadPct}%` }}>
            <div className="w-2.5 h-2.5 bg-destructive rounded-sm -ml-[5px] -mt-0.5" />
          </div>

          {/* Single composition track */}
          <div className="h-8 relative border-b border-border/30">
            <div
              className="absolute top-1 bottom-1 track-teal rounded-sm flex items-center px-2"
              style={{ left: "0%", width: "100%" }}
            >
              <span className="text-[10px] text-white font-medium truncate">
                {scene.metadata?.title || "Composition"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
