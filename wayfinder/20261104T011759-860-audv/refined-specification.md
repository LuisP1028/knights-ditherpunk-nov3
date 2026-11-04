# Refined Functional & Technical Specification (`refined-specification.md`)
# Ornate Chivalric Knights, Bill Atkinson Error-Diffusion Ditherpunk, and Modern Tactical HUD Interactive Election Day Portal for Tuesday, November 3, 2026

**Document Version:** 2.0 (Synthesized by `plan-1` from `functional_specification_001.md` and Stage 1 Discovery Scanners: `codebase-mapper`, `api-schema-mapper`, `mcp-provisioner`, `library-installer`, `function-mapper`)  
**Run ID:** `20261104T011759-860-audv`  
**Governed By:** [`LANGUAGE.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/LANGUAGE.md)  
**Status:** Authoritative Refined Technical Specification for Stage 2 Planning (`plan-2`, `planner-2.1`..`2.5`, `implementer`) and Stage 3 Implementation (`implementer-1`..`5`).  
**DO NOT CODE YET.** This document specifies exact objective functionality, workspace shapes, reusable module boundaries, API schemas, mathematical algorithms, Playwright MCP verification protocols, and objectively measurable verification targets without creating partial code diffs.

---

## 1. Objective & Desired Functionality

The objective of this project is to build an interactive, high-craft, zero-external-dependency static web application celebrating and facilitating voter participation on **General Election Day — Tuesday, November 3, 2026** (*"ORDER OF THE CIVIC AEGIS // NOVEMBER III BALLOT COMMAND"*).

The portal combines three core aesthetic and technical pillars into a seamless, high-performance experience:
1. **Ornate Chivalric Knights & Gothic Heraldry:** High-detail procedural luminance rendering and SVG filigree illustrating the civic mission of November 3 through 4 Chivalric Knight Orders (*Sir Vance of the Roll*, *Dame Astraea of the Warrant*, *Sir Percival of the Queue*, *Sovereign Champion of November III*) and a central hero monument (*The Guardian of the November III Ballot*).
2. **Authentic Bill Atkinson Error-Diffusion Ditherpunk:** Mathematical execution of true 6-neighbor, $\frac{1}{8}$-weight (75% error propagation, 25% local error absorption) Bill Atkinson dithering across procedural luminance buffers, alongside comparative dither modes (`Atkinson 1-Bit`, `Atkinson 2-Bit 4-Tone`, `Floyd-Steinberg Error Diffusion`, `Ordered Bayer 8x8 Stipple`) and 4 high-contrast Ditherpunk palettes.
3. **Modern Tactical HUD Overlay:** Crisp, responsive Heads-Up Display telemetry framing the dithered art, providing live countdown timers across all 6 U.S. time zones (`EST`, `CST`, `MST`, `PST`, `AKST`, `HST`) to November 3 poll closings, an interactive 5-step Election Day Readiness Gauntlet, a 6-item nonpartisan Sample Ballot simulator, official nonpartisan election protection hotlines (`866-OUR-VOTE`, `888-VE-Y-VOTA`, `888-API-VOTE`, `844-YALLA-US`), and an interactive "I VOTED — NOV 3" crest minting and PNG export studio.

---

## 2. Workspace Shape & Existing Code to Reuse (`codebase-mapper`)

### 2.1 Repository Layout & File Status
Per `codebase-mapper` findings in `wayfinder/20261104T011759-860-audv/codebase-map.md`:
- **Repository Architecture:** Greenfield standard ES Module project (`"type": "module"` in `package.json`).
- **Pre-existing Immutable Baseline (Do Not Modify):**
  - `package.json`: Contains `"type": "module"`, `"scripts": { "start": "node src/verify.mjs", "verify": "node src/verify.mjs --verify" }`.
  - `.nojekyll`: Present for static GitHub Pages routing.
  - `.gitignore`: Configured for Node.js, logs, and Sandcastle workspaces.
  - `LANGUAGE.md`: Authoritative domain glossary and evaluation taxonomy.
  - `functional_specification_001.md`: Original seed functional specification.

### 2.2 Strict Disjoint File Ownership Architecture
To guarantee zero Blackboard file collisions (`FILE_CLAIM_CONFLICT`), the implementation is strictly partitioned into 5 independent specialist tracks. Each file has exactly one owning implementer and reviewer:

| Track | Subsystem Description | Stage 2 Planner | Stage 3 Implementer | Stage 4 Tester | Exclusive Owned Files (`blackboard claim`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Track 1** | Tactical HUD Controller, Multi-Timezone November 3 Countdown & CLI Verifier | `planner-2.1` | `implementer-1` | `tester-1` | `src/hud_controller.mjs`<br>`src/verify.mjs`<br>`README.md` |
| **Track 2** | November 3 Civic Dataset & Deterministic Snapshot Store | `planner-2.2` | `implementer-2` | `tester-2` | `data/election_nov3_dataset.json`<br>`src/civic_store.mjs` |
| **Track 3** | Ornate Chivalric Knight Procedural Art, Gothic SVG Heraldry & Crest Studio | `planner-2.3` | `implementer-3` | `tester-3` | `src/knight_heraldry.mjs` |
| **Track 4** | Bill Atkinson Error-Diffusion Dithering Engine & Buffer Optimization | `planner-2.4` | `implementer-4` | `tester-4` | `src/atkinson_dither_engine.mjs` |
| **Track 5** | Flagship Webpage DOM, Ornate Ditherpunk + HUD Styling & Live Visual Polish | `planner-2.5` | `implementer-5` | `tester-5` | `index.html`<br>`styles/ditherpunk_hud.css` |

---

## 3. External Connections & Data Structures (`api-schema-mapper`)

### 3.1 Strict Zero-External-Network Invariant
Per `api-schema-mapper` findings (`wayfinder/20261104T011759-860-audv/api-schemas.md`):
- **External Network Requests:** Exactly `0`. No external REST/GraphQL APIs, CDN fonts, remote stylesheets, or external scripts are allowed.
- **Static Self-Contained Deployment:** The application runs completely offline, on local HTTP static servers, and directly on GitHub Pages.
- **Dataset Loading:** Track 2's dataset is stored at `data/election_nov3_dataset.json`. In Node.js, `src/verify.mjs` reads it via `node:fs/promises`. In the browser, `index.html` loads it via `fetch('./data/election_nov3_dataset.json')` with an immediate deterministic fallback to `DEFAULT_ELECTION_DATASET` exported by `src/civic_store.mjs` if run under restrictive protocols (such as `file://`).

### 3.2 Authoritative Dataset Schema (`data/election_nov3_dataset.json`)
The JSON document must match the schema mapped in `assets/20261104T011759-860-audv/api-schema-mapper-election-nov3-schema.json`:
- `schemaVersion`: `"1.0.0"`
- `electionDate`: `"2026-11-03"`
- `electionTitle`: `"General Election Day — Tuesday, November 3, 2026"`
- `portalBanner`: `"ORDER OF THE CIVIC AEGIS // NOVEMBER III BALLOT COMMAND"`
- `inLineVotingMandate`: `"If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law."`
- `pollClosingZones`: Array of 6 objects covering U.S. time zones:
  - `EST` (UTC-5): `standardCloseLocal: "19:00"`, `extendedCloseLocal: "20:00"`, states: `["GA", "IN", "KY", "VA", "VT", "FL", "NC", "OH", "WV", "PA", "MI"]`
  - `CST` (UTC-6): `standardCloseLocal: "19:00"`, `extendedCloseLocal: "20:00"`, states: `["AL", "MS", "MO", "OK", "TN", "TX", "IL", "WI", "MN", "AR", "LA"]`
  - `MST` (UTC-7): `standardCloseLocal: "19:00"`, `extendedCloseLocal: "20:00"`, states: `["AZ", "CO", "NM", "UT", "WY", "MT"]`
  - `PST` (UTC-8): `standardCloseLocal: "20:00"`, `extendedCloseLocal: "20:00"`, states: `["CA", "WA", "OR", "NV", "ID"]`
  - `AKST` (UTC-9): `standardCloseLocal: "20:00"`, `extendedCloseLocal: "20:00"`, states: `["AK"]`
  - `HST` (UTC-10): `standardCloseLocal: "19:00"`, `extendedCloseLocal: "19:00"`, states: `["HI"]`
- `knightOrders`: Array of 4 orders (`order-1` *Sir Vance of the Roll*, `order-2` *Dame Astraea of the Warrant*, `order-3` *Sir Percival of the Queue*, `order-4` *Sovereign Champion of November III*) with `id`, `name`, `title`, `motto`, `armorDescription`, `hudCallsign`, and `civicRole`.
- `readinessGauntlet`: Array of 5 sequential steps (`step-1` to `step-5`) with `id`, `title`, `tacticalObjective`, `instructions`, and `required`.
- `sampleBallotContests`: Array of 6 nonpartisan ballot items (Federal, State, Municipal Charter, Infrastructure Bond, Algorithmic Transparency, Library Levy) with `id`, `title`, `category`, `plainLanguageSummary`, `options` (`FOR`/`AGAINST` or candidates), and `fiscalImpact`.
- `voterRightsAndHotlines`:
  - `hotlines`: `866-OUR-VOTE` (English), `888-VE-Y-VOTA` (Spanish), `888-API-VOTE` (Asian languages), `844-YALLA-US` (Arabic).
  - `legalRights`: 4 core protections: In-Line Voting Right, Replacement Ballot Right, Provisional Ballot Right, and Assistance/Accessibility Right.

### 3.3 Storage Snapshot Schema (`src/civic_store.mjs`)
Stored in `window.localStorage` under key `"knights_ditherpunk_nov3_v1"` with automatic fallback to in-memory store if storage is blocked:
```json
{
  "version": 1,
  "lastSavedIso": "2026-11-03T18:00:00.000Z",
  "storageMode": "LOCAL_STORAGE",
  "checksum": "1a2b3c4d",
  "state": {
    "completedSteps": ["step-1"],
    "ballotSelections": { "contest-1": "candidate-a" },
    "selectedZone": "EST",
    "crest": {
      "callsign": "KNIGHT OF PRECINCT 04",
      "orderId": "order-1",
      "kernel": "atkinson-1bit",
      "palette": "obsidian-bone",
      "sealMinted": false
    },
    "studio": {
      "kernel": "atkinson-1bit",
      "palette": "obsidian-bone",
      "threshold": 128,
      "pixelScale": 2,
      "animateLight": true
    }
  }
}
```

---

## 4. Languages, Libraries & Function Signatures (`library-installer` & `function-mapper`)

### 4.1 Runtime Stack & Empirical Invariants
- **Language:** Standard Isomorphic ES2024 JavaScript (`.mjs`).
- **Dependencies:** `0` runtime npm dependencies.
- **Node.js Built-ins (for `src/verify.mjs`):** `node:fs`, `node:path`, `node:url`, `node:perf_hooks`, `node:assert/strict`.
- **Browser APIs:** Native HTML5 Canvas2D (`ImageData`, `Uint8ClampedArray`), SVG, and `localStorage`.

### 4.2 First-Principles Mathematical Dithering Invariant (Float32 Ring Buffer)
- **Atkinson Algorithm:**
  - Given pixel luminance $v \in [0, 255]$ and threshold $\tau$ (default 128):
    - Quantized value $q = (v \ge \tau) ? 255 : 0$ (or nearest level in $\{0, 85, 170, 255\}$ for 2-bit).
    - Quantization error $\Delta = v - q$.
    - Diffused error unit $\delta = \Delta \times 0.125$ ($\frac{1}{8}$).
    - Error diffused to 6 coordinates: $(x+1, y)$, $(x+2, y)$, $(x-1, y+1)$, $(x, y+1)$, $(x+1, y+1)$, $(x, y+2)$.
    - Total diffused error: $6 \times \frac{1}{8} = 0.75$ (75.0%). Local absorption: $25.0\%$.
- **Empirical V8 Finding:**
  - Implement using a 3-row floating-point error buffer: `new Float32Array(3 * (width + 4))`.
  - Multiplying by `0.125` in float arithmetic preserves exact precision (`(6 * delta) / Delta === 0.75`) without integer bit-shift truncation errors.
  - Benchmarked performance on `320x240`: **`0.802 ms`** per frame after 1 warmup pass (well below the `<= 8.0 ms` ceiling).

### 4.3 Exact Module Signatures

#### Track 4: `src/atkinson_dither_engine.mjs`
```javascript
export const DITHER_KERNELS = ['atkinson-1bit', 'atkinson-2bit', 'floyd-steinberg', 'bayer-8x8'];
export const DITHER_PALETTES = {
  'obsidian-bone': { shadow: '#0A0B0E', midDark: '#2B2D38', midLight: '#9CA3AF', highlight: '#F4F1EA', accent: '#E63946', levels: [[10,11,14],[43,45,56],[156,163,175],[244,241,234]] },
  'crimson-herald': { shadow: '#0B0708', midDark: '#4A1219', midLight: '#E63946', highlight: '#FFF8F0', accent: '#F59E0B', levels: [[11,7,8],[74,18,25],[230,57,70],[255,248,240]] },
  'phosphor-hud': { shadow: '#050C08', midDark: '#0D3B22', midLight: '#10B981', highlight: '#D1FAE5', accent: '#34D399', levels: [[5,12,8],[13,59,34],[16,185,129],[209,250,229]] },
  'cobalt-aegis': { shadow: '#070B14', midDark: '#1E3A8A', midLight: '#60A5FA', highlight: '#F1F5F9', accent: '#38BDF8', levels: [[7,11,20],[30,58,138],[96,165,250],[241,245,249]] }
};

export function ditherGrayscaleBuffer(inputLuminance, width, height, options = {}) {
  // options: { kernel = 'atkinson-1bit', threshold = 128 }
  // Returns: Uint8Array(width * height) with quantized levels {0, 255} or {0, 85, 170, 255}
}

export function applyPaletteToQuantized(quantizedBuffer, width, height, paletteId = 'obsidian-bone') {
  // Returns: Uint8ClampedArray(width * height * 4) RGBA
}

export function ditherRgbaBuffer(sourceRgba, width, height, options = {}) {
  // Converts RGBA to luminance, applies ditherGrayscaleBuffer, then applyPaletteToQuantized
  // Returns: Uint8ClampedArray(width * height * 4)
}

export function computeAtkinsonKernelVerify() {
  // Pure unit impulse test validating:
  // 1) Exactly 6 neighbors receive error: (1,0), (2,0), (-1,1), (0,1), (1,1), (0,2)
  // 2) Each receives exactly 1/8 (0.125) of delta
  // 3) Total error propagation is exactly 0.75 (75.0%)
  // 4) Micro-benchmark: 320x240 frame execution time <= 8.0 ms
  // Returns: { pass: boolean, propagationRatio: 0.75, neighborCount: 6, frameMs: number }
}
```

#### Track 3: `src/knight_heraldry.mjs`
```javascript
export const KNIGHT_SCENES = ['hero-guardian', 'order-1-recon', 'order-2-warrant', 'order-3-queue', 'order-4-champion'];

export function renderKnightSceneLuminance(sceneId, width, height, options = {}) {
  // options: { lightAngle = 0.0, visorOpen = false }
  // Returns: Uint8Array(width * height) grayscale luminance buffer with metallic specular gradients & gothic arches
}

export function getOrnateCornerFiligreeSVG(size = 48, className = '') {
  // Returns: SVG string of ornate corner brackets combining gothic tracery and HUD targeting crosshairs
}

export function getGothicArchHeaderSVG(titleText, subtitleText) {
  // Returns: SVG string of gothic cathedral arch framing header typography
}

export function getKnightCrestShieldSVG(orderId, width = 120, height = 140) {
  // Returns: SVG shield markup embossed with chivalric heraldry and "III NOV"
}

export function renderVotedCrestLuminance(config, width = 360, height = 360) {
  // config: { callsign, orderId }
  // Returns: Uint8Array(width * height)
}

export function renderVotedCrestToCanvas(canvas, config, ditherEngine) {
  // Renders crest luminance, applies dithering and palette, draws to HTMLCanvasElement
  // Returns: canvas
}
```

#### Track 2: `src/civic_store.mjs`
```javascript
export const STORAGE_KEY = 'knights_ditherpunk_nov3_v1';
export const DEFAULT_ELECTION_DATASET = { /* Complete embedded fallback dataset */ };

export function computeFnv1aChecksum(str) {
  // Returns: 8-character hex string of 32-bit FNV-1a hash
}

export function createCivicStore(initialState = {}, options = {}) {
  // Returns store instance:
  // { getState(), updateState(partial), completeGauntletStep(stepId), setBallotChoice(contestId, optionId),
  //   setZone(zoneId), setStudioParams(params), setCrestParams(params), resetStore(),
  //   getReadinessStats(), exportJson(), importJson(jsonStr) }
}
```

#### Track 1: `src/hud_controller.mjs`
```javascript
export function computePollCountdown(nowIsoOrEpoch, zoneId, dataset) {
  // Computes remaining time to November 3, 2026 local closing time:
  // Returns: {
  //   zoneId,
  //   status: 'POLLS_OPEN_ACTIVE' | 'FINAL_HOUR_CRITICAL' | 'POLLS_CLOSED_HOLD_THE_LINE',
  //   remainingSeconds: number (clamped >= 0),
  //   hours: number,
  //   minutes: number,
  //   seconds: number,
  //   percentDayElapsed: number,
  //   closingTimeLocal: string,
  //   inLineRightActive: boolean
  // }
}

export function formatHudTelemetryReadout(state, ditherStats = {}) {
  // Returns: string array of tactical HUD telemetry lines
}

export function initHudController({ rootElement, store, ditherEngine, knightHeraldry, dataset }) {
  // Binds countdown intervals, reticle tracking, keyboard shortcuts ([1-4], [K], [L], [H]), and canvas render loops
  // Returns: { destroy() }
}
```

#### Track 1: `src/verify.mjs`
CLI verification entry point (`npm run verify` $\rightarrow$ `node src/verify.mjs --verify`):
- Runs 5 automated checks in `<= 250 ms`:
  1. `VERIFY_DITHER_ENGINE`: Validates 6-neighbor Atkinson kernel, exact 0.75 propagation, and frame time `<= 8.0 ms`.
  2. `VERIFY_KNIGHT_HERALDRY`: Validates all 5 scenes generate non-empty, high-contrast luminance buffers and valid SVG strings.
  3. `VERIFY_CIVIC_DATASET_AND_STORE`: Validates schema fields in `data/election_nov3_dataset.json` and checksum state transitions in `src/civic_store.mjs`.
  4. `VERIFY_HUD_CONTROLLER`: Validates multi-timezone countdown logic for November 3, 2026 (including pre-open, active, final hour, and post-close "Hold the line" states).
  5. `VERIFY_DOM_AND_STYLESHEET`: Validates `index.html` and `styles/ditherpunk_hud.css` have all required IDs, no raw specification braces (`{Atkinson Dithering Engine}`, etc.), and valid responsive/reduced-motion rules.
- Prints clear diagnostic output and exits `0` on success, `1` on failure.

---

## 5. MCP Tools & Verification Playbook (`mcp-provisioner`)

The `playwright` MCP server is active and verified for Stage 4 browser audits. All calls are made via `call_mcp_tool` with `ServerName: "playwright"`.

### 5.1 Verification Checklist & Invocations
1. **Local HTTP Server Navigation:**
   - Command: `python3 -m http.server 4173` or equivalent static server.
   - MCP Tool: `browser_navigate` to `http://127.0.0.1:4173/index.html`.
2. **Multi-Viewport Zero-Overflow Audit:**
   - Viewports: `320x568` (iPhone SE min), `375x667` (standard mobile), `768x1024` (tablet), `1024x768` (desktop small), `1440x900` (desktop large), `1920x1080` (full HD).
   - MCP Tool: `browser_resize` followed by `browser_evaluate`:
     ```javascript
     () => ({
       scrollWidth: document.documentElement.scrollWidth,
       innerWidth: window.innerWidth,
       hasOverflow: document.documentElement.scrollWidth > window.innerWidth
     })
     ```
   - Invariant: `hasOverflow === false` at every breakpoint.
3. **Canvas & Atkinson Dither Pixel Invariant Audit:**
   - MCP Tool: `browser_evaluate`:
     ```javascript
     () => {
       const canvas = document.getElementById('canvas-hero-knight');
       if (!canvas) return { error: 'Missing hero canvas' };
       const ctx = canvas.getContext('2d');
       const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
       const nonZero = imgData.data.some((val, idx) => idx % 4 !== 3 && val > 0);
       return { width: canvas.width, height: canvas.height, rendered: nonZero };
     }
     ```
4. **Interactive Controls & Hotkey Verification:**
   - MCP Tool: `browser_press_key` with `'k'`, `'l'`, `'1'`, `'2'`, `'3'`, `'4'`.
   - Verify dither kernel and palette cycle without console errors.
5. **Reduced-Motion Accessibility:**
   - MCP Tool: `browser_emulate_media` with `media: 'prefers-reduced-motion: reduce'`.
   - Verify orbit loops pause smoothly.
6. **Zero-Network & Clean Console Audit:**
   - MCP Tool: `browser_console_messages` (verify zero unhandled errors/warnings).
   - MCP Tool: `browser_network_requests` (verify 0 outbound external CDN/API requests).
7. **Visual Evidence:**
   - MCP Tool: `browser_take_screenshot` saved to `screenshots/` for visual record.

---

## 6. Shared Contracts, Invariants & Expected Outputs

### 6.1 Required DOM Elements (`index.html`)
The HTML document must contain the following semantic IDs and sections:
- `#hud-top-telemetry-bar`: Sticky tactical HUD telemetry header with date (`NOV 03, 2026`), kernel readout, FPS counter, and navigation.
- `#section-hero-aegis`: Hero knight banner with `<canvas id="canvas-hero-knight">`, torch lighting controls, and gothic arch SVG.
- `#section-nov3-command`: Multi-timezone poll-closing countdown grid (`EST`, `CST`, `MST`, `PST`, `AKST`, `HST`), in-line voting protection banner, and 4 hotlines.
- `#section-dither-forge`: Atkinson error-diffusion workbench with kernel selector, palette selector, threshold slider, pixel scale, and file upload.
- `#section-knight-orders`: The 4 chivalric order cards (`#canvas-order-1` to `#canvas-order-4`) and the 5-step Readiness Gauntlet checklist.
- `#section-ballot-simulator`: 6 sample ballot cards with `FOR`/`AGAINST` toggles, argument summaries, and ballot summary exporter.
- `#section-voted-crest`: `<canvas id="canvas-voted-crest">` studio with callsign input, order selector, mint button, and PNG download button.

### 6.2 Strict Quality & Contract Invariants
1. **No Raw Braces In Copy:** DOM copy and text nodes must never contain raw spec braces like `{Atkinson Dithering Engine}` or `{Ornate Chivalric Knight Iconography}`.
2. **True Error Diffusion:** Dithering must mathematically compute error distribution across the 6 Atkinson neighbors and never be faked with CSS opacity/contrast filters.
3. **Contrast Compliance:** All text cards must satisfy WCAG AAA/AA contrast ($\ge 7:1$ for body text, $\ge 4.5:1$ for telemetry readouts) over dithered background surfaces.
4. **Deterministic Storage Fallback:** If `localStorage` is unavailable, `src/civic_store.mjs` seamlessly falls back to in-memory state without crashing.
5. **CLI Verification Budget:** `npm run verify` must execute all checks and exit `0` in `<= 250 ms`.
