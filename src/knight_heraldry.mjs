/**
 * @file src/knight_heraldry.mjs
 * @description Track 3: Ornate Chivalric Knight Procedural Art, Gothic SVG Heraldry & "I VOTED — NOV 3" Crest Studio.
 * Zero external runtime dependencies. Isomorphic ES2024 module running in both Node.js v24.9.0 and Browser ES Modules.
 */

// ---------------------------------------------------------------------------
// 1. Scene Registry & Canonical Order/Scene Normalization
// ---------------------------------------------------------------------------

const SCENE_DESCRIPTORS = [
  {
    id: 'hero-guardian',
    shortId: 'hero',
    orderId: 'order-4-champion',
    romanNumeral: 'III',
    name: 'The Guardian of the November III Ballot',
    title: 'High Sentinel of the Civic Aegis',
    motto: 'GUARD THE POLL // CAST THE SEAL // NOVEMBER III',
    hudCallsign: 'AEGIS_PRIME_NOV3',
    emblem: 'Crowned Armet Helm, Ceremonial Halberd & III NOV Heater Shield'
  },
  {
    id: 'order-1-recon',
    shortId: 'order-1',
    orderId: 'order-1-recon',
    romanNumeral: 'I',
    name: 'Sir Vance of the Roll',
    title: 'Knight Scout of Precinct & Registration Recon',
    motto: 'VERIFY THE ROLL // LOCK THE PRECINCT',
    hudCallsign: 'RECON_ORDER_I',
    emblem: 'Hounskull Bascinet, Sighting Reticle & Illuminated Precinct Scroll'
  },
  {
    id: 'order-2-warrant',
    shortId: 'order-2',
    orderId: 'order-2-warrant',
    romanNumeral: 'II',
    name: 'Dame Astraea of the Warrant',
    title: 'Justiciar of Ballot Contemplation & Nonpartisan Measure Audit',
    motto: 'WEIGH THE MEASURE // WIELD THE WARRANT',
    hudCallsign: 'WARRANT_ORDER_II',
    emblem: 'Crowned Gothic Sallet, Broadsword of Equilibrium & Civic Scales'
  },
  {
    id: 'order-3-queue',
    shortId: 'order-3',
    orderId: 'order-3-queue',
    romanNumeral: 'III',
    name: 'Sir Percival of the Queue',
    title: 'Bastion of Line Steadfastness & Statutory Voter Protection',
    motto: 'HOLD THE LINE // EVERY IN-QUEUE BALLOT PROTECTED',
    hudCallsign: 'QUEUE_ORDER_III',
    emblem: 'Cruciform Great Helm, Bolted Pavise Tower Shield & Queue Chevrons'
  },
  {
    id: 'order-4-champion',
    shortId: 'order-4',
    orderId: 'order-4-champion',
    romanNumeral: 'IV',
    name: 'Sovereign Champion of November III',
    title: 'Bearer of the Cast Seal & Sovereign Civic Crest',
    motto: 'SEAL THE BALLOT //NOVEMBER III SOVEREIGN',
    hudCallsign: 'CHAMPION_ORDER_IV',
    emblem: 'Radiant Maximilian Helm, Five-Point Sunburst Aureole & Sealed Star Shield'
  }
];

const SCENE_IDS = SCENE_DESCRIPTORS.map((d) => d.id);
const SCENE_BY_ID = Object.create(null);
for (const desc of SCENE_DESCRIPTORS) {
  SCENE_BY_ID[desc.id] = desc;
  SCENE_BY_ID[desc.shortId] = desc;
  SCENE_BY_ID[desc.orderId] = desc;
}

/**
 * Dual-compatible KNIGHT_SCENES export:
 * - Array of canonical scene IDs: ['hero-guardian', 'order-1-recon', 'order-2-warrant', 'order-3-queue', 'order-4-champion']
 * - Attached metadata lookups: KNIGHT_SCENES.byId, KNIGHT_SCENES.descriptors, KNIGHT_SCENES.list
 */
export const KNIGHT_SCENES = Object.assign([...SCENE_IDS], {
  byId: SCENE_BY_ID,
  descriptors: SCENE_DESCRIPTORS,
  list: [...SCENE_IDS]
});

/**
 * Normalizes any scene or order identifier to its canonical scene ID.
 * @param {string} rawId
 * @returns {string}
 */
export function normalizeSceneId(rawId = 'hero-guardian') {
  const key = String(rawId || 'hero-guardian').trim().toLowerCase();
  if (SCENE_BY_ID[key]) return SCENE_BY_ID[key].id;
  if (key.includes('hero') || key.includes('guardian')) return 'hero-guardian';
  if (key.includes('1') || key.includes('recon') || key.includes('vance')) return 'order-1-recon';
  if (key.includes('2') || key.includes('warrant') || key.includes('astraea')) return 'order-2-warrant';
  if (key.includes('3') || key.includes('queue') || key.includes('percival')) return 'order-3-queue';
  if (key.includes('4') || key.includes('champion') || key.includes('sovereign')) return 'order-4-champion';
  return 'hero-guardian';
}

/**
 * Normalizes an order ID to its canonical order scene ID.
 * @param {string} rawOrderId
 * @returns {string}
 */
export function normalizeOrderId(rawOrderId = 'order-4-champion') {
  const sceneId = normalizeSceneId(rawOrderId);
  return sceneId === 'hero-guardian' ? 'order-4-champion' : sceneId;
}

// ---------------------------------------------------------------------------
// 2. Embedded 5x7 ASCII Pixel Bitmap Font (Zero DOM / Zero External Font)
// ---------------------------------------------------------------------------

/**
 * 5-column by 7-row bitmap glyphs encoded as 7 integers of 5 bits (bit 4 = leftmost pixel, bit 0 = rightmost pixel).
 */
const BITMAP_FONT_5X7 = {
  ' ': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
  'A': [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'B': [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  'C': [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  'D': [0b11100, 0b10010, 0b10001, 0b10001, 0b10001, 0b10010, 0b11100],
  'E': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  'F': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  'G': [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  'H': [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'I': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b11111],
  'J': [0b00111, 0b00010, 0b00010, 0b00010, 0b10010, 0b10010, 0b01100],
  'K': [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  'L': [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  'M': [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  'N': [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  'O': [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'P': [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  'Q': [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  'R': [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  'S': [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  'T': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  'U': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'V': [0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b01010, 0b00100],
  'W': [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  'X': [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  'Y': [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  'Z': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  '3': [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  '6': [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  '-': [0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000, 0b00000],
  '_': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b11111],
  '/': [0b00001, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b10000],
  ':': [0b00000, 0b00100, 0b00100, 0b00000, 0b00100, 0b00100, 0b00000],
  '.': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b01100],
  ',': [0b00000, 0b00000, 0b00000, 0b00000, 0b00110, 0b00100, 0b01000],
  '!': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  '#': [0b01010, 0b11111, 0b01010, 0b01010, 0b11111, 0b01010, 0b00000],
  '[': [0b01110, 0b01000, 0b01000, 0b01000, 0b01000, 0b01000, 0b01110],
  ']': [0b01110, 0b00010, 0b00010, 0b00010, 0b00010, 0b00010, 0b01110]
};

/**
 * Stamps high-contrast beveled bitmap text directly into a luminance Uint8Array buffer.
 */
function drawBitmapTextLuminance(buf, width, height, text, centerX, topY, scale = 2, fgLum = 252, shadowLum = 8) {
  const cleanText = String(text || '').toUpperCase();
  if (!cleanText) return;
  const charAdvance = 6 * scale;
  const totalWidth = cleanText.length * charAdvance - scale;
  const startX = Math.round(centerX - totalWidth * 0.5);
  const startY = Math.round(topY);

  for (let c = 0; c < cleanText.length; c++) {
    const ch = cleanText[c];
    const glyph = BITMAP_FONT_5X7[ch] || BITMAP_FONT_5X7[' '];
    const baseX = startX + c * charAdvance;

    // Pass 1: 1-pixel beveled shadow outline so text survives any dither threshold
    if (shadowLum >= 0) {
      for (let row = 0; row < 7; row++) {
        const bits = glyph[row];
        if (!bits) continue;
        for (let col = 0; col < 5; col++) {
          if ((bits >> (4 - col)) & 1) {
            const px0 = baseX + col * scale;
            const py0 = startY + row * scale;
            for (let dy = -1; dy <= scale; dy++) {
              const py = py0 + dy;
              if (py < 0 || py >= height) continue;
              const rowOff = py * width;
              for (let dx = -1; dx <= scale; dx++) {
                const px = px0 + dx;
                if (px >= 0 && px < width) {
                  buf[rowOff + px] = shadowLum;
                }
              }
            }
          }
        }
      }
    }

    // Pass 2: Crisp foreground glyph stroke
    for (let row = 0; row < 7; row++) {
      const bits = glyph[row];
      if (!bits) continue;
      for (let col = 0; col < 5; col++) {
        if ((bits >> (4 - col)) & 1) {
          const px0 = baseX + col * scale;
          const py0 = startY + row * scale;
          for (let dy = 0; dy < scale; dy++) {
            const py = py0 + dy;
            if (py < 0 || py >= height) continue;
            const rowOff = py * width;
            for (let dx = 0; dx < scale; dx++) {
              const px = px0 + dx;
              if (px >= 0 && px < width) {
                buf[rowOff + px] = fgLum;
              }
            }
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Fast Scanline Procedural Knight Scene Renderer (~0.65ms for 320x240)
// ---------------------------------------------------------------------------

// Cached 1D X-coordinate lookup tables per width to eliminate redundant per-pixel trig
const X_TABLE_CACHE = new Map();

function getXLookupTables(width) {
  let cached = X_TABLE_CACHE.get(width);
  if (cached) return cached;

  const uTab = new Float32Array(width);
  const absUTab = new Float32Array(width);
  const sinFluteX = new Float32Array(width);
  const cosFluteX = new Float32Array(width);
  const archDistBaseL = new Float32Array(width);
  const archDistBaseR = new Float32Array(width);

  const invW = width > 1 ? 2.0 / (width - 1) : 0;
  for (let x = 0; x < width; x++) {
    const u = x * invW - 1.0;
    uTab[x] = u;
    absUTab[x] = u < 0 ? -u : u;
    sinFluteX[x] = Math.sin(u * 34.0);
    cosFluteX[x] = Math.cos(u * 34.0);
    archDistBaseL[x] = (u + 0.35) * (u + 0.35);
    archDistBaseR[x] = (u - 0.35) * (u - 0.35);
  }

  cached = { uTab, absUTab, sinFluteX, cosFluteX, archDistBaseL, archDistBaseR };
  X_TABLE_CACHE.set(width, cached);
  return cached;
}

/**
 * Renders a high-contrast continuous-tone grayscale luminance buffer (Uint8Array) of an
 * ornate chivalric knight framed inside a pointed Gothic cathedral arch with dynamic
 * directional torch lighting. Designed specifically to feed Bill Atkinson error diffusion.
 *
 * @param {string} [sceneId='hero-guardian']
 * @param {number} [width=320]
 * @param {number} [height=240]
 * @param {object} [options={}]
 * @returns {Uint8Array}
 */
export function renderKnightSceneLuminance(sceneId = 'hero-guardian', width = 320, height = 240, options = {}) {
  const w = Math.max(16, width | 0);
  const h = Math.max(16, height | 0);
  const canonicalId = normalizeSceneId(sceneId);
  const rawAngle = Number.isFinite(options.lightAngle) ? options.lightAngle : 0.65;
  const visorOpen = Boolean(options.visorOpen);
  const contrast = Number.isFinite(options.contrast) ? options.contrast : 1.0;

  // Directional torch vector L = (Lx, Ly, Lz) normalized
  const cosA = Math.cos(rawAngle);
  const sinA = Math.sin(rawAngle);
  const rawLx = cosA * 0.76;
  const rawLy = -0.32 + sinA * 0.22;
  const rawLz = 0.58 + cosA * 0.24;
  const invLen = 1.0 / Math.sqrt(rawLx * rawLx + rawLy * rawLy + rawLz * rawLz);
  const Lx = rawLx * invLen;
  const Ly = rawLy * invLen;
  const Lz = rawLz * invLen;

  // Orbiting torch position in normalized [-1, 1] space
  const torchU = 0.46 * cosA;
  const torchV = -0.44 + 0.14 * sinA;

  // Scene mode integer for branch-predicted inner scanline switching:
  // 0: hero-guardian, 1: order-1-recon, 2: order-2-warrant, 3: order-3-queue, 4: order-4-champion
  const mode =
    canonicalId === 'order-1-recon' ? 1 :
    canonicalId === 'order-2-warrant' ? 2 :
    canonicalId === 'order-3-queue' ? 3 :
    canonicalId === 'order-4-champion' ? 4 : 0;

  const { uTab, absUTab, sinFluteX, cosFluteX, archDistBaseL, archDistBaseR } = getXLookupTables(w);
  const out = new Uint8Array(w * h);
  const invH = h > 1 ? 2.0 / (h - 1) : 0;

  for (let y = 0; y < h; y++) {
    const v = y * invH - 1.0;
    const rowOffset = y * w;

    // Precompute scanline-invariant terms for v
    const sinFluteY = Math.sin(v * 14.0);
    const cosFluteY = Math.cos(v * 14.0);
    const dvArch = v - 0.18;
    const dvArchSq = dvArch * dvArch;
    const dvRose = v + 0.44;
    const dvRoseSq = dvRose * dvRose;
    const dvTorch = v - torchV;
    const dvTorchSq = dvTorch * dvTorch;

    // Stone masonry course index
    const stoneRowScaled = (v + 1.0) * 11.0;
    const stoneRow = stoneRowScaled | 0;
    const mortarY = (stoneRowScaled - stoneRow) < 0.075;
    const staggerShift = (stoneRow & 1) * 0.16;

    // Helm & Torso vertical bounds
    const inHelmY = v >= -0.62 && v <= -0.06;
    const inPlumeY = v >= -0.84 && v < -0.50;
    const inTorsoY = v > -0.08 && v <= 0.88;

    for (let x = 0; x < w; x++) {
      const u = uTab[x];
      const absU = absUTab[x];
      let lum = 18.0;

      // ---------------------------------------------------------------------
      // LAYER 1: Pointed Gothic Cathedral Arch, Vaulted Masonry & Rose Window
      // ---------------------------------------------------------------------
      let dArchSq;
      if (v < 0.18) {
        const dLSq = archDistBaseL[x] + dvArchSq;
        const dRSq = archDistBaseR[x] + dvArchSq;
        dArchSq = dLSq > dRSq ? dLSq : dRSq;
      } else {
        const pillarD = absU + 0.35;
        dArchSq = pillarD * pillarD;
      }

      if (dArchSq > 1.3456) {
        // Outer Gothic Ashlar Stone Spandrels (1.16^2 = 1.3456)
        const jointScaled = (u + 1.0 + staggerShift) * 5.5;
        const jointFrac = jointScaled - (jointScaled | 0);
        if (mortarY || jointFrac < 0.055) {
          lum = 8.0; // Deep mortar shadow
        } else {
          const stoneShade = 26.0 + (u * Lx - v * Ly) * 22.0 + ((stoneRow * 17 + ((u * 6.0) | 0)) & 7) * 2.5;
          lum = stoneShade < 10.0 ? 10.0 : stoneShade;
        }
      } else if (dArchSq >= 0.9604) {
        // Molded Gothic Arch Voussoirs & Ribbed Bevels (0.98^2 = 0.9604)
        // Polynomial rib wave across [0.9604, 1.3456]
        const normArch = (dArchSq - 0.9604) * 5.19; // [0, 2]
        const ribWave = (normArch - 1.0) * (1.0 - Math.abs(normArch - 1.0)) * 3.6;
        const nxArch = u * 0.85;
        const nyArch = v < 0.18 ? dvArch * 0.85 : 0.0;
        const dotArch = nxArch * Lx + nyArch * Ly + 0.55 * Lz;
        const posDot = dotArch > 0.0 ? dotArch : 0.0;
        const vJointScaled = (v - u * 0.7 + 3.0) * 14.0;
        const voussoirJoint = (vJointScaled - (vJointScaled | 0)) < 0.065;
        lum = voussoirJoint ? 14.0 : 48.0 + posDot * 135.0 + ribWave * 38.0;
      } else {
        // Inner Vaulted Sanctuary & Torchlight Halo
        const duTorch = u - torchU;
        const distTorchSq = duTorch * duTorch + dvTorchSq;
        const torchHalo = 185.0 / (1.0 + distTorchSq * 4.2);

        // Rose Window Tracery in Upper Vault
        const distRoseSq = u * u + dvRoseSq;
        if (distRoseSq < 0.34) {
          // 8-fold symmetry using u^2 - dv^2 and u*dv polynomial identity
          const u2 = u * u;
          const v2 = dvRoseSq;
          const diffUV = u2 - v2;
          const prodUV = u * dvRose;
          const spoke = (diffUV > -0.012 && diffUV < 0.012) || (prodUV > -0.008 && prodUV < 0.008);
          const ring =
            (distRoseSq > 0.285 && distRoseSq < 0.340) ||
            (distRoseSq > 0.115 && distRoseSq < 0.145) ||
            (distRoseSq > 0.014 && distRoseSq < 0.026);
          if (ring || spoke) {
            lum = 22.0 + torchHalo * 0.25;
          } else {
            lum = 44.0 + torchHalo * 0.92 + (0.34 - distRoseSq) * 135.0;
          }
        } else {
          // Pointed lancet background ribs
          const dRib1 = absU - 0.44;
          const dRib2 = absU - 0.22;
          const lancetRib = (dRib1 > -0.016 && dRib1 < 0.016) || (dRib2 > -0.012 && dRib2 < 0.012);
          lum = (lancetRib ? 24.0 : 14.0) + torchHalo * 0.78;
        }

        // Mode 4 (Sovereign Champion): Radiant 16-beam civic sunburst aureole
        if (mode === 4 && distRoseSq < 0.52 && distRoseSq > 0.03) {
          const s1 = (u + dvRose + 4.0) * 9.5;
          const s2 = (u - dvRose + 4.0) * 9.5;
          const f1 = s1 - (s1 | 0) - 0.5;
          const f2 = s2 - (s2 | 0) - 0.5;
          const rayMetric = (f1 < 0 ? -f1 : f1) + (f2 < 0 ? -f2 : f2);
          if (rayMetric < 0.38) {
            lum += 72.0 * (0.55 - distRoseSq);
          }
        }
      }

      // ---------------------------------------------------------------------
      // LAYER 2: Chivalric Knight Silhouette, Fluted Plate Armor & Pauldrons
      // ---------------------------------------------------------------------

      // Sweeping Crest Plume above Helm
      if (inPlumeY) {
        const plumeCenterU = -0.06 * (v + 0.52);
        const plumeHalfW = 0.22 - (v + 0.66) * (v + 0.66) * 2.4;
        const duPlume = u - plumeCenterU;
        if (Math.abs(duPlume) < plumeHalfW) {
          const featherWave = sinFluteX[x] * cosFluteY + cosFluteX[x] * sinFluteY;
          const plumeDot = Math.max(0.0, (duPlume / (plumeHalfW + 0.01)) * Lx - 0.5 * Ly + 0.75 * Lz);
          lum = 82.0 + plumeDot * 145.0 + featherWave * 36.0;
        }
      }

      // Knight Torso Cuirass, Maximilian Fluting & Articulated Pauldrons
      if (inTorsoY) {
        const torsoHalfW = 0.36 + (v + 0.08) * 0.14;
        if (absU < torsoHalfW) {
          const nx = u / torsoHalfW;
          const ny = (v - 0.32) * 0.45;
          const nzSq = 1.0 - nx * nx - ny * ny;
          const nz = nzSq > 0.06 ? Math.sqrt(nzSq) : 0.245;

          // Fast polynomial specular (d^8 via 3 squarings)
          const dot = Math.max(0.0, nx * Lx + ny * Ly + nz * Lz);
          const d2 = dot * dot;
          const d4 = d2 * d2;
          const spec = d4 * d4;

          // Maximilian chevron fluting ridges: sin(34*u +/- 14*v)
          const flute = u >= 0
            ? (sinFluteX[x] * cosFluteY + cosFluteX[x] * sinFluteY)
            : (sinFluteX[x] * cosFluteY - cosFluteX[x] * sinFluteY);

          // Articulated Pauldron Domes at shoulders (u = +/- 0.32, v in [-0.04, 0.34])
          const duPauldron = absU - 0.27;
          const dvPauldron = v - 0.12;
          const pauldronDistSq = duPauldron * duPauldron + dvPauldron * dvPauldron * 1.35;

          if (pauldronDistSq < 0.055 && absU > 0.16) {
            const lameEdge =
              Math.abs(v - 0.02) < 0.016 ||
              Math.abs(v - 0.12) < 0.016 ||
              Math.abs(v - 0.22) < 0.016;
            lum = lameEdge ? 248.0 : 48.0 + dot * 138.0 + spec * 150.0 + flute * 18.0;
          } else {
            // Central Breastplate Ridge & Gorget Rim
            const centerRidge = absU < 0.018;
            const gorgetRim = Math.abs(v - 0.01) < 0.018 || Math.abs(v - 0.36) < 0.016;
            lum = centerRidge || gorgetRim
              ? 244.0
              : 32.0 + dot * 132.0 + spec * 155.0 + flute * 30.0;
          }
        }
      }

      // ---------------------------------------------------------------------
      // LAYER 3: Helm, Visor, Heraldic Shield & Civic Weaponry per Knight Order
      // ---------------------------------------------------------------------
      if (inHelmY) {
        // Base helm width envelope
        const helmHalfW = mode === 3
          ? 0.23 // Great Helm (cylindrical flat-top)
          : 0.24 - (v + 0.34) * (v + 0.34) * 1.25;

        if (absU < helmHalfW) {
          const nx = u / (helmHalfW + 0.005);
          const ny = (v + 0.34) * 2.2;
          const nzSq = 1.0 - nx * nx - ny * ny * 0.35;
          const nz = nzSq > 0.08 ? Math.sqrt(nzSq) : 0.28;

          // Beaked Hounskull / Armet ridge modulation
          const beakBoost = (mode === 1 && v > -0.34 && v < -0.14) ? (0.22 - absU) * 120.0 : 0.0;
          const dot = Math.max(0.0, nx * Lx + ny * Ly + nz * Lz);
          const d2 = dot * dot;
          const d4 = d2 * d2;
          const spec = d4 * d4;

          let helmLum = 38.0 + dot * 145.0 + spec * 165.0 + beakBoost;

          // Crowned Brow Coronet (Hero, Order 2, Order 4)
          if ((mode === 0 || mode === 2 || mode === 4) && v >= -0.52 && v <= -0.43) {
            const crownTooth = ((absU * 18.0) % 1.0) < 0.48;
            if (crownTooth || v > -0.46) {
              helmLum = 225.0 + spec * 30.0;
            }
          }

          // Ocular Visor Slits & Cruciform Nasal Bar
          const slitHalfH = visorOpen ? 0.042 : 0.022;
          const inOcularBand = Math.abs(v + 0.33) < slitHalfH && absU > 0.032 && absU < 0.19;
          const inNasalRidge = absU <= 0.024 && v >= -0.46 && v <= -0.12;

          if (inOcularBand) {
            // Glowing tactical HUD visor slit or shadowed slit with reticle glint
            helmLum = visorOpen ? 250.0 : (absU > 0.08 && absU < 0.13 ? 238.0 : 6.0);
          } else if (inNasalRidge) {
            helmLum = 246.0;
          } else if (v > -0.26 && v < -0.12) {
            // Ventail breathing perforations on lower visor
            const ventGrid = (((absU * 38.0) | 0) + ((v * 38.0) | 0)) & 1;
            if (ventGrid && absU > 0.05 && absU < 0.18) {
              helmLum *= 0.32;
            }
          }

          lum = helmLum;
        }
      }

      // Scene-Specific Foreground Weapons, Shields & Tactical Iconography
      if (mode === 0 || mode === 4) {
        // HERO GUARDIAN & ORDER IV CHAMPION:
        // Left Ceremonial Halberd (u around -0.52) + Right Heater Shield embossed with "III"
        const duShaft = u + 0.54;
        if (Math.abs(duShaft) < 0.022 && v > -0.78 && v < 0.88) {
          lum = duShaft < 0 ? 238.0 : 52.0; // Metallic shaft highlight
        }
        // Halberd Crescent Axe Blade & Spike (v in [-0.66, -0.18], u in [-0.76, -0.34])
        if (v >= -0.68 && v <= -0.18 && u >= -0.78 && u <= -0.34) {
          const dvBlade = v + 0.42;
          const bladeOuter = u < -0.56 && (duShaft * duShaft + dvBlade * dvBlade * 0.75) < 0.048;
          const bladeBevel = u < -0.56 && (duShaft * duShaft + dvBlade * dvBlade * 0.75) > 0.034 && (duShaft * duShaft + dvBlade * dvBlade * 0.75) < 0.048;
          if (bladeBevel) lum = 252.0;
          else if (bladeOuter) lum = 135.0 + (u + 0.65) * 320.0;
        }

        // Foreground Heater Shield (u in [0.02, 0.52], v in [0.10, 0.80])
        if (v >= 0.10 && v <= 0.80 && u >= 0.02 && u <= 0.54) {
          const su = (u - 0.28) / 0.25; // [-1, 1] across shield width
          const sv = (v - 0.10) / 0.68; // [0, 1] down shield height
          const shieldEnv = sv < 0.45 ? 1.0 : Math.max(0.0, 1.0 - (sv - 0.45) * 1.65);
          if (Math.abs(su) <= shieldEnv) {
            const rimDist = shieldEnv - Math.abs(su);
            const isRim = rimDist < 0.11 || sv < 0.07;
            // Roman numeral "III" embossed in center of shield
            const inRomanBar =
              sv > 0.24 && sv < 0.64 &&
              (Math.abs(su + 0.36) < 0.07 || Math.abs(su) < 0.07 || Math.abs(su - 0.36) < 0.07);
            const inRomanSerif =
              (Math.abs(sv - 0.24) < 0.045 || Math.abs(sv - 0.64) < 0.045) && Math.abs(su) < 0.48;

            if (inRomanBar || inRomanSerif) {
              lum = 252.0;
            } else if (isRim) {
              lum = 228.0;
            } else {
              lum = 28.0 + (1.0 - su * 0.6) * 62.0 + (1.0 - sv) * 35.0;
            }
          }
        }
      } else if (mode === 1) {
        // ORDER I (SIR VANCE OF THE ROLL): Tactical Sighting Reticle + Precinct Scroll
        const duRet = u + 0.44;
        const dvRet = v + 0.28;
        const rRetSq = duRet * duRet + dvRet * dvRet;
        if ((rRetSq > 0.049 && rRetSq < 0.067) || (rRetSq > 0.011 && rRetSq < 0.018)) {
          lum = 248.0;
        } else if (rRetSq < 0.078 && (Math.abs(duRet) < 0.012 || Math.abs(dvRet) < 0.012)) {
          lum = 232.0;
        }

        // Foreground Unrolled Precinct Ledger Scroll (v in [0.34, 0.78], absU < 0.46)
        if (v >= 0.34 && v <= 0.78 && absU <= 0.46) {
          const isRollRoller = Math.abs(v - 0.36) < 0.032 || Math.abs(v - 0.76) < 0.032;
          const ledgerScaled = (v - 0.40) * 26.0;
          const isLedgerLine = (ledgerScaled - (ledgerScaled | 0)) < 0.22 && absU < 0.36;
          if (isRollRoller) {
            lum = 242.0;
          } else if (isLedgerLine) {
            lum = 16.0;
          } else {
            lum = 198.0 - absU * 95.0;
          }
        }
      } else if (mode === 2) {
        // ORDER II (DAME ASTRAEA OF THE WARRANT): Broadsword of Equilibrium & Civic Scales
        // Central Vertical Broadsword Blade (absU < 0.042, v in [-0.12, 0.86])
        if (absU < 0.042 && v >= -0.12 && v <= 0.86) {
          lum = u < 0 ? 250.0 : 58.0; // Crisp split-bevel blade
        }
        // Horizontal Scale Beam & Crossguard at v = 0.06
        if (Math.abs(v - 0.06) < 0.026 && absU < 0.56) {
          lum = 244.0;
        }
        // Twin Suspended Scale Pans at u = +/- 0.44, v = 0.38
        const duScale = absU - 0.44;
        if (v > 0.06 && v < 0.38 && Math.abs(Math.abs(duScale) - (v - 0.06) * 0.35) < 0.014) {
          lum = 215.0; // Suspension chains
        }
        const dvPan = v - 0.38;
        if (dvPan >= 0.0 && dvPan <= 0.11 && Math.abs(duScale) <= 0.16) {
          if (duScale * duScale + dvPan * dvPan * 2.2 < 0.026) {
            lum = dvPan < 0.028 ? 248.0 : 145.0 - duScale * 180.0;
          }
        }
      } else if (mode === 3) {
        // ORDER III (SIR PERCIVAL OF THE QUEUE): Massive Pavise Tower Shield & Queue Chevrons
        if (v >= 0.04 && v <= 0.86 && absU <= 0.42) {
          const isBorder = absU > 0.37 || v < 0.09 || v > 0.81;
          const isCentralRib = absU < 0.028;
          // Double Chevron of Steadfastness
          const chev1 = Math.abs((v - 0.28) - absU * 0.65) < 0.042;
          const chev2 = Math.abs((v - 0.50) - absU * 0.65) < 0.042;
          if (isBorder || isCentralRib || chev1 || chev2) {
            lum = 246.0;
          } else {
            const shieldNx = u / 0.42;
            const shieldDot = Math.max(0.0, shieldNx * Lx + 0.75 * Lz);
            lum = 34.0 + shieldDot * 118.0;
          }
        }
      }

      // ---------------------------------------------------------------------
      // LAYER 4: Outer Tactical HUD Reticle Framing & Dynamic Contrast Clamp
      // ---------------------------------------------------------------------
      // Crisp 2px dark frame border with corner ticks so every scene has exact min=0 and max=255
      if (x < 2 || x >= w - 2 || y < 2 || y >= h - 2) {
        lum = 4.0;
      } else if (
        ((x === 5 || x === w - 6) && (y < 18 || y >= h - 18)) ||
        ((y === 5 || y === h - 6) && (x < 18 || x >= w - 18))
      ) {
        lum = 252.0;
      }

      // Apply optional contrast gain around mid-gray 128
      if (contrast !== 1.0) {
        lum = 128.0 + (lum - 128.0) * contrast;
      }

      out[rowOffset + x] = lum <= 0.0 ? 0 : lum >= 255.0 ? 255 : (lum + 0.5) | 0;
    }
  }

  // Stamp subtle tactical HUD scene callsign in bottom-left plate for verifiable crisp detail
  const desc = SCENE_BY_ID[canonicalId] || SCENE_DESCRIPTORS[0];
  if (w >= 160 && h >= 100) {
    drawBitmapTextLuminance(out, w, h, desc.romanNumeral + ' // ' + desc.hudCallsign, w >> 1, h - 14, 1, 252, 6);
  }

  // Attach dual-compatible metadata properties directly onto the returned Uint8Array instance
  out.luminance = out;
  out.width = w;
  out.height = h;
  out.sceneId = canonicalId;
  return out;
}

// ---------------------------------------------------------------------------
// 4. Inline Gothic + HUD SVG Heraldry Factories (Polymorphic Signatures)
// ---------------------------------------------------------------------------

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates an inline SVG string for ornate corner brackets combining Gothic pointed
 * cusps/tracery with modern HUD targeting crosshairs.
 *
 * Polymorphic signature support:
 * - getOrnateCornerFiligreeSVG(size = 48, className = '')
 * - getOrnateCornerFiligreeSVG(corner = 'top-left', options = {})
 * - getOrnateCornerFiligreeSVG(options = {})
 *
 * @param {number|string|object} [arg1=48]
 * @param {string|object} [arg2='']
 * @returns {string}
 */
export function getOrnateCornerFiligreeSVG(arg1 = 48, arg2 = '') {
  let size = 48;
  let className = 'hud-corner-filigree';
  let corner = 'top-left';
  let accentColor = 'currentColor';

  if (typeof arg1 === 'number') {
    size = arg1;
    if (typeof arg2 === 'string' && arg2) {
      className = arg2;
    } else if (arg2 && typeof arg2 === 'object') {
      corner = arg2.corner || corner;
      accentColor = arg2.accentColor || accentColor;
      className = arg2.className || className;
    }
  } else if (typeof arg1 === 'string') {
    corner = arg1;
    if (typeof arg2 === 'string' && arg2) {
      className = arg2;
    } else if (arg2 && typeof arg2 === 'object') {
      size = Number.isFinite(arg2.size) ? arg2.size : size;
      accentColor = arg2.accentColor || accentColor;
      className = arg2.className || className;
    }
  } else if (arg1 && typeof arg1 === 'object') {
    size = Number.isFinite(arg1.size) ? arg1.size : size;
    corner = arg1.corner || corner;
    accentColor = arg1.accentColor || accentColor;
    className = arg1.className || className;
  }

  const rotationMap = {
    'top-left': 0,
    'top-right': 90,
    'bottom-right': 180,
    'bottom-left': 270
  };
  const deg = rotationMap[corner] ?? 0;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" class="${escapeXml(className)}" data-corner="${escapeXml(corner)}" aria-hidden="true" focusable="false">` +
      `<g transform="rotate(${deg} 32 32)" fill="none" stroke="${escapeXml(accentColor)}">` +
        `<path d="M3 60 L3 3 L60 3" stroke-width="2.5"/>` +
        `<path d="M9 52 L9 9 L52 9" stroke-width="1.2" stroke-dasharray="6 3"/>` +
        `<path d="M9 30 C9 17, 17 9, 30 9 C20 17, 17 20, 9 30 Z" fill="${escapeXml(accentColor)}" fill-opacity="0.22" stroke-width="1.2"/>` +
        `<circle cx="17" cy="17" r="3.5" stroke-width="1.5"/>` +
        `<path d="M3 17 L12 17 M17 3 L17 12 M34 3 L34 8 M3 34 L8 34 M48 3 L48 7 M3 48 L7 48" stroke-width="1.4"/>` +
      `</g>` +
    `</svg>`
  );
}

/**
 * Generates an inline SVG string of a pointed Gothic cathedral arch framing header typography
 * with a central rose-window rosette and crossed ceremonial halberds.
 *
 * Polymorphic signature support:
 * - getGothicArchHeaderSVG(titleText, subtitleText)
 * - getGothicArchHeaderSVG({ title, subtitle, accentColor, width, height })
 *
 * @param {string|object} [arg1='ORDER OF THE CIVIC AEGIS']
 * @param {string} [arg2='NOVEMBER 3, 2026 // BALLOT COMMAND']
 * @returns {string}
 */
export function getGothicArchHeaderSVG(
  arg1 = 'ORDER OF THE CIVIC AEGIS',
  arg2 = 'NOVEMBER 3, 2026 // BALLOT COMMAND'
) {
  let title = 'ORDER OF THE CIVIC AEGIS';
  let subtitle = 'NOVEMBER 3, 2026 // BALLOT COMMAND';
  let accentColor = 'currentColor';

  if (arg1 && typeof arg1 === 'object') {
    title = arg1.title || arg1.titleText || title;
    subtitle = arg1.subtitle || arg1.subtitleText || subtitle;
    accentColor = arg1.accentColor || accentColor;
  } else {
    if (typeof arg1 === 'string' && arg1) title = arg1;
    if (typeof arg2 === 'string' && arg2) subtitle = arg2;
  }

  const safeTitle = escapeXml(title);
  const safeSub = escapeXml(subtitle);
  const safeAccent = escapeXml(accentColor);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 124" width="100%" height="124" class="gothic-arch-header-svg" role="img" aria-label="${safeTitle} — ${safeSub}">` +
      `<title>${safeTitle} — ${safeSub}</title>` +
      `<g fill="none" stroke="${safeAccent}">` +
        `<!-- Outer Tactical HUD Frame & Corner Ticks -->` +
        `<path d="M8 36 L8 8 L64 8 M712 36 L712 8 L656 8 M8 88 L8 116 L64 116 M712 88 L712 116 L656 116" stroke-width="2.2"/>` +
        `<line x1="24" y1="62" x2="180" y2="62" stroke-width="1.2" stroke-dasharray="5 3"/>` +
        `<line x1="540" y1="62" x2="696" y2="62" stroke-width="1.2" stroke-dasharray="5 3"/>` +
        `<!-- Pointed Gothic Cathedral Lancet Arch -->` +
        `<path d="M136 114 C188 38, 286 12, 360 4 C434 12, 532 38, 584 114" stroke-width="2.5"/>` +
        `<path d="M158 114 C206 46, 294 20, 360 12 C426 20, 514 46, 562 114" stroke-width="1.3" stroke-dasharray="8 4"/>` +
        `<!-- Crossed Ceremonial Halberds -->` +
        `<line x1="296" y1="54" x2="424" y2="10" stroke-width="1.6"/>` +
        `<line x1="424" y1="54" x2="296" y2="10" stroke-width="1.6"/>` +
        `<!-- Gothic Rose Window Rosette -->` +
        `<circle cx="360" cy="30" r="16" stroke-width="1.8"/>` +
        `<circle cx="360" cy="30" r="7" stroke-width="1.2"/>` +
        `<path d="M360 14 L360 46 M344 30 L376 30 M349 19 L371 41 M371 19 L349 41" stroke-width="1.1"/>` +
      `</g>` +
      `<text x="360" y="78" text-anchor="middle" fill="${safeAccent}" font-family="monospace" font-size="18" font-weight="700" letter-spacing="3">${safeTitle}</text>` +
      `<text x="360" y="102" text-anchor="middle" fill="${safeAccent}" font-family="monospace" font-size="11" letter-spacing="2" opacity="0.88">${safeSub}</text>` +
    `</svg>`
  );
}

/**
 * Generates an inline SVG shield embossed with Order-specific chivalric heraldry and "III NOV".
 *
 * Polymorphic signature support:
 * - getKnightCrestShieldSVG(orderId = 'order-1-recon', width = 120, height = 140)
 * - getKnightCrestShieldSVG(orderId = 'order-1-recon', options = { width, height, accentColor })
 *
 * @param {string} [orderId='order-1-recon']
 * @param {number|object} [arg2=120]
 * @param {number} [arg3=140]
 * @returns {string}
 */
export function getKnightCrestShieldSVG(orderId = 'order-1-recon', arg2 = 120, arg3 = 140) {
  const canonicalId = normalizeOrderId(orderId);
  const desc = SCENE_BY_ID[canonicalId] || SCENE_DESCRIPTORS[1];

  let width = 120;
  let height = 140;
  let accentColor = 'currentColor';

  if (arg2 && typeof arg2 === 'object') {
    width = Number.isFinite(arg2.width) ? arg2.width : width;
    height = Number.isFinite(arg2.height) ? arg2.height : height;
    accentColor = arg2.accentColor || accentColor;
  } else {
    if (Number.isFinite(arg2)) width = arg2;
    if (Number.isFinite(arg3)) height = arg3;
  }

  const safeAccent = escapeXml(accentColor);
  let centralChargeMarkup = '';

  if (canonicalId === 'order-1-recon') {
    // Order I: Tactical Sighting Reticle & Precinct Scroll
    centralChargeMarkup =
      `<circle cx="60" cy="56" r="22" stroke-width="1.8"/>` +
      `<circle cx="60" cy="56" r="10" stroke-width="1.3" stroke-dasharray="4 2"/>` +
      `<path d="M60 28 L60 84 M32 56 L88 56" stroke-width="1.4"/>` +
      `<rect x="38" y="84" width="44" height="14" rx="2" stroke-width="1.6"/>`;
  } else if (canonicalId === 'order-2-warrant') {
    // Order II: Broadsword of Equilibrium & Balanced Civic Scales
    centralChargeMarkup =
      `<path d="M60 22 L60 98 M42 42 L78 42" stroke-width="2.2"/>` +
      `<path d="M34 42 L86 42" stroke-width="1.6"/>` +
      `<path d="M36 42 L28 66 L44 66 Z M84 42 L76 66 L92 66 Z" stroke-width="1.4"/>`;
  } else if (canonicalId === 'order-3-queue') {
    // Order III: Fortress Pavise Tower & Steadfast Queue Chevrons
    centralChargeMarkup =
      `<rect x="38" y="28" width="44" height="58" stroke-width="2.0"/>` +
      `<path d="M40 54 L60 38 L80 54 M40 70 L60 54 L80 70" stroke-width="2.2"/>` +
      `<line x1="60" y1="28" x2="60" y2="86" stroke-width="1.4"/>`;
  } else {
    // Order IV / Champion: Radiant Crown, Five-Point Sunburst & Halberd Cross
    centralChargeMarkup =
      `<polygon points="60,24 67,44 88,44 71,56 77,76 60,64 43,76 49,56 32,44 53,44" stroke-width="1.8"/>` +
      `<circle cx="60" cy="52" r="8" stroke-width="1.5"/>` +
      `<path d="M42 22 L48 32 L60 20 L72 32 L78 22" stroke-width="1.8"/>`;
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" width="${width}" height="${height}" class="knight-crest-shield-svg" data-order-id="${escapeXml(canonicalId)}" role="img" aria-label="${escapeXml(desc.name)} — III NOV Heraldic Shield">` +
      `<title>${escapeXml(desc.name)} (${escapeXml(desc.romanNumeral)}) — III NOV</title>` +
      `<g fill="none" stroke="${safeAccent}">` +
        `<!-- Outer Heater Shield Bevel -->` +
        `<path d="M12 12 L108 12 L108 64 C108 98, 60 122, 60 130 C60 122, 12 98, 12 64 Z" stroke-width="2.6"/>` +
        `<path d="M18 18 L102 18 L102 62 C102 92, 60 114, 60 122 C60 114, 18 92, 18 62 Z" stroke-width="1.2" stroke-dasharray="5 3"/>` +
        centralChargeMarkup +
        `<!-- Embossed III NOV Motto Scroll -->` +
        `<rect x="24" y="100" width="72" height="16" rx="2" fill="${safeAccent}" fill-opacity="0.14" stroke-width="1.5"/>` +
      `</g>` +
      `<text x="60" y="112" text-anchor="middle" fill="${safeAccent}" font-family="monospace" font-size="10" font-weight="700" letter-spacing="1.5">III NOV // ${escapeXml(desc.romanNumeral)}</text>` +
    `</svg>`
  );
}

// ---------------------------------------------------------------------------
// 5. Interactive "I VOTED — NOV 3" Crest Luminance & Canvas Studio
// ---------------------------------------------------------------------------

/**
 * Generates a high-contrast 360x360 grayscale luminance buffer for the personalized
 * "I VOTED — NOVEMBER 3, 2026" knightly crest badge with embedded 5x7 pixel bitmap typography.
 *
 * @param {object} [config={}]
 * @param {number} [width=360]
 * @param {number} [height=360]
 * @returns {Uint8Array}
 */
export function renderVotedCrestLuminance(config = {}, width = 360, height = 360) {
  const w = Math.max(64, width | 0);
  const h = Math.max(64, height | 0);
  const callsign = String(config.callsign || 'KNIGHT OF PRECINCT 04').trim().toUpperCase().slice(0, 26) || 'KNIGHT OF PRECINCT 04';
  const orderId = normalizeOrderId(config.orderId || 'order-4-champion');
  const desc = SCENE_BY_ID[orderId] || SCENE_DESCRIPTORS[4];
  const lightAngle = Number.isFinite(config.lightAngle) ? config.lightAngle : 0.65;

  // Base knight scene rendered inside the crest shield
  const buf = renderKnightSceneLuminance(orderId, w, h, {
    lightAngle,
    visorOpen: Boolean(config.visorOpen)
  });

  const invW = 2.0 / (w - 1);
  const invH = 2.0 / (h - 1);

  // Sculpt ornamental heater-shield medallion border and header/footer ribbon plates
  for (let y = 0; y < h; y++) {
    const v = y * invH - 1.0;
    const rowOff = y * w;

    for (let x = 0; x < w; x++) {
      const u = x * invW - 1.0;
      const absU = u < 0 ? -u : u;

      // Heater shield boundary envelope
      const shieldHalfW = v < 0.05 ? 0.72 : Math.max(0.0, 0.72 - (v - 0.05) * 0.82);
      const inShieldY = v >= -0.64 && v <= 0.72;
      const dEdge = shieldHalfW - absU;

      if (inShieldY && Math.abs(dEdge) < 0.038) {
        // Bright metallic shield border bevel
        buf[rowOff + x] = dEdge > 0 ? 250 : 12;
      } else if (!inShieldY || absU > shieldHalfW + 0.038) {
        // Outer obsidian medallion field with radial gothic filigree rings
        const r = Math.sqrt(u * u + v * v);
        const outerRing = Math.abs(r - 0.90) < 0.018 || Math.abs(r - 0.84) < 0.01;
        const cornerBracket =
          (absU > 0.76 && Math.abs(v) > 0.76) &&
          (Math.abs(absU - 0.92) < 0.02 || Math.abs(Math.abs(v) - 0.92) < 0.02);
        if (outerRing || cornerBracket) {
          buf[rowOff + x] = 242;
        } else {
          buf[rowOff + x] = (buf[rowOff + x] * 0.35) | 0;
        }
      }

      // Top "I VOTED" Ribbon Plate (v in [-0.88, -0.66], absU < 0.80)
      if (v >= -0.88 && v <= -0.66 && absU <= 0.80) {
        const isPlateBorder =
          Math.abs(v + 0.88) < 0.018 ||
          Math.abs(v + 0.66) < 0.018 ||
          Math.abs(absU - 0.80) < 0.02;
        buf[rowOff + x] = isPlateBorder ? 252 : 10;
      }

      // Bottom Date & Callsign Scroll Plates (v in [0.60, 0.92], absU < 0.86)
      if (v >= 0.60 && v <= 0.92 && absU <= 0.86) {
        const isScrollBorder =
          Math.abs(v - 0.60) < 0.016 ||
          Math.abs(v - 0.76) < 0.014 ||
          Math.abs(v - 0.92) < 0.018 ||
          Math.abs(absU - 0.86) < 0.02;
        buf[rowOff + x] = isScrollBorder ? 248 : 12;
      }
    }
  }

  // Stamp high-contrast 5x7 bitmap typography into the ribbon plates
  const scaleTop = Math.max(1, Math.floor(w / 110));
  const scaleSub = Math.max(1, Math.floor(w / 170));

  drawBitmapTextLuminance(buf, w, h, 'I VOTED // NOV 3', w >> 1, Math.round(h * 0.085), scaleTop, 255, 4);
  drawBitmapTextLuminance(buf, w, h, 'NOVEMBER 3, 2026', w >> 1, Math.round(h * 0.815), scaleSub, 252, 6);
  drawBitmapTextLuminance(buf, w, h, callsign, w >> 1, Math.round(h * 0.895), scaleSub, 255, 4);

  // Attach metadata properties onto the Uint8Array
  buf.luminance = buf;
  buf.width = w;
  buf.height = h;
  buf.callsign = callsign;
  buf.orderId = orderId;
  buf.orderTitle = desc.name;
  return buf;
}

/**
 * Built-in fallback Atkinson 1-bit/2-bit dither & palette mapper used only if a caller invokes
 * renderVotedCrestToCanvas without passing ditherEngine and before dynamic import resolution.
 */
const FALLBACK_PALETTES = {
  'obsidian-bone': [[10, 11, 14], [43, 45, 56], [156, 163, 175], [244, 241, 234]],
  'crimson-herald': [[11, 7, 8], [74, 18, 25], [230, 57, 70], [255, 248, 240]],
  'phosphor-hud': [[5, 12, 8], [13, 59, 34], [16, 185, 129], [209, 250, 229]],
  'cobalt-aegis': [[7, 11, 20], [30, 58, 138], [96, 165, 250], [241, 245, 249]]
};

function fallbackDitherAndPalette(lum, width, height, kernel = 'atkinson-1bit', threshold = 128, paletteId = 'obsidian-bone') {
  const stride = width + 4;
  const err = new Float32Array(3 * stride);
  const quantized = new Uint8Array(width * height);
  const is2Bit = kernel === 'atkinson-2bit';

  for (let y = 0; y < height; y++) {
    const r0 = (y % 3) * stride + 2;
    const r1 = ((y + 1) % 3) * stride + 2;
    const r2 = ((y + 2) % 3) * stride + 2;
    err.fill(0, r2 - 2, r2 + width + 2);
    const rowOff = y * width;

    for (let x = 0; x < width; x++) {
      const idx = rowOff + x;
      let v = lum[idx] + err[r0 + x];
      if (v < 0) v = 0;
      else if (v > 255) v = 255;

      let q;
      if (is2Bit) {
        const adj = v + (128 - threshold);
        q = adj < 43 ? 0 : adj < 128 ? 85 : adj < 213 ? 170 : 255;
      } else {
        q = v >= threshold ? 255 : 0;
      }
      quantized[idx] = q;

      const delta = (v - q) * 0.125;
      err[r0 + x + 1] += delta;
      err[r0 + x + 2] += delta;
      err[r1 + x - 1] += delta;
      err[r1 + x] += delta;
      err[r1 + x + 1] += delta;
      err[r2 + x] += delta;
    }
  }

  const tones = FALLBACK_PALETTES[paletteId] || FALLBACK_PALETTES['obsidian-bone'];
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < quantized.length; i++) {
    const rgb = tones[quantized[i] >> 6];
    const p = i << 2;
    rgba[p] = rgb[0];
    rgba[p + 1] = rgb[1];
    rgba[p + 2] = rgb[2];
    rgba[p + 3] = 255;
  }
  return { quantized, rgba };
}

/**
 * Renders the personalized "I VOTED — NOV 3" crest luminance buffer, applies Bill Atkinson
 * error-diffusion dithering and palette mapping, and draws it onto the provided HTMLCanvasElement
 * (or headless mock canvas).
 *
 * @param {HTMLCanvasElement|object|null} canvas
 * @param {object} [config={}]
 * @param {object|null} [ditherEngine=null]
 * @returns {object}
 */
export function renderVotedCrestToCanvas(canvas, config = {}, ditherEngine = null) {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const width = (canvas && Number.isFinite(canvas.width) && canvas.width > 0) ? canvas.width : (config.width || 360);
  const height = (canvas && Number.isFinite(canvas.height) && canvas.height > 0) ? canvas.height : (config.height || 360);
  const kernel = config.kernel || 'atkinson-1bit';
  const palette = config.palette || 'obsidian-bone';
  const threshold = Number.isFinite(config.threshold) ? config.threshold : 128;
  const callsign = String(config.callsign || 'KNIGHT OF PRECINCT 04').trim().toUpperCase().slice(0, 26) || 'KNIGHT OF PRECINCT 04';
  const orderId = normalizeOrderId(config.orderId || 'order-4-champion');

  const lum = renderVotedCrestLuminance({ ...config, callsign, orderId }, width, height);

  let quantized;
  let rgba;

  if (ditherEngine && typeof ditherEngine.ditherGrayscaleBuffer === 'function') {
    const ditherRes = ditherEngine.ditherGrayscaleBuffer(lum, width, height, { kernel, threshold, palette });
    quantized = ditherRes?.quantized instanceof Uint8Array ? ditherRes.quantized : ditherRes;
    if (ditherRes?.rgba instanceof Uint8ClampedArray) {
      rgba = ditherRes.rgba;
    } else if (typeof ditherEngine.applyPaletteToQuantized === 'function') {
      rgba = ditherEngine.applyPaletteToQuantized(quantized, width, height, palette);
    }
  }

  if (!quantized || !rgba) {
    const fb = fallbackDitherAndPalette(lum, width, height, kernel, threshold, palette);
    quantized = quantized || fb.quantized;
    rgba = rgba || fb.rgba;
  }

  let dataUrl = '';
  if (canvas && typeof canvas.getContext === 'function') {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (typeof ctx.createImageData === 'function' && typeof ctx.putImageData === 'function') {
        const imgData = ctx.createImageData(width, height);
        imgData.data.set(rgba);
        ctx.putImageData(imgData, 0, 0);
      } else if (typeof ImageData !== 'undefined' && typeof ctx.putImageData === 'function') {
        const imgData = new ImageData(new Uint8ClampedArray(rgba), width, height);
        ctx.putImageData(imgData, 0, 0);
      }
    }
    if (typeof canvas.toDataURL === 'function') {
      try {
        dataUrl = canvas.toDataURL('image/png');
      } catch {
        dataUrl = '';
      }
    }
  }

  const elapsedMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;

  const result = {
    canvas,
    width,
    height,
    luminance: lum,
    quantized,
    rgba,
    dataUrl,
    frameMs: elapsedMs,
    elapsedMs,
    callsign,
    orderId,
    kernel,
    palette
  };

  if (canvas && typeof canvas === 'object') {
    canvas.lastRenderResult = result;
    return Object.assign(canvas, result);
  }
  return result;
}
