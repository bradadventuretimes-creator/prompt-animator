import { useRef, useEffect } from "react";
import type { RemotionScene } from "@/lib/scene-types";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Clock, Code2, Monitor } from "lucide-react";

interface EditingPanelProps {
  scene: RemotionScene;
  onUpdateCode: (code: string) => void;
  onUpdateDuration: (durationInFrames: number) => void;
  onUpdateFps: (fps: number) => void;
  onUpdateDimensions: (width: number, height: number) => void;
  streamingCode: string;
  isGenerating: boolean;
}

export function EditingPanel({
  scene,
  onUpdateCode,
  onUpdateDuration,
  onUpdateFps,
  streamingCode,
  isGenerating,
}: EditingPanelProps) {
  const codeRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll code during streaming
  useEffect(() => {
    if (isGenerating && codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [streamingCode, isGenerating]);

  const displayCode = isGenerating && streamingCode ? streamingCode : scene.componentCode;

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col shrink-0 overflow-hidden">
      <div className="p-2.5 border-b border-border">
        <h2 className="font-semibold text-sm">Properties</h2>
      </div>

      {/* Composition info */}
      <div className="p-2.5 border-b border-border space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          <Monitor className="h-3 w-3" />
          {scene.width}×{scene.height} · {scene.fps}fps
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">FPS</Label>
          <Slider
            value={[scene.fps]}
            onValueChange={([v]) => onUpdateFps(v)}
            min={15}
            max={60}
            step={1}
            className="mt-0.5"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {(scene.durationInFrames / scene.fps).toFixed(1)}s ({scene.durationInFrames}f)
          </Label>
          <Slider
            value={[scene.durationInFrames]}
            onValueChange={([v]) => onUpdateDuration(v)}
            min={30}
            max={900}
            step={1}
            className="mt-0.5"
          />
        </div>
      </div>

      {/* Live code editor */}
      <div className="p-2.5 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
          <Code2 className="h-3 w-3" />
          Code {isGenerating && <span className="text-primary animate-pulse">● live</span>}
        </div>
        <textarea
          ref={codeRef}
          value={displayCode}
          onChange={(e) => onUpdateCode(e.target.value)}
          readOnly={isGenerating}
          className="flex-1 min-h-0 bg-muted text-[10px] font-mono text-foreground p-2 rounded-md border border-border resize-none focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
