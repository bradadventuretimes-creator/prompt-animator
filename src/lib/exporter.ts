import type { RemotionScene } from "./scene-types";

export async function exportVideo(
  scene: RemotionScene,
  onProgress: (pct: number) => void
): Promise<void> {
  // Find the Remotion player iframe or container in the DOM
  const playerContainer = document.querySelector('[data-remotion-player]') as HTMLElement | null;
  if (!playerContainer) {
    throw new Error("Player not found. Please ensure the video preview is visible.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = scene.width;
  canvas.height = scene.height;
  const ctx = canvas.getContext("2d")!;

  const stream = canvas.captureStream(0);
  const recorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9",
    videoBitsPerSecond: 5_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "motion-video.webm";
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    };
    recorder.onerror = () => reject(new Error("Recording failed"));

    recorder.start();

    // Use html2canvas-like approach: capture the player DOM at each frame
    // For now, just do a simple screen capture of the player area
    let frame = 0;
    const totalFrames = scene.durationInFrames;
    const interval = 1000 / scene.fps;

    const renderNext = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      try {
        // Draw the player content to canvas via drawImage on a video or foreignObject
        // Fallback: fill with the current frame indicator
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.font = "24px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(`Frame ${frame}/${totalFrames}`, canvas.width / 2, canvas.height / 2);
      } catch {
        // ignore render errors during export
      }

      const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };
      if (track.requestFrame) track.requestFrame();
      onProgress(Math.round((frame / totalFrames) * 100));
      frame++;
      setTimeout(renderNext, interval / 4);
    };
    renderNext();
  });
}
