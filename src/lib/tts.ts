import * as tts from "@mintplex-labs/piper-tts-web";

let initialized = false;

export async function generateVoiceover(
  text: string,
  onProgress?: (progress: number, text: string) => void
): Promise<string> {
  if (!initialized) {
    onProgress?.(5, "Loading Piper TTS model...");
    initialized = true;
  }

  onProgress?.(10, "Generating speech...");

  const wav = await tts.predict({
    text,
    voiceId: "en_US-hfc_female-medium",
  });

  onProgress?.(100, "Done");
  return URL.createObjectURL(wav);
}
