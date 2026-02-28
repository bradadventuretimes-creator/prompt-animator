// @ts-nocheck
import { pipeline } from "@huggingface/transformers";

let synthesizer = null;

export async function generateVoiceover(
  text: string,
  onProgress?: (progress: number, text: string) => void
): Promise<string> {
  if (!synthesizer) {
    onProgress?.(0, "Loading TTS model...");
    synthesizer = pipeline("text-to-speech", "Xenova/speecht5_tts", {
      progress_callback: (p) => {
        onProgress?.(p.progress ?? 0, p.status ?? "Loading...");
      },
    });
  }

  const synth = await synthesizer;
  onProgress?.(50, "Generating audio...");

  const result = await synth(text, {
    speaker_embeddings:
      "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin",
  });

  const audio = result as { audio: Float32Array; sampling_rate: number };
  const wav = float32ToWav(audio.audio, audio.sampling_rate);
  const blob = new Blob([wav], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);

  onProgress?.(100, "Done");
  return url;
}

function float32ToWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}
