import { useState, useCallback } from "react";
import { DEFAULT_SCENE } from "@/lib/default-scene";
import { useSceneEditor } from "@/hooks/use-scene-editor";
import { loadModel, generateScene, isModelLoaded } from "@/lib/ai";
import { exportVideo } from "@/lib/exporter";
import type { AppStatus } from "@/lib/scene-types";
import { PromptBar } from "@/components/PromptBar";
import { CanvasPreview } from "@/components/CanvasPreview";
import { EditingPanel } from "@/components/EditingPanel";
import { Timeline } from "@/components/Timeline";
import { ExportButton } from "@/components/ExportButton";
import { StatusIndicator } from "@/components/StatusIndicator";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<AppStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelProgressText, setModelProgressText] = useState("");
  const [exportProgress, setExportProgress] = useState(0);
  const { toast } = useToast();

  const {
    scene,
    updateBackground,
    updateElement,
    updateElementAnimation,
    updateDuration,
    replaceScene,
  } = useSceneEditor(DEFAULT_SCENE);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe the animation you want to create." });
      return;
    }
    setError(null);
    try {
      if (!isModelLoaded()) {
        setStatus("loading-model");
        await loadModel((pct, text) => {
          setModelProgress(pct);
          setModelProgressText(text);
        });
      }
      setStatus("generating");
      const newScene = await generateScene(prompt);
      replaceScene(newScene);
      setStatus("idle");
      toast({ title: "Scene generated!", description: "Your animation is ready to preview." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setError(msg);
      setStatus("idle");
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }, [prompt, replaceScene, toast]);

  const handleExport = useCallback(async () => {
    setStatus("exporting");
    setExportProgress(0);
    setError(null);
    try {
      await exportVideo(scene, (pct) => setExportProgress(pct));
      setStatus("idle");
      toast({ title: "Export complete!", description: "Your video has been downloaded." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      setError(msg);
      setStatus("idle");
      toast({ title: "Export error", description: msg, variant: "destructive" });
    }
  }, [scene, toast]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">AI Motion Editor</h1>
        <StatusIndicator status={status} error={error} />
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Prompt Input */}
        <PromptBar
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          status={status}
          modelProgress={modelProgress}
          modelProgressText={modelProgressText}
        />

        {/* Canvas Preview */}
        <CanvasPreview scene={scene} />

        {/* Timeline */}
        <Timeline scene={scene} />

        {/* Editing Panel + Export */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EditingPanel
              scene={scene}
              onUpdateBackground={updateBackground}
              onUpdateElement={updateElement}
              onUpdateElementAnimation={updateElementAnimation}
              onUpdateDuration={updateDuration}
            />
          </div>
          <div className="flex items-start">
            <ExportButton
              onExport={handleExport}
              status={status}
              exportProgress={exportProgress}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
