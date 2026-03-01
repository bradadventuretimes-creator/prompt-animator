

# Replace TTS with Piper, Upgrade AI to Generate Rich Animations

## Overview

Two core changes: (1) swap Xenova TTS for Piper TTS (browser WASM-based, higher quality), and (2) upgrade the AI system prompt and workflow so it generates proper motion graphics with shapes, gradients, layered animations, and React components -- not just animated text.

---

## 1. Replace TTS with Piper TTS

**File: `package.json`**
- Add `@mintplex-labs/piper-tts-web` (v1.0.4)
- Remove `@huggingface/transformers`

**File: `src/lib/tts.ts`** -- Full rewrite:
```text
import * as tts from '@mintplex-labs/piper-tts-web';

export async function generateVoiceover(
  text: string,
  onProgress?: (progress: number, text: string) => void
): Promise<string> {
  onProgress?.(10, "Loading Piper TTS model...");
  const wav = await tts.predict({
    text,
    voiceId: 'en_US-hfc_female-medium',
  });
  onProgress?.(100, "Done");
  return URL.createObjectURL(wav);
}
```

This is a browser-only WASM library. It downloads the voice model on first use (~15MB), caches it, and generates WAV audio entirely client-side. Much faster and better quality than speecht5.

---

## 2. Upgrade AI System Prompt for Rich Motion Graphics

**File: `src/lib/ai.ts`** -- Rewrite `GENERATE_SYSTEM_PROMPT`:

The current prompt only teaches the AI to create text with opacity fades. The new prompt will include examples showing:

- **Geometric shapes**: circles, rectangles, lines as visual elements using `div` with borderRadius, gradients
- **Multi-layer compositions**: background layer, midground shapes, foreground text
- **Advanced animations**: spring-based entrances, parallax movement, scaling, rotation via CSS transform
- **Color and gradient backgrounds**: linear-gradient, radial-gradient
- **Icon/logo placeholders**: styled divs acting as logos (circles with initials, abstract shapes)
- **Scene transitions**: elements entering/exiting at different phases

Example additions to the system prompt:
```text
DESIGN PRINCIPLES:
- Create RICH motion graphics, not just text on a background
- Use geometric shapes (circles, rectangles, lines) as visual elements
- Layer multiple elements with different animation timings
- Use gradients, shadows, and color transitions
- Create logo-like elements using styled divs (circles with letters, abstract shapes)
- Animate position, scale, rotation, and opacity together
- Use spring() for natural-feeling entrances

EXAMPLE - Logo reveal with shapes:
The code creates a circle that scales in with spring, then text fades in,
then supporting shapes slide in from sides, then a tagline types in.
Each element uses different interpolate ranges spread across the full duration.
```

The prompt will include 2-3 rich examples showing multi-element compositions with shapes, not just text paragraphs.

---

## 3. Teach AI to Generate Reusable Sub-Components

**File: `src/lib/ai.ts`** -- Update system prompt to show the AI it can define helper functions inside the code body:

```text
You can define helper functions before the return statement:
  var makeCircle = function(x, y, size, color, delay) {
    var scale = spring({ frame: frame - delay, fps: fps, config: { damping: 12 } });
    return React.createElement("div", { style: { position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: color, transform: "scale(" + scale + ")" } });
  };
```

This lets the AI create reusable animated elements (particle systems, grid patterns, icon sets) rather than copy-pasting the same div 20 times.

---

## 4. Update Workflow Visual Generation Step

**File: `src/lib/ai.ts`** -- In `generateVideoWorkflow()`, improve the visual prompt sent per scene:

Currently it sends: `"Create a motion graphics scene: {visualDescription}"`

Change to include more context:
```text
"Create a motion graphics scene with rich visual elements.
Title: {title}
Visual concept: {visualDescription}
Narration: {narration}
Duration: {durationSeconds}s at {fps}fps = {durationInFrames} frames.

Include animated shapes, backgrounds with gradients, and text elements.
Spread animations across ALL {durationInFrames} frames in multiple phases."
```

This gives the AI enough context to design visuals that match the narration timing.

---

## 5. Audio Sync in Video Preview

**File: `src/components/VideoPreview.tsx`** -- Add an `<audio>` element that syncs with the Remotion Player when a scene has voiceover:

- Create an audio ref pointing to `scene.voiceover?.audioUrl`
- On player `play` event: `audioEl.play()`
- On player `pause` event: `audioEl.pause()`
- On `frameupdate`: sync `audioEl.currentTime = frame / fps` if drift > 0.1s
- On scene change: reset audio element src

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add `@mintplex-labs/piper-tts-web`, remove `@huggingface/transformers` |
| `src/lib/tts.ts` | Full rewrite to use Piper TTS predict API |
| `src/lib/ai.ts` | Rewrite GENERATE_SYSTEM_PROMPT with rich motion graphics examples; improve visual prompt in workflow |
| `src/components/VideoPreview.tsx` | Add audio element synced to player for voiceover playback |

### Piper TTS API
```text
import * as tts from '@mintplex-labs/piper-tts-web';
// Returns a Blob (WAV)
const wav = await tts.predict({ text: "Hello world", voiceId: "en_US-hfc_female-medium" });
const url = URL.createObjectURL(wav);
```

### Audio sync pattern (VideoPreview.tsx)
```text
const audioRef = useRef<HTMLAudioElement>(null);

// On frameupdate:
if (audioRef.current && scene.voiceover?.audioUrl) {
  const targetTime = frame / scene.fps;
  if (Math.abs(audioRef.current.currentTime - targetTime) > 0.15) {
    audioRef.current.currentTime = targetTime;
  }
}

// On play: audioRef.current?.play()
// On pause: audioRef.current?.pause()
```

### Enhanced system prompt structure
The new GENERATE_SYSTEM_PROMPT will be ~60 lines covering:
1. JSON output format (same as current)
2. Available APIs (same)
3. Design principles (NEW - shapes, layers, gradients)
4. Helper function pattern (NEW)
5. Two rich examples (NEW - logo reveal, info scene with shapes)
6. Duration enforcement (same)

