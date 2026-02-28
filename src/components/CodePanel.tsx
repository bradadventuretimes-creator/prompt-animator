import type { Scene } from "@/lib/scene-types";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";

interface CodePanelProps {
  scene: Scene;
}

export function CodePanel({ scene }: CodePanelProps) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(scene, null, 2);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [json]);

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm">Scene Code</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <pre className="text-[11px] font-mono text-muted-foreground bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre">
          {json}
        </pre>
      </div>
    </div>
  );
}
