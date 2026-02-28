import type { RemotionScene } from "@/lib/scene-types";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, Trash2, Copy } from "lucide-react";
import { useRef, useCallback, useState } from "react";

interface TimelinePanelProps {
  scenes: RemotionScene[];
  activeSceneIndex: number;
  onSelectScene: (index: number) => void;
  onDeleteScene: (index: number) => void;
  onDuplicateScene: (index: number) => void;
  currentFrame: number;
  playing?: boolean;
  onSeek?: (frame: number) => void;
  onTogglePlay?: () => void;
  onReset?: () => void;
}

const CLIP_COLORS = ["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];

export function TimelinePanel({
  scenes,
  activeSceneIndex,
  onSelectScene,
  onDeleteScene,
  onDuplicateScene,
  currentFrame,
  playing,
  onSeek,
  onTogglePlay,
  onReset,
}: TimelinePanelProps) {
  const activeScene = scenes[activeSceneIndex] || scenes[0];
  const totalSeconds = activeScene.durationInFrames / activeScene.fps;
  const tickCount = Math.ceil(totalSeconds);
  const playheadPct = (currentFrame / activeScene.durationInFrames) * 100;
  const trackAreaRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!trackAreaRef.current || !onSeek) return;
    const rect = trackAreaRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(Math.round(pct * (activeScene.durationInFrames - 1)));
  }, [onSeek, activeScene.durationInFrames]);

  const handleClipContext = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, index });
  }, []);

  const totalFrames = scenes.reduce((sum, s) => sum + s.durationInFrames, 0);

  return (
    <div className="bg-card border-t border-border flex flex-col" style={{ height: "220px" }} onClick={() => setContextMenu(null)}>
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border text-xs">
        <span className="font-mono text-muted-foreground">
          {(currentFrame / activeScene.fps).toFixed(2)} / {totalSeconds.toFixed(2)}
        </span>
        <div className="flex items-center gap-0.5 ml-4">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSeek?.(Math.max(0, currentFrame - activeScene.fps))}><ChevronLeft className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onReset}><SkipBack className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onTogglePlay}>
            {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSeek?.(Math.min(activeScene.durationInFrames - 1, currentFrame + activeScene.fps))}><SkipForward className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSeek?.(Math.min(activeScene.durationInFrames - 1, currentFrame + 1))}><ChevronRight className="h-3 w-3" /></Button>
        </div>
        <div className="ml-auto flex items-center gap-1 text-muted-foreground">
          <span className="text-[10px]">{scenes.length} scene{scenes.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div ref={trackAreaRef} className="flex-1 overflow-x-auto relative cursor-pointer" onClick={handleTimelineClick}>
          {/* Time ruler */}
          <div className="h-6 border-b border-border flex items-end relative">
            {Array.from({ length: tickCount + 1 }, (_, i) => (
              <div key={i} className="absolute bottom-0 text-[9px] text-muted-foreground" style={{ left: `${(i / totalSeconds) * 100}%` }}>
                <div className="h-2 w-px bg-border mb-0.5 mx-auto" />
                <span className="ml-0.5">{i}s</span>
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-px bg-destructive z-10 pointer-events-none" style={{ left: `${playheadPct}%` }}>
            <div className="w-2.5 h-2.5 bg-destructive rounded-sm -ml-[5px] -mt-0.5" />
          </div>

          {/* Scene clips in a row */}
          <div className="h-10 relative border-b border-border/30 flex">
            {scenes.map((scene, idx) => {
              const widthPct = (scene.durationInFrames / totalFrames) * 100;
              const colorClass = CLIP_COLORS[idx % CLIP_COLORS.length];
              const isActive = idx === activeSceneIndex;
              return (
                <div
                  key={scene.id}
                  onClick={(e) => { e.stopPropagation(); onSelectScene(idx); }}
                  onContextMenu={(e) => handleClipContext(e, idx)}
                  className={`h-full ${colorClass} flex items-center px-2 cursor-pointer border-r border-background/30 transition-all ${isActive ? "opacity-100 ring-2 ring-primary ring-inset" : "opacity-60 hover:opacity-80"}`}
                  style={{ width: `${widthPct}%`, minWidth: 40 }}
                >
                  <span className="text-[10px] text-white font-medium truncate">{scene.name}</span>
                </div>
              );
            })}
          </div>

          {/* Voiceover track */}
          <div className="h-6 relative border-b border-border/30">
            <span className="absolute left-1 top-0.5 text-[8px] text-muted-foreground">🎙 Audio</span>
            {scenes.map((scene, idx) => {
              if (!scene.voiceover?.audioUrl) return null;
              const widthPct = (scene.durationInFrames / totalFrames) * 100;
              let leftPct = 0;
              for (let i = 0; i < idx; i++) leftPct += (scenes[i].durationInFrames / totalFrames) * 100;
              return (
                <div
                  key={scene.id + "-vo"}
                  className="absolute top-1 bottom-1 bg-primary/40 rounded-sm flex items-center px-1"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: 20 }}
                >
                  <span className="text-[8px] text-primary-foreground truncate">VO</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => { onDuplicateScene(contextMenu.index); setContextMenu(null); }}
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent flex items-center gap-2"
          >
            <Copy className="h-3 w-3" /> Duplicate
          </button>
          <button
            onClick={() => { onDeleteScene(contextMenu.index); setContextMenu(null); }}
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent text-destructive flex items-center gap-2"
            disabled={scenes.length <= 1}
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
