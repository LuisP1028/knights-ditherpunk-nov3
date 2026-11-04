# Verification & Deconfliction Blueprint (`verification-blueprint.md`)
# Ornate Chivalric Knights, Bill Atkinson Error-Diffusion Ditherpunk, and Modern Tactical HUD Interactive Election Day Portal for Tuesday, November 3, 2026

**Document Version:** 1.0 (Authoritative Stage 4 Verification, Testing & Blackboard Deconfliction Blueprint)  
**Author:** `tester` (Lead Verification & Review Coordinator)  
**Run ID:** `20261104T011759-860-audv`  
**Governed By:** [`LANGUAGE.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/.sandcastle/worktrees/agent-tester-20261104T011759-860-audv/LANGUAGE.md), [`functional_specification_001.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/.sandcastle/worktrees/agent-tester-20261104T011759-860-audv/functional_specification_001.md), [`wayfinder/20261104T011759-860-audv/refined-specification.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/.sandcastle/worktrees/agent-tester-20261104T011759-860-audv/wayfinder/20261104T011759-860-audv/refined-specification.md), and [`wayfinder/20261104T011759-860-audv/implementation-blueprint.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/.sandcastle/worktrees/agent-tester-20261104T011759-860-audv/wayfinder/20261104T011759-860-audv/implementation-blueprint.md)  
**Synthesized From Stage 3 Live Blackboard Ledger:** `seq=#1` through `seq=#14` (`implementer-1`, `implementer-2`, `implementer-3`, `implementer-4`, `implementer-5`).

---

## 1. Executive Summary & Verification Architecture

This blueprint governs Stage 4 (`stage4-testing`) for the **Ornate Chivalric Knights + Bill Atkinson Ditherpunk + Modern Tactical HUD Interactive Election Day Portal (`2026-11-03`)**. It synthesizes the Seed Specification, the Refined Specification, the Stage 2 Implementation Blueprint, and the live Stage 3 Blackboard module contract announcements (`seq=#1`–`#14`) into a zero-collision, deterministic verification protocol for `tester-1`, `tester-2`, `tester-3`, `tester-4`, and `tester-5`.

### 1.1 Core Evaluation Taxonomy (`LANGUAGE.md`)
Every `tester-x` agent MUST audit its assigned track against the strict evaluation parameters defined in [`LANGUAGE.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/.sandcastle/worktrees/agent-tester-20261104T011759-860-audv/LANGUAGE.md):
- **`{errors}`**: Zero stack traces, syntax errors, unhandled exceptions, non-zero exit codes, `FILE_CLAIM_CONFLICT` breaches, raw specification brace tokens (`{Atkinson Dithering Engine}`, `{Ornate Chivalric Knight Iconography}`, `{Modern Tactical HUD Overlay}`, `{November 3 Election Day Command Center}`, `{Dithered I-Voted Crest Generator}`, `{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`) leaked into visible DOM text, fake CSS opacity/noise filters substituted for genuine pixel quantization, horizontal viewport overflow (`document.documentElement.scrollWidth > window.innerWidth`), or external runtime network dependencies.
- **`{correctness}`**:
  1. Exact 6-neighbor Bill Atkinson error-diffusion quantization in `src/atkinson_dither_engine.mjs` where each neighbor $(x+1,y)$, $(x+2,y)$, $(x-1,y+1)$, $(x,y+1)$, $(x+1,y+1)$, and $(x,y+2)$ receives exact $\frac{1}{8}$ (`0.125`) of quantization error $\Delta = v - q$, propagating $\frac{6}{8} = 75.0\%$ (`0.75`) and absorbing $25.0\%$ (`0.25`) locally with zero boundary scanline wrapping.
  2. Deterministic multi-timezone November 3, 2026 poll-closing countdowns across all 6 U.S. time zones (`EST`, `CST`, `MST`, `PST`, `AKST`, `HST`), clamping post-close timestamps at `00:00:00` (`remainingSeconds === 0`) and transitioning cleanly to `'POLLS_CLOSED_HOLD_THE_LINE'`.
  3. Atomic client state persistence in `src/civic_store.mjs` with monotonic revision counters, 32-bit FNV-1a checksum integrity (`computeFnv1aChecksum`), JSON export/import validation, and automatic `MEMORY_FALLBACK` when `localStorage` is unavailable or throws `QuotaExceededError`.
- **`{functionality}`**: End-to-end interactive voter experience across `index.html` where all 6 canvases (`#canvas-hero-knight`, `#canvas-order-1`..`#canvas-order-4`, `#canvas-voted-crest`) render high-contrast Atkinson-dithered knight scenes, interactive HUD controls and hotkeys (`[1-4]`, `[K]`, `[L]`, `[H]`) work in real time, Readiness Gauntlet and Sample Ballot choices update HUD telemetry, and the "I VOTED — NOV 3" crest exports as a valid PNG.
- **`{correct required outputs}`**:
  - `npm run verify` (`node src/verify.mjs --verify`) exits `0` in `<= 250 ms` and prints `PASS: ALL NOVEMBER 3 KNIGHTS DITHERPUNK HUD INVARIANTS VERIFIED`.
  - Zero horizontal overflow (`overflowPx === 0`) across `320px`, `375px`, `768px`, `1024px`, `1440px`, and `1920px` viewports.
  - Zero console errors and zero external runtime network requests.

---

## 2. Mandatory Pre-Code Blackboard Deconfliction Protocol (`tester-1`..`5`)

To guarantee **zero file-lock collisions (`FILE_CLAIM_CONFLICT`)** and prevent duplicate test or remediation edits during Stage 4, every `tester-x` agent MUST obey the following sequence **before editing any file**:

1. **Step 1 — Read the Blackboard & Register Exclusive File Claims (`DO NOT CODE YET` Gate):**
   - Immediately upon startup, run `blackboard read --since 0`.
   - Claim **only** the exclusive remediation target files assigned to your Track in Section 2.1 using `blackboard claim <filepath>`.
   - **Never claim or edit files belonging to another Track.** If you discover a cross-track contract mismatch, post a `request` on the Blackboard (`blackboard post-request --to tester-<N> --content "..."`) rather than touching another tester's owned files.
   - **Immutable Baseline Files (NEVER Claim or Edit):** `package.json`, `.nojekyll`, `.gitignore`, `LANGUAGE.md`, and `functional_specification_001.md`.
2. **Step 2 — Run Read-Only Verification First (`npm run verify` + Track-Specific Probe):**
   - Execute `npm run verify` (`node src/verify.mjs --verify`) and your track's verification audit **before** modifying any source file.
   - If your track's owned files already pass 100% of unit, contract, performance, and visual checks with zero `{errors}`, **do not make unnecessary cosmetic edits**—record the empirical metrics in your Blackboard finding and handoff report.
   - If a defect is found in your owned files, remediate it surgical-first at its architectural root cause within your owned file boundary, then re-verify with `npm run verify`.
3. **Step 3 — Coordinate Ephemeral HTTP Server & Playwright MCP Sessions (`tester-5` Lead):**
   - `tester-5` is the designated primary operator for the live Playwright MCP multi-viewport browser audit (`http://127.0.0.1:4173/index.html`) and always closes the browser tab via `browser_close` (`{}`) and terminates its background HTTP server upon completion.
   - `tester-1` through `tester-4` perform deterministic Node.js CLI/module verification (and if any secondary browser check is needed, use a distinct ephemeral port `4174`–`4177` and immediately close).
4. **Step 4 — Publish Verification Telemetry & Complete:**
   - Post a comprehensive `finding` to `all` on the Blackboard summarizing your track's verified metrics (`frameMs`, `propagationRatio`, `verifyWallClockMs`, `overflowPx`, checksum tests), run `blackboard done`, and write your handoff report (`handoff/20261104T011759-860-audv/tester-<N>.txt`).

### 2.1 Exclusive 5-Track Verification & Remediation Ownership Matrix

| Tester Agent | Paired Implementer | Track Scope | Exclusive Owned Files for Claim & Remediation (`blackboard claim`) | Primary Verification Target |
| :--- | :--- | :--- | :--- | :--- |
| **`tester-1`** | `implementer-1` | **Track 1: Tactical HUD Controller, Multi-Zone Nov 3 Countdown & CLI Verifier** | `src/hud_controller.mjs`<br>`src/verify.mjs`<br>`README.md` | Multi-zone Nov 3 countdown state machine, HUD telemetry array + attached properties, hotkey dispatcher, and `npm run verify` (`<= 250 ms` exit `0`) |
| **`tester-2`** | `implementer-2` | **Track 2: November 3 Civic Dataset & Deterministic Snapshot Store** | `data/election_nov3_dataset.json`<br>`src/civic_store.mjs` | Dataset schema completeness (6 zones, 4 orders, 5 steps, 6 contests, 4 hotlines, 4 rights), FNV-1a checksum integrity, CoW store transitions, and `MEMORY_FALLBACK` |
| **`tester-3`** | `implementer-3` | **Track 3: Ornate Chivalric Knight Procedural Art, Gothic SVG Heraldry & Crest Studio** | `src/knight_heraldry.mjs` | All 5 `KNIGHT_SCENES` luminance contrast (`min < 40`, `max > 200`), polymorphic SVG generators, 5x7 ASCII crest luminance, and `renderVotedCrestToCanvas` |
| **`tester-4`** | `implementer-4` | **Track 4: Bill Atkinson Error-Diffusion Dithering Engine & Buffer Optimization** | `src/atkinson_dither_engine.mjs` | Exact 6-neighbor `0.125` float impulse test (`propagationRatio === 0.75`), boundary guard apron safety, 4 kernels, 4 palettes, and `320x240` compute `<= 8.0 ms` |
| **`tester-5`** | `implementer-5` | **Track 5: Flagship Webpage DOM, Ornate Ditherpunk + HUD Styling & Live Visual Audit** | `index.html`<br>`styles/ditherpunk_hud.css` | Playwright MCP live browser audit across `320px`–`1920px` (`0px` overflow), 6 non-empty dithered canvases, hotkeys, reduced-motion, `0` leaked braces, `0` console/network errors |

---

## 3. Synthesized Stage 3 Blackboard Contracts & Track-by-Track Verification Gates

### 3.1 Track 4 Verification Specification (`tester-4` $\rightarrow$ `src/atkinson_dither_engine.mjs`)
Per `implementer-4` Blackboard announcement (`seq=#4`, `seq=#12`):
- **Exclusive Claim:** `blackboard claim src/atkinson_dither_engine.mjs`
- **Contract & Invariant Checks:**
  1. **Exports Presence & Dual-Compatibility:**
     - `DITHER_KERNELS`: Object keyed by `'atkinson-1bit'`, `'atkinson-2bit'`, `'floyd-steinberg'`, `'bayer-8x8'` AND iterable (`Array.from(DITHER_KERNELS)` / `DITHER_KERNELS.list` / `DITHER_KERNELS.includes('atkinson-1bit')`).
     - `DITHER_PALETTES`: Object keyed by `'obsidian-bone'`, `'crimson-herald'`, `'phosphor-hud'`, `'cobalt-aegis'`, each with `shadow`, `midDark`, `midLight`, `highlight`, `accent` hex strings, `levels`/`tonesRgb` RGB arrays, and pre-computed `Uint32Array` ABGR lookup tables.
  2. **Bill Atkinson Mathematical Unit Impulse Audit (`computeAtkinsonKernelVerify()`):**
     - Verify `res.pass === true`, `res.neighborCount === 6`, `res.neighborWeightEach === 0.125`, `res.propagationRatio === 0.75` (`res.errorPropagationRatio === 0.75`), `res.absorbedFraction === 0.25`, and `res.boundarySafe === true`.
     - Verify the 6 exact neighbor offsets: `(1, 0)`, `(2, 0)`, `(-1, 1)`, `(0, 1)`, `(1, 1)`, `(0, 2)` each receive exact $\Delta \times 0.125$, and all non-neighbor pixels remain `0`.
  3. **Boundary Guard Apron Verification:**
     - Verify impulses at `(0, 0)`, `(width - 1, 0)`, `(width - 2, 0)`, and `(width - 1, height - 1)` never wrap error onto the opposite edge of the next scanline and never throw out-of-bounds errors.
  4. **Polymorphic Buffer & Palette Verification:**
     - Verify `ditherGrayscaleBuffer(lum, 320, 240, { kernel, threshold })` returns a `Uint8Array(76800)` with attached `.quantized`, `.width`, `.height`, `.kernel`, `.threshold`, `.errorPropagationRatio`, `.frameMs`, `.elapsedMs`, and `.rgba`.
     - Verify `applyPaletteToQuantized` works in both 3-arg `(qBuf, paletteId)` and 4-arg `(qBuf, width, height, paletteId)` forms, returning a `Uint8ClampedArray(width * height * 4)` with exact RGB levels matching `DITHER_PALETTES[paletteId].levels`.
     - Verify `ditherRgbaBuffer(rgba, width, height, options)` accurately converts RGBA to BT.601 luminance, dithers, and maps to palette RGBA.
  5. **Operational Frame Budget:**
     - Verify `computeAtkinsonKernelVerify().frameMs <= 8.0` on a `320x240` buffer.

---

### 3.2 Track 2 Verification Specification (`tester-2` $\rightarrow$ `data/election_nov3_dataset.json`, `src/civic_store.mjs`)
Per `implementer-2` Blackboard announcement (`seq=#2`, `seq=#3`, `seq=#10`):
- **Exclusive Claims:** `blackboard claim data/election_nov3_dataset.json` and `blackboard claim src/civic_store.mjs`
- **Contract & Invariant Checks:**
  1. **Dataset Schema Audit (`data/election_nov3_dataset.json` & `DEFAULT_ELECTION_DATASET`):**
     - `schemaVersion === '1.0.0'`, `electionDate === '2026-11-03'`.
     - `pollClosingZones`: Array of length `6` (`EST`, `CST`, `MST`, `PST`, `AKST`, `HST`), each with `id`, `zoneId`, `utcOffset`, `utcOffsetHours`, `standardCloseLocal`/`primaryCloseLocal`, `extendedCloseLocal`/`secondaryCloseLocal`, `closingIsoUtc`/`closeIsoUtc`, `representativeStates`/`states`, and `inLineProtectionRule`.
     - `knightOrders`: Array of length `4` (`order-1-recon`..`order-4-champion` + short ID aliases `order-1`..`order-4`).
     - `readinessGauntlet`: Array of length `5` (`step-1`..`step-5`).
     - `sampleBallotContests`: Array of length `6` (`contest-1`..`contest-6`).
     - `voterRightsAndHotlines`: `hotlines` array of length `4` (`866-OUR-VOTE`, `888-VE-Y-VOTA`, `888-API-VOTE`, `844-YALLA-US`) and `legalRights`/`rights`/`cardinalRights` arrays of length `4`.
  2. **Deterministic Snapshot Store Audit (`src/civic_store.mjs`):**
     - Verify `STORAGE_KEY === 'knights_ditherpunk_nov3_v1'`.
     - Verify `computeFnv1aChecksum` (and `computeChecksum`) returns deterministic 8-character lowercase hex strings.
     - Verify `createCivicStore()` state transitions across all canonical and alias methods:
       - `toggleStep` / `toggleReadinessStep` / `completeGauntletStep`: completing all 5 steps updates `metrics.readinessPercentage` from `0` $\rightarrow$ `20` $\rightarrow$ `40` $\rightarrow$ `60` $\rightarrow$ `80` $\rightarrow$ `100` and upgrades `metrics.unlockedKnightRank` to `'Sovereign Champion of November III'`.
       - `setBallotSelection` / `setBallotChoice`: locking choices across `contest-1`..`contest-6` updates `metrics.ballotCompletionCount` (`0`..`6`) and `metrics.ballotLockRatio` (`'0/6'`..`'6/6'`).
       - `setSelectedZone` / `setZone`: switches active zone (`EST`..`HST`) and ignores invalid zone codes.
       - `updateDitherConfig` / `setStudioParams` & `updateCrestConfig` / `setCrestParams` & `mintCivicSeal` / `mintSeal`.
       - `exportSnapshotJson` / `exportJson` & `importSnapshotJson` / `importJson`: round-trip import succeeds; tampered JSON payload with mismatched checksum throws a descriptive `Error` (Fail-Fast Invariant).
       - Storage resilience: When `storage` throws `QuotaExceededError` or `SecurityError`, store seamlessly operates with `storageMode === 'MEMORY_FALLBACK'` without throwing uncaught exceptions.

---

### 3.3 Track 3 Verification Specification (`tester-3` $\rightarrow$ `src/knight_heraldry.mjs`)
Per `implementer-3` Blackboard announcement (`seq=#1`, `seq=#14`):
- **Exclusive Claim:** `blackboard claim src/knight_heraldry.mjs`
- **Contract & Invariant Checks:**
  1. **Scene Catalog & Normalization (`KNIGHT_SCENES`):**
     - Verify `KNIGHT_SCENES` contains all 5 canonical scenes (`'hero-guardian'`, `'order-1-recon'`, `'order-2-warrant'`, `'order-3-queue'`, `'order-4-champion'`), supports `.byId` and `.descriptors`, and normalizes short IDs `'order-1'`..`'order-4'`.
  2. **Procedural 3D-Shaded Luminance Buffers (`renderKnightSceneLuminance`):**
     - Render each of the 5 scenes at `320x240` (and `240x180`) across varying `lightAngle` (`0.0`, `0.65`, `1.8`) and `visorOpen` (`false`, `true`).
     - Verify returned buffer is `Uint8Array(width * height)` with attached `.luminance`, `.width`, `.height`, `.sceneId`.
     - Verify high dynamic range (`min < 35`, `max > 215`, non-zero standard deviation) and confirm changing `lightAngle` produces distinct lighting gradients on the knight armor.
  3. **Polymorphic Gothic SVG Filigree Generators:**
     - Verify `getOrnateCornerFiligreeSVG` works with `('top-left', { size: 48 })` AND `(48, 'custom-class')`.
     - Verify `getGothicArchHeaderSVG` works with `('TITLE', 'SUBTITLE')` AND `({ title: 'TITLE', subtitle: 'SUBTITLE' })`.
     - Verify `getKnightCrestShieldSVG` works across all 4 orders with `(orderId, 120, 140)` AND `(orderId, { width: 120, height: 140 })`, containing valid `<svg`...`</svg>` tags and `"III NOV"` heraldry.
  4. **"I VOTED — NOV 3" Crest Luminance & Canvas Helper:**
     - Verify `renderVotedCrestLuminance({ callsign: 'SIR VANCE', orderId: 'order-1-recon' }, 360, 360)` produces a `Uint8Array(129600)` with rasterized 5x7 ASCII bitmap text and heraldic shield bevels.
     - Verify `renderVotedCrestToCanvas(mockOrRealCanvas, config, ditherEngine)` executes cleanly in both Node.js (mock 2D context) and browser Canvas2D, returning `{ canvas, width, height, rgba, quantized, frameMs }`.

---

### 3.4 Track 1 Verification Specification (`tester-1` $\rightarrow$ `src/hud_controller.mjs`, `src/verify.mjs`, `README.md`)
Per `implementer-1` Blackboard announcement (`seq=#5`, `seq=#7`, `seq=#8`, `seq=#11`):
- **Exclusive Claims:** `blackboard claim src/hud_controller.mjs`, `blackboard claim src/verify.mjs`, and `blackboard claim README.md`
- **Contract & Invariant Checks:**
  1. **Multi-Timezone November 3 Countdown Engine (`computePollCountdown` & `computeAllZoneCountdowns`):**
     - Test pre-close timestamp (`2026-11-03T18:00:00Z` = `13:00 EST`): verify `status === 'POLLS_OPEN_ACTIVE'`, `hours === 7`, `minutes === 0`, `seconds === 0`, `inLineRightActive === true`.
     - Test final-hour timestamp (`2026-11-04T00:30:00Z` = `19:30 EST`, 30m before `20:00 EST` extended close): verify `status === 'FINAL_HOUR_CRITICAL'`, `remainingSeconds === 1800`.
     - Test post-close timestamp (`2026-11-04T06:00:00Z`, after all 6 U.S. zones close): verify `status === 'POLLS_CLOSED_HOLD_THE_LINE'`, `remainingSeconds === 0`, `hours === 0`, `minutes === 0`, `seconds === 0`, `formatted === '00:00:00'` (strictly zero negative numbers), and `statusBadge` / `statusBanner` reminds voters in queue before close to stay in line.
     - Verify `computeAllZoneCountdowns` (and alias `computeAllZonesCountdown`) returns all 6 zones (`EST`, `CST`, `MST`, `PST`, `AKST`, `HST`).
  2. **HUD Telemetry Formatter (`formatHudTelemetryReadout`):**
     - Verify returned value is an `Array` of 8 telemetry lines containing `'2026-11-03'`, `'ATKINSON'`, `'75.0%'`, rank, and ballot lock ratio, AND has attached properties (`.sysDate`, `.kernelCode`, `.errorPropText`, `.frameLatencyText`, `.aegisRank`, `.readinessPercentage`, `.ballotLockRatio`, `.storageMode`, `.summaryLine`).
  3. **Keyboard Shortcut Dispatcher (`dispatchHudHotkey`):**
     - Verify keys `'1'`, `'2'`, `'3'`, `'4'` switch palettes, `'k'`/`'d'` cycles dither kernels, `'l'` toggles `animateLight`, `'h'` toggles HUD overlay, `'v'` mints seal, and events originating inside `<input>`/`<textarea>`/`<select>` are ignored.
  4. **CLI Verification Runner (`npm run verify` / `src/verify.mjs`):**
     - Run `npm run verify` (`node src/verify.mjs --verify`) and `npm start` (`node src/verify.mjs`).
     - Confirm all 5 suites (`VERIFY_DITHER_ENGINE`, `VERIFY_KNIGHT_HERALDRY`, `VERIFY_CIVIC_DATASET_AND_STORE`, `VERIFY_HUD_CONTROLLER`, `VERIFY_DOM_AND_STYLESHEET`) pass, total wall-clock execution time is `<= 250 ms`, exit code is `0`, and output contains `PASS: ALL NOVEMBER 3 KNIGHTS DITHERPUNK HUD INVARIANTS VERIFIED`.

---

### 3.5 Track 5 Live Browser & Visual Verification Specification (`tester-5` $\rightarrow$ `index.html`, `styles/ditherpunk_hud.css`)
Per `implementer-5` Blackboard announcement (`seq=#6`, `seq=#9`, `seq=#13`) and `wayfinder/20261104T011759-860-audv/mcp-tools.md`:
- **Exclusive Claims:** `blackboard claim index.html` and `blackboard claim styles/ditherpunk_hud.css`
- **Live Playwright MCP Browser Verification Protocol:**
  1. **Start Local Static HTTP Server:**
     - Launch `python3 -m http.server 4173 --bind 127.0.0.1` in background.
     - Call `playwright` $\rightarrow$ `browser_navigate` to `http://127.0.0.1:4173/index.html`.
  2. **DOM Semantic Completeness & Zero Leaked Braces Audit (`browser_evaluate`):**
     - Confirm presence of `#hud-top-telemetry-bar`, `#section-hero-aegis`, `#canvas-hero-knight`, `#section-nov3-command`, `#section-dither-forge`, `#section-knight-orders`, `#canvas-order-1`, `#canvas-order-2`, `#canvas-order-3`, `#canvas-order-4`, `#section-ballot-simulator`, `#section-voted-crest`, and `#canvas-voted-crest`.
     - Confirm `document.body.innerText` contains **zero** leaked brace tokens (`{Atkinson Dithering Engine}`, `{Ornate Chivalric Knight Iconography}`, `{Modern Tactical HUD Overlay}`, `{November 3 Election Day Command Center}`, `{Dithered I-Voted Crest Generator}`, `{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`).
  3. **Live Canvas Pixel-Buffer Inspection (`browser_evaluate`):**
     - Inspect `getContext('2d').getImageData(...)` on all 6 canvases (`#canvas-hero-knight`, `#canvas-order-1`..`4`, `#canvas-voted-crest`) and confirm every canvas is populated with non-zero, multi-tone dithered pixels matching the active palette.
  4. **Multi-Viewport Zero-Overflow Sweep (`browser_resize` + `browser_evaluate`):**
     - Resize through `320x568`, `375x812`, `768x1024`, `1024x768`, `1440x900`, and `1920x1080`.
     - At every viewport width, verify `document.documentElement.scrollWidth <= window.innerWidth` (`overflowPx === 0`).
  5. **Interactive Controls, Hotkeys & Reduced-Motion Accessibility:**
     - Dispatch hotkeys `'2'`, `'3'`, `'4'`, `'1'`, `'k'`, `'l'`, `'h'` via `browser_press_key` and verify `html[data-palette]` and canvas pixels update cleanly.
     - Click a Readiness Gauntlet checkbox and Sample Ballot choice button, and verify `localStorage.getItem('knights_ditherpunk_nov3_v1')` updates with a valid FNV-1a checksum.
     - Call `browser_emulate_media` with `{"reducedMotion": "reduce"}` and verify animations settle cleanly.
  6. **Zero Console Errors & Zero External Network Audit:**
     - Call `browser_console_messages` (`{"level": "error", "all": true}`) $\rightarrow$ assert `0` errors.
     - Call `browser_network_requests` (`{"includeStatic": true}`) $\rightarrow$ assert `0` non-`127.0.0.1` requests and `0` failed (`4xx`/`5xx`) requests.
     - Call `browser_close` (`{}`) and stop the local HTTP server.

---

## 4. Summary Verification Matrix & Sign-Off Criteria

| Gate ID | Verification Check | Owner | Target Budget / Invariant |
| :--- | :--- | :--- | :--- |
| **G-01** | `npm run verify` (`node src/verify.mjs --verify`) | `tester-1` (All Tracks) | Exit code `0` in `<= 250 ms`; prints `PASS: ALL NOVEMBER 3 KNIGHTS DITHERPUNK HUD INVARIANTS VERIFIED` |
| **G-02** | Bill Atkinson 6-Neighbor `1/8` Impulse & Frame Compute | `tester-4` | Exact `6` neighbors at `0.125` each (`0.75` propagation, `0.25` absorption); `320x240` frame `<= 8.0 ms` |
| **G-03** | November 3 Dataset & Deterministic Store Checksums | `tester-2` | `2026-11-03` schema (6 zones, 4 orders, 5 steps, 6 contests, 4 hotlines, 4 rights); FNV-1a + `MEMORY_FALLBACK` |
| **G-04** | Procedural Knight Luminance & Gothic SVG Heraldry | `tester-3` | All 5 `KNIGHT_SCENES` + voted crest render high-contrast buffers (`min < 40`, `max > 200`) & valid `<svg>` |
| **G-05** | Multi-Viewport Browser Overflow & Live Canvas Audit | `tester-5` | `0 px` horizontal overflow (`320px`–`1920px`), 6 active canvases, `0` leaked braces, `0` console/network errors |
