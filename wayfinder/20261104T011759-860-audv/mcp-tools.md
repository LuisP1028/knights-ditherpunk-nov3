# MCP Provisioning & Live Verification Playbook (`mcp-tools.md`)

**Run ID:** `20261104T011759-860-audv`  
**Agent:** `mcp-provisioner`  
**Governed By:** [`LANGUAGE.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/.sandcastle/worktrees/agent-mcp-provisioner-20261104T011759-860-audv/LANGUAGE.md) & [`functional_specification_001.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/.sandcastle/worktrees/agent-mcp-provisioner-20261104T011759-860-audv/functional_specification_001.md)

---

## 1. Active MCP Servers & Readiness Status

We assessed the full subsystem requirements of [`functional_specification_001.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/.sandcastle/worktrees/agent-mcp-provisioner-20261104T011759-860-audv/functional_specification_001.md) against the Sandcastle Host MCP Registry ([`.sandcastle/mcp.md`](file:///Users/diesel/Desktop/knights-ditherpunk-nov3/.sandcastle/worktrees/agent-mcp-provisioner-20261104T011759-860-audv/.sandcastle/mcp.md)) and executed live MCP health probes.

| MCP Server | Status | Verified Capability / Probe Result | Role in `functional_specification_001.md` |
| :--- | :--- | :--- | :--- |
| **`playwright`** | **ACTIVE & VERIFIED** | Live probe succeeded (`HeadlessChrome/157.0.0.0`, `canvasSupported: true`, clean tab lifecycle via `browser_close`). | **Primary Live Browser & Visual Verification Engine:** Multi-viewport layout overflow audits (`320px`, `375px`, `768px`, `1024px`, `1440px`, `1920px+`), live `<canvas>` pixel-buffer inspection for `{Atkinson Dithering Engine}` and `{Ornate Chivalric Knight Iconography}`, console/network zero-error checks, `prefers-reduced-motion: reduce` emulation, keyboard hotkey verification (`[1-4]`, `[K]`, `[L]`, `[H]`), and `{Dithered I-Voted Crest Generator}` PNG export validation. |
| **`context7`** | **ACTIVE & READY** | Schemas verified (`resolve-library-id`, `query-docs`). | **Optional Reference Lookup:** Available if downstream agents need standard Web API, Canvas2D `ImageData`, or SVG specification documentation. Note that runtime code is 100% zero-external-dependency vanilla ES Modules (`Node.js v24.9.0` + native browser Canvas2D/LocalStorage). |
| `postgres`, `neo4j-cypher`, `google-colab`, `google-drive`, `blender-mcp`, `glbforge`, `threejs-devtools-mcp`, `ffmpeg` | **NOT REQUIRED (Bypassed)** | N/A — Zero external runtime dependencies or remote databases permitted by Section 4.5 & Section 5. | `functional_specification_001.md` mandates a 100% self-contained static bundle (`0` external runtime network requests, local JSON dataset in `data/election_nov3_dataset.json`, and pure 2D procedural luminance + Bill Atkinson error-diffusion canvases). |

---

## 2. Tool Schemas & Exact Invocation Payloads (`call_mcp_tool`)

All `playwright` MCP tools are lazy-loaded via `call_mcp_tool` using `ServerName: "playwright"`. Do **not** guess parameter names—use the exact verified schemas below.

### 2.1 `playwright` -> `browser_navigate`
Navigates the headless browser to the local HTTP server hosting the application.
- **Schema Path:** `/Users/diesel/.gemini/antigravity-cli/mcp/playwright/browser_navigate.json`
- **Invocation Payload:**
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_navigate",
  "Arguments": {
    "url": "http://127.0.0.1:4173/index.html"
  }
}
```

### 2.2 `playwright` -> `browser_resize`
Resizes the browser viewport to verify the strict multi-viewport zero-overflow invariant (`document.documentElement.scrollWidth <= window.innerWidth` across `320px`, `375px`, `768px`, `1024px`, `1440px`, and `1920px`).
- **Schema Path:** `/Users/diesel/.gemini/antigravity-cli/mcp/playwright/browser_resize.json`
- **Invocation Payload:**
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_resize",
  "Arguments": {
    "width": 375,
    "height": 812
  }
}
```

### 2.3 `playwright` -> `browser_evaluate`
Executes arbitrary JavaScript inside the live page context to inspect DOM structure, `{Atkinson Dithering Engine}` canvas pixel buffers, `{Modern Tactical HUD Overlay}` readouts, `localStorage` snapshots, and horizontal overflow metrics.
- **Schema Path:** `/Users/diesel/.gemini/antigravity-cli/mcp/playwright/browser_evaluate.json`
- **Invocation Payload:**
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_evaluate",
  "Arguments": {
    "function": "() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth) })"
  }
}
```

### 2.4 `playwright` -> `browser_console_messages`
Captures browser console output to verify zero uncaught runtime errors or warnings (`{errors}` invariant).
- **Schema Path:** `/Users/diesel/.gemini/antigravity-cli/mcp/playwright/browser_console_messages.json`
- **Invocation Payload:**
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_console_messages",
  "Arguments": {
    "level": "error",
    "all": true
  }
}
```

### 2.5 `playwright` -> `browser_network_requests`
Verifies the strict zero-external-network-dependency budget (`0` external CDN scripts, stylesheets, or runtime API calls).
- **Schema Path:** `/Users/diesel/.gemini/antigravity-cli/mcp/playwright/browser_network_requests.json`
- **Invocation Payload:**
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_network_requests",
  "Arguments": {
    "includeStatic": true
  }
}
```

### 2.6 `playwright` -> `browser_emulate_media`
Emulates `prefers-reduced-motion: reduce` to verify Section 6.4 accessibility compliance (torch-light orbit animations and radar sweeps settle into crisp static frames while manual controls remain 100% responsive).
- **Schema Path:** `/Users/diesel/.gemini/antigravity-cli/mcp/playwright/browser_emulate_media.json`
- **Invocation Payload:**
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_emulate_media",
  "Arguments": {
    "reducedMotion": "reduce"
  }
}
```

### 2.7 `playwright` -> `browser_snapshot`
Captures the accessibility tree and optional bounding boxes (`[box=x,y,width,height]`) of all rendered elements.
- **Schema Path:** `/Users/diesel/.gemini/antigravity-cli/mcp/playwright/browser_snapshot.json`
- **Invocation Payload:**
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_snapshot",
  "Arguments": {
    "boxes": true
  }
}
```

### 2.8 `playwright` -> `browser_click`, `browser_press_key`, & `browser_select_option`
Interacts with HUD hotkeys (`[1-4]`, `[K]`, `[L]`, `[H]`), Readiness Gauntlet checkboxes, Sample Ballot buttons, and Dither Forge controls.
- **Schema Paths:**
  - `/Users/diesel/.gemini/antigravity-cli/mcp/playwright/browser_press_key.json`
  - `/Users/diesel/.gemini/antigravity-cli/mcp/playwright/browser_click.json`
  - `/Users/diesel/.gemini/antigravity-cli/mcp/playwright/browser_select_option.json`
- **Invocation Payloads:**
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_press_key",
  "Arguments": {
    "key": "k"
  }
}
```
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_click",
  "Arguments": {
    "target": "#btn-download-crest",
    "element": "Download Dithered I-Voted Crest button"
  }
}
```

### 2.9 `playwright` -> `browser_take_screenshot`
Captures full-page or viewport screenshots (`scale` is required and must be `"css"` or `"device"`).
- **Schema Path:** `/Users/diesel/.gemini/antigravity-cli/mcp/playwright/browser_take_screenshot.json`
- **Invocation Payload:**
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_take_screenshot",
  "Arguments": {
    "scale": "css",
    "fullPage": true
  }
}
```

### 2.10 `playwright` -> `browser_close`
Cleanly closes the active browser tab when verification is complete so subsequent testers inherit a clean session.
- **Schema Path:** `/Users/diesel/.gemini/antigravity-cli/mcp/playwright/browser_close.json`
- **Invocation Payload:**
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_close",
  "Arguments": {}
}
```

---

## 3. Live Coding & Stage 3/4 Verification Playbook

Downstream implementers (`implementer-1` through `implementer-5`) and testers (`tester-1` through `tester-5`) MUST follow this two-tier verification workflow while coding and auditing:

### Step 1: Fast CLI Verification (`<= 250 ms` Gate)
Run the deterministic Node.js verification suite before and after any edit:
```bash
npm run verify
```
- Must exit `0` in `<= 250 ms` and output:
  `PASS: ALL NOVEMBER 3 KNIGHTS DITHERPUNK HUD INVARIANTS VERIFIED`

### Step 2: Start Ephemeral Local Static Server for Browser MCP Inspection
Because ES modules (`<script type="module" src="./src/...">`) and `fetch('./data/election_nov3_dataset.json')` require HTTP origin semantics rather than `file://`, start a fast local HTTP server (e.g., via Python or Node.js on an ephemeral port) when running Playwright MCP checks:
```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

### Step 3: Execute Comprehensive Live DOM, Canvas & Multi-Viewport Audit via `playwright` MCP
After navigating to `http://127.0.0.1:4173/index.html` with `browser_navigate`, run the following comprehensive probe via `browser_evaluate` to verify all visual, mathematical, and DOM invariants in real time:

```json
{
  "ServerName": "playwright",
  "ToolName": "browser_evaluate",
  "Arguments": {
    "function": "() => {\n  const requiredIds = [\n    'hud-top-telemetry-bar',\n    'section-hero-aegis',\n    'canvas-hero-knight',\n    'section-nov3-command',\n    'section-dither-forge',\n    'section-knight-orders',\n    'canvas-order-1',\n    'canvas-order-2',\n    'canvas-order-3',\n    'canvas-order-4',\n    'section-ballot-simulator',\n    'section-voted-crest',\n    'canvas-voted-crest'\n  ];\n  const missingIds = requiredIds.filter(id => !document.getElementById(id));\n  const bodyText = document.body.innerText || '';\n  const leakedBraces = [\n    '{Atkinson Dithering Engine}',\n    '{Ornate Chivalric Knight Iconography}',\n    '{Modern Tactical HUD Overlay}',\n    '{November 3 Election Day Command Center}',\n    '{Dithered I-Voted Crest Generator}',\n    '{errors}',\n    '{correctness}',\n    '{functionality}',\n    '{correct required outputs}'\n  ].filter(token => bodyText.includes(token));\n\n  const canvasIds = ['canvas-hero-knight', 'canvas-order-1', 'canvas-order-2', 'canvas-order-3', 'canvas-order-4', 'canvas-voted-crest'];\n  const canvasMetrics = canvasIds.map(id => {\n    const c = document.getElementById(id);\n    if (!c || !c.getContext) return { id, exists: false };\n    const ctx = c.getContext('2d');\n    const data = ctx.getImageData(0, 0, Math.min(c.width, 64), Math.min(c.height, 64)).data;\n    let nonZero = 0;\n    const uniqueRgb = new Set();\n    for (let i = 0; i < data.length; i += 4) {\n      if (data[i] + data[i+1] + data[i+2] > 0) nonZero++;\n      uniqueRgb.add(`${data[i]},${data[i+1]},${data[i+2]}`);\n    }\n    return { id, exists: true, width: c.width, height: c.height, nonZeroSamplePixels: nonZero, uniqueColorsInSample: uniqueRgb.size };\n  });\n\n  return {\n    missingIds,\n    leakedBraces,\n    overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),\n    scrollWidth: document.documentElement.scrollWidth,\n    innerWidth: window.innerWidth,\n    canvasMetrics\n  };\n}"
  }
}
```

### Step 4: Sweep All Mandatory Viewports (`320px`, `375px`, `768px`, `1024px`, `1440px`, `1920px`)
Call `browser_resize` for each required width (`320`, `375`, `768`, `1024`, `1440`, `1920`) and verify via `browser_evaluate` that `document.documentElement.scrollWidth <= window.innerWidth` (`overflowPx === 0`).

### Step 5: Verify Interactive State Transitions & Reduced Motion
1. Use `browser_press_key` (`"1"`, `"2"`, `"3"`, `"4"`, `"k"`, `"l"`, `"h"`) or `browser_click` on readiness steps and sample ballot items, then inspect `localStorage.getItem("knights_ditherpunk_nov3_v1")` via `browser_evaluate` to confirm deterministic snapshot persistence and checksum updates.
2. Call `browser_emulate_media` with `{"reducedMotion": "reduce"}` and verify that continuous orbit animations pause cleanly without breaking interactive sliders or canvas rendering.
3. Call `browser_console_messages` (`{"level": "error", "all": true}`) and `browser_network_requests` (`{"includeStatic": true}`) to confirm `0` runtime console errors and `0` external network requests.
4. Always finish by calling `browser_close` (`{}`) and terminating any background HTTP server.
