

# Fix Errors, Add Live Code Streaming, and Clean Up Platform

## Problems Identified

**1. "Render error: Unexpected token '<'"** -- The `remotion-renderer.tsx` uses `new Function()` which cannot parse JSX. The AI generates code containing JSX (`<div>`, `<h1>`, etc.) but `new Function()` only understands plain JavaScript. JSX needs to be transpiled to `React.createElement()` calls before execution.

**2. "AI returned invalid JSON"** -- The small local model (Qwen2.5-Coder-1.5B) often fails to produce valid JSON with properly escaped code strings. The current parsing is brittle -- it tries `JSON.parse()` once and gives up.

**3. No live code visibility** -- The AI generates everything in one shot, and the user only sees the result (or error) at the end. There's no streaming or progress feedback showing the code being written.

**4. Cluttered UI** -- Multiple unused/legacy components (Timeline.tsx, PromptBar.tsx, ExportButton.tsx, StatusIndicator.tsx, NavLink.tsx, renderer.ts) and the sidebar has tabs (Templates, Timeline) that don't do anything useful.

**5. App.css conflicts** -- `src/App.css` sets `max-width: 1280px` and `padding: 2rem` on `#root`, which constrains the full-screen editor layout.

## To answer your question about React in the browser

Yes, Remotion's React code works entirely in the browser without Node.js. The `@remotion/player` package renders React components as animations directly in the DOM. The only limitation is video **export** (encoding to MP4) which normally needs a server -- but for preview and WebM capture, everything runs client-side.

## Plan

### Step 1: Fix JSX Rendering (the "Unexpected token '<'" error)

The core issue: `new Function()` cannot parse JSX syntax. Two fixes needed:

- **Change the AI system prompt** to instruct the model to output `React.createElement()` calls instead of JSX. This avoids needing a JSX transpiler entirely. The prompt will include clear examples using `React.createElement("div", { style: {...} }, children)` instead of `<div style={...}>`.
- **Add a JSX-to-createElement fallback** in `remotion-renderer.tsx`: if the code contains `<` characters (indicating JSX), attempt a simple regex-based transform of common patterns before falling back to the error message. This catches cases where the AI still outputs JSX despite instructions.

### Step 2: Fix JSON Parsing (the "invalid JSON" error)

Make the AI output format more robust:

- **Use streaming** with WebLLM to accumulate tokens, then extract the code more reliably.
- **Add multiple extraction strategies** in `ai.ts`: try JSON.parse first, then regex extraction of the `"code"` field, then treat the entire output as code if it contains `return` and `React.createElement`.
- **Add auto-retry** (1 retry with a slightly rephrased prompt) before showing the error to the user.

### Step 3: Add Live Code Streaming

Switch `generateScene()` to use WebLLM's streaming API (`stream: true`):

- As tokens arrive, accumulate and display them in real-time in the code panel.
- Add a new `generateSceneStreaming()` function that accepts an `onToken(partialCode: string)` callback.
- The `Index.tsx` will pass this callback to update a `streamingCode` state, which the CodePanel/EditingPanel will display live.
- The code panel will auto-scroll to follow new tokens during generation.

### Step 4: Clean Up UI and Remove Dead Code

**Delete unused files:**
- `src/components/Timeline.tsx` (legacy canvas-based timeline, replaced by TimelinePanel)
- `src/components/PromptBar.tsx` (replaced by ChatPanel's built-in prompt area)
- `src/components/ExportButton.tsx` (replaced by header Download button)
- `src/components/StatusIndicator.tsx` (status shown inline in ChatPanel)
- `src/components/NavLink.tsx` (unused)
- `src/lib/renderer.ts` (legacy canvas renderer, replaced by Remotion)

**Clean up App.css:**
- Remove the `#root` max-width/padding rules that conflict with the full-screen layout.

**Simplify SidebarNav:**
- Remove "Timeline" tab (timeline is always visible at the bottom)
- Remove "Templates" tab (not implemented)
- Keep: New, Projects, Chat, Media, Code

**Simplify EditingPanel:**
- Merge Properties panel into a cleaner layout: composition info at top, live code editor below.
- Remove the separate CodePanel sidebar -- instead, the code is always visible in the right panel's code editor section.

### Step 5: Improve AI Prompt Quality

Rewrite the system prompt to:
- Use `React.createElement()` exclusively (no JSX)
- Provide 3 diverse examples (text animation, shape motion, multi-element scene)
- Be more explicit about the JSON format constraints
- Add negative examples ("DO NOT use JSX syntax like <div>")

---

## Technical Details

### Streaming API usage (ai.ts)
```text
const chunks = await engine.chat.completions.create({
  messages: [...],
  stream: true,
  temperature: 0.3,
  max_tokens: 3000,
});

let accumulated = "";
for await (const chunk of chunks) {
  accumulated += chunk.choices[0]?.delta?.content || "";
  onToken(accumulated);
}
```

### JSX-free code example (what AI will generate)
```text
const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
return React.createElement("div", {
  style: { width: 1280, height: 720, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }
}, React.createElement("div", {
  style: { fontSize: 48, color: "white", opacity }
}, "Hello World"));
```

### Robust JSON extraction (ai.ts)
```text
1. Try JSON.parse(content)
2. Try extracting JSON from markdown fences
3. Try regex: match /"code"\s*:\s*"([\s\S]*?)"\s*,/ and extract fields
4. If content contains "return" and "React.createElement", treat entire content as code with default dimensions
```

### Files to Modify
| File | Change |
|------|--------|
| `src/lib/ai.ts` | Streaming API, new prompt with React.createElement, robust parsing |
| `src/lib/remotion-renderer.tsx` | JSX fallback detection |
| `src/pages/Index.tsx` | Add streamingCode state, pass to panels, clean up |
| `src/components/SidebarNav.tsx` | Remove Timeline/Templates tabs |
| `src/components/EditingPanel.tsx` | Merge code view, show streaming code |
| `src/components/ChatPanel.tsx` | Show streaming progress with live token count |
| `src/App.css` | Remove conflicting #root styles |

### Files to Delete
| File | Reason |
|------|--------|
| `src/components/Timeline.tsx` | Legacy, replaced by TimelinePanel |
| `src/components/PromptBar.tsx` | Replaced by ChatPanel |
| `src/components/ExportButton.tsx` | Replaced by header button |
| `src/components/StatusIndicator.tsx` | Unused |
| `src/components/NavLink.tsx` | Unused |
| `src/lib/renderer.ts` | Legacy canvas renderer |
| `src/components/CodePanel.tsx` | Merged into EditingPanel |
| `src/components/MediaPanel.tsx` | Merged into EditingPanel as composition info |

