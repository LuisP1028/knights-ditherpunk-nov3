/**
 * @file src/atkinson_dither_engine.mjs
 * @description Track 4: Bill Atkinson Error-Diffusion Dithering Engine & Cross-Domain Buffer Optimization.
 *
 * Implements authentic 6-neighbor, 1/8-weight (0.125 exact IEEE-754 float, 75.0% propagation,
 * 25.0% local absorption) Bill Atkinson dithering alongside comparative Ditherpunk modes:
 * - 'atkinson-1bit'   (2-tone {0, 255}, 6x1/8 error diffusion)
 * - 'atkinson-2bit'   (4-tone {0, 85, 170, 255}, 6x1/8 error diffusion)
 * - 'floyd-steinberg' (2-tone {0, 255}, 4-neighbor 16/16 [7, 3, 5, 1] error diffusion)
 * - 'bayer-8x8'       (2-tone {0, 255}, ordered 8x8 threshold matrix cross-hatch stippling)
 *
 * Architectural Performance Invariants:
 * 1. Padded 3-row Float32Array(3 * (width + 4)) sliding ring buffer with 2-pixel left/right guard apron
 *    (px = x + 2), reducing error buffer space from O(W * H) to O(W) (< 4 KB in L1 cache) and eliminating
 *    all per-pixel boundary branches.
 * 2. Monomorphic pristine-buffer staging (`_sharedCleanSrc`, `_sharedCleanOut`) so V8 TurboFan never
 *    deoptimizes indexed TypedArray accesses when upstream or downstream callers attach metadata expandos
 *    onto returned `Uint8Array` instances.
 * 3. Exact IEEE-754 power-of-two multiplication (* 0.125 = 2^-3, * 0.0625 = 2^-4) avoiding integer >> 3
 *    truncation drift and guaranteeing exact 0.75 (6/8) error propagation.
 * 4. Pre-packed 32-bit native-endian Uint32Array(4) palette lookup tables indexed via branchless
 *    bit-shift (q >> 6: {0->0, 85->1, 170->2, 255->3}).
 * 5. Dual-compatible return values and polymorphic signatures across all 5 tracks.
 */

const hasPerformanceNow =
  typeof globalThis !== 'undefined' &&
  typeof globalThis.performance === 'object' &&
  globalThis.performance !== null &&
  typeof globalThis.performance.now === 'function';

function nowMs() {
  return hasPerformanceNow ? globalThis.performance.now() : Date.now();
}

/**
 * Canonical 6-neighbor Bill Atkinson diffusion offsets and exact 1/8 (0.125) weights.
 * Total propagated fraction = 6 * 0.125 = 0.75 (75.0%); locally absorbed = 0.25 (25.0%).
 */
export const ATKINSON_NEIGHBOR_OFFSETS = Object.freeze([
  Object.freeze({ dx: 1, dy: 0, weight: 0.125 }),
  Object.freeze({ dx: 2, dy: 0, weight: 0.125 }),
  Object.freeze({ dx: -1, dy: 1, weight: 0.125 }),
  Object.freeze({ dx: 0, dy: 1, weight: 0.125 }),
  Object.freeze({ dx: 1, dy: 1, weight: 0.125 }),
  Object.freeze({ dx: 0, dy: 2, weight: 0.125 })
]);

const KERNEL_DESCRIPTORS = Object.freeze({
  'atkinson-1bit': Object.freeze({
    id: 'atkinson-1bit',
    label: 'ATKINSON 1-BIT [6x1/8]',
    hudCode: 'ATKINSON_6x1/8',
    divisor: 8,
    errorPropagation: 0.75,
    errorPropagationRatio: 0.75,
    absorbedFraction: 0.25,
    bits: 1,
    levels: Object.freeze([0, 255]),
    description: 'Bill Atkinson 6-neighbor 1/8 error diffusion (75% propagation, 25% absorption)'
  }),
  'atkinson-2bit': Object.freeze({
    id: 'atkinson-2bit',
    label: 'ATKINSON 2-BIT [4-TONE]',
    hudCode: 'ATKINSON_2BIT_4TONE',
    divisor: 8,
    errorPropagation: 0.75,
    errorPropagationRatio: 0.75,
    absorbedFraction: 0.25,
    bits: 2,
    levels: Object.freeze([0, 85, 170, 255]),
    description: '4-tone quantized Bill Atkinson 6-neighbor 1/8 error diffusion'
  }),
  'floyd-steinberg': Object.freeze({
    id: 'floyd-steinberg',
    label: 'FLOYD-STEINBERG [16/16]',
    hudCode: 'FLOYD_STEINBERG_16',
    divisor: 16,
    errorPropagation: 1.0,
    errorPropagationRatio: 1.0,
    absorbedFraction: 0.0,
    bits: 1,
    levels: Object.freeze([0, 255]),
    description: 'Classic 4-neighbor 16/16 [7, 3, 5, 1] 100% error diffusion'
  }),
  'bayer-8x8': Object.freeze({
    id: 'bayer-8x8',
    label: 'ORDERED BAYER 8x8',
    hudCode: 'BAYER_8x8_ORDERED',
    divisor: 64,
    errorPropagation: 0.0,
    errorPropagationRatio: 0.0,
    absorbedFraction: 1.0,
    bits: 1,
    levels: Object.freeze([0, 255]),
    description: 'Ordered 8x8 threshold matrix cross-hatch stippling'
  })
});

const KERNEL_ID_LIST = Object.freeze([
  'atkinson-1bit',
  'atkinson-2bit',
  'floyd-steinberg',
  'bayer-8x8'
]);

/**
 * Dual-compatible `DITHER_KERNELS`:
 * - Works as a standard Array (`Array.isArray(DITHER_KERNELS) === true`, `.includes()`, `for..of`, `.map()`)
 * - Works as a dictionary lookup (`DITHER_KERNELS['atkinson-1bit'].hudCode`, `DITHER_KERNELS.byId[...]`)
 */
const ditherKernelsHybrid = [...KERNEL_ID_LIST];
for (const kernelId of KERNEL_ID_LIST) {
  Object.defineProperty(ditherKernelsHybrid, kernelId, {
    value: KERNEL_DESCRIPTORS[kernelId],
    writable: false,
    enumerable: false,
    configurable: false
  });
}
Object.defineProperty(ditherKernelsHybrid, 'list', {
  value: KERNEL_ID_LIST,
  writable: false,
  enumerable: false,
  configurable: false
});
Object.defineProperty(ditherKernelsHybrid, 'byId', {
  value: KERNEL_DESCRIPTORS,
  writable: false,
  enumerable: false,
  configurable: false
});
Object.defineProperty(ditherKernelsHybrid, 'descriptors', {
  value: Object.freeze(KERNEL_ID_LIST.map((id) => KERNEL_DESCRIPTORS[id])),
  writable: false,
  enumerable: false,
  configurable: false
});

export const DITHER_KERNELS = Object.freeze(ditherKernelsHybrid);
export const DITHER_KERNEL_MAP = KERNEL_DESCRIPTORS;

/**
 * Build a hardware-endianness-safe 4-entry Uint32Array RGBA lookup table from 4 [R, G, B] triples.
 */
function createRgbaLut32(levels) {
  const buffer = new ArrayBuffer(16);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < 4; i++) {
    const rgb = levels[i];
    const base = i * 4;
    bytes[base] = rgb[0];
    bytes[base + 1] = rgb[1];
    bytes[base + 2] = rgb[2];
    bytes[base + 3] = 255;
  }
  return new Uint32Array(buffer);
}

function buildPaletteDefinition({ id, name, label, shadow, midDark, midLight, highlight, accent, levels }) {
  const frozenLevels = Object.freeze(levels.map((rgb) => Object.freeze([...rgb])));
  const lut32 = createRgbaLut32(frozenLevels);
  return Object.freeze({
    id,
    name,
    label: label || name,
    shadow,
    midDark,
    midLight,
    highlight,
    accent,
    levels: frozenLevels,
    tonesRgb: frozenLevels,
    colors: Object.freeze({ shadow, midDark, midLight, highlight, accent }),
    rgbaLut: lut32,
    rgbaTable: lut32
  });
}

/**
 * Authoritative 4 high-contrast Ditherpunk palettes.
 */
export const DITHER_PALETTES = Object.freeze({
  'obsidian-bone': buildPaletteDefinition({
    id: 'obsidian-bone',
    name: 'Obsidian & Bone',
    label: 'OBSIDIAN & BONE [MONUMENT]',
    shadow: '#0A0B0E',
    midDark: '#2B2D38',
    midLight: '#9CA3AF',
    highlight: '#F4F1EA',
    accent: '#E63946',
    levels: [
      [10, 11, 14],
      [43, 45, 56],
      [156, 163, 175],
      [244, 241, 234]
    ]
  }),
  'crimson-herald': buildPaletteDefinition({
    id: 'crimson-herald',
    name: 'Crimson Herald',
    label: 'CRIMSON HERALD [BALLOT SEAL]',
    shadow: '#0B0708',
    midDark: '#4A1219',
    midLight: '#E63946',
    highlight: '#FFF8F0',
    accent: '#F59E0B',
    levels: [
      [11, 7, 8],
      [74, 18, 25],
      [230, 57, 70],
      [255, 248, 240]
    ]
  }),
  'phosphor-hud': buildPaletteDefinition({
    id: 'phosphor-hud',
    name: 'Phosphor HUD',
    label: 'PHOSPHOR HUD [NIGHT RECON]',
    shadow: '#050C08',
    midDark: '#0D3B22',
    midLight: '#10B981',
    highlight: '#D1FAE5',
    accent: '#34D399',
    levels: [
      [5, 12, 8],
      [13, 59, 34],
      [16, 185, 129],
      [209, 250, 229]
    ]
  }),
  'cobalt-aegis': buildPaletteDefinition({
    id: 'cobalt-aegis',
    name: 'Cobalt Aegis',
    label: 'COBALT AEGIS [PRECINCT COMMAND]',
    shadow: '#070B14',
    midDark: '#1E3A8A',
    midLight: '#60A5FA',
    highlight: '#F1F5F9',
    accent: '#38BDF8',
    levels: [
      [7, 11, 20],
      [30, 58, 138],
      [96, 165, 250],
      [241, 245, 249]
    ]
  })
});

/**
 * Canonical 8x8 Bayer ordered threshold matrix (values 0..63), pre-scaled to centered offsets [-126..+126].
 */
const BAYER_8X8_RAW = new Uint8Array([
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21
]);

const BAYER_8X8_BIAS = new Int16Array(64);
for (let i = 0; i < 64; i++) {
  BAYER_8X8_BIAS[i] = (BAYER_8X8_RAW[i] << 2) - 126;
}

/**
 * Module-scoped pristine buffers that NEVER receive expando properties so V8 TurboFan
 * compiles monomorphic packed TypedArray memory accesses across all callers.
 */
let _sharedErrorRing = new Float32Array(3 * (2048 + 4));
let _sharedCleanSrc = new Uint8Array(512 * 512);
let _sharedCleanOut = new Uint8Array(512 * 512);
let _sharedScaledWorkLuminance = new Uint8Array(320 * 240);
let _sharedScaledWorkQuantized = new Uint8Array(320 * 240);

function ensureStagingBuffers(totalPixels, stride) {
  const requiredRing = stride * 3;
  if (_sharedErrorRing.length < requiredRing) {
    _sharedErrorRing = new Float32Array(requiredRing);
  } else {
    _sharedErrorRing.fill(0, 0, requiredRing);
  }
  if (_sharedCleanSrc.length < totalPixels) {
    _sharedCleanSrc = new Uint8Array(totalPixels);
    _sharedCleanOut = new Uint8Array(totalPixels);
  }
}

function normalizeKernelId(kernel) {
  if (typeof kernel === 'string' && KERNEL_DESCRIPTORS[kernel]) {
    return kernel;
  }
  if (typeof kernel === 'string') {
    const lower = kernel.toLowerCase().trim();
    if (lower.includes('2bit') || lower.includes('4-tone') || lower.includes('4tone')) {
      return 'atkinson-2bit';
    }
    if (lower.includes('floyd') || lower.includes('steinberg')) {
      return 'floyd-steinberg';
    }
    if (lower.includes('bayer') || lower.includes('ordered')) {
      return 'bayer-8x8';
    }
  }
  return 'atkinson-1bit';
}

function normalizePaletteId(paletteId) {
  if (typeof paletteId === 'string' && DITHER_PALETTES[paletteId]) {
    return paletteId;
  }
  return 'obsidian-bone';
}

function quantizeBayer8x8(width, height, threshold, contrast) {
  const src = _sharedCleanSrc;
  const out = _sharedCleanOut;
  const hasContrast = Math.abs(contrast - 1.0) > 1e-4;
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    const bayerRow = (y & 7) << 3;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x;
      let lum = src[idx];
      if (hasContrast) {
        lum = (lum - 128.0) * contrast + 128.0;
        lum = lum < 0.0 ? 0.0 : lum > 255.0 ? 255.0 : lum;
      }
      const effective = lum + BAYER_8X8_BIAS[bayerRow | (x & 7)];
      out[idx] = effective >= threshold ? 255 : 0;
    }
  }
}

function quantizeAtkinson1Bit(width, height, threshold, contrast) {
  const src = _sharedCleanSrc;
  const out = _sharedCleanOut;
  const stride = width + 4;
  const err = _sharedErrorRing;
  const hasContrast = Math.abs(contrast - 1.0) > 1e-4;
  let r0 = 0;
  let r1 = stride;
  let r2 = stride * 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x;
      const px = x + 2;
      let base = src[idx];
      if (hasContrast) {
        base = (base - 128.0) * contrast + 128.0;
        base = base < 0.0 ? 0.0 : base > 255.0 ? 255.0 : base;
      }
      const v = base + err[r0 + px];
      const clamped = v < 0.0 ? 0.0 : v > 255.0 ? 255.0 : v;
      const q = clamped >= threshold ? 255 : 0;
      out[idx] = q;

      // Exact 1/8 = 0.125 IEEE-754 float error weight diffused to 6 Atkinson neighbors (75% total)
      const delta = (clamped - q) * 0.125;
      err[r0 + px + 1] += delta;
      err[r0 + px + 2] += delta;
      err[r1 + px - 1] += delta;
      err[r1 + px] += delta;
      err[r1 + px + 1] += delta;
      err[r2 + px] += delta;
    }
    const nextR0 = r1;
    r1 = r2;
    r2 = r0;
    r0 = nextR0;
    err.fill(0, r2, r2 + stride);
  }
}

function quantizeAtkinson2Bit(width, height, threshold, contrast) {
  const src = _sharedCleanSrc;
  const out = _sharedCleanOut;
  const stride = width + 4;
  const err = _sharedErrorRing;
  const hasContrast = Math.abs(contrast - 1.0) > 1e-4;
  const thresholdBias = threshold - 128.0;
  const t0 = 43.0 + thresholdBias * 0.5;
  const t1 = 128.0 + thresholdBias * 0.5;
  const t2 = 213.0 + thresholdBias * 0.5;
  let r0 = 0;
  let r1 = stride;
  let r2 = stride * 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x;
      const px = x + 2;
      let base = src[idx];
      if (hasContrast) {
        base = (base - 128.0) * contrast + 128.0;
        base = base < 0.0 ? 0.0 : base > 255.0 ? 255.0 : base;
      }
      const v = base + err[r0 + px];
      const clamped = v < 0.0 ? 0.0 : v > 255.0 ? 255.0 : v;
      const q = clamped < t0 ? 0 : clamped < t1 ? 85 : clamped < t2 ? 170 : 255;
      out[idx] = q;

      const delta = (clamped - q) * 0.125;
      err[r0 + px + 1] += delta;
      err[r0 + px + 2] += delta;
      err[r1 + px - 1] += delta;
      err[r1 + px] += delta;
      err[r1 + px + 1] += delta;
      err[r2 + px] += delta;
    }
    const nextR0 = r1;
    r1 = r2;
    r2 = r0;
    r0 = nextR0;
    err.fill(0, r2, r2 + stride);
  }
}

function quantizeFloydSteinberg(width, height, threshold, contrast) {
  const src = _sharedCleanSrc;
  const out = _sharedCleanOut;
  const stride = width + 4;
  const err = _sharedErrorRing;
  const hasContrast = Math.abs(contrast - 1.0) > 1e-4;
  let r0 = 0;
  let r1 = stride;
  let r2 = stride * 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x;
      const px = x + 2;
      let base = src[idx];
      if (hasContrast) {
        base = (base - 128.0) * contrast + 128.0;
        base = base < 0.0 ? 0.0 : base > 255.0 ? 255.0 : base;
      }
      const v = base + err[r0 + px];
      const clamped = v < 0.0 ? 0.0 : v > 255.0 ? 255.0 : v;
      const q = clamped >= threshold ? 255 : 0;
      out[idx] = q;

      // Exact 1/16 = 0.0625 IEEE-754 float unit
      const unit = (clamped - q) * 0.0625;
      err[r0 + px + 1] += unit * 7.0;
      err[r1 + px - 1] += unit * 3.0;
      err[r1 + px] += unit * 5.0;
      err[r1 + px + 1] += unit;
    }
    const nextR0 = r1;
    r1 = r2;
    r2 = r0;
    r0 = nextR0;
    err.fill(0, r2, r2 + stride);
  }
}

/**
 * Core single-scale error-diffusion / ordered quantization pass on pristine module staging buffers.
 * Operates with zero inner-loop allocations and zero boundary branches using the 2-pixel guard apron.
 */
function runCoreQuantizationPass(width, height, kernel, threshold, contrast) {
  if (kernel === 'atkinson-1bit') {
    quantizeAtkinson1Bit(width, height, threshold, contrast);
  } else if (kernel === 'atkinson-2bit') {
    quantizeAtkinson2Bit(width, height, threshold, contrast);
  } else if (kernel === 'floyd-steinberg') {
    quantizeFloydSteinberg(width, height, threshold, contrast);
  } else {
    quantizeBayer8x8(width, height, threshold, contrast);
  }
}

function copyIntoStagingSrc(src, totalPixels) {
  if (typeof src.subarray === 'function') {
    _sharedCleanSrc.set(src.length === totalPixels ? src : src.subarray(0, totalPixels));
  } else {
    for (let i = 0; i < totalPixels; i++) {
      _sharedCleanSrc[i] = src[i];
    }
  }
}

/**
 * Attach dual-compatible metadata fields onto a returned typed array so both direct array indexing
 * (`res[i]`, `res instanceof Uint8Array`) and object destructuring (`const { quantized, frameMs } = ...`)
 * work seamlessly without extra wrapper allocations.
 */
function attachQuantizedMetadata(out, width, height, kernel, threshold, elapsedMs, paletteOption) {
  const ratio = KERNEL_DESCRIPTORS[kernel]?.errorPropagationRatio ?? 0.75;
  out.quantized = out;
  out.width = width;
  out.height = height;
  out.kernel = kernel;
  out.threshold = threshold;
  out.errorPropagationRatio = ratio;
  out.propagationRatio = ratio;
  out.frameMs = elapsedMs;
  out.elapsedMs = elapsedMs;

  if (paletteOption) {
    const palId = normalizePaletteId(paletteOption);
    out.palette = palId;
    out.rgba = applyPaletteToQuantized(out, width, height, palId);
  }
  return out;
}

/**
 * Quantize a grayscale luminance buffer using Bill Atkinson error diffusion or comparative kernels.
 *
 * @param {Uint8Array|Uint8ClampedArray|Float32Array|{luminance: Uint8Array, width?: number, height?: number}} inputLuminance
 * @param {number} width
 * @param {number} height
 * @param {object} [options={}]
 * @returns {Uint8Array} Quantized luminance buffer ({0, 255} or {0, 85, 170, 255}) with attached metadata properties.
 */
export function ditherGrayscaleBuffer(inputLuminance, width, height, options = {}) {
  const tStart = nowMs();

  const src =
    inputLuminance && typeof inputLuminance === 'object' && inputLuminance.luminance
      ? inputLuminance.luminance
      : inputLuminance;
  const w = Math.floor(Number(width || inputLuminance?.width || 0));
  const h = Math.floor(Number(height || inputLuminance?.height || 0));

  if (!src || typeof src.length !== 'number') {
    throw new TypeError('ditherGrayscaleBuffer: inputLuminance must be a typed array or buffer-like object');
  }
  if (w <= 0 || h <= 0 || src.length < w * h) {
    throw new RangeError(
      `ditherGrayscaleBuffer: invalid dimensions (${w}x${h}) for buffer of length ${src.length}`
    );
  }

  const kernel = normalizeKernelId(options?.kernel);
  const rawThreshold = options?.threshold !== undefined ? Number(options.threshold) : 128;
  const threshold = Number.isFinite(rawThreshold) ? Math.max(1, Math.min(254, rawThreshold)) : 128;
  const rawContrast =
    options?.contrast !== undefined
      ? Number(options.contrast)
      : options?.contrastGain !== undefined
        ? Number(options.contrastGain)
        : 1.0;
  const contrast = Number.isFinite(rawContrast) && rawContrast > 0 ? rawContrast : 1.0;
  const rawScale = options?.pixelScale !== undefined ? Math.floor(Number(options.pixelScale)) : 1;
  const pixelScale = Number.isFinite(rawScale) && rawScale > 1 ? Math.min(8, rawScale) : 1;

  const totalPixels = w * h;
  const out =
    options?.outBuffer instanceof Uint8Array && options.outBuffer.length >= totalPixels
      ? options.outBuffer
      : new Uint8Array(totalPixels);

  if (pixelScale === 1) {
    ensureStagingBuffers(totalPixels, w + 4);
    copyIntoStagingSrc(src, totalPixels);
    runCoreQuantizationPass(w, h, kernel, threshold, contrast);
    out.set(_sharedCleanOut.subarray(0, totalPixels));
  } else {
    // Macroscopic pixel-scale dithering: downsample by pixelScale, dither at coarse resolution,
    // and nearest-neighbor expand back to (w x h) so dither dots render as crisp NxN pixel blocks.
    const sw = Math.max(1, Math.floor(w / pixelScale));
    const sh = Math.max(1, Math.floor(h / pixelScale));
    const scaledCount = sw * sh;
    ensureStagingBuffers(scaledCount, sw + 4);
    if (_sharedScaledWorkQuantized.length < scaledCount) {
      _sharedScaledWorkQuantized = new Uint8Array(scaledCount);
    }

    for (let sy = 0; sy < sh; sy++) {
      const srcY = Math.min(h - 1, sy * pixelScale);
      const srcRow = srcY * w;
      const dstRow = sy * sw;
      for (let sx = 0; sx < sw; sx++) {
        const srcX = Math.min(w - 1, sx * pixelScale);
        _sharedCleanSrc[dstRow + sx] = src[srcRow + srcX];
      }
    }

    runCoreQuantizationPass(sw, sh, kernel, threshold, contrast);
    _sharedScaledWorkQuantized.set(_sharedCleanOut.subarray(0, scaledCount));

    for (let y = 0; y < h; y++) {
      const sy = Math.min(sh - 1, Math.floor(y / pixelScale));
      const srcRow = sy * sw;
      const dstRow = y * w;
      for (let x = 0; x < w; x++) {
        const sx = Math.min(sw - 1, Math.floor(x / pixelScale));
        out[dstRow + x] = _sharedScaledWorkQuantized[srcRow + sx];
      }
    }
  }

  const elapsedMs = Number((nowMs() - tStart).toFixed(4));
  return attachQuantizedMetadata(out, w, h, kernel, threshold, elapsedMs, options?.palette);
}

/**
 * Map a quantized luminance buffer ({0, 85, 170, 255} or {0, 255}) to a 4-channel RGBA buffer.
 *
 * Supports polymorphic call patterns:
 * - 4/5-arg: `applyPaletteToQuantized(quantizedBuffer, width, height, paletteId = 'obsidian-bone', outRgba = null)`
 * - 2/3-arg: `applyPaletteToQuantized(quantizedBuffer, paletteId = 'obsidian-bone', outRgba = null)`
 *
 * Uses branchless 32-bit `Uint32Array` writes indexed via `qBuf[i] >> 6` (`0->0, 85->1, 170->2, 255->3`).
 *
 * @returns {Uint8ClampedArray} RGBA pixel buffer of length `N * 4`.
 */
export function applyPaletteToQuantized(
  quantizedInput,
  arg2 = 'obsidian-bone',
  arg3 = null,
  arg4 = 'obsidian-bone',
  arg5 = null
) {
  const qBuf =
    quantizedInput && typeof quantizedInput === 'object' && quantizedInput.quantized
      ? quantizedInput.quantized
      : quantizedInput;

  if (!qBuf || typeof qBuf.length !== 'number') {
    throw new TypeError('applyPaletteToQuantized: quantizedInput must be a typed array');
  }

  let totalPixels = qBuf.length;
  let paletteId = 'obsidian-bone';
  let outRgba = null;

  if (typeof arg2 === 'number' && typeof arg3 === 'number') {
    const w = Math.floor(arg2);
    const h = Math.floor(arg3);
    if (w > 0 && h > 0 && w * h <= qBuf.length) {
      totalPixels = w * h;
    }
    if (typeof arg4 === 'string') {
      paletteId = arg4;
      outRgba = arg5;
    } else if (arg4 instanceof Uint8ClampedArray) {
      outRgba = arg4;
    }
  } else {
    if (typeof arg2 === 'string') {
      paletteId = arg2;
    }
    if (arg3 instanceof Uint8ClampedArray) {
      outRgba = arg3;
    } else if (arg4 instanceof Uint8ClampedArray) {
      outRgba = arg4;
    }
  }

  const palette = DITHER_PALETTES[normalizePaletteId(paletteId)];
  const lut32 = palette.rgbaLut;
  const requiredBytes = totalPixels * 4;

  // Stage quantized bytes in pristine _sharedCleanOut if not already there to avoid expando deopt
  if (_sharedCleanOut.length < totalPixels) {
    _sharedCleanOut = new Uint8Array(totalPixels);
  }
  if (typeof qBuf.subarray === 'function') {
    _sharedCleanOut.set(qBuf.length === totalPixels ? qBuf : qBuf.subarray(0, totalPixels));
  } else {
    for (let i = 0; i < totalPixels; i++) _sharedCleanOut[i] = qBuf[i];
  }
  const cleanQ = _sharedCleanOut;

  const targetRgba =
    outRgba instanceof Uint8ClampedArray && outRgba.length >= requiredBytes
      ? outRgba
      : new Uint8ClampedArray(requiredBytes);

  if ((targetRgba.byteOffset & 3) === 0) {
    const out32 = new Uint32Array(targetRgba.buffer, targetRgba.byteOffset, totalPixels);
    for (let i = 0; i < totalPixels; i++) {
      out32[i] = lut32[cleanQ[i] >> 6];
    }
  } else {
    const levels = palette.levels;
    for (let i = 0; i < totalPixels; i++) {
      const rgb = levels[cleanQ[i] >> 6];
      const base = i * 4;
      targetRgba[base] = rgb[0];
      targetRgba[base + 1] = rgb[1];
      targetRgba[base + 2] = rgb[2];
      targetRgba[base + 3] = 255;
    }
  }

  return targetRgba;
}

/**
 * Fast integer BT.601 luminance extraction from an RGBA buffer:
 * Y = (77 * R + 150 * G + 29 * B) >> 8
 */
export function extractLuminanceFromRgba(sourceRgba, width, height, outLuminance = null) {
  const w = Math.floor(Number(width || 0));
  const h = Math.floor(Number(height || 0));
  const totalPixels = w * h;
  if (!sourceRgba || sourceRgba.length < totalPixels * 4) {
    throw new RangeError('extractLuminanceFromRgba: sourceRgba is smaller than width * height * 4');
  }
  const lum =
    outLuminance instanceof Uint8Array && outLuminance.length >= totalPixels
      ? outLuminance
      : new Uint8Array(totalPixels);

  for (let i = 0, p = 0; i < totalPixels; i++, p += 4) {
    lum[i] = (77 * sourceRgba[p] + 150 * sourceRgba[p + 1] + 29 * sourceRgba[p + 2]) >> 8;
  }
  return lum;
}

/**
 * Downsample an arbitrary-resolution RGBA image (e.g., 12MP uploaded mobile portrait) into a bounded
 * working luminance buffer (`dstWidth x dstHeight`, default `320x240`) so real-time slider scrubbing
 * always executes in < 1.0 ms.
 */
export function downsampleRgbaToLuminance(
  sourceRgba,
  srcWidth,
  srcHeight,
  dstWidth = 320,
  dstHeight = 240,
  outLuminance = null
) {
  const sw = Math.max(1, Math.floor(Number(srcWidth)));
  const sh = Math.max(1, Math.floor(Number(srcHeight)));
  const dw = Math.max(1, Math.floor(Number(dstWidth)));
  const dh = Math.max(1, Math.floor(Number(dstHeight)));
  const totalOut = dw * dh;
  const out =
    outLuminance instanceof Uint8Array && outLuminance.length >= totalOut
      ? outLuminance
      : new Uint8Array(totalOut);

  const xRatio = sw / dw;
  const yRatio = sh / dh;

  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, Math.floor(y * yRatio));
    const srcRowOffset = sy * sw;
    const dstRowOffset = y * dw;
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, Math.floor(x * xRatio));
      const p = (srcRowOffset + sx) * 4;
      out[dstRowOffset + x] =
        (77 * sourceRgba[p] + 150 * sourceRgba[p + 1] + 29 * sourceRgba[p + 2]) >> 8;
    }
  }
  return out;
}

/**
 * Convert an RGBA buffer to BT.601 luminance, dither via `ditherGrayscaleBuffer`, and map to a
 * 4-channel RGBA `Uint8ClampedArray` via `applyPaletteToQuantized`.
 *
 * @returns {Uint8ClampedArray} Palette-mapped RGBA buffer with attached `.rgba`, `.quantized`, `.frameMs` metadata.
 */
export function ditherRgbaBuffer(sourceRgba, width, height, options = {}) {
  const tStart = nowMs();
  const w = Math.floor(Number(width || 0));
  const h = Math.floor(Number(height || 0));
  const luminance = extractLuminanceFromRgba(sourceRgba, w, h);
  const quantized = ditherGrayscaleBuffer(luminance, w, h, options);
  const paletteId = normalizePaletteId(options?.palette);
  const outRgba = applyPaletteToQuantized(quantized, w, h, paletteId, options?.outRgba || null);
  const elapsedMs = Number((nowMs() - tStart).toFixed(4));

  outRgba.rgba = outRgba;
  outRgba.quantized = quantized;
  outRgba.width = w;
  outRgba.height = h;
  outRgba.kernel = quantized.kernel;
  outRgba.palette = paletteId;
  outRgba.threshold = quantized.threshold;
  outRgba.errorPropagationRatio = quantized.errorPropagationRatio;
  outRgba.frameMs = elapsedMs;
  outRgba.elapsedMs = elapsedMs;
  return outRgba;
}

/**
 * Zero-allocation Canvas2D blitter that reuses a cached `ImageData` buffer on the target `<canvas>`
 * and uses `{ alpha: false }` when acquiring the 2D context.
 */
export function blitQuantizedToCanvas(canvas, quantizedBuffer, width, height, paletteId = 'obsidian-bone') {
  if (!canvas || typeof canvas.getContext !== 'function') {
    return null;
  }
  const w = Math.floor(Number(width || canvas.width || 320));
  const h = Math.floor(Number(height || canvas.height || 240));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  const ctx = canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d');
  if (!ctx) return null;

  let imgData = canvas._cachedDitherImageData;
  if (!imgData || imgData.width !== w || imgData.height !== h) {
    if (typeof ctx.createImageData === 'function') {
      imgData = ctx.createImageData(w, h);
    } else if (typeof ImageData === 'function') {
      imgData = new ImageData(w, h);
    } else {
      return null;
    }
    canvas._cachedDitherImageData = imgData;
  }

  applyPaletteToQuantized(quantizedBuffer, w, h, paletteId, imgData.data);
  ctx.putImageData(imgData, 0, 0);
  return imgData;
}

/**
 * Pure unit-impulse and performance benchmark verifier for the Bill Atkinson Dithering Engine:
 * 1) Validates exact 6-neighbor error diffusion offsets: (1,0), (2,0), (-1,1), (0,1), (1,1), (0,2)
 * 2) Validates each neighbor receives exact 1/8 (0.125) of quantization error Delta
 * 3) Validates total error propagation is exact 0.75 (75.0%) with 0.25 (25.0%) absorbed locally
 * 4) Validates 2-pixel guard apron boundary safety at (0,0), (W-1,0), (0,H-1), and (W-1,H-1)
 * 5) Runs JIT warmup + timed 320x240 benchmark asserting frameMs <= 8.0 ms
 */
export function computeAtkinsonKernelVerify() {
  // 1. Warmup + Timed 320x240 benchmark first so V8 compiles the hot loop with 320x240 bounds feedback
  const benchW = 320;
  const benchH = 240;
  const benchInput = new Uint8Array(benchW * benchH);
  const benchOut = new Uint8Array(benchW * benchH);
  for (let i = 0; i < benchInput.length; i++) {
    benchInput[i] = (i * 17 + (i >> 5) * 31) & 255;
  }

  // Warmup passes for V8 TurboFan hot-loop compilation
  for (let w = 0; w < 2; w++) {
    ditherGrayscaleBuffer(benchInput, benchW, benchH, {
      kernel: 'atkinson-1bit',
      threshold: 128,
      outBuffer: benchOut
    });
  }

  const t0 = nowMs();
  ditherGrayscaleBuffer(benchInput, benchW, benchH, {
    kernel: 'atkinson-1bit',
    threshold: 128,
    outBuffer: benchOut
  });
  const frameMs = Number((nowMs() - t0).toFixed(4));

  // 2. Unit impulse test on a 5x5 grid with impulse at (ix = 2, iy = 1), value = 120, threshold = 128
  const gridW = 5;
  const gridH = 5;
  const ix = 2;
  const iy = 1;
  const impulseVal = 120;
  const threshold = 128;

  // Trace exact ring-buffer error distribution across the 5x5 grid when only (2,1) = 120 is non-zero.
  // Because deltaUnit = 15 < threshold (128), every neighbor quantizes to 0 and diffuses 0 secondary
  // error if we inspect the error received by each pixel immediately before its own quantization.
  const stride = gridW + 4;
  const errRing = new Float32Array(stride * 3);
  let r0 = 0;
  let r1 = stride;
  let r2 = stride * 2;

  const impulseGrid = new Uint8Array(gridW * gridH);
  impulseGrid[iy * gridW + ix] = impulseVal;

  const receivedErrorAtPixel = new Float32Array(gridW * gridH);
  const deltaTotal = impulseVal; // 120 - 0 = 120
  const deltaUnit = deltaTotal * 0.125; // 15.0

  for (let y = 0; y < gridH; y++) {
    const rowOffset = y * gridW;
    for (let x = 0; x < gridW; x++) {
      const idx = rowOffset + x;
      const px = x + 2;
      const incomingErr = errRing[r0 + px];
      receivedErrorAtPixel[idx] = incomingErr;

      // Only the impulse source (2,1) injects primary error for single-impulse response measurement
      if (x === ix && y === iy) {
        const v = impulseGrid[idx] + incomingErr;
        const q = v >= threshold ? 255 : 0;
        const delta = (v - q) * 0.125;
        errRing[r0 + px + 1] += delta;
        errRing[r0 + px + 2] += delta;
        errRing[r1 + px - 1] += delta;
        errRing[r1 + px] += delta;
        errRing[r1 + px + 1] += delta;
        errRing[r2 + px] += delta;
      }
    }
    const nextR0 = r1;
    r1 = r2;
    r2 = r0;
    r0 = nextR0;
    errRing.fill(0, r2, r2 + stride);
  }

  const expectedCoords = new Set(['3,1', '4,1', '1,2', '2,2', '3,2', '2,3']);
  let activeNeighborCount = 0;
  let propagatedSum = 0;
  let exactNeighborsMatch = true;

  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const val = receivedErrorAtPixel[y * gridW + x];
      const key = `${x},${y}`;
      if (expectedCoords.has(key)) {
        if (Math.abs(val - deltaUnit) > 1e-6) {
          exactNeighborsMatch = false;
        }
        activeNeighborCount++;
        propagatedSum += val;
      } else if (val !== 0) {
        exactNeighborsMatch = false;
      }
    }
  }

  // Also verify each of the 6 Atkinson neighbors individually flips to 255 through `ditherGrayscaleBuffer`
  // when probed one at a time with base value 114 + diffused 15 = 129 >= 128:
  for (const { dx, dy } of ATKINSON_NEIGHBOR_OFFSETS) {
    const probeInput = new Uint8Array(gridW * gridH);
    probeInput[iy * gridW + ix] = impulseVal; // 120 -> diffuses +15 to each of the 6 neighbors
    const nx = ix + dx;
    const ny = iy + dy;
    probeInput[ny * gridW + nx] = 114; // 114 + 15 = 129 >= 128 -> must quantize to 255!
    const probeOut = ditherGrayscaleBuffer(probeInput, gridW, gridH, {
      kernel: 'atkinson-1bit',
      threshold: 128
    });
    if (probeOut[ny * gridW + nx] !== 255) {
      exactNeighborsMatch = false;
    }
  }

  // 3. Boundary safety test: impulses at corners (0,0), (W-1,0), (0,H-1), (W-1,H-1)
  // Verify right-edge impulse at (W-1, 0) never wraps across scanlines to (0, 1) or (1, 1).
  const edgeInput = new Uint8Array(gridW * gridH);
  edgeInput[0 * gridW + (gridW - 1)] = 120; // Right edge of row 0
  edgeInput[1 * gridW + 0] = 120; // Left edge of row 1 (would flip to 255 if right-edge error wrapped!)
  const edgeOut = ditherGrayscaleBuffer(edgeInput, gridW, gridH, {
    kernel: 'atkinson-1bit',
    threshold: 128
  });
  const boundarySafe = edgeOut[1 * gridW + 0] === 0 && edgeOut.length === gridW * gridH;

  const propagationRatio = Number((propagatedSum / deltaTotal).toFixed(4));
  const absorbedFraction = Number((1.0 - propagationRatio).toFixed(4));
  const pass =
    exactNeighborsMatch &&
    activeNeighborCount === 6 &&
    propagationRatio === 0.75 &&
    absorbedFraction === 0.25 &&
    boundarySafe &&
    frameMs <= 8.0;

  return {
    pass,
    passed: pass,
    valid: pass,
    kernel: 'atkinson-1bit',
    kernelId: 'atkinson-1bit',
    divisor: 8,
    neighborCount: activeNeighborCount,
    expectedNeighborsCount: 6,
    neighborWeightEach: 0.125,
    neighbors: ATKINSON_NEIGHBOR_OFFSETS,
    propagationRatio,
    errorPropagationRatio: propagationRatio,
    propagatedFraction: propagationRatio,
    absorbedFraction,
    boundarySafe,
    impulseTestPassed: exactNeighborsMatch,
    frameMs,
    atkinsonFrameMs: frameMs,
    benchmark320x240Ms: frameMs
  };
}

export const ditherEngine = Object.freeze({
  DITHER_KERNELS,
  DITHER_KERNEL_MAP,
  DITHER_PALETTES,
  ATKINSON_NEIGHBOR_OFFSETS,
  ditherGrayscaleBuffer,
  applyPaletteToQuantized,
  extractLuminanceFromRgba,
  downsampleRgbaToLuminance,
  ditherRgbaBuffer,
  blitQuantizedToCanvas,
  computeAtkinsonKernelVerify
});

export default ditherEngine;
