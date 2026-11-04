# Visual Taste, Spatial Architecture & UI Direction (`visual-taste-direction.md`)

**Document Version:** 1.0 (Empirically Verified via Headless Chromium Playwright MCP & WCAG Contrast Audit)  
**Run ID:** `20261104T011759-860-audv`  
**Author:** `planner-2.5` (Multimodal Taste & Visual Direction Arbiter)  
**Target Handoff:** `plan-2`, `implementer`, `implementer-5` (Track 5: `index.html` & `styles/ditherpunk_hud.css`), `tester-5`  
**Governed By:** [`LANGUAGE.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/LANGUAGE.md) & [`wayfinder/20261104T011759-860-audv/refined-specification.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/wayfinder/20261104T011759-860-audv/refined-specification.md)

---

## 1. Executive Aesthetic Synthesis: "Cathedral Reliquary Meets Avionics Mission Control"

Track 5 (`index.html` and `styles/ditherpunk_hud.css`, exclusively owned by `implementer-5` and verified by `tester-5`) defines the visual and interactive surface of **"ORDER OF THE CIVIC AEGIS // NOVEMBER III BALLOT COMMAND"** for **General Election Day — Tuesday, November 3, 2026**.

To fuse the three core visual pillars without visual clutter, low-contrast text mud, or era-clash, the portal enforces a strict **Tri-Layer Spatial Hierarchy**:

1. **Layer 0 — Structural Architecture & Gothic Cathedral Heraldry (Macro Frame):**
   - Pointed gothic cathedral arches, rose-window rosettes, halberd dividers, and Victorian/Renaissance engraved corner filigree (`getOrnateCornerFiligreeSVG`, `getGothicArchHeaderSVG`, `getKnightCrestShieldSVG` from Track 3) establish monumental civic gravitas.
   - Structural frames sit on deep obsidian/vellum card surfaces with subtle 2×2 Ordered Bayer SVG stipple background textures (`--bayer-stipple-bg`) that never intrude behind body copy.
2. **Layer 1 — Authentic Bill Atkinson Error-Diffusion Ditherpunk Plates (Focal Art Viewports):**
   - All 6 `<canvas>` plates (`#canvas-hero-knight`, `#canvas-order-1`..`#canvas-order-4`, `#canvas-voted-crest`) operate as recessed, razor-sharp **1-bit and 2-bit optical viewports** (`image-rendering: pixelated; image-rendering: crisp-edges;`).
   - Because Bill Atkinson's 6-neighbor $\frac{1}{8}$-weight kernel propagates exactly $75.0\%$ of quantization error and absorbs $25.0\%$ locally, fluted gothic plate armor and cathedral masonry exhibit high-contrast specular stippling with zero midtone mud.
   - **Optimization Rule (per `planner-2.4` seq `#23`):** Never apply `filter: drop-shadow()`, `backdrop-filter: blur()`, or non-integer CSS transforms over any `<canvas>` element, as these trigger costly GPU readbacks and blur 1-bit pixel edges.
3. **Layer 2 — High-Precision Modern Tactical HUD Overlay (Micro Telemetry & Controls):**
   - Crisp `1px solid` targeting brackets, tabular-numeral multi-timezone countdown clocks (`EST`, `CST`, `MST`, `PST`, `AKST`, `HST`), reticle coordinate readouts (`KERNEL: ATKINSON_6x1/8`, `ERR_PROP: 75.0%`, `FRAME_MS`), and keyboard hotkey badges (`[1-4]`, `[K]`, `[L]`, `[H]`, `[V]`) frame the gothic artwork like a modern flight-deck / reconnaissance terminal.

### Verified Visual Prototypes (`assets/20261104T011759-860-audv/`)
Live prototypes were rendered and inspected via Playwright MCP across desktop and mobile viewports, confirming `0 px` horizontal overflow (`scrollWidth === innerWidth`) and razor-sharp 1-bit Atkinson stippling:
- **Desktop `1440×900` Prototype:** `assets/20261104T011759-860-audv/planner-2.5-ditherpunk-hud-prototype-desktop.png`
- **Mobile `375×812` Prototype:** `assets/20261104T011759-860-audv/planner-2.5-ditherpunk-hud-prototype-mobile.png`

---

## 2. Curated Ditherpunk Palettes & Empirically Verified WCAG AAA/AA Contrast Matrix

All 4 palettes defined in `src/atkinson_dither_engine.mjs` (`DITHER_PALETTES`) are mirrored as CSS Custom Properties on `html[data-palette="<palette-id>"]` in `styles/ditherpunk_hud.css`. Every text surface is masked by a dedicated opaque/high-opacity card background (`--surface-card` and `--surface-elevated`) so raw 1-bit dither noise never sits directly beneath readable typography.

### 2.1 Complete Palette Token & WCAG Contrast Verification Table

| Palette ID (`data-palette`) | 4 Quantization Tones (`0`, `85`, `170`, `255`) | UI Surface Tokens (`--surface-card` / `--surface-elevated`) | Typography & Accent Tokens (`--text-primary` / `--text-secondary` / `--accent-primary`) | Empirically Verified WCAG Contrast Ratios |
| :--- | :--- | :--- | :--- | :--- |
| **`obsidian-bone`** *(Default Classic Atkinson)* | `0`: `#0A0B0E`<br>`85`: `#2B2D38`<br>`170`: `#9CA3AF`<br>`255`: `#F4F1EA` | Card: `#0F1117`<br>Elevated: `#161922`<br>Glass: `rgba(15,17,23,0.92)` | Primary: `#F4F1EA`<br>Secondary: `#B8C0CC`<br>Muted: `#9CA3AF`<br>Accent: `#E63946` | • 1-Bit Canvas (`#F4F1EA` / `#0A0B0E`): **`17.45:1` (AAA)**<br>• Body Copy (`#F4F1EA` / `#0F1117`): **`16.73:1` (AAA)**<br>• Telemetry (`#B8C0CC` / `#0F1117`): **`10.29:1` (AAA)**<br>• Muted HUD (`#9CA3AF` / `#0F1117`): **`7.43:1` (AAA)**<br>• Accent Badge (`#E63946` / `#0F1117`): **`4.53:1` (AA)** |
| **`crimson-herald`** *(Nov 3 Civic Banner)* | `0`: `#0B0708`<br>`85`: `#4A1219`<br>`170`: `#E63946`<br>`255`: `#FFF8F0` | Card: `#120A0C`<br>Elevated: `#1C1013`<br>Glass: `rgba(18,10,12,0.94)` | Primary: `#FFF8F0`<br>Secondary: `#F3D5D8`<br>Muted: `#FCA5A5`<br>Accent: `#F59E0B` | • 1-Bit Canvas (`#FFF8F0` / `#0B0708`): **`19.02:1` (AAA)**<br>• Body Copy (`#FFF8F0` / `#120A0C`): **`18.56:1` (AAA)**<br>• Telemetry (`#F3D5D8` / `#120A0C`): **`14.26:1` (AAA)**<br>• Muted HUD (`#FCA5A5` / `#120A0C`): **`10.30:1` (AAA)**<br>• Accent Badge (`#F59E0B` / `#120A0C`): **`9.10:1` (AAA)** |
| **`phosphor-hud`** *(Tactical Night Vision)* | `0`: `#050C08`<br>`85`: `#0D3B22`<br>`170`: `#10B981`<br>`255`: `#D1FAE5` | Card: `#07120C`<br>Elevated: `#0B1D14`<br>Glass: `rgba(7,18,12,0.94)` | Primary: `#D1FAE5`<br>Secondary: `#6EE7B7`<br>Muted: `#34D399`<br>Accent: `#34D399` | • 1-Bit Canvas (`#D1FAE5` / `#050C08`): **`17.43:1` (AAA)**<br>• Body Copy (`#D1FAE5` / `#07120C`): **`16.82:1` (AAA)**<br>• Telemetry (`#6EE7B7` / `#07120C`): **`12.51:1` (AAA)**<br>• Muted HUD (`#34D399` / `#07120C`): **`9.92:1` (AAA)**<br>• Accent Badge (`#34D399` / `#07120C`): **`9.92:1` (AAA)** |
| **`cobalt-aegis`** *(Chivalric Steel & Cobalt)* | `0`: `#070B14`<br>`85`: `#1E3A8A`<br>`170`: `#60A5FA`<br>`255`: `#F1F5F9` | Card: `#0A101E`<br>Elevated: `#111A2E`<br>Glass: `rgba(10,16,30,0.94)` | Primary: `#F1F5F9`<br>Secondary: `#BAE6FD`<br>Muted: `#93C5FD`<br>Accent: `#38BDF8` | • 1-Bit Canvas (`#F1F5F9` / `#070B14`): **`17.97:1` (AAA)**<br>• Body Copy (`#F1F5F9` / `#0A101E`): **`17.34:1` (AAA)**<br>• Telemetry (`#BAE6FD` / `#0A101E`): **`14.31:1` (AAA)**<br>• Muted HUD (`#93C5FD` / `#0A101E`): **`10.53:1` (AAA)**<br>• Accent Badge (`#38BDF8` / `#0A101E`): **`8.87:1` (AAA)** |

> [!IMPORTANT]
> **Button Active-State Contrast Rule:** When a button or badge uses `background: var(--accent-primary)`, set `color: var(--bg-shadow)` (`#0A0B0E` / `#0B0708` / `#050C08` / `#070B14`) and `font-weight: 700` so active button labels maintain `>= 4.8:1` to `9.9:1` contrast across all 4 palettes.

---

## 3. Zero-Network Typography System & Fluid Scale (`0` External Font CDNs)

Per Section 3.1 of `refined-specification.md`, **zero external font CDNs (`fonts.googleapis.com`, etc.) are permitted**. `styles/ditherpunk_hud.css` uses carefully curated system font stacks that evoke chivalric stone carving, tactical avionics telemetry, and high-legibility civic prose:

```css
:root {
  /* Monumental Chivalric Display Stack (Roman/Gothic Inscribed Serif) */
  --font-display: 'Cinzel', 'Palatino Linotype', 'Book Antiqua', 'Iowan Old Style', 'Baskerville', 'Georgia', serif;

  /* Tactical HUD Telemetry & Countdown Numerals Stack */
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Mono', 'Menlo', 'Consolas', 'Liberation Mono', monospace;

  /* High-Legibility Civic Body & Sample Ballot Prose Stack */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
```

### Fluid Typographic Scale (`clamp()`)
- **Hero Monumental Title (`.chivalric-hero-title`):** `font-family: var(--font-display); font-size: clamp(1.65rem, 3.5vw, 2.85rem); line-height: 1.12; letter-spacing: 0.04em; text-transform: uppercase;`
- **Section Header (`.chivalric-section-title`):** `font-family: var(--font-display); font-size: clamp(1.25rem, 2.4vw, 1.95rem); line-height: 1.18; letter-spacing: 0.03em; text-transform: uppercase;`
- **Timezone Countdown Clock (`.tz-countdown-clock`):** `font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: clamp(1.35rem, 2.2vw, 1.85rem); font-weight: 700; letter-spacing: 0.05em;`
- **HUD Kicker / Callsign Pill (`.hud-kicker`, `.hud-pill`):** `font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: clamp(0.68rem, 1.05vw, 0.78rem); letter-spacing: 0.08em; text-transform: uppercase;`
- **Body & Sample Ballot Copy (`.civic-prose`):** `font-family: var(--font-sans); font-size: clamp(0.92rem, 1.15vw, 1.04rem); line-height: 1.58; max-width: 66ch;`

---

## 4. Screen-Size-Agnostic Responsive Grid Geometry (`320px` to `2560px+`)

To guarantee `document.documentElement.scrollWidth <= window.innerWidth` (`overflowPx === 0`) across all mandatory audit viewports (`320×568`, `375×667`, `768×1024`, `1024×768`, `1440×900`, `1920×1080`), `styles/ditherpunk_hud.css` MUST enforce the following structural geometry rules:

### 4.1 Global Box-Sizing & Overflow Containment
```css
*, *::before, *::after {
  box-sizing: border-box;
  min-width: 0; /* Critical: prevents CSS Grid/Flexbox children from forcing horizontal expansion */
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  background-color: var(--bg-shadow);
  background-image: var(--bayer-stipple-bg);
  color: var(--text-primary);
}

.portal-shell {
  width: min(100%, 1440px);
  margin-inline: auto;
  padding-block: clamp(1rem, 3vw, 2.25rem);
  padding-inline: clamp(0.65rem, 2.5vw, 2rem);
  display: flex;
  flex-direction: column;
  gap: clamp(1.25rem, 3.5vw, 2.75rem);
}
```

### 4.2 Safe Auto-Fit Grid Templates (`min(100%, <min-col-width>)`)
Never use raw `minmax(360px, 1fr)` without wrapping in `min(100%, ...)`, because a `360px` minimum column overflows a `320px` or `375px` viewport. Always use:
1. **Hero Banner (`#section-hero-aegis`):**
   - `grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));`
   - Splits into a 2-column monumental composition at `>= 768px` (left: Gothic Arch SVG + Chivalric Call to Action + Palette/Torch quick controls; right: Recessed `#canvas-hero-knight` HUD viewport with targeting brackets and live cursor reticle readout) and stacks cleanly into 1 column at `320px–767px`.
2. **Multi-Timezone Poll-Closing Matrix (`#section-nov3-command`):**
   - `grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));`
   - Renders 6 cards in 1 row at `1440px+`, 3×2 at `768px–1024px`, and 1-column or 2-column stack at `320px–375px`.
   - Apply `contain: layout paint;` to each `.tz-card` so the 1Hz countdown update never triggers document-wide layout reflows.
3. **Interactive Bill Atkinson Dither Forge (`#section-dither-forge`):**
   - `grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));`
   - Left column: Interactive $4 \times 3$ Bill Atkinson $\frac{1}{8}$ error-diffusion kernel matrix diagram (`[ *, 1/8, 1/8 ]`, `[ 1/8, 1/8, 1/8 ]`, `[ 0, 1/8, 0 ]` showing $6/8 = 75\%$ propagation and $25\%$ absorption) + comparative kernel selector (`atkinson-1bit`, `atkinson-2bit`, `floyd-steinberg`, `bayer-8x8`).
   - Right column: Live parameter controls (Palette `1–4`, Threshold $\tau \in [1, 254]$, Pixel Scale `1x`/`2x`/`3x`, Torch Light Angle slider & Orbit toggle, and local client-side image upload `<input type="file" accept="image/*">`).
4. **Four Chivalric Orders & 5-Step Readiness Gauntlet (`#section-knight-orders`):**
   - Orders gallery: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));` for `#canvas-order-1` through `#canvas-order-4`.
   - Readiness Gauntlet: 5 interactive step rows (`step-1` through `step-5`) with custom tactical checkbox indicators, HUD step codes (`GAUNTLET_01`..`GAUNTLET_05`), and an Aegis Rank progression bar (*Initiate of the Roll* $\rightarrow$ *Sovereign Champion of November III*).
5. **Sample Ballot Contemplation Matrix (`#section-ballot-simulator`):**
   - `grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));`
   - 6 nonpartisan ballot cards (`contest-1` through `contest-6`) with plain-language summary, fiscal impact note, pros/cons comparison, interactive option buttons (`FOR`, `AGAINST`, `CANDIDATE A`, `CANDIDATE B`, `UNDECIDED`), and a deterministic JSON/Text Ballot Summary export panel.
6. **"I VOTED — NOV 3" Dithered Crest Studio (`#section-voted-crest`):**
   - `grid-template-columns: repeat(auto-fit, minmax(min(100%, 290px), 1fr));`
   - Left column: Form controls for Voter Callsign (`#input-crest-callsign`, max 28 chars), Chivalric Order (`#select-crest-order`), Kernel & Palette overrides, **"MINT CIVIC SEAL [V]"** button (`#btn-mint-crest`), and **"DOWNLOAD DITHERED PNG (nov3-i-voted-crest.png)"** button (`#btn-download-crest`).
   - Right column: Centered square `<canvas id="canvas-voted-crest" width="360" height="360">` framed by ornate gothic SVG corner filigree.

---

## 5. Authoritative DOM Contract & Required Element IDs (`index.html`)

To guarantee 100% compatibility with Track 1 (`src/hud_controller.mjs` & `src/verify.mjs`) and Stage 4 Playwright MCP verification (`mcp-tools.md`), `index.html` MUST include all of the following exact IDs and attributes:

### 5.1 Mandatory Top-Level Section & Canvas IDs (Checked by `VERIFY_DOM_AND_STYLESHEET` & Playwright MCP)
1. `#hud-top-telemetry-bar` — Sticky tactical HUD header bar (`contain: layout paint;`).
2. `#section-hero-aegis` — Hero section containing:
   - `<canvas id="canvas-hero-knight" class="dither-canvas" width="320" height="240">`
   - Inline Gothic Arch SVG container (`#hero-gothic-arch-svg`)
   - Reticle & Torch-light controls (`#btn-toggle-light`, `#slider-light-angle`, `#hud-reticle-readout`)
3. `#section-nov3-command` — November 3 Poll-Closing Command Center containing:
   - `#countdown-grid-zones` (cards with `data-zone-id="EST"`, `"CST"`, `"MST"`, `"PST"`, `"AKST"`, `"HST"`)
   - `#banner-inline-voting-mandate` (displaying the statutory mandate: *"If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law."*)
   - `#grid-election-hotlines` (cards displaying `866-OUR-VOTE`, `888-VE-Y-VOTA`, `888-API-VOTE`, `844-YALLA-US`)
   - `#grid-voter-rights` (the 4 cardinal statutory voter rights)
4. `#section-dither-forge` — Interactive Bill Atkinson Ditherpunk Workbench containing:
   - `#select-dither-kernel` / buttons with `data-kernel="atkinson-1bit" | "atkinson-2bit" | "floyd-steinberg" | "bayer-8x8"`
   - `#select-dither-palette` / buttons with `data-palette="obsidian-bone" | "crimson-herald" | "phosphor-hud" | "cobalt-aegis"`
   - `#slider-dither-threshold` (`type="range" min="1" max="254" value="128"`)
   - `#select-pixel-scale` (`1`, `2`, `3`)
   - `#input-upload-image` (`type="file" accept="image/*"`)
   - `#atkinson-kernel-diagram` (visual $4 \times 3$ grid illustrating the six $\frac{1}{8}$ neighbor weights and $75\%$ propagation)
5. `#section-knight-orders` — Four Chivalric Orders & Readiness Gauntlet containing:
   - `<canvas id="canvas-order-1" class="dither-canvas" width="240" height="180" data-scene="order-1-recon">`
   - `<canvas id="canvas-order-2" class="dither-canvas" width="240" height="180" data-scene="order-2-warrant">`
   - `<canvas id="canvas-order-3" class="dither-canvas" width="240" height="180" data-scene="order-3-queue">`
   - `<canvas id="canvas-order-4" class="dither-canvas" width="240" height="180" data-scene="order-4-champion">`
   - `#readiness-gauntlet-list` (interactive checklist items for `step-1` through `step-5` with `data-step-id="step-1"`..`"step-5"`)
   - `#hud-readiness-progress` & `#hud-aegis-rank`
6. `#section-ballot-simulator` — Sample Ballot & Civic Proposition Matrix containing:
   - `#ballot-contests-grid` (cards for `contest-1` through `contest-6` with option buttons `data-contest-id` and `data-option`)
   - `#btn-export-ballot` & `#btn-reset-store`
   - `#ballot-export-output` (`<pre>` or `<textarea readonly>` for instant JSON/summary inspection)
7. `#section-voted-crest` — Interactive "I VOTED — NOV 3" Crest Studio containing:
   - `<canvas id="canvas-voted-crest" class="dither-canvas" width="360" height="360">`
   - `#input-crest-callsign` (`type="text" maxlength="28" value="KNIGHT OF PRECINCT 04"`)
   - `#select-crest-order` (`order-1-recon` through `order-4-champion`)
   - `#btn-mint-crest` ("MINT CIVIC SEAL [V]")
   - `#btn-download-crest` ("DOWNLOAD DITHERED PNG")

### 5.2 Initial SSR / Static HTML Population (Instant First-Paint & CLI Verifier Resilience)
Do **not** leave `#section-nov3-command`, `#section-knight-orders`, or `#section-ballot-simulator` as empty `<div>` shells waiting for JavaScript to populate them. `index.html` MUST include complete, semantic default HTML markup for:
- All 6 U.S. time zones (`EST`, `CST`, `MST`, `PST`, `AKST`, `HST`),
- All 4 Election Protection hotlines (`866-OUR-VOTE`, `888-VE-Y-VOTA`, `888-API-VOTE`, `844-YALLA-US`) and the In-Line Voting Mandate,
- All 4 Chivalric Knight Orders (`Sir Vance of the Roll`, `Dame Astraea of the Warrant`, `Sir Percival of the Queue`, `Sovereign Champion of November III`) and their `<canvas>` elements,
- All 5 Readiness Gauntlet steps (`step-1`..`step-5`), and
- All 6 Sample Ballot contests (`contest-1`..`contest-6`).
When `initHudController` / `initElectionHudApp` runs in the browser, it progressively hydrates and binds live event listeners and 1Hz/60Hz updates onto this rich initial DOM. This guarantees zero layout shift (`CLS = 0`), instant visual richness, and 100% pass rates on static file inspections in `src/verify.mjs`.

---

## 6. Strict Anti-Leak & Accessibility Invariants (`{errors}` Prevention)

1. **Zero Leaked Specification Braces in `index.html` or `styles/ditherpunk_hud.css`:**
   - Never include any curly-brace specification tokens anywhere in HTML text, comments, or attributes. Specifically forbidden strings:
     - `Atkinson Dithering Engine` wrapped in `{` `}`
     - `Ornate Chivalric Knight Iconography` wrapped in `{` `}`
     - `Modern Tactical HUD Overlay` wrapped in `{` `}`
     - `November 3 Election Day Command Center` wrapped in `{` `}`
     - `Dithered I-Voted Crest Generator` wrapped in `{` `}`
     - Evaluation taxonomy tokens (`errors`, `correctness`, `functionality`, `correct required outputs`, `sufficient`, `insufficient`) wrapped in `{` `}`.
2. **Reduced-Motion Accessibility (`@media (prefers-reduced-motion: reduce)`):**
   - `styles/ditherpunk_hud.css` MUST include an explicit `@media (prefers-reduced-motion: reduce)` block that disables CSS pulse/scan animations (`animation: none !important; transition: none !important;`) while keeping focus rings, hover borders, and manual controls crisp and responsive.
3. **Zero Missing Asset 404s:**
   - Include an inline SVG data-URI favicon (`<link rel="icon" href="data:image/svg+xml,...">`) in `<head>` so headless browsers never log a `404 (Not Found)` console error for `/favicon.ico`.
