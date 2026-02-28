import { useState, useCallback, useRef } from "react";
import { DEFAULT_PROJECT } from "@/lib/default-scene";
import { useProjectEditor } from "@/hooks/use-scene-editor";
import { exportVideo } from "@/lib/exporter";
import type { AppStatus, RemotionScene, VideoProject } from "@/lib/scene-types";
import { SidebarNav } from "@/components/SidebarNav";
import { ChatPanel, type ChatMessage } from "@/components/ChatPanel";
import { VideoPreview } from "@/components/VideoPreview";
import { EditingPanel } from "@/components/EditingPanel";
import { TimelinePanel } from "@/components/TimelinePanel";
import { ProjectsPanel, type SavedProject } from "@/components/ProjectsPanel";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

const STORAGE_KEY = "javamotion_projects";
const ACTION_WORDS = /\b(create|make|generate|build|animate|design|show|render)\b/i;

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
  const [streamingCode, setStreamingCode] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();

  const playerRef = useRef<{ seek: (f: number) => void; togglePlay: () => void; reset: () => void } | null>(null);

  const {
    project,
    activeScene,
    setActiveIndex,
    updateActiveScene,
    addScene,
    removeScene,
    duplicateScene,
    replaceProject,
  } = useProjectEditor(DEFAULT_PROJECT);

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

  const ensureModel = useCallback(async () => {
    const ai = await import("@/lib/ai");
    if (!ai.isModelLoaded()) {
      setStatus("loading-model");
      await ai.loadModel((pct, text) => {
        setModelProgress(pct);
        setModelProgressText(text);
      });
    }
    return ai;
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe the animation you want to create." });
      return;
    }

    addMessage("user", prompt);
    const currentPrompt = prompt;
    setPrompt("");

    const isGenerateIntent = ACTION_WORDS.test(currentPrompt);

    try {
      const ai = await ensureModel();

      if (!isGenerateIntent) {
        // Chat mode
        setStatus("generating");
        const chatHistory = messages.map((m) => ({ role: m.role, content: m.content }));
        chatHistory.push({ role: "user" as const, content: currentPrompt });

        let response = "";
        await ai.chatWithAI(chatHistory, (accumulated) => {
          response = accumulated;
          setStreamingCode(accumulated);
        });

        setStreamingCode("");
        setStatus("idle");
        addMessage("assistant", response, ["Generate it now", "Tell me more", "Change the style"]);
        return;
      }

      // Generate mode
      setStatus("generating");
      setStreamingCode("");

      const chatHistory = messages.map((m) => ({ role: m.role, content: m.content }));

      const result = await ai.generateSceneStreaming(currentPrompt, (accumulated) => {
        setStreamingCode(accumulated);
      }, {
        existingCode: activeScene.componentCode,
        messageHistory: chatHistory,
        fps: project.globalSettings.fps,
      });

      const newScene: RemotionScene = {
        id: result.id,
        name: result.name,
        componentCode: result.componentCode,
        width: result.width,
        height: result.height,
        fps: result.fps,
        durationInFrames: result.durationInFrames,
      };

      // If voiceover text was suggested, attach it
      if (result.voiceoverText) {
        newScene.voiceover = { text: result.voiceoverText, audioUrl: "" };
      }

      addScene(newScene);
      setStreamingCode("");
      setStatus("idle");

      const durationSec = (newScene.durationInFrames / newScene.fps).toFixed(1);
      const suggestions = ["Add more scenes", "Change colors", "Add voiceover", "Make it longer"];
      addMessage("assistant", `Generated "${newScene.name}" — ${durationSec}s at ${newScene.width}×${newScene.height}. ${result.voiceoverText ? 'Voiceover text suggested — click "Add voiceover" to generate audio.' : ""}`, suggestions);

      toast({ title: "Scene generated!", description: `${durationSec}s animation added.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setStatus("idle");
      setStreamingCode("");
      addMessage("assistant", `Error: ${msg}. Try a simpler prompt or re-download the model in Settings.`);
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }, [prompt, messages, activeScene, project.globalSettings.fps, ensureModel, addMessage, addScene, toast]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setPrompt(suggestion);
  }, []);

  const handleExport = useCallback(async () => {
    setStatus("exporting");
    setExportProgress(0);
    try {
      await exportVideo(activeScene, (pct) => setExportProgress(pct));
      setStatus("idle");
      toast({ title: "Export complete!", description: "Your video has been downloaded." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      setStatus("idle");
      toast({ title: "Export error", description: msg, variant: "destructive" });
    }
  }, [activeScene, toast]);

  const handleNewProject = useCallback((w: number, h: number) => {
    const newProject: VideoProject = {
      id: crypto.randomUUID(),
      name: "Untitled",
      createdAt: Date.now(),
      scenes: [{
        id: crypto.randomUUID(),
        name: "Scene 1",
        width: w,
        height: h,
        fps: 30,
        durationInFrames: 150,
        componentCode: `var frame = useCurrentFrame();\nvar config = useVideoConfig();\nreturn React.createElement("div", {\n  style: { width: config.width, height: config.height, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }\n}, React.createElement("div", {\n  style: { color: "#e0e0ff", fontSize: 32, fontFamily: "system-ui" }\n}, "New Project"));`,
      }],
      activeSceneIndex: 0,
      globalSettings: { width: w, height: h, fps: 30 },
    };
    replaceProject(newProject);
    setPrompt("");
    setMessages([]);
    toast({ title: "New project", description: `Created ${w}×${h} composition.` });
  }, [replaceProject, toast]);

  const handleLoadProject = useCallback((p: SavedProject) => {
    // Legacy support: wrap old scenes in project format
    const scene = p.scene as RemotionScene;
    if (!scene.id) scene.id = crypto.randomUUID();
    if (!scene.name) scene.name = p.name;
    const proj: VideoProject = {
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      scenes: [scene],
      activeSceneIndex: 0,
      globalSettings: { width: scene.width, height: scene.height, fps: scene.fps },
    };
    replaceProject(proj);
    setActiveTab("chat");
    toast({ title: "Project loaded", description: p.name });
  }, [replaceProject, toast]);

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

  const handleGenerateVoiceover = useCallback(async (text: string) => {
    try {
      setStatus("generating-voice");
      const tts = await import("@/lib/tts");
      const audioUrl = await tts.generateVoiceover(text, (pct, msg) => {
        setModelProgressText(`TTS: ${msg} (${pct}%)`);
      });
      updateActiveScene({ voiceover: { text, audioUrl } });
      setStatus("idle");
      toast({ title: "Voiceover generated!", description: "Audio attached to active scene." });
    } catch (err) {
      setStatus("idle");
      const msg = err instanceof Error ? err.message : "TTS failed";
      toast({ title: "Voiceover error", description: msg, variant: "destructive" });
    }
  }, [updateActiveScene, toast]);

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
              <div className="flex justify-between"><span>Dimensions</span><span className="font-mono text-foreground">{activeScene.width}×{activeScene.height}</span></div>
              <div className="flex justify-between"><span>FPS</span><span className="font-mono text-foreground">{activeScene.fps}</span></div>
              <div className="flex justify-between"><span>Duration</span><span className="font-mono text-foreground">{(activeScene.durationInFrames / activeScene.fps).toFixed(1)}s</span></div>
              <div className="flex justify-between"><span>Frames</span><span className="font-mono text-foreground">{activeScene.durationInFrames}</span></div>
              <div className="flex justify-between"><span>Scenes</span><span className="font-mono text-foreground">{project.scenes.length}</span></div>
            </div>
          </div>
        );
      case "code":
        return (
          <div className="w-72 bg-card border-r border-border flex flex-col shrink-0 overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Code</h2>
              <button
                onClick={() => navigator.clipboard.writeText(activeScene.componentCode)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="flex-1 p-3 text-[10px] font-mono text-foreground overflow-auto leading-relaxed whitespace-pre-wrap">
              {isGenerating && streamingCode ? streamingCode : activeScene.componentCode}
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
          scene={activeScene}
          onFrameUpdate={setCurrentFrame}
          onPlayingChange={setPlaying}
          onPlayerReady={(p) => { playerRef.current = p; }}
        />

        <EditingPanel
          scene={activeScene}
          sceneName={activeScene.name}
          sceneIndex={project.activeSceneIndex}
          totalScenes={project.scenes.length}
          onUpdateCode={(code) => updateActiveScene({ componentCode: code })}
          onUpdateDuration={(d) => updateActiveScene({ durationInFrames: d })}
          onUpdateFps={(fps) => updateActiveScene({ fps })}
          onDeleteScene={() => removeScene(project.activeSceneIndex)}
          onDuplicateScene={() => duplicateScene(project.activeSceneIndex)}
          onGenerateVoiceover={handleGenerateVoiceover}
          voiceover={activeScene.voiceover}
          streamingCode={streamingCode}
          isGenerating={isGenerating}
        />
      </div>

      <TimelinePanel
        scenes={project.scenes}
        activeSceneIndex={project.activeSceneIndex}
        onSelectScene={setActiveIndex}
        onDeleteScene={removeScene}
        onDuplicateScene={duplicateScene}
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
