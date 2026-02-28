import type { RemotionScene } from "@/lib/scene-types";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Palette, Clock, Code2 } from "lucide-react";

interface EditingPanelProps {
  scene: RemotionScene;
  onUpdateCode: (code: string) => void;
  onUpdateDuration: (durationInFrames: number) => void;
  onUpdateFps: (fps: number) => void;
  onUpdateDimensions: (width: number, height: number) => void;
}

export function EditingPanel({
  scene,
  onUpdateCode,
  onUpdateDuration,
  onUpdateFps,
  onUpdateDimensions,
}: EditingPanelProps) {
  return (
    <div className="w-72 bg-card border-l border-border flex flex-col shrink-0 overflow-y-auto">
      <div className="p-3 border-b border-border">
        <h2 className="font-semibold text-sm">Properties</h2>
      </div>

      {/* Composition settings */}
      <div className="p-3 border-b border-border space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <Palette className="h-3.5 w-3.5" />
          Composition
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">Width</Label>
            <p className="text-xs font-mono">{scene.width}px</p>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Height</Label>
            <p className="text-xs font-mono">{scene.height}px</p>
          </div>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">
            FPS: {scene.fps}
          </Label>
          <Slider
            value={[scene.fps]}
            onValueChange={([v]) => onUpdateFps(v)}
            min={15}
            max={60}
            step={1}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Duration: {(scene.durationInFrames / scene.fps).toFixed(1)}s ({scene.durationInFrames} frames)
          </Label>
          <Slider
            value={[scene.durationInFrames]}
            onValueChange={([v]) => onUpdateDuration(v)}
            min={30}
            max={900}
            step={1}
            className="mt-1"
          />
        </div>
      </div>

      {/* Code editor */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          <Code2 className="h-3.5 w-3.5" />
          Component Code
        </div>
        <textarea
          value={scene.componentCode}
          onChange={(e) => onUpdateCode(e.target.value)}
          className="flex-1 min-h-[200px] bg-muted text-[11px] font-mono text-foreground p-3 rounded-lg border border-border resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
