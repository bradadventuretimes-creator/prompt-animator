import { useState, useCallback, useRef } from "react";
import { DEFAULT_REMOTION_SCENE } from "@/lib/default-scene";
import { useSceneEditor } from "@/hooks/use-scene-editor";
import { exportVideo } from "@/lib/exporter";
import type { AppStatus, RemotionScene } from "@/lib/scene-types";
import { SidebarNav } from "@/components/SidebarNav";
import { ChatPanel } from "@/components/ChatPanel";
import { VideoPreview } from "@/components/VideoPreview";
import { EditingPanel } from "@/components/EditingPanel";
import { TimelinePanel } from "@/components/TimelinePanel";
import { MediaPanel } from "@/components/MediaPanel";
import { CodePanel } from "@/components/CodePanel";
import { ProjectsPanel, type SavedProject } from "@/components/ProjectsPanel";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Share2 } from "lucide-react";

const STORAGE_KEY = "javamotion_projects";

function loadProjects(): SavedProject[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveProjects(projects: SavedProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<AppStatus>("idle");
  const [modelProgress, setModelProgress] = useState(0);
  const [modelProgressText, setModelProgressText] = useState("");
  const [exportProgress, setExportProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("chat");
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [projects, setProjects] = useState<SavedProject[]>(loadProjects);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { toast } = useToast();

  const playerRef = useRef<{ seek: (f: number) => void; togglePlay: () => void; reset: () => void } | null>(null);

  const {
    scene,
    updateCode,
    updateDuration,
    updateFps,
    updateDimensions,
    replaceScene,
  } = useSceneEditor(DEFAULT_REMOTION_SCENE);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe the animation you want to create." });
      return;
    }
    try {
      const ai = await import("@/lib/ai");
      if (!ai.isModelLoaded()) {
        setStatus("loading-model");
        await ai.loadModel((pct, text) => {
          setModelProgress(pct);
          setModelProgressText(text);
        });
      }
      setStatus("generating");
      const newScene = await ai.generateScene(prompt);
      replaceScene(newScene);
      setStatus("idle");

      const project: SavedProject = {
        id: crypto.randomUUID(),
        name: prompt.slice(0, 50),
        createdAt: Date.now(),
        scene: newScene,
      };
      setProjects((prev) => {
        const next = [project, ...prev];
        saveProjects(next);
        return next;
      });

      toast({ title: "Scene generated!", description: "Your animation is ready to preview." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setStatus("idle");
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }, [prompt, replaceScene, toast]);

  const handleExport = useCallback(async () => {
    setStatus("exporting");
    setExportProgress(0);
    try {
      await exportVideo(scene, (pct) => setExportProgress(pct));
      setStatus("idle");
      toast({ title: "Export complete!", description: "Your video has been downloaded." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      setStatus("idle");
      toast({ title: "Export error", description: msg, variant: "destructive" });
    }
  }, [scene, toast]);

  const handleNewProject = useCallback((w: number, h: number) => {
    const blank: RemotionScene = {
      width: w,
      height: h,
      fps: 30,
      durationInFrames: 150,
      componentCode: `const frame = useCurrentFrame();
const { width, height } = useVideoConfig();
return (
  <div style={{ width, height, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ color: "#e0e0ff", fontSize: 32, fontFamily: "system-ui" }}>New Project</div>
  </div>
);`,
    };
    replaceScene(blank);
    setPrompt("");
    toast({ title: "New project", description: `Created ${w}×${h} composition.` });
  }, [replaceScene, toast]);

  const handleLoadProject = useCallback((p: SavedProject) => {
    replaceScene(p.scene as RemotionScene);
    setActiveTab("chat");
    toast({ title: "Project loaded", description: p.name });
  }, [replaceScene, toast]);

  const handleDeleteProject = useCallback((id: string) => {
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveProjects(next);
      return next;
    });
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    if (tab === "new") {
      setShowNewDialog(true);
      return;
    }
    setActiveTab(tab);
  }, []);

  const isExporting = status === "exporting";

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <header className="h-12 border-b border-border px-4 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-primary">Java</span>Motion
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
          <Button size="sm" onClick={handleExport} disabled={isExporting} className="gap-1.5 text-xs">
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {isExporting ? `${exportProgress}%` : "Download"}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />

        {activeTab === "chat" && (
          <ChatPanel prompt={prompt} onPromptChange={setPrompt} onGenerate={handleGenerate} status={status} modelProgress={modelProgress} modelProgressText={modelProgressText} />
        )}
        {activeTab === "media" && <MediaPanel scene={scene} />}
        {activeTab === "code" && <CodePanel scene={scene} />}
        {activeTab === "projects" && (
          <ProjectsPanel projects={projects} onLoad={handleLoadProject} onDelete={handleDeleteProject} />
        )}

        <VideoPreview
          scene={scene}
          onFrameUpdate={setCurrentFrame}
          onPlayingChange={setPlaying}
          onPlayerReady={(p) => { playerRef.current = p; }}
        />

        <EditingPanel
          scene={scene}
          onUpdateCode={updateCode}
          onUpdateDuration={updateDuration}
          onUpdateFps={updateFps}
          onUpdateDimensions={updateDimensions}
        />
      </div>

      <TimelinePanel
        scene={scene}
        currentFrame={currentFrame}
        playing={playing}
        onSeek={(f) => playerRef.current?.seek(f)}
        onTogglePlay={() => playerRef.current?.togglePlay()}
        onReset={() => playerRef.current?.reset()}
      />

      <NewProjectDialog open={showNewDialog} onOpenChange={setShowNewDialog} onCreate={handleNewProject} />
    </div>
  );
};

export default Index;
