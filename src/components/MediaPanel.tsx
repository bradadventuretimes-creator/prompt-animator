import type { RemotionScene } from "@/lib/scene-types";
import { Film, Clock, Monitor } from "lucide-react";

interface MediaPanelProps {
  scene: RemotionScene;
}

export function MediaPanel({ scene }: MediaPanelProps) {
  const durationSec = (scene.durationInFrames / scene.fps).toFixed(1);

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">Composition Info</h2>
      </div>
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
          <Monitor className="h-4 w-4 text-primary shrink-0" />
          <div className="text-xs">
            <p className="font-medium">{scene.width}×{scene.height}</p>
            <p className="text-muted-foreground">Resolution</p>
          </div>
        </div>
        <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
          <Film className="h-4 w-4 text-primary shrink-0" />
          <div className="text-xs">
            <p className="font-medium">{scene.fps} fps</p>
            <p className="text-muted-foreground">Frame rate</p>
          </div>
        </div>
        <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <div className="text-xs">
            <p className="font-medium">{durationSec}s ({scene.durationInFrames} frames)</p>
            <p className="text-muted-foreground">Duration</p>
          </div>
        </div>
        {scene.metadata?.title && (
          <div className="p-3 bg-muted/50 border border-border rounded-lg text-xs">
            <p className="font-medium">{scene.metadata.title}</p>
            {scene.metadata.description && (
              <p className="text-muted-foreground mt-1">{scene.metadata.description}</p>
            )}
          </div>
        )}
        <div className="p-3 bg-muted/50 border border-border rounded-lg text-xs">
          <p className="font-medium">Code Size</p>
          <p className="text-muted-foreground">{scene.componentCode.length} characters</p>
        </div>
      </div>
    </div>
  );
}
