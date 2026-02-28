import { useState } from "react";
import type { RemotionScene, ProjectFile } from "@/lib/scene-types";
import { Button } from "@/components/ui/button";
import { Code2, Trash2, Copy, FileCode, Volume2, FolderTree } from "lucide-react";

interface EditingPanelProps {
  scene: RemotionScene;
  sceneName: string;
  sceneIndex: number;
  totalScenes: number;
  files: ProjectFile[];
  onUpdateCode: (code: string) => void;
  onDeleteScene: () => void;
  onDuplicateScene: () => void;
  streamingCode: string;
  isGenerating: boolean;
}

export function EditingPanel({
  scene,
  sceneName,
  sceneIndex,
  totalScenes,
  files,
  onUpdateCode,
  onDeleteScene,
  onDuplicateScene,
  streamingCode,
  isGenerating,
}: EditingPanelProps) {
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  const selectedFile = selectedFilePath ? files.find((f) => f.path === selectedFilePath) : null;
  const displayCode = selectedFile
    ? selectedFile.content
    : isGenerating && streamingCode
      ? streamingCode
      : scene.componentCode;

  // Group files by directory
  const grouped: Record<string, ProjectFile[]> = {};
  for (const f of files) {
    const dir = f.path.split("/")[0] || "root";
    if (!grouped[dir]) grouped[dir] = [];
    grouped[dir].push(f);
  }

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col shrink-0 overflow-hidden">
      {/* Scene header */}
      <div className="p-2.5 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm truncate">
          {sceneName} <span className="text-muted-foreground text-[10px]">({sceneIndex + 1}/{totalScenes})</span>
        </h2>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDuplicateScene} title="Duplicate scene">
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onDeleteScene} disabled={totalScenes <= 1} title="Delete scene">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Scene info (read-only) */}
      <div className="px-2.5 py-1.5 border-b border-border flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>{scene.width}×{scene.height}</span>
        <span>·</span>
        <span>{scene.fps}fps</span>
        <span>·</span>
        <span>{(scene.durationInFrames / scene.fps).toFixed(1)}s</span>
        {scene.voiceover?.audioUrl && (
          <>
            <span>·</span>
            <Volume2 className="h-3 w-3 text-primary" />
          </>
        )}
      </div>

      {/* File tree */}
      {files.length > 0 && (
        <div className="border-b border-border max-h-32 overflow-y-auto">
          <div className="px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            <FolderTree className="h-3 w-3" />
            Files
          </div>
          <div className="px-1 pb-1.5">
            {Object.entries(grouped).map(([dir, dirFiles]) => (
              <div key={dir}>
                <div className="text-[9px] text-muted-foreground font-medium px-1.5 py-0.5">{dir}/</div>
                {dirFiles.map((f) => {
                  const fileName = f.path.split("/").pop() || f.path;
                  const isSelected = selectedFilePath === f.path;
                  const icon = f.type === "audio" ? <Volume2 className="h-2.5 w-2.5" /> : <FileCode className="h-2.5 w-2.5" />;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilePath(isSelected ? null : f.path)}
                      className={`w-full text-left px-2.5 py-0.5 text-[10px] font-mono flex items-center gap-1.5 rounded transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {icon}
                      {fileName}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code viewer */}
      <div className="p-2.5 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            <Code2 className="h-3 w-3" />
            {selectedFile ? selectedFile.path.split("/").pop() : "Code"}
            {isGenerating && !selectedFile && <span className="text-primary animate-pulse">● live</span>}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(displayCode)}
            className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Copy
          </button>
        </div>
        <textarea
          value={displayCode}
          onChange={(e) => {
            if (!selectedFile && !isGenerating) {
              onUpdateCode(e.target.value);
            }
          }}
          readOnly={isGenerating || !!selectedFile}
          className="flex-1 min-h-0 bg-muted text-[10px] font-mono text-foreground p-2 rounded-md border border-border resize-none focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
