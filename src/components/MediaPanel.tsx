import type { Scene } from "@/lib/scene-types";
import { Type, Film } from "lucide-react";

interface MediaPanelProps {
  scene: Scene;
}

export function MediaPanel({ scene }: MediaPanelProps) {
  return (
    <div className="w-80 bg-card border-r border-border flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">Media Assets</h2>
      </div>
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
          <Film className="h-4 w-4 text-primary shrink-0" />
          <div className="text-xs">
            <p className="font-medium">{scene.width}×{scene.height} — {scene.fps}fps</p>
            <p className="text-muted-foreground">{(scene.duration / scene.fps).toFixed(1)}s duration</p>
          </div>
        </div>
        {scene.elements.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No assets yet. Generate a scene to see assets here.</p>
        ) : (
          scene.elements.map((el, i) => (
            <div key={i} className="p-3 bg-muted/50 border border-border rounded-lg flex items-start gap-3">
              <Type className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs min-w-0">
                <p className="font-medium truncate">{el.text}</p>
                <p className="text-muted-foreground">
                  {el.fontSize}px · {el.animation.type} · {el.animation.duration} frames
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-3 w-3 rounded-sm border border-border" style={{ backgroundColor: el.color }} />
                  <span className="text-muted-foreground font-mono">{el.color}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
