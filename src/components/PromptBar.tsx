import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import type { AppStatus } from "@/lib/scene-types";

interface PromptBarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  status: AppStatus;
  modelProgress: number;
  modelProgressText: string;
}

export function PromptBar({
  prompt,
  onPromptChange,
  onGenerate,
  status,
  modelProgress,
  modelProgressText,
}: PromptBarProps) {
  const isLoading = status === "loading-model" || status === "generating";

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Textarea
          placeholder='Describe your animation... e.g. "Create a terminal animation that types a command and shows a success message"'
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className="flex-1 resize-none bg-card text-card-foreground border-border min-h-[60px]"
          disabled={isLoading}
        />
        <Button
          onClick={onGenerate}
          disabled={isLoading}
          className="self-end px-6"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span className="ml-2">
            {status === "loading-model" ? "Loading AI..." : status === "generating" ? "Generating..." : "Generate"}
          </span>
        </Button>
      </div>
      {status === "loading-model" && (
        <div className="space-y-1">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${modelProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground truncate">{modelProgressText}</p>
        </div>
      )}
    </div>
  );
}
