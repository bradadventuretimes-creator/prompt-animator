import { Film, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RemotionScene } from "@/lib/scene-types";

export interface SavedProject {
  id: string;
  name: string;
  createdAt: number;
  scene: RemotionScene;
}

interface ProjectsPanelProps {
  projects: SavedProject[];
  onLoad: (project: SavedProject) => void;
  onDelete: (id: string) => void;
}

export function ProjectsPanel({ projects, onLoad, onDelete }: ProjectsPanelProps) {
  return (
    <div className="w-80 bg-card border-r border-border flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">Projects</h2>
      </div>
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {projects.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No saved projects yet. Generate a scene and it will appear here.</p>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              className="p-3 bg-muted/50 border border-border rounded-lg flex items-center gap-3 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => onLoad(p)}
            >
              <Film className="h-4 w-4 text-primary shrink-0" />
              <div className="text-xs min-w-0 flex-1">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-muted-foreground">
                  {p.scene.width}×{p.scene.height} · {(p.scene.durationInFrames / p.scene.fps).toFixed(1)}s
                </p>
                <p className="text-muted-foreground text-[10px]">
                  {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
