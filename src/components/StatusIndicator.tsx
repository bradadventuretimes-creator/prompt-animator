import { Badge } from "@/components/ui/badge";
import type { AppStatus } from "@/lib/scene-types";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface StatusIndicatorProps {
  status: AppStatus;
  error: string | null;
}

const STATUS_MAP: Record<AppStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  idle: { label: "Ready", variant: "outline" },
  "loading-model": { label: "Loading AI Model", variant: "secondary" },
  generating: { label: "Generating Scene", variant: "secondary" },
  rendering: { label: "Rendering", variant: "secondary" },
  exporting: { label: "Exporting Video", variant: "secondary" },
};

export function StatusIndicator({ status, error }: StatusIndicatorProps) {
  const { label, variant } = STATUS_MAP[status];
  const isActive = status !== "idle";

  return (
    <div className="flex items-center gap-2">
      <Badge variant={error ? "destructive" : variant} className="gap-1.5">
        {isActive && !error && <Loader2 className="h-3 w-3 animate-spin" />}
        {!isActive && !error && <CheckCircle className="h-3 w-3" />}
        {error && <AlertCircle className="h-3 w-3" />}
        {error ? "Error" : label}
      </Badge>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
