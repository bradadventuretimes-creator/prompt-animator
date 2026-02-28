import type { Scene } from "@/lib/scene-types";
import { Progress } from "@/components/ui/progress";

interface TimelineProps {
  scene: Scene;
}

export function Timeline({ scene }: TimelineProps) {
  const totalSeconds = scene.duration / scene.fps;

  return (
    <div className="p-3 bg-card border border-border rounded-lg space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-card-foreground">Timeline</h3>
        <span className="text-xs text-muted-foreground">
          {scene.duration} frames • {totalSeconds.toFixed(1)}s @ {scene.fps}fps
        </span>
      </div>
      <div className="space-y-1.5">
        {scene.elements.map((el, i) => {
          const startPct = (el.animation.startFrame / scene.duration) * 100;
          const durPct = (el.animation.duration / scene.duration) * 100;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-28 truncate" title={el.text}>
                {el.text}
              </span>
              <div className="flex-1 h-5 bg-muted rounded-sm relative overflow-hidden">
                <div
                  className="absolute top-0 h-full bg-primary/60 rounded-sm flex items-center px-1"
                  style={{
                    left: `${startPct}%`,
                    width: `${Math.min(durPct, 100 - startPct)}%`,
                  }}
                >
                  <span className="text-[10px] text-primary-foreground truncate">
                    {el.animation.type}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
