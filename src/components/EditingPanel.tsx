import { useRef, useEffect, useState } from "react";
import type { RemotionScene } from "@/lib/scene-types";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Code2, Monitor, Trash2, Copy, Mic, Loader2 } from "lucide-react";

interface EditingPanelProps {
  scene: RemotionScene;
  sceneName: string;
  sceneIndex: number;
  totalScenes: number;
  onUpdateCode: (code: string) => void;
  onUpdateDuration: (durationInFrames: number) => void;
  onUpdateFps: (fps: number) => void;
  onDeleteScene: () => void;
  onDuplicateScene: () => void;
  onGenerateVoiceover: (text: string) => void;
  voiceover?: { text: string; audioUrl: string };
  streamingCode: string;
  isGenerating: boolean;
}

export function EditingPanel({
  scene,
  sceneName,
  sceneIndex,
  totalScenes,
  onUpdateCode,
  onUpdateDuration,
  onUpdateFps,
  onDeleteScene,
  onDuplicateScene,
  onGenerateVoiceover,
  voiceover,
  streamingCode,
  isGenerating,
}: EditingPanelProps) {
  const codeRef = useRef<HTMLTextAreaElement>(null);
  const [voiceText, setVoiceText] = useState(voiceover?.text || "");
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

  useEffect(() => {
    if (isGenerating && codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [streamingCode, isGenerating]);

  useEffect(() => {
    setVoiceText(voiceover?.text || "");
  }, [voiceover?.text]);

  const displayCode = isGenerating && streamingCode ? streamingCode : scene.componentCode;

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col shrink-0 overflow-hidden">
      <div className="p-2.5 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm truncate">{sceneName} <span className="text-muted-foreground text-[10px]">({sceneIndex + 1}/{totalScenes})</span></h2>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDuplicateScene} title="Duplicate scene">
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onDeleteScene} disabled={totalScenes <= 1} title="Delete scene">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Composition info */}
      <div className="p-2.5 border-b border-border space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          <Monitor className="h-3 w-3" />
          {scene.width}×{scene.height} · {scene.fps}fps
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">FPS</Label>
          <Slider value={[scene.fps]} onValueChange={([v]) => onUpdateFps(v)} min={15} max={60} step={1} className="mt-0.5" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {(scene.durationInFrames / scene.fps).toFixed(1)}s ({scene.durationInFrames}f)
          </Label>
          <Slider value={[scene.durationInFrames]} onValueChange={([v]) => onUpdateDuration(v)} min={30} max={1800} step={1} className="mt-0.5" />
        </div>
      </div>

      {/* Voiceover section */}
      <div className="p-2.5 border-b border-border space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          <Mic className="h-3 w-3" />
          Voiceover
        </div>
        <Textarea
          value={voiceText}
          onChange={(e) => setVoiceText(e.target.value)}
          placeholder="Enter narration text..."
          className="min-h-[48px] text-[10px] bg-muted border-0 resize-none"
        />
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] flex-1"
            onClick={() => {
              if (voiceText.trim()) {
                setIsGeneratingVoice(true);
                onGenerateVoiceover(voiceText);
                setTimeout(() => setIsGeneratingVoice(false), 1000);
              }
            }}
            disabled={!voiceText.trim() || isGeneratingVoice}
          >
            {isGeneratingVoice ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Mic className="h-3 w-3 mr-1" />}
            Generate Voice
          </Button>
          {voiceover?.audioUrl && (
            <audio src={voiceover.audioUrl} controls className="h-6 flex-1" style={{ maxWidth: 80 }} />
          )}
        </div>
      </div>

      {/* Live code editor */}
      <div className="p-2.5 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            <Code2 className="h-3 w-3" />
            Code {isGenerating && <span className="text-primary animate-pulse">● live</span>}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(scene.componentCode)}
            className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Copy
          </button>
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
