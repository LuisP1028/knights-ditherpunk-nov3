# Order of the Civic Aegis // November III Ballot Command

**Ornate Chivalric Knights, Bill Atkinson Error-Diffusion Ditherpunk, and Modern Tactical HUD Interactive Election Day Portal for Tuesday, November 3, 2026**

A zero-dependency, offline-capable static web application (`ES2024` + HTML5 `Canvas2D` + inline Gothic `SVG`) celebrating and facilitating voter participation on **General Election Day — Tuesday, November 3, 2026**.

---

## Core Architectural Pillars

1. **Authentic Bill Atkinson Error-Diffusion Ditherpunk (`src/atkinson_dither_engine.mjs`):**
   - Implements Bill Atkinson's original 6-neighbor, $\frac{1}{8}$-weight (`0.125`) error-diffusion kernel over a padded 3-row `Float32Array` sliding ring buffer.
   - Propagates exact $\frac{6}{8} = 0.75$ (`75.0%`) of each pixel's quantization error $\Delta = v - q$ to coordinates $(x+1,y)$, $(x+2,y)$, $(x-1,y+1)$, $(x,y+1)$, $(x+1,y+1)$, and $(x,y+2)$, absorbing `25.0%` locally to preserve high-contrast edge fidelity on gothic plate armor and cathedral masonry.
   - Includes comparative Ditherpunk modes (`Atkinson 1-Bit`, `Atkinson 2-Bit 4-Tone`, `Floyd-Steinberg 16/16`, `Ordered Bayer 8x8`) and 4 WCAG AAA/AA verified palettes (`obsidian-bone`, `crimson-herald`, `phosphor-hud`, `cobalt-aegis`).
2. **Ornate Chivalric Knights & Gothic SVG Heraldry (`src/knight_heraldry.mjs`):**
   - Procedural 3D-shaded luminance synthesis for 5 chivalric scenes (*The Guardian of the November III Ballot*, *Order I: Sir Vance of the Roll*, *Order II: Dame Astraea of the Warrant*, *Order III: Sir Percival of the Queue*, and *Order IV: Sovereign Champion of November III*).
   - Dynamic torch-orbit specular lighting, inline Gothic cathedral arch and corner filigree SVG generators, and an interactive **"I VOTED — NOVEMBER 3, 2026"** heraldic crest studio with one-click dithered PNG export (`nov3-i-voted-crest.png`).
3. **Modern Tactical HUD & Multi-Timezone November 3 Command Center (`src/hud_controller.mjs`, `src/civic_store.mjs`, `data/election_nov3_dataset.json`):**
   - Live poll-closing countdowns across all 6 U.S. time zones (`EST`, `CST`, `MST`, `PST`, `AKST`, `HST`) anchored to **Tuesday, November 3, 2026**, featuring deterministic post-close `00:00:00` clamping and the statutory **Hold the Line / In-Queue Protection Mandate**.
   - Interactive **5-Step Election Day Readiness Gauntlet**, **6-Contest Nonpartisan Sample Ballot Simulator**, and official Election Protection hotlines (`866-OUR-VOTE`, `888-VE-Y-VOTA`, `888-API-VOTE`, `844-YALLA-US`).
   - Deterministic client-side persistence (`localStorage` key `knights_ditherpunk_nov3_v1` with 32-bit FNV-1a checksum verification and automatic `MEMORY_FALLBACK`).

---

## Keyboard Shortcuts (Tactical HUD Hotkeys)

| Key | Action |
| :--- | :--- |
| **`1` – `4`** | Switch active Ditherpunk palette (`1`: Obsidian & Bone, `2`: Crimson Herald, `3`: Phosphor HUD, `4`: Cobalt Aegis) |
| **`K` / `D`** | Cycle active error-diffusion / ordered dither kernel (`Atkinson 1-Bit` $\rightarrow$ `Atkinson 2-Bit` $\rightarrow$ `Floyd-Steinberg` $\rightarrow$ `Bayer 8x8`) |
| **`L`** | Toggle dynamic torchlight orbit animation across the Hero Knight viewport |
| **`H`** | Toggle tactical HUD reticle grid overlay |
| **`V`** | Mint personalized November 3, 2026 Civic Seal on the "I VOTED" Crest Studio |

---

## Repository Structure

```text
.
├── index.html                      # Track 5: Flagship semantic DOM & 6 live dithered Canvas2D viewports
├── styles/
│   └── ditherpunk_hud.css          # Track 5: Responsive grid, 4 palette token sets, pixelated canvas & reduced-motion rules
├── data/
│   └── election_nov3_dataset.json  # Track 2: Authoritative Nov 3, 2026 poll closing zones, knight orders, gauntlet & hotlines
└── src/
    ├── atkinson_dither_engine.mjs  # Track 4: Bill Atkinson 6-neighbor 1/8 error-diffusion engine & 32-bit ABGR LUT mapper
    ├── knight_heraldry.mjs         # Track 3: Procedural knight luminance renderer, Gothic SVG filigree & Crest Studio
    ├── civic_store.mjs             # Track 2: Deterministic FNV-1a checksum state store with localStorage & memory fallback
    ├── hud_controller.mjs          # Track 1: Multi-timezone Nov 3 countdown engine, HUD telemetry, hotkeys & DOM bindings
    └── verify.mjs                  # Track 1: Sub-250ms 5-suite deterministic CLI verifier
```

---

## Quick Start & Verification

### 1. Run the Automated 5-Suite CLI Verifier (`<= 250 ms`)
```bash
npm run verify
```

### 2. Serve Locally in Any Browser
```bash
python3 -m http.server 4173 --bind 127.0.0.1
```
Then open `http://127.0.0.1:4173/index.html`.
