/**
 * @file src/verify.mjs
 * @description Track 1: Sub-250ms 5-Suite Deterministic CLI Verifier for the
 * Ornate Chivalric Knights + Bill Atkinson Ditherpunk + Modern Tactical HUD
 * Interactive Election Day Portal (Tuesday, November 3, 2026).
 *
 * Usage:
 *   npm run verify   (node src/verify.mjs --verify)
 *   npm start        (node src/verify.mjs)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';

import {
  DITHER_KERNELS,
  DITHER_PALETTES,
  ditherGrayscaleBuffer,
  applyPaletteToQuantized,
  ditherRgbaBuffer,
  computeAtkinsonKernelVerify
} from './atkinson_dither_engine.mjs';

import {
  KNIGHT_SCENES,
  renderKnightSceneLuminance,
  renderVotedCrestLuminance,
  renderVotedCrestToCanvas,
  getOrnateCornerFiligreeSVG,
  getGothicArchHeaderSVG,
  getKnightCrestShieldSVG
} from './knight_heraldry.mjs';

import {
  STORAGE_KEY,
  DEFAULT_ELECTION_DATASET,
  computeFnv1aChecksum,
  createCivicStore
} from './civic_store.mjs';

import {
  POLL_ZONE_IDS,
  computePollCountdown,
  computeAllZoneCountdowns,
  formatHudTelemetryReadout,
  dispatchHudHotkey,
  initHudController
} from './hud_controller.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Construct forbidden specification brace tokens dynamically so no literal brace token appears in source
const FORBIDDEN_SPEC_TOKENS = [
  'Atkinson Dithering Engine',
  'Ornate Chivalric Knight Iconography',
  'Modern Tactical HUD Overlay',
  'November 3 Election Day Command Center',
  'Dithered I-Voted Crest Generator',
  'errors',
  'correctness',
  'functionality',
  'correct required outputs',
  'sufficient',
  'insufficient'
].map((name) => `{${name}}`);

/**
 * Suite 1: Verifies Track 4 Bill Atkinson Error-Diffusion Dithering Engine.
 */
function verifyDitherEngine() {
  const t0 = performance.now();
  const audit = computeAtkinsonKernelVerify();

  assert.equal(Boolean(audit.pass ?? audit.passed), true, 'Atkinson kernel unit impulse test must pass');
  assert.equal(audit.neighborCount ?? audit.expectedNeighborsCount, 6, 'Atkinson kernel must diffuse to 6 neighbors');
  assert.equal(audit.neighborWeightEach, 0.125, 'Each Atkinson neighbor weight must be exact 0.125 (1/8)');
  assert.equal(
    audit.propagationRatio ?? audit.errorPropagationRatio,
    0.75,
    'Total Atkinson error propagation ratio must equal exact 0.75 (75.0%)'
  );
  assert.equal(audit.boundarySafe, true, 'Atkinson error ring buffer must be boundary safe without scanline wrap');

  const frameMs = Number(audit.frameMs ?? audit.atkinsonFrameMs ?? audit.benchmark320x240Ms);
  assert.ok(Number.isFinite(frameMs) && frameMs <= 8.0, `Atkinson 320x240 frameMs (${frameMs}ms) must be <= 8.0ms`);

  // Verify all 4 kernels and 4 palettes on a 64x48 test ramp
  const w = 64;
  const h = 48;
  const ramp = new Uint8Array(w * h);
  for (let i = 0; i < ramp.length; i++) {
    ramp[i] = i & 255;
  }

  const requiredKernels = ['atkinson-1bit', 'atkinson-2bit', 'floyd-steinberg', 'bayer-8x8'];
  for (const k of requiredKernels) {
    assert.ok(DITHER_KERNELS[k] || (Array.isArray(DITHER_KERNELS) && DITHER_KERNELS.includes(k)), `Missing kernel ${k}`);
    const q = ditherGrayscaleBuffer(ramp, w, h, { kernel: k, threshold: 128 });
    assert.ok(q instanceof Uint8Array, `ditherGrayscaleBuffer(${k}) must return Uint8Array`);
    assert.equal(q.length, w * h, `Quantized buffer length mismatch for ${k}`);
  }

  const requiredPalettes = ['obsidian-bone', 'crimson-herald', 'phosphor-hud', 'cobalt-aegis'];
  const qSample = ditherGrayscaleBuffer(ramp, w, h, { kernel: 'atkinson-2bit', threshold: 128 });
  for (const p of requiredPalettes) {
    assert.ok(DITHER_PALETTES[p], `Missing palette ${p}`);
    const rgba4 = applyPaletteToQuantized(qSample, w, h, p);
    assert.ok(rgba4 instanceof Uint8ClampedArray, `applyPaletteToQuantized(${p}) must return Uint8ClampedArray`);
    assert.equal(rgba4.length, w * h * 4, `RGBA length mismatch for palette ${p}`);
    const rgba3 = applyPaletteToQuantized(qSample, p);
    assert.equal(rgba3.length, w * h * 4, `3-arg applyPaletteToQuantized(${p}) must return N*4 bytes`);
  }

  const rgbaIn = new Uint8ClampedArray(32 * 24 * 4).fill(140);
  const ditheredRgba = ditherRgbaBuffer(rgbaIn, 32, 24, { kernel: 'atkinson-1bit', palette: 'obsidian-bone' });
  const rgbaBytes = ditheredRgba instanceof Uint8ClampedArray ? ditheredRgba : ditheredRgba.rgba;
  assert.ok(rgbaBytes instanceof Uint8ClampedArray && rgbaBytes.length === 32 * 24 * 4, 'ditherRgbaBuffer must return RGBA buffer');

  const elapsed = performance.now() - t0;
  return { frameMs, elapsed };
}

/**
 * Suite 2: Verifies Track 3 Ornate Chivalric Knight Procedural Art, SVG Filigree & Crest Studio.
 */
function verifyKnightHeraldry() {
  const t0 = performance.now();
  const requiredScenes = [
    'hero-guardian',
    'order-1-recon',
    'order-2-warrant',
    'order-3-queue',
    'order-4-champion'
  ];

  for (const sceneId of requiredScenes) {
    const w = sceneId === 'hero-guardian' ? 160 : 120;
    const h = sceneId === 'hero-guardian' ? 120 : 90;
    const buf = renderKnightSceneLuminance(sceneId, w, h, { lightAngle: 0.65 });
    const lum = buf instanceof Uint8Array ? buf : buf.luminance;
    assert.ok(lum instanceof Uint8Array && lum.length === w * h, `Scene ${sceneId} must return Uint8Array(${w * h})`);

    let minVal = 255;
    let maxVal = 0;
    for (let i = 0; i < lum.length; i++) {
      const v = lum[i];
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
    assert.ok(minVal < 50 && maxVal > 200, `Scene ${sceneId} must have high dynamic range (min=${minVal}, max=${maxVal})`);
  }

  // Verify lightAngle responsiveness on hero-guardian
  const heroA = renderKnightSceneLuminance('hero-guardian', 96, 72, { lightAngle: 0.2 });
  const heroB = renderKnightSceneLuminance('hero-guardian', 96, 72, { lightAngle: 2.4 });
  let diffCount = 0;
  for (let i = 0; i < heroA.length; i++) {
    if (heroA[i] !== heroB[i]) diffCount++;
  }
  assert.ok(diffCount > 100, 'renderKnightSceneLuminance must respond dynamically to lightAngle changes');

  // Verify SVG generators
  const cornerSvg = getOrnateCornerFiligreeSVG('top-left', { size: 48 });
  const archSvg = getGothicArchHeaderSVG('ORDER OF THE CIVIC AEGIS', 'NOVEMBER 3, 2026');
  const shieldSvg = getKnightCrestShieldSVG('order-1-recon', 120, 140);

  for (const [label, svgStr] of [
    ['getOrnateCornerFiligreeSVG', cornerSvg],
    ['getGothicArchHeaderSVG', archSvg],
    ['getKnightCrestShieldSVG', shieldSvg]
  ]) {
    assert.equal(typeof svgStr, 'string', `${label} must return a string`);
    assert.ok(svgStr.includes('<svg') && svgStr.includes('</svg>'), `${label} must return valid <svg>...</svg> markup`);
    for (const token of FORBIDDEN_SPEC_TOKENS) {
      assert.ok(!svgStr.includes(token), `${label} must not contain raw spec token ${token}`);
    }
  }

  // Verify Voted Crest luminance & canvas studio
  const crestLum = renderVotedCrestLuminance({ callsign: 'SIR VANCE NOV 3', orderId: 'order-1-recon' }, 180, 180);
  const crestBytes = crestLum instanceof Uint8Array ? crestLum : crestLum.luminance;
  assert.ok(crestBytes instanceof Uint8Array && crestBytes.length === 180 * 180, 'renderVotedCrestLuminance must return Uint8Array');

  let putImageCalled = false;
  const mockCanvas = {
    width: 180,
    height: 180,
    getContext() {
      return {
        createImageData(w, h) {
          return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
        },
        putImageData(imgData) {
          putImageCalled = imgData.data.length === 180 * 180 * 4;
        }
      };
    },
    toDataURL() {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
  };
  renderVotedCrestToCanvas(mockCanvas, {
    callsign: 'SIR VANCE NOV 3',
    orderId: 'order-1-recon',
    kernel: 'atkinson-1bit',
    palette: 'obsidian-bone'
  });
  assert.equal(putImageCalled, true, 'renderVotedCrestToCanvas must draw dithered ImageData to 2D canvas context');

  const elapsed = performance.now() - t0;
  return { elapsed };
}

/**
 * Suite 3: Verifies Track 2 Authoritative November 3 Civic Dataset & Deterministic Snapshot Store.
 */
function verifyCivicDatasetAndStore() {
  const t0 = performance.now();
  const datasetPath = path.join(ROOT_DIR, 'data', 'election_nov3_dataset.json');
  assert.ok(fs.existsSync(datasetPath), 'Missing data/election_nov3_dataset.json');

  const rawJson = fs.readFileSync(datasetPath, 'utf8');
  const dataset = JSON.parse(rawJson);

  assert.equal(dataset.electionDate, '2026-11-03', 'Dataset electionDate must be 2026-11-03');
  assert.ok(Array.isArray(dataset.pollClosingZones) && dataset.pollClosingZones.length === 6, 'Must have 6 pollClosingZones');

  const zoneIds = dataset.pollClosingZones.map((z) => z.id || z.zoneId);
  for (const expectedZone of POLL_ZONE_IDS) {
    assert.ok(zoneIds.includes(expectedZone), `Dataset missing pollClosingZone ${expectedZone}`);
  }

  assert.ok(Array.isArray(dataset.knightOrders) && dataset.knightOrders.length === 4, 'Must have 4 knightOrders');
  assert.ok(Array.isArray(dataset.readinessGauntlet) && dataset.readinessGauntlet.length === 5, 'Must have 5 readinessGauntlet steps');
  assert.ok(Array.isArray(dataset.sampleBallotContests) && dataset.sampleBallotContests.length === 6, 'Must have 6 sampleBallotContests');

  const hotlines = dataset.voterRightsAndHotlines?.hotlines || [];
  assert.equal(hotlines.length, 4, 'Must have 4 nonpartisan election protection hotlines');
  const hotlineText = JSON.stringify(hotlines);
  for (const code of ['866-OUR-VOTE', '888-VE-Y-VOTA', '888-API-VOTE', '844-YALLA-US']) {
    assert.ok(hotlineText.includes(code), `Missing hotline ${code} in dataset`);
  }

  const rights = dataset.voterRightsAndHotlines?.legalRights ||
    dataset.voterRightsAndHotlines?.rights ||
    dataset.voterRightsAndHotlines?.cardinalRights || [];
  assert.ok(Array.isArray(rights) && rights.length >= 4, 'Must have 4 statutory voter rights');

  // Verify FNV-1a checksum determinism
  assert.equal(STORAGE_KEY, 'knights_ditherpunk_nov3_v1', 'STORAGE_KEY must match knights_ditherpunk_nov3_v1');
  const hashA = computeFnv1aChecksum('november-3-2026-civic-aegis');
  const hashB = computeFnv1aChecksum('november-3-2026-civic-aegis');
  assert.equal(hashA, hashB, 'FNV-1a checksum must be deterministic');
  assert.match(hashA, /^[0-9a-fA-F]{8}$/, 'FNV-1a checksum must be an 8-character hex string');

  // Verify store transitions & MEMORY_FALLBACK resilience
  const throwingStorage = {
    getItem() {
      throw new Error('Simulated SecurityError');
    },
    setItem() {
      throw new Error('Simulated QuotaExceededError');
    },
    removeItem() {
      throw new Error('Simulated SecurityError');
    }
  };

  const store = createCivicStore({ storage: throwingStorage });
  const initial = store.getState();
  assert.equal(initial.storageMode, 'MEMORY_FALLBACK', 'Store must fail over to MEMORY_FALLBACK when storage throws');

  for (const stepId of ['step-1', 'step-2', 'step-3', 'step-4', 'step-5']) {
    if (typeof store.toggleStep === 'function') {
      store.toggleStep(stepId, true);
    } else {
      store.completeGauntletStep(stepId);
    }
  }

  const afterSteps = store.getState();
  const readinessPct = afterSteps.metrics?.readinessPercentage ?? (store.getReadinessStats?.().readinessPercentage);
  assert.equal(readinessPct, 100, 'Completing all 5 gauntlet steps must reach 100% readiness');

  if (typeof store.setBallotSelection === 'function') {
    store.setBallotSelection('contest-1', 'FOR');
  } else {
    store.setBallotChoice('contest-1', 'FOR');
  }

  if (typeof store.mintCivicSeal === 'function') {
    store.mintCivicSeal('DAME ASTRAEA NOV 3', 'order-2-warrant');
  } else if (typeof store.mintSeal === 'function') {
    store.mintSeal('DAME ASTRAEA NOV 3', 'order-2-warrant');
  }

  const exported = typeof store.exportJson === 'function' ? store.exportJson() : store.exportSnapshotJson();
  assert.ok(typeof exported === 'string' && exported.includes('DAME ASTRAEA NOV 3'), 'exportJson must serialize current store state');

  store.resetStore ? store.resetStore() : store.reset();
  assert.equal(store.getState().completedSteps.length, 0, 'resetStore must clear completedSteps');

  if (typeof store.importJson === 'function') {
    store.importJson(exported);
  } else {
    store.importSnapshotJson(exported);
  }
  assert.equal(store.getState().completedSteps.length, 5, 'importJson must restore 5 completed steps');

  const elapsed = performance.now() - t0;
  return { elapsed };
}

/**
 * Suite 4: Verifies Track 1 Multi-Timezone Poll Countdown, HUD Telemetry & Hotkeys.
 */
function verifyHudController() {
  const t0 = performance.now();

  // 1. Active daytime voting window on Tuesday, Nov 3, 2026 (18:00 UTC = 13:00 EST)
  const activeAll = computeAllZoneCountdowns('2026-11-03T18:00:00.000Z');
  assert.equal(activeAll.length, 6, 'computeAllZoneCountdowns must return 6 U.S. time zones');
  const estActive = activeAll.find((z) => z.zoneId === 'EST');
  assert.equal(estActive.status, 'POLLS_OPEN_ACTIVE', 'EST at 13:00 local must be POLLS_OPEN_ACTIVE');
  assert.equal(estActive.hours, 7, 'EST at 18:00 UTC has 7h remaining until 01:00 UTC (20:00 EST) close');
  assert.equal(estActive.formattedClock, '07:00:00', 'EST formattedClock must be 07:00:00');
  assert.equal(estActive.inLineRightActive, true, 'inLineRightActive must be true');

  // 2. Final Hour Critical window in EST (00:30 UTC Nov 4 = 19:30 EST Nov 3, 30m before 20:00 close)
  const estFinal = computePollCountdown('2026-11-04T00:30:00.000Z', 'EST');
  assert.equal(estFinal.status, 'FINAL_HOUR_CRITICAL', 'EST 30m before close must be FINAL_HOUR_CRITICAL');
  assert.equal(estFinal.remainingSeconds, 1800, 'EST 30m before close must have 1800 remainingSeconds');
  assert.equal(estFinal.formattedClock, '00:30:00', 'EST 30m before close must format as 00:30:00');

  // 3. Post-close clamping across all 6 zones (06:00 UTC Nov 4, after AKST/HST 05:00 UTC close)
  const closedAll = computeAllZoneCountdowns('2026-11-04T06:00:00.000Z');
  for (const cd of closedAll) {
    assert.equal(cd.status, 'POLLS_CLOSED_HOLD_THE_LINE', `${cd.zoneId} post-close must be POLLS_CLOSED_HOLD_THE_LINE`);
    assert.equal(cd.remainingMs, 0, `${cd.zoneId} post-close remainingMs must clamp to 0`);
    assert.equal(cd.remainingSeconds, 0, `${cd.zoneId} post-close remainingSeconds must clamp to 0`);
    assert.equal(cd.hours, 0, `${cd.zoneId} hours must never be negative`);
    assert.equal(cd.minutes, 0, `${cd.zoneId} minutes must never be negative`);
    assert.equal(cd.seconds, 0, `${cd.zoneId} seconds must never be negative`);
    assert.equal(cd.formattedClock, '00:00:00', `${cd.zoneId} post-close clock must clamp to 00:00:00`);
    assert.equal(cd.inLineRightActive, true, `${cd.zoneId} post-close inLineRightActive must remain true`);
  }

  // 4. Verify HUD telemetry formatter dual-compatible return contract
  const store = createCivicStore();
  const readout = formatHudTelemetryReadout(store.getState(), { frameMs: 0.74 });
  assert.ok(Array.isArray(readout) && readout.length === 8, 'formatHudTelemetryReadout must return an 8-element Array');
  assert.ok(readout.sysDate.includes('2026-11-03'), 'Telemetry sysDate must reference 2026-11-03');
  assert.equal(readout.kernelCode, 'ATKINSON_6x1/8', 'Default kernelCode must be ATKINSON_6x1/8');
  assert.equal(readout.errorPropText, '75.0%', 'Default errorPropText must be 75.0%');

  // 5. Verify HUD hotkey dispatcher & input focus guard
  const ignored = dispatchHudHotkey({ key: 'k', target: { tagName: 'INPUT' } }, store);
  assert.equal(ignored.handled, false, 'Hotkeys must be ignored when focus is inside an <input>');

  const palRes = dispatchHudHotkey('2', store);
  assert.equal(palRes.handled, true, 'Hotkey "2" must be handled');
  assert.equal(palRes.palette, 'crimson-herald', 'Hotkey "2" must select crimson-herald palette');

  const kernRes = dispatchHudHotkey('k', store);
  assert.equal(kernRes.handled, true, 'Hotkey "k" must cycle kernel');
  assert.equal(kernRes.kernel, 'atkinson-2bit', 'Hotkey "k" must cycle from atkinson-1bit to atkinson-2bit');

  const lightRes = dispatchHudHotkey('l', store);
  assert.equal(lightRes.handled, true, 'Hotkey "l" must toggle animateLight');

  const mintRes = dispatchHudHotkey('v', store);
  assert.equal(mintRes.handled, true, 'Hotkey "v" must mint civic seal');

  // 6. Verify fail-fast error boundaries on computePollCountdown
  assert.throws(
    () => computePollCountdown('not-an-iso-date', 'EST'),
    TypeError,
    'computePollCountdown must throw TypeError on invalid timestamp'
  );
  assert.throws(
    () => computePollCountdown('2026-11-03T18:00:00.000Z', 'UNKNOWN_ZONE'),
    RangeError,
    'computePollCountdown must throw RangeError on unknown timezone code'
  );

  // 7. Verify initHudController end-to-end execution DAG & DOM controller lifecycle
  const createSimCanvas = (w, h, scene) => {
    let curW = w;
    let curH = h;
    let bitmap = new Uint8ClampedArray(w * h * 4);
    return {
      get width() {
        return curW;
      },
      set width(val) {
        curW = Number(val) || w;
        bitmap = new Uint8ClampedArray(curW * curH * 4); // HTML5 Canvas spec: setting width clears bitmap
      },
      get height() {
        return curH;
      },
      set height(val) {
        curH = Number(val) || h;
        bitmap = new Uint8ClampedArray(curW * curH * 4); // HTML5 Canvas spec: setting height clears bitmap
      },
      getAttribute(attr) {
        return attr === 'data-scene' ? scene : null;
      },
      getContext() {
        return {
          createImageData(iw, ih) {
            return { width: iw, height: ih, data: new Uint8ClampedArray(iw * ih * 4) };
          },
          putImageData(imgData) {
            bitmap = new Uint8ClampedArray(imgData.data);
          }
        };
      },
      hasNonZeroPixels() {
        for (let i = 0; i < bitmap.length; i += 4) {
          if (bitmap[i] > 0 || bitmap[i + 1] > 0 || bitmap[i + 2] > 0) return true;
        }
        return false;
      }
    };
  };

  const simCanvases = {
    '#canvas-hero-knight': createSimCanvas(80, 60, 'hero-guardian'),
    '#canvas-order-1': createSimCanvas(60, 45, 'order-1-recon'),
    '#canvas-order-2': createSimCanvas(60, 45, 'order-2-warrant'),
    '#canvas-order-3': createSimCanvas(60, 45, 'order-3-queue'),
    '#canvas-order-4': createSimCanvas(60, 45, 'order-4-champion'),
    '#canvas-voted-crest': createSimCanvas(90, 90, null)
  };
  const filigreeBox = { children: [], innerHTML: '', dataset: {} };
  const shieldBox = {
    innerHTML: '',
    dataset: {},
    getAttribute(name) {
      return name === 'data-shield-order' ? 'order-1-recon' : null;
    }
  };
  const mockDoc = {
    documentElement: {
      attrs: {},
      setAttribute(k, v) {
        this.attrs[k] = v;
      },
      classList: { toggle() {} }
    },
    body: {
      attrs: {},
      setAttribute(k, v) {
        this.attrs[k] = v;
      }
    },
    querySelector(sel) {
      return simCanvases[sel] || null;
    },
    querySelectorAll(sel) {
      if (sel.includes('.section-filigree-corners')) return [filigreeBox];
      if (sel.includes('[data-shield-order]')) return [shieldBox];
      return [];
    }
  };

  const hudStore = createCivicStore();
  const controller = initHudController({ rootDocument: mockDoc, store: hudStore });
  for (const [cid, cObj] of Object.entries(simCanvases)) {
    assert.equal(cObj.hasNonZeroPixels(), true, `initHudController must render non-zero dithered pixels to ${cid}`);
  }
  assert.ok(filigreeBox.innerHTML.includes('<svg'), 'initHudController must hydrate .section-filigree-corners SVG');
  assert.ok(shieldBox.innerHTML.includes('<svg'), 'initHudController must hydrate [data-shield-order] SVG');

  controller.dispatchKey('3');
  assert.equal(mockDoc.documentElement.attrs['data-palette'], 'phosphor-hud', 'dispatchKey("3") must sync data-palette');
  controller.destroy();

  const elapsed = performance.now() - t0;
  return { elapsed };
}

/**
 * Suite 5: Verifies Track 5 Flagship DOM (`index.html`) & Stylesheet (`styles/ditherpunk_hud.css`).
 */
function verifyDomAndStylesheet() {
  const t0 = performance.now();
  const htmlPath = path.join(ROOT_DIR, 'index.html');
  const cssPath = path.join(ROOT_DIR, 'styles', 'ditherpunk_hud.css');

  assert.ok(fs.existsSync(htmlPath), 'Missing index.html');
  assert.ok(fs.existsSync(cssPath), 'Missing styles/ditherpunk_hud.css');

  const html = fs.readFileSync(htmlPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');

  const requiredDomIds = [
    'hud-top-telemetry-bar',
    'section-hero-aegis',
    'canvas-hero-knight',
    'section-nov3-command',
    'section-dither-forge',
    'section-knight-orders',
    'canvas-order-1',
    'canvas-order-2',
    'canvas-order-3',
    'canvas-order-4',
    'section-ballot-simulator',
    'section-voted-crest',
    'canvas-voted-crest'
  ];

  for (const id of requiredDomIds) {
    assert.ok(
      html.includes(`id="${id}"`) || html.includes(`id='${id}'`),
      `index.html is missing required DOM element id="${id}"`
    );
  }

  // Verify all 6 time zones and 4 hotlines appear in static HTML
  for (const zoneId of POLL_ZONE_IDS) {
    assert.ok(html.includes(zoneId), `index.html missing timezone ${zoneId}`);
  }
  for (const hotline of ['866-OUR-VOTE', '888-VE-Y-VOTA', '888-API-VOTE', '844-YALLA-US']) {
    assert.ok(html.includes(hotline), `index.html missing hotline ${hotline}`);
  }

  // Verify zero leaked specification brace tokens in index.html and styles/ditherpunk_hud.css
  for (const token of FORBIDDEN_SPEC_TOKENS) {
    assert.ok(!html.includes(token), `index.html contains forbidden raw specification token: ${token}`);
    assert.ok(!css.includes(token), `styles/ditherpunk_hud.css contains forbidden raw specification token: ${token}`);
  }

  // Verify zero external runtime script/stylesheet/font CDNs
  const externalResourceMatch = html.match(/<(?:script|link)\b[^>]*(?:src|href)=["']https?:\/\//i);
  assert.equal(externalResourceMatch, null, 'index.html must not load external http/https scripts or stylesheets');

  // Verify reduced-motion and crisp pixelated canvas rules in CSS
  assert.ok(
    css.includes('prefers-reduced-motion'),
    'styles/ditherpunk_hud.css must include @media (prefers-reduced-motion: reduce)'
  );
  assert.ok(
    css.includes('pixelated'),
    'styles/ditherpunk_hud.css must include image-rendering: pixelated for dithered canvases'
  );

  const elapsed = performance.now() - t0;
  return { requiredDomIdsCount: requiredDomIds.length, elapsed };
}

/**
 * Main CLI Verification Runner.
 */
export function runAllVerifications() {
  const totalStart = performance.now();

  const s1 = verifyDitherEngine();
  console.log(
    `[PASS] 1/5 VERIFY_DITHER_ENGINE (6-neighbor 1/8 Atkinson 75.0% propagation, frame=${s1.frameMs.toFixed(2)}ms)`
  );

  const s2 = verifyKnightHeraldry();
  console.log(
    `[PASS] 2/5 VERIFY_KNIGHT_HERALDRY (5 knight scenes + voted crest + Gothic SVG filigree, ${s2.elapsed.toFixed(2)}ms)`
  );

  const s3 = verifyCivicDatasetAndStore();
  console.log(
    `[PASS] 3/5 VERIFY_CIVIC_DATASET_AND_STORE (2026-11-03 dataset + FNV-1a snapshot store, ${s3.elapsed.toFixed(2)}ms)`
  );

  const s4 = verifyHudController();
  console.log(
    `[PASS] 4/5 VERIFY_HUD_CONTROLLER (6 US timezones + hold-the-line clamp + HUD hotkeys, ${s4.elapsed.toFixed(2)}ms)`
  );

  const s5 = verifyDomAndStylesheet();
  console.log(
    `[PASS] 5/5 VERIFY_DOM_AND_STYLESHEET (${s5.requiredDomIdsCount} required IDs, 0 leaked braces, 0 external URLs, ${s5.elapsed.toFixed(2)}ms)`
  );

  const totalElapsed = performance.now() - totalStart;
  assert.ok(
    totalElapsed <= 250.0,
    `Total CLI verification time (${totalElapsed.toFixed(2)}ms) exceeded the 250ms budget`
  );

  console.log(
    `PASS: ALL NOVEMBER 3 KNIGHTS DITHERPUNK HUD INVARIANTS VERIFIED (elapsed: ${totalElapsed.toFixed(1)}ms <= 250ms)`
  );

  return { passed: true, totalElapsed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    runAllVerifications();
    process.exit(0);
  } catch (err) {
    console.error('FAIL: VERIFICATION SUITE ERROR:', err?.stack || err?.message || err);
    process.exit(1);
  }
}
