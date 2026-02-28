import { useState, useCallback, useRef } from "react";
import { DEFAULT_REMOTION_SCENE } from "@/lib/default-scene";
import { useSceneEditor } from "@/hooks/use-scene-editor";
import { exportVideo } from "@/lib/exporter";
import type { AppStatus, RemotionScene } from "@/lib/scene-types";
import { SidebarNav } from "@/components/SidebarNav";
import { ChatPanel, type ChatMessage } from "@/components/ChatPanel";
import { VideoPreview } from "@/components/VideoPreview";
import { EditingPanel } from "@/components/EditingPanel";
import { TimelinePanel, type TimelineClip } from "@/components/TimelinePanel";
import { ProjectsPanel, type SavedProject } from "@/components/ProjectsPanel";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

const STORAGE_KEY = "javamotion_projects";

function loadProjects(): SavedProject[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveProjects(projects: SavedProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function generateSuggestions(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const suggestions: string[] = [];
  if (lower.includes("logo") || lower.includes("brand")) {
    suggestions.push("Add particle effects", "Make it 3D", "Add tagline text");
  } else if (lower.includes("explainer") || lower.includes("product")) {
    suggestions.push("Add screen recording", "Add pricing slide", "Make it longer");
  } else {
    suggestions.push("Add more motion", "Change colors", "Make it slower");
  }
  return suggestions;
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
  const [streamingCode, setStreamingCode] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [clips, setClips] = useState<TimelineClip[]>([]);
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

  const addMessage = useCallback((role: "user" | "assistant", content: string, suggestions?: string[]) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: Date.now(),
      suggestions,
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe the animation you want to create." });
      return;
    }

    addMessage("user", prompt);
    const currentPrompt = prompt;
    setPrompt("");

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
      setStreamingCode("");

      const newScene = await ai.generateSceneStreaming(currentPrompt, (accumulated) => {
        setStreamingCode(accumulated);
      });

      replaceScene(newScene);
      setStreamingCode("");
      setStatus("idle");

      // Add clip to timeline
      const clipName = currentPrompt.slice(0, 30);
      setClips((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: clipName,
          startFrame: 0,
          durationInFrames: newScene.durationInFrames,
          color: "",
        },
      ]);

      // AI response with suggestions
      const suggestions = generateSuggestions(currentPrompt);
      addMessage("assistant", `Generated "${clipName}" — ${(newScene.durationInFrames / newScene.fps).toFixed(1)}s at ${newScene.width}×${newScene.height}. How would you like to refine it?`, suggestions);

      const project: SavedProject = {
        id: crypto.randomUUID(),
        name: currentPrompt.slice(0, 50),
        createdAt: Date.now(),
        scene: newScene,
      };
      setProjects((prev) => {
        const next = [project, ...prev];
        saveProjects(next);
        return next;
      });

      toast({ title: "Scene generated!", description: "Your animation is ready." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setStatus("idle");
      setStreamingCode("");
      addMessage("assistant", `Error: ${msg}. Try a simpler prompt or re-download the model in Settings.`);
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }, [prompt, replaceScene, toast, addMessage]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setPrompt(suggestion);
  }, []);

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
      componentCode: `var frame = useCurrentFrame();\nvar config = useVideoConfig();\nreturn React.createElement("div", {\n  style: { width: config.width, height: config.height, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }\n}, React.createElement("div", {\n  style: { color: "#e0e0ff", fontSize: 32, fontFamily: "system-ui" }\n}, "New Project"));`,
    };
    replaceScene(blank);
    setPrompt("");
    setMessages([]);
    setClips([]);
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
  const isGenerating = status === "generating";

  const renderSidePanel = () => {
    switch (activeTab) {
      case "chat":
        return (
          <ChatPanel
            prompt={prompt}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            status={status}
            modelProgress={modelProgress}
            modelProgressText={modelProgressText}
            streamingCode={streamingCode}
            messages={messages}
            onSuggestionClick={handleSuggestionClick}
          />
        );
      case "projects":
        return <ProjectsPanel projects={projects} onLoad={handleLoadProject} onDelete={handleDeleteProject} />;
      case "media":
        return (
          <div className="w-72 bg-card border-r border-border flex flex-col shrink-0">
            <div className="p-3 border-b border-border">
              <h2 className="font-semibold text-sm">Composition</h2>
            </div>
            <div className="p-3 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Dimensions</span><span className="font-mono text-foreground">{scene.width}×{scene.height}</span></div>
              <div className="flex justify-between"><span>FPS</span><span className="font-mono text-foreground">{scene.fps}</span></div>
              <div className="flex justify-between"><span>Duration</span><span className="font-mono text-foreground">{(scene.durationInFrames / scene.fps).toFixed(1)}s</span></div>
              <div className="flex justify-between"><span>Frames</span><span className="font-mono text-foreground">{scene.durationInFrames}</span></div>
            </div>
          </div>
        );
      case "code":
        return (
          <div className="w-72 bg-card border-r border-border flex flex-col shrink-0 overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Code</h2>
              <button
                onClick={() => navigator.clipboard.writeText(scene.componentCode)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="flex-1 p-3 text-[10px] font-mono text-foreground overflow-auto leading-relaxed whitespace-pre-wrap">
              {isGenerating && streamingCode ? streamingCode : scene.componentCode}
            </pre>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <header className="h-11 border-b border-border px-4 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-bold tracking-tight">
          <span className="text-primary">Java</span>Motion
        </h1>
        <Button size="sm" onClick={handleExport} disabled={isExporting} className="gap-1.5 text-xs h-7">
          {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
          {isExporting ? `${exportProgress}%` : "Export"}
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />
        {renderSidePanel()}

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
          streamingCode={streamingCode}
          isGenerating={isGenerating}
        />
      </div>

      <TimelinePanel
        scene={scene}
        currentFrame={currentFrame}
        playing={playing}
        onSeek={(f) => playerRef.current?.seek(f)}
        onTogglePlay={() => playerRef.current?.togglePlay()}
        onReset={() => playerRef.current?.reset()}
        clips={clips}
      />

      <NewProjectDialog open={showNewDialog} onOpenChange={setShowNewDialog} onCreate={handleNewProject} />
    </div>
  );
};

export default Index;
