import { useState, useCallback, useRef } from "react";
import { DEFAULT_PROJECT } from "@/lib/default-scene";
import { useProjectEditor } from "@/hooks/use-scene-editor";
import { exportVideo } from "@/lib/exporter";
import type { AppStatus, RemotionScene, VideoProject, ProjectFile } from "@/lib/scene-types";
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

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "scene";
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
  const [streamingChat, setStreamingChat] = useState("");
  const [workflowStep, setWorkflowStep] = useState("");
  const [workflowDetail, setWorkflowDetail] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(DEFAULT_PROJECT.files);
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

  const addFileForScene = useCallback((scene: RemotionScene) => {
    const fileName = slugify(scene.name);
    const file: ProjectFile = {
      id: crypto.randomUUID(),
      path: `scenes/${fileName}.jsx`,
      content: scene.componentCode,
      sceneId: scene.id,
      type: "scene",
    };
    setProjectFiles((prev) => [...prev, file]);

    if (scene.voiceover?.audioUrl) {
      const audioFile: ProjectFile = {
        id: crypto.randomUUID(),
        path: `audio/${fileName}-voiceover.wav`,
        content: "[audio blob]",
        sceneId: scene.id,
        type: "audio",
      };
      setProjectFiles((prev) => [...prev, audioFile]);
    }
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
      toast({ title: "Enter a prompt", description: "Describe the video you want to create." });
      return;
    }

    addMessage("user", prompt);
    const currentPrompt = prompt;
    setPrompt("");

    const isGenerateIntent = ACTION_WORDS.test(currentPrompt);

    try {
      const ai = await ensureModel();

      if (!isGenerateIntent) {
        // Chat mode — stream to chat panel only
        setStatus("generating");
        const chatHistory = messages.map((m) => ({ role: m.role, content: m.content }));
        chatHistory.push({ role: "user" as const, content: currentPrompt });

        let response = "";
        await ai.chatWithAI(chatHistory, (accumulated) => {
          response = accumulated;
          setStreamingChat(accumulated);
        });

        setStreamingChat("");
        setStatus("idle");
        addMessage("assistant", response, ["Generate it now", "Tell me more", "Change the style"]);
        return;
      }

      // Generate mode — full workflow: Script -> Audio -> Visuals
      setStreamingCode("");
      setStreamingChat("");

      const scenes = await ai.generateVideoWorkflow(currentPrompt, {
        onStepChange: (step, detail) => {
          setStatus(step as AppStatus || "idle");
          setWorkflowStep(step);
          setWorkflowDetail(detail);
        },
        onScriptToken: (text) => {
          // Script streaming shown as workflow detail
          setWorkflowDetail(`Writing script... (${text.length} chars)`);
        },
        onCodeToken: (code) => {
          setStreamingCode(code);
        },
        onSceneReady: (scene) => {
          addScene(scene);
          addFileForScene(scene);
        },
        onChatMessage: (content) => {
          addMessage("assistant", content);
        },
        fps: project.globalSettings.fps,
        width: project.globalSettings.width,
        height: project.globalSettings.height,
      });

      setStreamingCode("");
      setStatus("idle");
      setWorkflowStep("");
      setWorkflowDetail("");

      const totalDuration = scenes.reduce((sum, s) => sum + s.durationInFrames / s.fps, 0).toFixed(1);
      addMessage("assistant", `🎬 Video complete! ${scenes.length} scenes, ${totalDuration}s total.`, [
        "Add more scenes", "Change the style", "Make it longer", "Export video"
      ]);

      toast({ title: "Video generated!", description: `${scenes.length} scenes created.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setStatus("idle");
      setStreamingCode("");
      setStreamingChat("");
      setWorkflowStep("");
      setWorkflowDetail("");
      addMessage("assistant", `Error: ${msg}. Try a simpler prompt or re-download the model in Settings.`);
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }, [prompt, messages, project.globalSettings, ensureModel, addMessage, addScene, addFileForScene, toast]);

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
    const sceneId = crypto.randomUUID();
    const defaultCode = `var frame = useCurrentFrame();\nvar config = useVideoConfig();\nreturn React.createElement("div", {\n  style: { width: config.width, height: config.height, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }\n}, React.createElement("div", {\n  style: { color: "#e0e0ff", fontSize: 32, fontFamily: "system-ui" }\n}, "New Project"));`;

    const newProject: VideoProject = {
      id: crypto.randomUUID(),
      name: "Untitled",
      createdAt: Date.now(),
      scenes: [{
        id: sceneId,
        name: "Scene 1",
        width: w,
        height: h,
        fps: 30,
        durationInFrames: 150,
        componentCode: defaultCode,
      }],
      files: [{
        id: crypto.randomUUID(),
        path: "scenes/scene-1.jsx",
        content: defaultCode,
        sceneId,
        type: "scene",
      }],
      activeSceneIndex: 0,
      globalSettings: { width: w, height: h, fps: 30 },
    };
    replaceProject(newProject);
    setProjectFiles(newProject.files);
    setPrompt("");
    setMessages([]);
    toast({ title: "New project", description: `Created ${w}×${h} composition.` });
  }, [replaceProject, toast]);

  const handleLoadProject = useCallback((p: SavedProject) => {
    const scene = p.scene as RemotionScene;
    if (!scene.id) scene.id = crypto.randomUUID();
    if (!scene.name) scene.name = p.name;
    const proj: VideoProject = {
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      scenes: [scene],
      files: [{
        id: crypto.randomUUID(),
        path: `scenes/${slugify(scene.name)}.jsx`,
        content: scene.componentCode,
        sceneId: scene.id,
        type: "scene",
      }],
      activeSceneIndex: 0,
      globalSettings: { width: scene.width, height: scene.height, fps: scene.fps },
    };
    replaceProject(proj);
    setProjectFiles(proj.files);
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

  const isExporting = status === "exporting";
  const isGenerating = status === "generating" || status === "scripting" || status === "generating-audio" || status === "generating-visuals";

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
            streamingChat={streamingChat}
            workflowStep={workflowStep}
            workflowDetail={workflowDetail}
            messages={messages}
            onSuggestionClick={handleSuggestionClick}
          />
        );
      case "projects":
        return <ProjectsPanel projects={projects} onLoad={handleLoadProject} onDelete={handleDeleteProject} />;
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
          files={projectFiles}
          onUpdateCode={(code) => updateActiveScene({ componentCode: code })}
          onDeleteScene={() => removeScene(project.activeSceneIndex)}
          onDuplicateScene={() => duplicateScene(project.activeSceneIndex)}
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
