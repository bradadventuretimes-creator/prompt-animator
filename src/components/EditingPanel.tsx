import type { Scene, AnimationType } from "@/lib/scene-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditingPanelProps {
  scene: Scene;
  onUpdateBackground: (color: string) => void;
  onUpdateElement: (index: number, updates: Record<string, unknown>) => void;
  onUpdateElementAnimation: (index: number, updates: Record<string, unknown>) => void;
  onUpdateDuration: (duration: number) => void;
}

export function EditingPanel({
  scene,
  onUpdateBackground,
  onUpdateElement,
  onUpdateElementAnimation,
  onUpdateDuration,
}: EditingPanelProps) {
  return (
    <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
      <h3 className="text-sm font-semibold text-card-foreground">Scene Properties</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Background</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={scene.background}
              onChange={(e) => onUpdateBackground(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <Input
              value={scene.background}
              onChange={(e) => onUpdateBackground(e.target.value)}
              className="flex-1 text-xs h-8"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Duration (frames)</Label>
          <Input
            type="number"
            value={scene.duration}
            onChange={(e) => onUpdateDuration(Math.max(1, parseInt(e.target.value) || 1))}
            className="text-xs h-8"
          />
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Elements</h3>
        <div className="space-y-4">
          {scene.elements.map((el, i) => (
            <div key={i} className="p-3 bg-muted/50 rounded-md space-y-2 border border-border/50">
              <span className="text-xs font-medium text-muted-foreground">Text Element {i + 1}</span>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Text</Label>
                <Input
                  value={el.text}
                  onChange={(e) => onUpdateElement(i, { text: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Color</Label>
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={el.color}
                      onChange={(e) => onUpdateElement(i, { color: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={el.color}
                      onChange={(e) => onUpdateElement(i, { color: e.target.value })}
                      className="flex-1 text-xs h-6"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Font Size</Label>
                  <Input
                    type="number"
                    value={el.fontSize}
                    onChange={(e) => onUpdateElement(i, { fontSize: parseInt(e.target.value) || 32 })}
                    className="text-xs h-6"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Animation</Label>
                  <Select
                    value={el.animation.type}
                    onValueChange={(v) => onUpdateElementAnimation(i, { type: v as AnimationType })}
                  >
                    <SelectTrigger className="h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="typing">Typing</SelectItem>
                      <SelectItem value="fadeIn">Fade In</SelectItem>
                      <SelectItem value="scaleIn">Scale In</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Start Frame</Label>
                  <Input
                    type="number"
                    value={el.animation.startFrame}
                    onChange={(e) => onUpdateElementAnimation(i, { startFrame: parseInt(e.target.value) || 0 })}
                    className="text-xs h-6"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Anim Duration</Label>
                  <Input
                    type="number"
                    value={el.animation.duration}
                    onChange={(e) => onUpdateElementAnimation(i, { duration: parseInt(e.target.value) || 30 })}
                    className="text-xs h-6"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
