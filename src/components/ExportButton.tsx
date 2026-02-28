import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import type { AppStatus } from "@/lib/scene-types";

interface ExportButtonProps {
  onExport: () => void;
  status: AppStatus;
  exportProgress: number;
}

export function ExportButton({ onExport, status, exportProgress }: ExportButtonProps) {
  const isExporting = status === "exporting";

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onExport}
        disabled={isExporting || status === "loading-model" || status === "generating"}
        variant="secondary"
        className="gap-2"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isExporting ? `Exporting ${exportProgress}%` : "Export WebM"}
      </Button>
      {isExporting && (
        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden max-w-xs">
          <div
            className="bg-primary h-full transition-all duration-200"
            style={{ width: `${exportProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
