import type { RemotionScene } from "@/lib/scene-types";
import { usePlayer } from "@/hooks/use-player";
import { Player } from "@remotion/player";
import { Play, Pause, RotateCcw, Maximize, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useCallback, useRef, useState } from "react";

interface VideoPreviewProps {
  scene: RemotionScene;
  onFrameUpdate?: (frame: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onPlayerReady?: (player: { seek: (f: number) => void; togglePlay: () => void; reset: () => void }) => void;
}

export function VideoPreview({ scene, onFrameUpdate, onPlayingChange, onPlayerReady }: VideoPreviewProps) {
  const { playerRef, DynamicComponent, playing, setPlaying, currentFrame, setCurrentFrame, togglePlay, reset, seek } = usePlayer(scene);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioMuted, setAudioMuted] = useState(false);

  const totalSeconds = scene.durationInFrames / scene.fps;
  const currentSeconds = currentFrame / scene.fps;
  const hasVoiceover = !!scene.voiceover?.audioUrl;

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;

    const onPlay = () => {
      setPlaying(true);
      if (audioRef.current && hasVoiceover) {
        audioRef.current.play().catch(() => {});
      }
    };
    const onPause = () => {
      setPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
    const onEnded = () => {
      setPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
    const onFrame = (e: { detail: { frame: number } }) => {
      const frame = e.detail.frame;
      setCurrentFrame(frame);
      // Sync audio with video frame
      if (audioRef.current && hasVoiceover) {
        const targetTime = frame / scene.fps;
        if (Math.abs(audioRef.current.currentTime - targetTime) > 0.15) {
          audioRef.current.currentTime = targetTime;
        }
      }
    };

    p.addEventListener("play", onPlay);
    p.addEventListener("pause", onPause);
    p.addEventListener("ended", onEnded);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    p.addEventListener("frameupdate", onFrame as any);

    return () => {
      p.removeEventListener("play", onPlay);
      p.removeEventListener("pause", onPause);
      p.removeEventListener("ended", onEnded);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p.removeEventListener("frameupdate", onFrame as any);
    };
  }, [playerRef, setPlaying, setCurrentFrame, DynamicComponent, hasVoiceover, scene.fps]);

  // Reset audio when scene changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
  }, [scene.id]);

  useEffect(() => { onFrameUpdate?.(currentFrame); }, [currentFrame, onFrameUpdate]);
  useEffect(() => { onPlayingChange?.(playing); }, [playing, onPlayingChange]);
  useEffect(() => { onPlayerReady?.({ seek, togglePlay, reset }); }, [seek, togglePlay, reset, onPlayerReady]);

  const handleSeekBar = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const targetFrame = Math.round(pct * scene.durationInFrames);
    seek(targetFrame);
    if (audioRef.current && hasVoiceover) {
      audioRef.current.currentTime = targetFrame / scene.fps;
    }
  }, [seek, scene.durationInFrames, scene.fps, hasVoiceover]);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  const toggleMute = useCallback(() => {
    setAudioMuted((m) => {
      if (audioRef.current) audioRef.current.muted = !m;
      return !m;
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-card">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm">Video Player</h2>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 bg-background/50">
        <div ref={containerRef} className="relative rounded-xl overflow-hidden shadow-2xl bg-black w-full max-w-3xl">
          {hasVoiceover && (
            <audio ref={audioRef} src={scene.voiceover!.audioUrl} muted={audioMuted} preload="auto" />
          )}
          <Player
            ref={playerRef}
            component={DynamicComponent}
            compositionWidth={scene.width}
            compositionHeight={scene.height}
            durationInFrames={scene.durationInFrames}
            fps={scene.fps}
            style={{ width: "100%" }}
            controls={false}
            loop
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={togglePlay} className="h-8 w-8 text-white hover:text-primary hover:bg-white/10">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              {hasVoiceover && (
                <Button variant="ghost" size="icon" onClick={toggleMute} className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10">
                  {audioMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </Button>
              )}
              <span className="text-xs text-white/80 font-mono ml-auto">
                {currentSeconds.toFixed(2)} / {totalSeconds.toFixed(2)}
              </span>
              <Button variant="ghost" size="icon" onClick={reset} className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleFullscreen} className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10">
                <Maximize className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div
              className="mt-2 w-full bg-white/20 rounded-full h-1 cursor-pointer"
              onClick={handleSeekBar}
            >
              <div className="bg-primary h-full rounded-full transition-all duration-100" style={{ width: `${(currentFrame / scene.durationInFrames) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
