# API, Web Platform, Dataset & Cross-Module Payload Schemas (`api-schemas.md`)

**Run ID:** `20261104T011759-860-audv`  
**Scanner Role:** `api-schema-mapper`  
**Governed By:** [`LANGUAGE.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/LANGUAGE.md) & [`functional_specification_001.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/functional_specification_001.md)

---

## 1. Connection & Runtime Environment Architecture

### 1.1 Zero-External-Network Operational Invariant
Per [`functional_specification_001.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/functional_specification_001.md) Section 2 (`{errors}` item 5), Section 4.5.1, and Section 5, the application operates under a strict **Zero External Runtime Network Request (`0` external APIs / `0` external CDN scripts)** invariant:
- **External REST/GraphQL Endpoints:** None (`0`). No external telemetry, font CDNs, or third-party scripts may be fetched at runtime.
- **Static Deployment Compatibility:** Must run 100% self-contained offline, over local HTTP static servers, and on GitHub Pages (`./` relative paths).
- **Local Data Source Connection:**
  - **File Path:** `./data/election_nov3_dataset.json`
  - **Node.js CLI Access (`src/verify.mjs`):** Loaded deterministically via `node:fs/promises` (`readFile(new URL('../data/election_nov3_dataset.json', import.meta.url), 'utf8')`).
  - **Browser Runtime Access (`index.html` / `src/hud_controller.mjs` / `src/civic_store.mjs`):** Loaded via `fetch('./data/election_nov3_dataset.json')` with an immediate deterministic fallback to the canonical dataset exported by `src/civic_store.mjs` (`DEFAULT_ELECTION_DATASET`) so the UI never fails even under `file://` protocol restrictions.

### 1.2 Web Platform & Node.js Built-in API Surface
| API Surface | Environment | Usage & Contract | Error / Boundary Handling |
| :--- | :--- | :--- | :--- |
| `window.localStorage` | Browser | Persist serialized snapshot JSON under key `"knights_ditherpunk_nov3_v1"` | Catch `QuotaExceededError` / `SecurityError` -> set `storageMode: "MEMORY_FALLBACK"` without throwing |
| `HTMLCanvasElement.getContext('2d')` | Browser | `createImageData(w, h)`, `putImageData(imgData, 0, 0)`, `toDataURL('image/png')` | Guard missing canvas or headless Node environment by running pure `Uint8ClampedArray` / `Uint8Array` buffer transforms in `src/atkinson_dither_engine.mjs` |
| `FileReader` / `Image` | Browser | Optional user portrait upload in `#section-dither-forge` for live client-side Atkinson dithering | Validate `file.type.startsWith('image/')`; clamp internal working resolution to `320x240` or `360x240` to maintain `<= 8.0 ms` frame budget |
| `window.matchMedia('(prefers-reduced-motion: reduce)')` | Browser | Detect OS reduced-motion preference | When `.matches === true`, default `animateLight: false` and pause continuous radar/torch orbit loops while keeping manual controls interactive |
| `performance.now()` | Browser & Node.js | Measure per-frame Atkinson dithering compute latency (`frameMs`) and CLI verify wall-clock (`<= 250 ms`) | Available globally in both modern browsers and Node.js `v24.9.0` |

---

## 2. Verbatim Schema: `data/election_nov3_dataset.json` (Track 2 Owned)

`data/election_nov3_dataset.json` (claimed exclusively by `implementer-2` in Track 2) MUST conform to the following exact JSON structure so Track 1 (`src/hud_controller.mjs`, `src/verify.mjs`) and Track 5 (`index.html`) can consume every field without guessing:

```json
{
  "schemaVersion": "1.0.0",
  "electionDate": "2026-11-03",
  "electionTitle": "General Election Day — Tuesday, November 3, 2026",
  "portalBanner": "ORDER OF THE CIVIC AEGIS // NOVEMBER III BALLOT COMMAND",
  "inLineVotingMandate": "If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.",
  "pollClosingZones": [
    {
      "zoneId": "EST",
      "label": "Eastern Standard Time (UTC-5)",
      "utcOffset": "UTC-05:00",
      "utcOffsetHours": -5,
      "primaryClosingLocalTime": "19:00",
      "secondaryClosingLocalTime": "20:00",
      "closingIsoUtc": "2026-11-04T01:00:00Z",
      "earliestClosingIsoUtc": "2026-11-04T00:00:00Z",
      "representativeStates": ["NY", "PA", "GA", "MI", "NC", "OH", "VA", "FL", "MA"],
      "inLineProtectionRule": "If you are in line before polls close on November 3 (19:00/20:00 EST), stay in line—your right to cast a ballot is protected by law."
    }
  ],
  "knightOrders": [
    {
      "orderId": "order-1-recon",
      "romanNumeral": "I",
      "name": "Sir Vance of the Roll",
      "title": "Order I — Sir Vance of the Roll (Precinct & Registration Recon)",
      "motto": "VERIFY THE ROLL // LOCK THE PRECINCT",
      "sceneId": "order-1-recon",
      "armorNotes": "Hounskull bascinet helm with articulated bevors, fluted reconnaissance pauldrons, and illuminated precinct scroll.",
      "hudDesignation": "RECON_UNIT_01 // ROLL_VERIFIER",
      "civicMission": "Verify active voter registration, confirm assigned November 3 polling place, and inspect precinct opening hours."
    }
  ],
  "readinessGauntlet": [
    {
      "stepId": "step-1",
      "stepNumber": 1,
      "title": "Verify Registration & Precinct Location",
      "hudCode": "GAUNTLET_01 // ROLL_RECON",
      "description": "Confirm active registration status and exact precinct polling address for Tuesday, November 3, 2026.",
      "actionHint": "Check official state/local election roll lookup and note precinct room number.",
      "orderId": "order-1-recon"
    }
  ],
  "sampleBallotContests": [
    {
      "contestId": "contest-1",
      "category": "FEDERAL OFFICE",
      "code": "FED-REP-01",
      "title": "United States Representative — Congressional District",
      "summary": "Two-year federal legislative mandate representing district constituents in the U.S. House of Representatives.",
      "fiscalImpact": "Direct oversight of federal appropriations, infrastructure grants, and civic technology standards.",
      "pros": "Candidate A emphasizes local transit modernization and election security grants.",
      "cons": "Candidate B prioritizes regulatory streamlining and municipal tax relief.",
      "options": ["CANDIDATE A", "CANDIDATE B", "WRITE-IN / OTHER", "UNDECIDED"],
      "defaultSelection": "UNDECIDED"
    }
  ],
  "voterRightsAndHotlines": {
    "inLineMandateHeadline": "STAY IN LINE IF QUEUED BEFORE POLL CLOSE ON NOVEMBER 3",
    "inLineMandateDetail": "If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.",
    "hotlines": [
      {
        "id": "hotline-en",
        "code": "866-OUR-VOTE",
        "phoneDisplay": "866-OUR-VOTE (866-687-8683)",
        "phoneNumeric": "1-866-687-8683",
        "languages": "English",
        "organization": "Election Protection Coalition"
      },
      {
        "id": "hotline-es",
        "code": "888-VE-Y-VOTA",
        "phoneDisplay": "888-VE-Y-VOTA (888-839-8682)",
        "phoneNumeric": "1-888-839-8682",
        "languages": "Spanish / Español",
        "organization": "NALEO Educational Fund"
      },
      {
        "id": "hotline-api",
        "code": "888-API-VOTE",
        "phoneDisplay": "888-API-VOTE (888-274-8683)",
        "phoneNumeric": "1-888-274-8683",
        "languages": "Asian Languages (Mandarin, Cantonese, Korean, Vietnamese, Tagalog, Urdu, Hindi, Bengali)",
        "organization": "APIAVote & Asian Americans Advancing Justice"
      },
      {
        "id": "hotline-ar",
        "code": "844-YALLA-US",
        "phoneDisplay": "844-YALLA-US (844-925-5287)",
        "phoneNumeric": "1-844-925-5287",
        "languages": "Arabic / العربية",
        "organization": "Arab American Institute"
      }
    ],
    "rights": [
      {
        "rightId": "right-inline",
        "title": "Right to Stay in Line Before Poll Close",
        "statuteSummary": "Any eligible voter standing in the polling place queue at the scheduled closing time on November 3 must be permitted to vote.",
        "hudDirective": "HOLD_QUEUE_POSITION // DO_NOT_DEPART"
      },
      {
        "rightId": "right-spoiled",
        "title": "Right to a Replacement Ballot if Spoiled",
        "statuteSummary": "If you make a mistake or tear your paper ballot before casting it, you have the right to request a fresh replacement ballot from poll workers.",
        "hudDirective": "REQUEST_REPLACEMENT_WARRANT"
      },
      {
        "rightId": "right-provisional",
        "title": "Right to Cast a Provisional Ballot",
        "statuteSummary": "If your name is missing from the precinct roll or your ID is challenged, demand a provisional ballot so your eligibility can be verified and counted.",
        "hudDirective": "INVOKE_PROVISIONAL_SAFEGUARD"
      },
      {
        "rightId": "right-accessibility",
        "title": "Right to Accessible Voting Machines & Assistance",
        "statuteSummary": "Every polling place must provide an operational accessible voting system and permit voter-chosen assistance (excluding the voter's employer or union agent).",
        "hudDirective": "ENGAGE_ACCESSIBLE_TERMINAL"
      }
    ]
  }
}
```

### Mandatory Cardinality Invariants in `data/election_nov3_dataset.json`:
1. `electionDate` === `"2026-11-03"`.
2. `pollClosingZones.length === 6` with exact `zoneId` values: `["EST", "CST", "MST", "PST", "AKST", "HST"]`.
3. `knightOrders.length === 4` with exact `orderId` values: `["order-1-recon", "order-2-warrant", "order-3-queue", "order-4-champion"]`.
4. `readinessGauntlet.length === 5` with exact `stepId` values: `["step-1", "step-2", "step-3", "step-4", "step-5"]`.
5. `sampleBallotContests.length === 6` with `contestId` values `["contest-1", "contest-2", "contest-3", "contest-4", "contest-5", "contest-6"]`.
6. `voterRightsAndHotlines.hotlines.length === 4` containing `"866-OUR-VOTE"`, `"888-VE-Y-VOTA"`, `"888-API-VOTE"`, and `"844-YALLA-US"`, and `voterRightsAndHotlines.rights.length === 4`.

---

## 3. Verbatim Schema: Cross-Module ES Module Contracts (Tracks 1–5)

### 3.1 Track 4: `src/atkinson_dither_engine.mjs`
- **Exported Constants:**
  - `DITHER_KERNELS`: Object keyed by `"atkinson-1bit"`, `"atkinson-2bit"`, `"floyd-steinberg"`, `"bayer-8x8"`, each containing `{ id, label, hudCode, errorPropagationRatio, divisor, description }`.
    - For `"atkinson-1bit"` and `"atkinson-2bit"`: `errorPropagationRatio: 0.75`, `divisor: 8`, `hudCode: "ATKINSON_6x1/8"`.
  - `DITHER_PALETTES`: Object keyed by `"obsidian-bone"`, `"crimson-herald"`, `"phosphor-hud"`, `"cobalt-aegis"`, each containing `{ id, label, shadow: "#...", midDark: "#...", midLight: "#...", highlight: "#...", accent: "#...", rgbaTable: Uint32Array }`.
- **Exported Functions:**
  1. `ditherGrayscaleBuffer(luminanceBuffer, width, height, options = {})`
     - **Inputs:**
       - `luminanceBuffer`: `Uint8Array | Uint8ClampedArray` of length `width * height`
       - `width`: `number` (integer `> 0`)
       - `height`: `number` (integer `> 0`)
       - `options`: `{ kernel?: "atkinson-1bit" | "atkinson-2bit" | "floyd-steinberg" | "bayer-8x8", threshold?: number (1..254, default 128), contrastGain?: number (0.5..2.0, default 1.0) }`
     - **Return Payload:**
       ```js
       {
         quantized: Uint8Array, // length width * height; values in {0, 255} for 1-bit or {0, 85, 170, 255} for 2-bit
         width: number,
         height: number,
         kernel: string,
         threshold: number,
         errorPropagationRatio: number, // 0.75 for Atkinson, 1.0 for Floyd-Steinberg, 0.0 for Bayer
         frameMs: number // elapsed milliseconds measured via performance.now()
       }
       ```
  2. `applyPaletteToQuantized(quantizedBuffer, width, height, paletteId = "obsidian-bone", options = {})`
     - **Inputs:** `quantizedBuffer` (`Uint8Array` or result object `{ quantized }`), `width`, `height`, `paletteId`, `options`
     - **Return Payload:** `Uint8ClampedArray` of length `width * height * 4` (RGBA pixel buffer ready for `ImageData`).
  3. `ditherRgbaBuffer(rgbaBuffer, width, height, options = {})`
     - **Inputs:** `rgbaBuffer` (`Uint8ClampedArray | Uint8Array` of length `width * height * 4`), `width`, `height`, `options` (`{ kernel, palette, threshold, contrastGain, pixelScale }`)
     - **Return Payload:**
       ```js
       {
         rgba: Uint8ClampedArray, // length width * height * 4
         quantized: Uint8Array,  // length width * height
         width: number,
         height: number,
         kernel: string,
         palette: string,
         frameMs: number,
         errorPropagationRatio: number
       }
       ```
  4. `computeAtkinsonKernelVerify()`
     - **Return Payload:**
       ```js
       {
         valid: boolean, // true
         kernelId: "atkinson-1bit",
         divisor: 8,
         neighborCount: 6,
         neighbors: [
           { dx: 1, dy: 0, weight: 0.125 },
           { dx: 2, dy: 0, weight: 0.125 },
           { dx: -1, dy: 1, weight: 0.125 },
           { dx: 0, dy: 1, weight: 0.125 },
           { dx: 1, dy: 1, weight: 0.125 },
           { dx: 0, dy: 2, weight: 0.125 }
         ],
         propagatedFraction: 0.75,
         absorbedFraction: 0.25,
         impulseTestPassed: boolean,
         benchmark320x240Ms: number
       }
       ```

---

### 3.2 Track 3: `src/knight_heraldry.mjs`
- **Exported Constants:**
  - `KNIGHT_SCENES`: Array/Map of the 5 required scene descriptors (`"hero-guardian"`, `"order-1-recon"`, `"order-2-warrant"`, `"order-3-queue"`, `"order-4-champion"`).
- **Exported Functions:**
  1. `renderKnightSceneLuminance(sceneId = "hero-guardian", width = 320, height = 240, options = {})`
     - **Inputs:** `sceneId` (`string`), `width` (`number`), `height` (`number`), `options` (`{ lightAngle?: number, timeMs?: number, contrast?: number }`)
     - **Return Payload:** `Uint8Array` of length `width * height` with rich grayscale luminance (`0..255`) representing the 3D-shaded gothic knight, arch masonry, heraldic shield, and dynamic torchlight. (Also attaches or supports helper `renderKnightSceneMetadata` if needed, while returning a `Uint8Array` directly or having `luminance` property so callers can inspect either `buf instanceof Uint8Array` or `buf.luminance`). *Interoperability Rule:* Return a `Uint8Array` instance directly, and also attach `.luminance = buffer`, `.width = width`, `.height = height`, `.sceneId = sceneId` as properties on the returned `Uint8Array` instance so both `buf[i]` and `buf.luminance[i]` work seamlessly!
  2. `getOrnateCornerFiligreeSVG(options = {})` -> returns valid `<svg ...>...</svg>` string.
  3. `getGothicArchHeaderSVG(options = {})` -> returns valid `<svg ...>...</svg>` string.
  4. `getKnightCrestShieldSVG(orderId = "order-1-recon", options = {})` -> returns valid `<svg ...>...</svg>` string.
  5. `renderVotedCrestLuminance(config = {}, width = 320, height = 320)`
     - **Inputs:** `config`: `{ callsign?: string, orderId?: string, dateLabel?: string, lightAngle?: number }`
     - **Return Payload:** `Uint8Array` of length `width * height` (with `.luminance`, `.width`, `.height` properties attached for dual compatibility).
  6. `renderVotedCrestToCanvas(canvas, config = {}, ditherEngine)`
     - **Inputs:** Browser `<canvas>` (or mock canvas object `{ width, height, getContext }`), `config` (`{ callsign, orderId, kernel, palette, threshold }`), `ditherEngine` (`src/atkinson_dither_engine.mjs` module).
     - **Return Payload:** `{ width, height, rgba: Uint8ClampedArray, frameMs: number, callsign: string, orderId: string, kernel: string, palette: string }`.

---

### 3.3 Track 2: `src/civic_store.mjs`
- **Exported Constants:**
  - `STORAGE_KEY = "knights_ditherpunk_nov3_v1"`
  - `DEFAULT_ELECTION_DATASET`: In-memory mirror of `data/election_nov3_dataset.json`.
- **Exported Functions:**
  - `computeChecksum(payload)` -> deterministic 8-character hex FNV-1a / CRC32 checksum string.
  - `createCivicStore(options = {})`
    - **Options:** `{ storage?: Storage | null, storageKey?: string, initialDataset?: object }`
    - **Store Methods:**
      - `getState()` -> returns immutable snapshot with:
        ```js
        {
          schemaVersion: "1.0.0",
          revision: number,
          checksum: string,
          storageMode: "LOCAL_STORAGE" | "MEMORY_FALLBACK",
          selectedZone: "EST" | "CST" | "MST" | "PST" | "AKST" | "HST",
          completedSteps: string[], // e.g. ["step-1", "step-2"]
          ballotSelections: Record<string, string>, // contestId -> selected option
          ditherConfig: {
            kernel: "atkinson-1bit" | "atkinson-2bit" | "floyd-steinberg" | "bayer-8x8",
            palette: "obsidian-bone" | "crimson-herald" | "phosphor-hud" | "cobalt-aegis",
            threshold: number,
            pixelScale: number,
            contrastGain: number,
            lightAngle: number,
            animateLight: boolean
          },
          crestConfig: {
            callsign: string,
            orderId: string,
            kernel: string,
            palette: string,
            sealMinted: boolean,
            mintedAtIso: string | null
          },
          metrics: {
            readinessPercentage: number, // 0..100
            completedStepsCount: number, // 0..5
            totalStepsCount: 5,
            unlockedKnightRank: string, // "Initiate of the Roll" .. "Sovereign Champion of November III"
            ballotCompletionCount: number, // 0..6
            totalBallotContests: 6,
            ballotLockRatio: string // e.g. "4/6"
          }
        }
        ```
      - `toggleStep(stepId, forceState?)`
      - `setBallotSelection(contestId, optionValue)`
      - `updateDitherConfig(partialConfig)`
      - `setSelectedZone(zoneId)`
      - `updateCrestConfig(partialCrest)`
      - `mintCivicSeal(callsign?, orderId?)`
      - `exportSnapshotJson()`
      - `importSnapshotJson(jsonString)`
      - `resetState()`
      - `subscribe(listener)`

---

### 3.4 Track 1: `src/hud_controller.mjs` & `src/verify.mjs`
- **`src/hud_controller.mjs` Exports:**
  1. `computePollCountdown(nowIsoOrEpoch, zoneId = "EST", dataset = DEFAULT_ELECTION_DATASET)`
     - **Inputs:** `nowIsoOrEpoch` (`string | number | Date`), `zoneId` (`"EST" | "CST" | "MST" | "PST" | "AKST" | "HST"`), `dataset`
     - **Return Payload:**
       ```js
       {
         zoneId: string,
         label: string,
         electionDate: "2026-11-03",
         status: "POLLS_OPEN_ACTIVE" | "FINAL_HOUR_CRITICAL" | "POLLS_CLOSED_HOLD_THE_LINE",
         isClosed: boolean,
         remainingMs: number, // clamped >= 0 (never negative)
         hours: number,       // integer >= 0
         minutes: number,     // integer 0..59
         seconds: number,     // integer 0..59
         formattedClock: string, // "HH:MM:SS" (e.g. "02:41:47" or "00:00:00" when closed)
         statusBanner: string,   // includes "HOLD THE LINE" / in-queue mandate when closed
         elapsedPercentage: number // 0..100
       }
       ```
  2. `formatHudTelemetryReadout(state, ditherStats = {})`
     - **Return Payload:**
       ```js
       {
         sysDate: "2026-11-03 // ELECTION_DAY",
         kernelCode: string, // e.g. "ATKINSON_6x1/8"
         errorPropText: string, // e.g. "75.0%"
         frameLatencyText: string, // e.g. "2.4 ms"
         aegisRank: string,
         readinessPercentage: number,
         ballotLockRatio: string,
         storageMode: string,
         summaryLine: string
       }
       ```
  3. `computeAllZonesCountdown(nowIsoOrEpoch, dataset)` -> returns array of 6 zone countdown objects.
  4. `initHudController(options = {})` -> binds DOM controls, canvases, keyboard shortcuts, and countdown timers in browser environments.

---

### 3.5 Track 5: `index.html` & `styles/ditherpunk_hud.css` Required DOM Contract
`index.html` MUST include the following exact element IDs verified by `src/verify.mjs` and Stage 4 headless browser tests:
- `#hud-top-telemetry-bar`
- `#section-hero-aegis` and `<canvas id="canvas-hero-knight">`
- `#section-nov3-command`
- `#section-dither-forge`
- `#section-knight-orders` and `<canvas id="canvas-order-1">`, `<canvas id="canvas-order-2">`, `<canvas id="canvas-order-3">`, `<canvas id="canvas-order-4">`
- `#section-ballot-simulator`
- `#section-voted-crest` and `<canvas id="canvas-voted-crest">`
- Zero occurrences of raw specification token strings (`{Atkinson Dithering Engine}`, `{Ornate Chivalric Knight Iconography}`, `{Modern Tactical HUD Overlay}`, `{November 3 Election Day Command Center}`, `{Dithered I-Voted Crest Generator}`, `{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`).
