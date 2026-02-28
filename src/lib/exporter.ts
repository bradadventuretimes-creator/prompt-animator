import type { Scene } from "./scene-types";
import { renderFrame } from "./renderer";

export async function exportVideo(
  scene: Scene,
  onProgress: (pct: number) => void
): Promise<void> {
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

    let frame = 0;
    const totalFrames = scene.duration;
    const interval = 1000 / scene.fps;

    const renderNext = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }
      renderFrame(scene, frame, ctx);
      // Request frame from captureStream
      const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };
      if (track.requestFrame) track.requestFrame();
      onProgress(Math.round((frame / totalFrames) * 100));
      frame++;
      setTimeout(renderNext, interval / 4); // render faster than realtime
    };
    renderNext();
  });
}
