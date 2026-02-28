import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Square, RectangleHorizontal } from "lucide-react";

const RATIOS = [
  { label: "16:9 Landscape", w: 1920, h: 1080, icon: Monitor },
  { label: "9:16 Portrait", w: 1080, h: 1920, icon: Smartphone },
  { label: "1:1 Square", w: 1080, h: 1080, icon: Square },
  { label: "4:5 Social", w: 1080, h: 1350, icon: RectangleHorizontal },
];

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (w: number, h: number) => void;
}

export function NewProjectDialog({ open, onOpenChange, onCreate }: NewProjectDialogProps) {
  const [selected, setSelected] = useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Choose a video ratio to get started.</p>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {RATIOS.map((r, i) => {
            const Icon = r.icon;
            const isActive = selected === i;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted hover:border-muted-foreground/30"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{r.label}</span>
                <span className="text-[10px] text-muted-foreground">{r.w}×{r.h}</span>
              </button>
            );
          })}
        </div>
        <Button
          className="w-full mt-2"
          onClick={() => {
            onCreate(RATIOS[selected].w, RATIOS[selected].h);
            onOpenChange(false);
          }}
        >
          Create Project
        </Button>
      </DialogContent>
    </Dialog>
  );
}
