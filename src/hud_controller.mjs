/**
 * @file src/hud_controller.mjs
 * @description Track 1: Modern Tactical HUD Controller, Multi-Timezone November 3, 2026
 * Poll-Closing Countdown Engine, Telemetry Formatter, Hotkey State Machine, and
 * Dirty-Flagged Canvas2D Render Loop Orchestrator.
 *
 * Zero external runtime dependencies. Runs isomorphically in Node.js (v24+) and modern browsers.
 */

import {
  ditherGrayscaleBuffer as defaultDitherGrayscaleBuffer,
  ditherRgbaBuffer as defaultDitherRgbaBuffer,
  applyPaletteToQuantized as defaultApplyPaletteToQuantized,
  DITHER_PALETTES as DEFAULT_DITHER_PALETTES,
  DITHER_KERNELS as DEFAULT_DITHER_KERNELS
} from './atkinson_dither_engine.mjs';

import {
  KNIGHT_SCENES as DEFAULT_KNIGHT_SCENES,
  renderKnightSceneLuminance as defaultRenderKnightSceneLuminance,
  renderVotedCrestLuminance as defaultRenderVotedCrestLuminance,
  renderVotedCrestToCanvas as defaultRenderVotedCrestToCanvas,
  getOrnateCornerFiligreeSVG as defaultGetOrnateCornerFiligreeSVG,
  getGothicArchHeaderSVG as defaultGetGothicArchHeaderSVG,
  getKnightCrestShieldSVG as defaultGetKnightCrestShieldSVG
} from './knight_heraldry.mjs';

import {
  DEFAULT_ELECTION_DATASET,
  createCivicStore as defaultCreateCivicStore
} from './civic_store.mjs';

/**
 * Ordered list of the 6 authoritative U.S. time zones monitored on Election Day (Nov 3, 2026).
 */
export const POLL_ZONE_IDS = Object.freeze(['EST', 'CST', 'MST', 'PST', 'AKST', 'HST']);

/**
 * Ordered list of dither kernel IDs for deterministic [K]/[D] hotkey cycling.
 */
export const KERNEL_CYCLE_ORDER = Object.freeze([
  'atkinson-1bit',
  'atkinson-2bit',
  'floyd-steinberg',
  'bayer-8x8'
]);

/**
 * Ordered list of palette IDs for deterministic [1-4] hotkey selection.
 */
export const PALETTE_HOTKEY_MAP = Object.freeze({
  '1': 'obsidian-bone',
  '2': 'crimson-herald',
  '3': 'phosphor-hud',
  '4': 'cobalt-aegis'
});

/**
 * Authoritative built-in poll-closing schedule for General Election Day — Tuesday, November 3, 2026.
 * Daylight Saving Time ends on Sunday, November 1, 2026; all zones are on Standard Time.
 */
export const CANONICAL_POLL_CLOSING_ZONES = Object.freeze({
  EST: Object.freeze({
    id: 'EST',
    zoneId: 'EST',
    label: 'Eastern Standard Time (EST / UTC-5)',
    utcOffset: '-05:00',
    utcOffsetHours: -5,
    primaryClosingLocalTime: '19:00',
    primaryCloseLocal: '19:00',
    standardCloseLocal: '19:00',
    secondaryClosingLocalTime: '20:00',
    secondaryCloseLocal: '20:00',
    extendedCloseLocal: '20:00',
    closingIsoUtc: '2026-11-04T01:00:00.000Z',
    closeIsoUtc: '2026-11-04T01:00:00.000Z',
    earliestClosingIsoUtc: '2026-11-04T00:00:00.000Z',
    earlyCloseIsoUtc: '2026-11-04T00:00:00.000Z',
    representativeStates: Object.freeze(['GA', 'IN', 'KY', 'VA', 'VT', 'FL', 'NC', 'OH', 'WV', 'PA', 'MI', 'NY', 'MA']),
    states: Object.freeze(['GA', 'IN', 'KY', 'VA', 'VT', 'FL', 'NC', 'OH', 'WV', 'PA', 'MI', 'NY', 'MA']),
    inLineProtectionRule: 'If you are in line before local poll closing (19:00 or 20:00 EST) on November 3, stay in line—your right to cast a ballot is protected by law.'
  }),
  CST: Object.freeze({
    id: 'CST',
    zoneId: 'CST',
    label: 'Central Standard Time (CST / UTC-6)',
    utcOffset: '-06:00',
    utcOffsetHours: -6,
    primaryClosingLocalTime: '19:00',
    primaryCloseLocal: '19:00',
    standardCloseLocal: '19:00',
    secondaryClosingLocalTime: '20:00',
    secondaryCloseLocal: '20:00',
    extendedCloseLocal: '20:00',
    closingIsoUtc: '2026-11-04T02:00:00.000Z',
    closeIsoUtc: '2026-11-04T02:00:00.000Z',
    earliestClosingIsoUtc: '2026-11-04T01:00:00.000Z',
    earlyCloseIsoUtc: '2026-11-04T01:00:00.000Z',
    representativeStates: Object.freeze(['AL', 'MS', 'MO', 'OK', 'TN', 'TX', 'IL', 'WI', 'MN', 'AR', 'LA']),
    states: Object.freeze(['AL', 'MS', 'MO', 'OK', 'TN', 'TX', 'IL', 'WI', 'MN', 'AR', 'LA']),
    inLineProtectionRule: 'If you are in line before local poll closing (19:00 or 20:00 CST) on November 3, stay in line—your right to cast a ballot is protected by law.'
  }),
  MST: Object.freeze({
    id: 'MST',
    zoneId: 'MST',
    label: 'Mountain Standard Time (MST / UTC-7)',
    utcOffset: '-07:00',
    utcOffsetHours: -7,
    primaryClosingLocalTime: '19:00',
    primaryCloseLocal: '19:00',
    standardCloseLocal: '19:00',
    secondaryClosingLocalTime: '20:00',
    secondaryCloseLocal: '20:00',
    extendedCloseLocal: '20:00',
    closingIsoUtc: '2026-11-04T03:00:00.000Z',
    closeIsoUtc: '2026-11-04T03:00:00.000Z',
    earliestClosingIsoUtc: '2026-11-04T02:00:00.000Z',
    earlyCloseIsoUtc: '2026-11-04T02:00:00.000Z',
    representativeStates: Object.freeze(['AZ', 'CO', 'NM', 'UT', 'WY', 'MT']),
    states: Object.freeze(['AZ', 'CO', 'NM', 'UT', 'WY', 'MT']),
    inLineProtectionRule: 'If you are in line before local poll closing (19:00 or 20:00 MST) on November 3, stay in line—your right to cast a ballot is protected by law.'
  }),
  PST: Object.freeze({
    id: 'PST',
    zoneId: 'PST',
    label: 'Pacific Standard Time (PST / UTC-8)',
    utcOffset: '-08:00',
    utcOffsetHours: -8,
    primaryClosingLocalTime: '20:00',
    primaryCloseLocal: '20:00',
    standardCloseLocal: '20:00',
    secondaryClosingLocalTime: '20:00',
    secondaryCloseLocal: '20:00',
    extendedCloseLocal: '20:00',
    closingIsoUtc: '2026-11-04T04:00:00.000Z',
    closeIsoUtc: '2026-11-04T04:00:00.000Z',
    earliestClosingIsoUtc: '2026-11-04T04:00:00.000Z',
    earlyCloseIsoUtc: '2026-11-04T04:00:00.000Z',
    representativeStates: Object.freeze(['CA', 'WA', 'OR', 'NV', 'ID']),
    states: Object.freeze(['CA', 'WA', 'OR', 'NV', 'ID']),
    inLineProtectionRule: 'If you are in line before local poll closing (20:00 PST) on November 3, stay in line—your right to cast a ballot is protected by law.'
  }),
  AKST: Object.freeze({
    id: 'AKST',
    zoneId: 'AKST',
    label: 'Alaska Standard Time (AKST / UTC-9)',
    utcOffset: '-09:00',
    utcOffsetHours: -9,
    primaryClosingLocalTime: '20:00',
    primaryCloseLocal: '20:00',
    standardCloseLocal: '20:00',
    secondaryClosingLocalTime: '20:00',
    secondaryCloseLocal: '20:00',
    extendedCloseLocal: '20:00',
    closingIsoUtc: '2026-11-04T05:00:00.000Z',
    closeIsoUtc: '2026-11-04T05:00:00.000Z',
    earliestClosingIsoUtc: '2026-11-04T05:00:00.000Z',
    earlyCloseIsoUtc: '2026-11-04T05:00:00.000Z',
    representativeStates: Object.freeze(['AK']),
    states: Object.freeze(['AK']),
    inLineProtectionRule: 'If you are in line before local poll closing (20:00 AKST) on November 3, stay in line—your right to cast a ballot is protected by law.'
  }),
  HST: Object.freeze({
    id: 'HST',
    zoneId: 'HST',
    label: 'Hawaii-Aleutian Standard Time (HST / UTC-10)',
    utcOffset: '-10:00',
    utcOffsetHours: -10,
    primaryClosingLocalTime: '19:00',
    primaryCloseLocal: '19:00',
    standardCloseLocal: '19:00',
    secondaryClosingLocalTime: '19:00',
    secondaryCloseLocal: '19:00',
    extendedCloseLocal: '19:00',
    closingIsoUtc: '2026-11-04T05:00:00.000Z',
    closeIsoUtc: '2026-11-04T05:00:00.000Z',
    earliestClosingIsoUtc: '2026-11-04T05:00:00.000Z',
    earlyCloseIsoUtc: '2026-11-04T05:00:00.000Z',
    representativeStates: Object.freeze(['HI']),
    states: Object.freeze(['HI']),
    inLineProtectionRule: 'If you are in line before local poll closing (19:00 HST) on November 3, stay in line—your right to cast a ballot is protected by law.'
  })
});

/**
 * Resolves a timezone descriptor from an optional dataset or the canonical built-in table.
 * Throws a RangeError if an unknown zoneId is explicitly provided.
 *
 * @param {string} zoneId
 * @param {object|null} dataset
 * @returns {object}
 */
function resolveZoneDescriptor(zoneId = 'EST', dataset = null) {
  const normalizedId = (zoneId === undefined || zoneId === null || zoneId === '')
    ? 'EST'
    : String(zoneId).trim().toUpperCase();

  const canonical = CANONICAL_POLL_CLOSING_ZONES[normalizedId];
  const datasetZones = Array.isArray(dataset?.pollClosingZones)
    ? dataset.pollClosingZones
    : (Array.isArray(DEFAULT_ELECTION_DATASET?.pollClosingZones) ? DEFAULT_ELECTION_DATASET.pollClosingZones : null);

  let fromDataset = null;
  if (datasetZones) {
    fromDataset = datasetZones.find(
      (z) => String(z?.id || z?.zoneId || '').trim().toUpperCase() === normalizedId
    ) || null;
  }

  if (!canonical && !fromDataset) {
    throw new RangeError(
      `Unknown U.S. poll-closing time zone "${String(zoneId)}". Expected one of: ${POLL_ZONE_IDS.join(', ')}.`
    );
  }

  return {
    ...(canonical || {}),
    ...(fromDataset || {}),
    id: normalizedId,
    zoneId: normalizedId
  };
}

/**
 * Parses a Date, epoch milliseconds number, or ISO-8601 timestamp string into epoch milliseconds.
 * Fails fast with a descriptive TypeError if the input cannot be parsed.
 *
 * @param {Date|number|string} nowIsoOrEpoch
 * @returns {number}
 */
function parseEpochMs(nowIsoOrEpoch) {
  if (nowIsoOrEpoch instanceof Date) {
    const ms = nowIsoOrEpoch.getTime();
    if (!Number.isFinite(ms)) {
      throw new TypeError('Invalid Date instance passed to computePollCountdown.');
    }
    return ms;
  }
  if (typeof nowIsoOrEpoch === 'number') {
    if (!Number.isFinite(nowIsoOrEpoch)) {
      throw new TypeError(`Non-finite epoch timestamp passed to computePollCountdown: ${String(nowIsoOrEpoch)}`);
    }
    return nowIsoOrEpoch;
  }
  if (typeof nowIsoOrEpoch === 'string' && nowIsoOrEpoch.trim().length > 0) {
    const ms = Date.parse(nowIsoOrEpoch);
    if (!Number.isFinite(ms)) {
      throw new TypeError(`Unparseable ISO timestamp passed to computePollCountdown: "${nowIsoOrEpoch}"`);
    }
    return ms;
  }
  throw new TypeError(
    `computePollCountdown requires a valid ISO-8601 string, finite epoch number, or Date instance (received ${typeof nowIsoOrEpoch}).`
  );
}

/**
 * Computes exact remaining time to local poll closing on Tuesday, November 3, 2026
 * for the requested U.S. time zone (`EST`, `CST`, `MST`, `PST`, `AKST`, `HST`).
 *
 * Strictly clamps post-close values at 00:00:00 (never negative) and transitions status
 * deterministically through:
 * - 'POLLS_OPEN_ACTIVE' (> 60 minutes remaining)
 * - 'FINAL_HOUR_CRITICAL' (0 < remaining <= 60 minutes)
 * - 'POLLS_CLOSED_HOLD_THE_LINE' (remaining <= 0)
 *
 * @param {string|number|Date} nowIsoOrEpoch
 * @param {string} [zoneId='EST']
 * @param {object|null} [dataset=null]
 * @returns {object}
 */
export function computePollCountdown(nowIsoOrEpoch, zoneId = 'EST', dataset = null) {
  const nowMs = parseEpochMs(nowIsoOrEpoch);
  const zone = resolveZoneDescriptor(zoneId, dataset);
  const canonical = CANONICAL_POLL_CLOSING_ZONES[zone.zoneId] || {};

  const closeIsoUtc = zone.closingIsoUtc || zone.closeIsoUtc || canonical.closingIsoUtc;
  const closeMs = Date.parse(closeIsoUtc);
  if (!Number.isFinite(closeMs)) {
    throw new Error(`Invalid closingIsoUtc "${String(closeIsoUtc)}" for zone ${zone.zoneId}`);
  }

  // Standard 14-hour Election Day polling window (e.g. 06:00 to 20:00 local)
  const pollingWindowMs = 14 * 3600 * 1000;
  const openMs = closeMs - pollingWindowMs;
  const rawDeltaMs = closeMs - nowMs;

  const remainingMs = Math.max(0, rawDeltaMs);
  const remainingSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const formattedClock = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  let status;
  let isClosed;
  let statusBadge;
  let statusBanner;

  if (rawDeltaMs <= 0) {
    status = 'POLLS_CLOSED_HOLD_THE_LINE';
    isClosed = true;
    statusBadge = 'HOLD THE LINE // IN-QUEUE RIGHT ACTIVE';
    statusBanner = 'HOLD THE LINE // IN-QUEUE RIGHT ACTIVE — STAY IN LINE IF QUEUED BEFORE CLOSE';
  } else if (rawDeltaMs <= 3600 * 1000) {
    status = 'FINAL_HOUR_CRITICAL';
    isClosed = false;
    statusBadge = 'FINAL HOUR CRITICAL // ENTER QUEUE NOW';
    statusBanner = 'FINAL HOUR CRITICAL // GET IN LINE BEFORE POLL CLOSE';
  } else {
    status = 'POLLS_OPEN_ACTIVE';
    isClosed = false;
    statusBadge = 'POLLS OPEN // ACTIVE BALLOT WINDOW';
    statusBanner = 'POLLS OPEN // ACTIVE VOTING WINDOW';
  }

  const elapsedRatio = Math.min(1, Math.max(0, (nowMs - openMs) / pollingWindowMs));
  const percentDayElapsed = Math.round(elapsedRatio * 1000) / 10;

  const primaryLocal = zone.primaryClosingLocalTime || zone.primaryCloseLocal || zone.standardCloseLocal || '19:00';
  const secondaryLocal = zone.secondaryClosingLocalTime || zone.secondaryCloseLocal || zone.extendedCloseLocal || '20:00';
  const closeLocalLabel = primaryLocal === secondaryLocal
    ? `${secondaryLocal} ${zone.zoneId}`
    : `${primaryLocal}/${secondaryLocal} ${zone.zoneId}`;

  const statesList = zone.representativeStates || zone.states || zone.sampleStates || canonical.representativeStates || [];
  const inLineMandate = zone.inLineProtectionRule || zone.inLineRule || canonical.inLineProtectionRule ||
    'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.';

  return {
    id: zone.zoneId,
    zoneId: zone.zoneId,
    label: zone.label || canonical.label || zone.zoneId,
    utcOffset: zone.utcOffset || canonical.utcOffset || '-05:00',
    utcOffsetHours: zone.utcOffsetHours ?? canonical.utcOffsetHours ?? -5,
    electionDate: '2026-11-03',
    status,
    isClosed,
    remainingMs,
    remainingSeconds,
    totalRemainingSeconds: remainingSeconds,
    hours,
    minutes,
    seconds,
    formatted: formattedClock,
    formattedClock,
    statusBadge,
    statusBanner,
    statusBannerText: statusBanner,
    pctElapsed: percentDayElapsed,
    percentDayElapsed,
    dayProgressPercent: percentDayElapsed,
    elapsedPercentage: percentDayElapsed,
    closingTimeLocal: secondaryLocal,
    primaryClosingLocalTime: primaryLocal,
    secondaryClosingLocalTime: secondaryLocal,
    closeLocalLabel,
    closingIsoUtc: closeIsoUtc,
    inLineRightActive: true,
    inLineRightMandate: inLineMandate,
    representativeStates: statesList,
    states: statesList
  };
}

/**
 * Computes November 3, 2026 poll-closing countdowns across all 6 U.S. time zones
 * (`EST`, `CST`, `MST`, `PST`, `AKST`, `HST`).
 *
 * @param {string|number|Date} [nowIsoOrEpoch=Date.now()]
 * @param {object|null} [dataset=null]
 * @returns {Array<object>}
 */
export function computeAllZoneCountdowns(nowIsoOrEpoch = Date.now(), dataset = null) {
  return POLL_ZONE_IDS.map((zoneId) => computePollCountdown(nowIsoOrEpoch, zoneId, dataset));
}

export const computeAllZonesCountdown = computeAllZoneCountdowns;

/**
 * Resolves the chivalric rank title for a given number of completed Readiness Gauntlet steps.
 *
 * @param {number} count
 * @returns {string}
 */
function resolveRankFromSteps(count) {
  if (count >= 5) return 'Sovereign Champion of November III';
  if (count === 4) return 'Guardian of the Queue (Order III)';
  if (count === 3) return 'Justiciar of the Warrant (Order II)';
  if (count >= 1) return 'Scout of the Precinct (Order I)';
  return 'Initiate of the Roll';
}

/**
 * Formats tactical HUD telemetry lines and attaches structured readout properties.
 *
 * Dual-Compatible Return Contract:
 * Returns an Array of 8 formatted HUD strings (`lines[0..7]`) AND attaches
 * `.sysDate`, `.kernelCode`, `.kernelLabel`, `.kernelReadout`, `.errorPropText`,
 * `.errorPropLabel`, `.errorPropagation`, `.frameLatencyText`, `.frameLatencyLabel`,
 * `.frameLatency`, `.aegisRank`, `.aegisRankLabel`, `.readinessPercentage`,
 * `.readinessIndex`, `.ballotLockRatio`, `.ballotLockLabel`, `.storageMode`,
 * `.storageModeLabel`, `.storageStatus`, and `.summaryLine` directly onto the Array instance.
 *
 * @param {object} [stateOrStore={}]
 * @param {object} [maybeMetricsOrStats={}]
 * @param {object} [maybeDitherStats={}]
 * @returns {Array<string> & object}
 */
export function formatHudTelemetryReadout(
  stateOrStore = {},
  maybeMetricsOrStats = {},
  maybeDitherStats = {}
) {
  const rawSnapshot = typeof stateOrStore?.getState === 'function'
    ? stateOrStore.getState()
    : (stateOrStore || {});

  const nestedState = rawSnapshot.state || rawSnapshot;

  // Detect whether 2-arg (state, ditherStats) or 3-arg (state, derivedMetrics, ditherStats) was passed
  const secondArgLooksLikeMetrics = Boolean(
    maybeMetricsOrStats &&
    typeof maybeMetricsOrStats === 'object' &&
    ('readinessPercentage' in maybeMetricsOrStats ||
      'completedStepCount' in maybeMetricsOrStats ||
      'unlockedKnightRank' in maybeMetricsOrStats)
  );

  const explicitMetrics = secondArgLooksLikeMetrics ? maybeMetricsOrStats : {};
  const ditherStats = secondArgLooksLikeMetrics
    ? (maybeDitherStats || {})
    : (maybeMetricsOrStats || {});

  const ditherConfig = rawSnapshot.ditherConfig || rawSnapshot.studio || nestedState.ditherConfig || nestedState.studio || {};
  const kernelId = String(
    ditherStats.kernel || ditherConfig.kernel || 'atkinson-1bit'
  ).toLowerCase();

  let kernelCode = 'ATKINSON_6x1/8';
  let errorPropText = '75.0%';
  if (kernelId === 'atkinson-2bit') {
    kernelCode = 'ATKINSON_2BIT_6x1/8';
    errorPropText = '75.0%';
  } else if (kernelId === 'floyd-steinberg') {
    kernelCode = 'FLOYD_STEINBERG_16/16';
    errorPropText = '100.0%';
  } else if (kernelId === 'bayer-8x8') {
    kernelCode = 'ORDERED_BAYER_8x8';
    errorPropText = '0.0% (MATRIX)';
  }

  const rawFrameMs = Number.isFinite(ditherStats.frameMs)
    ? ditherStats.frameMs
    : (Number.isFinite(ditherStats.elapsedMs) ? ditherStats.elapsedMs : 0.80);
  const frameMsFormatted = Math.max(0.01, rawFrameMs).toFixed(2);

  const metrics = {
    ...(rawSnapshot.metrics || nestedState.metrics || {}),
    ...explicitMetrics
  };

  const completedSteps = Array.isArray(rawSnapshot.completedSteps)
    ? rawSnapshot.completedSteps
    : (Array.isArray(nestedState.completedSteps) ? nestedState.completedSteps : []);
  const completedCount = Number.isFinite(metrics.completedStepCount)
    ? metrics.completedStepCount
    : completedSteps.length;

  const readinessPercentage = Number.isFinite(metrics.readinessPercentage)
    ? metrics.readinessPercentage
    : Math.min(100, Math.max(0, completedCount * 20));

  const aegisRank = metrics.unlockedKnightRank || resolveRankFromSteps(completedCount);

  const ballotSelections = rawSnapshot.ballotSelections || nestedState.ballotSelections || {};
  const lockedContestsCount = Number.isFinite(metrics.ballotCompletionCount)
    ? metrics.ballotCompletionCount
    : Object.values(ballotSelections).filter((v) => v && v !== 'UNDECIDED').length;
  const totalContestsCount = Number.isFinite(metrics.totalBallotContests)
    ? metrics.totalBallotContests
    : 6;
  const ballotLockRatio = metrics.ballotLockRatio || `${lockedContestsCount}/${totalContestsCount}`;

  const storageMode = rawSnapshot.storageMode || nestedState.storageMode || 'LOCAL_STORAGE';

  const lines = [
    'SYS_DATE: 2026-11-03 // ELECTION_DAY',
    `KERNEL: ${kernelCode}`,
    `ERR_PROP: ${errorPropText}`,
    `FRAME_LATENCY_MS: ${frameMsFormatted} ms`,
    `AEGIS_RANK: ${aegisRank}`,
    `VOTER_READINESS_INDEX: ${readinessPercentage}%`,
    `BALLOT_LOCK_RATIO: ${ballotLockRatio}`,
    `STORAGE_MODE: ${storageMode}`
  ];

  const summaryLine = lines.join(' | ');

  Object.assign(lines, {
    lines,
    sysDate: 'SYS_DATE: 2026-11-03 // ELECTION_DAY',
    sysDateShort: '2026-11-03 // ELECTION_DAY',
    kernel: kernelId,
    kernelCode,
    kernelLabel: kernelCode,
    kernelReadout: `KERNEL: ${kernelCode}`,
    errorPropText,
    errorPropLabel: errorPropText,
    errorPropagation: `ERR_PROP: ${errorPropText}`,
    frameMs: Number(frameMsFormatted),
    frameLatencyText: `${frameMsFormatted} ms`,
    frameLatencyLabel: `${frameMsFormatted} ms`,
    frameLatency: `FRAME_MS: ${frameMsFormatted}ms`,
    aegisRank,
    aegisRankLabel: `AEGIS_RANK: ${aegisRank}`,
    completedStepCount: completedCount,
    readinessPercentage,
    readinessIndex: `VOTER_READINESS_INDEX: ${readinessPercentage}%`,
    lockedContestsCount,
    totalContestsCount,
    ballotLockRatio,
    ballotLockLabel: `BALLOT_LOCK_RATIO: ${ballotLockRatio}`,
    storageMode,
    storageModeLabel: storageMode,
    storageStatus: `STORAGE_MODE: ${storageMode}`,
    summaryLine
  });

  return lines;
}

/**
 * Applies a dither studio parameter update to a store instance using whichever
 * method signature the store exposes.
 *
 * @param {object} store
 * @param {object} patch
 */
function applyStudioPatchToStore(store, patch) {
  if (!store) return;
  if (typeof store.updateDitherConfig === 'function') {
    store.updateDitherConfig(patch);
  } else if (typeof store.setStudioParams === 'function') {
    store.setStudioParams(patch);
  } else if (typeof store.updateState === 'function') {
    const cur = store.getState?.() || {};
    const curStudio = cur.ditherConfig || cur.studio || cur.state?.studio || {};
    const merged = { ...curStudio, ...patch };
    store.updateState({ ditherConfig: merged, studio: merged });
  }
}

/**
 * Deterministic HUD keyboard shortcut dispatcher.
 *
 * Supported hotkeys:
 * - '1' .. '4' : Switch active Ditherpunk palette ('obsidian-bone', 'crimson-herald', 'phosphor-hud', 'cobalt-aegis')
 * - 'k' / 'K' / 'd' / 'D' : Cycle active dither kernel ('atkinson-1bit' -> 'atkinson-2bit' -> 'floyd-steinberg' -> 'bayer-8x8')
 * - 'l' / 'L' : Toggle dynamic torch light orbit ('animateLight')
 * - 'h' / 'H' : Toggle HUD tactical grid overlay
 * - 'v' / 'V' : Mint voter's November 3 Civic Seal
 *
 * Ignores key events originating inside editable form elements (`<input>`, `<textarea>`, `<select>`, `contentEditable`).
 *
 * @param {string|KeyboardEvent|object} keyOrEvent
 * @param {object} store
 * @param {object} [callbacks={}]
 * @returns {object}
 */
export function dispatchHudHotkey(keyOrEvent, store, callbacks = {}) {
  if (keyOrEvent && typeof keyOrEvent === 'object') {
    if (keyOrEvent.metaKey || keyOrEvent.ctrlKey || keyOrEvent.altKey) {
      return {
        handled: false,
        action: null,
        state: store?.getState?.() || null
      };
    }
    const target = keyOrEvent.target || keyOrEvent.srcElement;
    if (target && typeof target === 'object') {
      const tagName = String(target.tagName || '').toUpperCase();
      if (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target.isContentEditable === true
      ) {
        return {
          handled: false,
          action: null,
          ignoredInputFocus: true,
          state: store?.getState?.() || null
        };
      }
    }
  }

  const rawKey = typeof keyOrEvent === 'string'
    ? keyOrEvent
    : String(keyOrEvent?.key || '');

  if (!rawKey) {
    return { handled: false, action: null, state: store?.getState?.() || null };
  }

  const snap = store?.getState?.() || {};
  const ditherConfig = snap.ditherConfig || snap.studio || snap.state?.studio || {
    kernel: 'atkinson-1bit',
    palette: 'obsidian-bone',
    animateLight: true
  };

  // [1-4] Palette Selection
  if (Object.prototype.hasOwnProperty.call(PALETTE_HOTKEY_MAP, rawKey)) {
    const nextPalette = PALETTE_HOTKEY_MAP[rawKey];
    applyStudioPatchToStore(store, { palette: nextPalette });
    callbacks.onPaletteChange?.(nextPalette);
    return {
      handled: true,
      key: rawKey,
      action: 'SET_PALETTE',
      palette: nextPalette,
      state: store?.getState?.() || null
    };
  }

  const lowerKey = rawKey.toLowerCase();

  // [K] or [D] Cycle Dither Kernel
  if (lowerKey === 'k' || lowerKey === 'd') {
    const currentKernel = ditherConfig.kernel || 'atkinson-1bit';
    const idx = KERNEL_CYCLE_ORDER.indexOf(currentKernel);
    const nextKernel = KERNEL_CYCLE_ORDER[(idx + 1) % KERNEL_CYCLE_ORDER.length];
    applyStudioPatchToStore(store, { kernel: nextKernel });
    callbacks.onKernelChange?.(nextKernel);
    return {
      handled: true,
      key: rawKey,
      action: 'CYCLE_KERNEL',
      kernel: nextKernel,
      state: store?.getState?.() || null
    };
  }

  // [L] Toggle Torch Light Orbit
  if (lowerKey === 'l') {
    const currentAnimate = ditherConfig.animateLight !== false;
    const nextAnimate = !currentAnimate;
    applyStudioPatchToStore(store, { animateLight: nextAnimate });
    callbacks.onToggleLight?.(nextAnimate);
    return {
      handled: true,
      key: rawKey,
      action: 'TOGGLE_LIGHT_ORBIT',
      animateLight: nextAnimate,
      state: store?.getState?.() || null
    };
  }

  // [H] Toggle Tactical HUD Overlay
  if (lowerKey === 'h') {
    const toggled = callbacks.onToggleHudOverlay ? callbacks.onToggleHudOverlay() : true;
    return {
      handled: true,
      key: rawKey,
      action: 'TOGGLE_HUD_OVERLAY',
      hudOverlayVisible: toggled,
      state: store?.getState?.() || null
    };
  }

  // [V] Mint November 3 Civic Seal
  if (lowerKey === 'v') {
    if (typeof store?.mintCivicSeal === 'function') {
      store.mintCivicSeal();
    } else if (typeof store?.mintSeal === 'function') {
      store.mintSeal();
    } else if (typeof store?.setCrestParams === 'function') {
      store.setCrestParams({ sealMinted: true, mintedAtIso: new Date().toISOString() });
    }
    callbacks.onMintCrest?.();
    return {
      handled: true,
      key: rawKey,
      action: 'MINT_CIVIC_SEAL',
      state: store?.getState?.() || null
    };
  }

  return {
    handled: false,
    key: rawKey,
    action: null,
    state: store?.getState?.() || null
  };
}

/**
 * Initializes the interactive Ornate Knights + Bill Atkinson Ditherpunk + Tactical HUD
 * browser portal controller.
 *
 * Binds multi-timezone November 3, 2026 poll-closing countdowns, 6 live dithered `<canvas>`
 * plates, Gothic SVG heraldry injection, Dither Forge parameter controls, Readiness Gauntlet
 * checkboxes, Sample Ballot choice matrix, "I VOTED — NOV 3" Crest Studio PNG export,
 * keyboard hotkeys, and `prefers-reduced-motion` accessibility hooks.
 *
 * @param {object} [options={}]
 * @returns {object} Controller handle with `{ store, renderAllCanvases, updateCountdowns, dispatchKey, destroy }`
 */
export function initHudController(options = {}) {
  const isElementOrDoc = options && typeof options === 'object' && typeof options.querySelector === 'function';
  const config = isElementOrDoc ? { rootElement: options } : (options || {});

  const doc = config.rootDocument ||
    config.rootElement?.ownerDocument ||
    (typeof config.rootElement?.getElementById === 'function' ? config.rootElement : null) ||
    (typeof document !== 'undefined' ? document : null);

  const root = config.rootElement || doc?.documentElement || doc;

  // Clean up any prior controller bound to the same root or document
  if (root && typeof root === 'object' && root.__knightsHudController) {
    try {
      root.__knightsHudController.destroy();
    } catch {
      // Ignore cleanup errors on stale instance
    }
  }
  if (doc && typeof doc === 'object' && doc.__knightsHudController) {
    try {
      doc.__knightsHudController.destroy();
    } catch {
      // Ignore cleanup errors on stale instance
    }
  }

  const dataset = config.dataset || DEFAULT_ELECTION_DATASET;
  const store = config.store || defaultCreateCivicStore({ initialDataset: dataset });

  const ditherGrayscale = config.ditherEngine?.ditherGrayscaleBuffer || defaultDitherGrayscaleBuffer;
  const applyPalette = config.ditherEngine?.applyPaletteToQuantized || defaultApplyPaletteToQuantized;

  const renderSceneLum = config.knightHeraldry?.renderKnightSceneLuminance || defaultRenderKnightSceneLuminance;
  const renderCrestLum = config.knightHeraldry?.renderVotedCrestLuminance || defaultRenderVotedCrestLuminance;
  const renderCrestCanvas = config.knightHeraldry?.renderVotedCrestToCanvas || defaultRenderVotedCrestToCanvas;
  const getCornerSvg = config.knightHeraldry?.getOrnateCornerFiligreeSVG || defaultGetOrnateCornerFiligreeSVG;
  const getArchSvg = config.knightHeraldry?.getGothicArchHeaderSVG || defaultGetGothicArchHeaderSVG;
  const getShieldSvg = config.knightHeraldry?.getKnightCrestShieldSVG || defaultGetKnightCrestShieldSVG;

  // Respect prefers-reduced-motion: reduce
  let reducedMotion = false;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotion = Boolean(mq && mq.matches);
      if (reducedMotion) {
        applyStudioPatchToStore(store, { animateLight: false });
      }
    } catch {
      reducedMotion = false;
    }
  }

  let hudOverlayVisible = true;
  let visorOpen = false;
  let lastHeroFrameMs = 0.78;
  let customHeroLuminance = null;
  const customHeroWidth = 320;
  const customHeroHeight = 240;

  // Cache of procedural luminance buffers keyed by `${sceneId}:${w}x${h}:${quantizedAngle}:${visorOpen}`
  const luminanceCache = new Map();
  // Reusable ImageData cache keyed by canvas element
  const canvasImageDataCache = new WeakMap();

  const q = (selector) => {
    if (root && typeof root.querySelector === 'function') {
      const found = root.querySelector(selector);
      if (found) return found;
    }
    if (doc && doc !== root && typeof doc.querySelector === 'function') {
      return doc.querySelector(selector);
    }
    return null;
  };

  const qa = (selector) => {
    const results = [];
    const seen = new Set();
    if (root && typeof root.querySelectorAll === 'function') {
      for (const el of root.querySelectorAll(selector)) {
        if (!seen.has(el)) {
          seen.add(el);
          results.push(el);
        }
      }
    }
    if (doc && doc !== root && typeof doc.querySelectorAll === 'function') {
      for (const el of doc.querySelectorAll(selector)) {
        if (!seen.has(el)) {
          seen.add(el);
          results.push(el);
        }
      }
    }
    return results;
  };

  /**
   * Synchronizes the active palette attribute on `<html>` and `<body>`.
   */
  function syncPaletteDomAttribute(paletteId) {
    const validPalette = DEFAULT_DITHER_PALETTES?.[paletteId] ? paletteId : 'obsidian-bone';
    if (doc?.documentElement?.setAttribute) {
      doc.documentElement.setAttribute('data-palette', validPalette);
    }
    if (doc?.body?.setAttribute) {
      doc.body.setAttribute('data-palette', validPalette);
    }
  }

  /**
   * Injects Gothic SVG filigree into designated containers if present.
   */
  function injectHeraldicSvgOrnaments() {
    if (!doc) return;
    const archContainer = q('#hero-gothic-arch-svg');
    if (archContainer && !archContainer.dataset?.hydratedSvg && !archContainer.querySelector?.('svg')) {
      archContainer.innerHTML = getArchSvg({
        title: 'ORDER OF THE CIVIC AEGIS',
        subtitle: 'NOVEMBER III BALLOT COMMAND // 2026-11-03'
      });
      if (archContainer.dataset) archContainer.dataset.hydratedSvg = 'true';
    }

    for (const el of qa('[data-corner-filigree]')) {
      if (!el.dataset?.hydratedSvg) {
        const corner = el.getAttribute('data-corner-filigree') || 'top-left';
        el.innerHTML = getCornerSvg(corner, { size: 36 });
        if (el.dataset) el.dataset.hydratedSvg = 'true';
      }
    }

    for (const el of qa('.section-filigree-corners, [data-filigree-target]')) {
      if (!el.dataset?.hydratedSvg && (!el.children || el.children.length === 0)) {
        const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        el.innerHTML = corners
          .map((c) => `<div class="corner-ornament ${c}">${getCornerSvg('top-left', { size: 36 })}</div>`)
          .join('');
        if (el.dataset) el.dataset.hydratedSvg = 'true';
      }
    }

    for (const el of qa('[data-order-shield], [data-shield-order]')) {
      if (!el.dataset?.hydratedSvg) {
        const orderId = el.getAttribute('data-order-shield') || el.getAttribute('data-shield-order') || 'order-1-recon';
        el.innerHTML = getShieldSvg(orderId, 56, 66);
        if (el.dataset) el.dataset.hydratedSvg = 'true';
      }
    }
  }

  /**
   * Renders a single procedural or custom luminance buffer onto a target `<canvas>`
   * using the active Bill Atkinson / comparative dither kernel and palette.
   */
  function renderDitheredCanvas(canvasEl, sceneId, studioConfig) {
    if (!canvasEl || typeof canvasEl.getContext !== 'function') return 0;
    const width = Number(canvasEl.width) || 320;
    const height = Number(canvasEl.height) || 240;
    const ctx = canvasEl.getContext('2d', { alpha: false });
    if (!ctx) return 0;

    const kernel = studioConfig.kernel || 'atkinson-1bit';
    const palette = studioConfig.palette || 'obsidian-bone';
    const threshold = Number.isFinite(Number(studioConfig.threshold)) ? Number(studioConfig.threshold) : 128;
    const pixelScale = Number.isFinite(Number(studioConfig.pixelScale)) ? Math.max(1, Math.min(4, Number(studioConfig.pixelScale))) : 1;
    const lightAngle = Number.isFinite(Number(studioConfig.lightAngle)) ? Number(studioConfig.lightAngle) : 0.65;

    let lumBuffer;
    if (sceneId === 'hero-guardian' && customHeroLuminance && customHeroWidth === width && customHeroHeight === height) {
      lumBuffer = customHeroLuminance;
    } else {
      const angleKey = sceneId === 'hero-guardian' ? lightAngle.toFixed(2) : '0.65';
      const visorKey = sceneId === 'hero-guardian' ? String(visorOpen) : 'false';
      const cacheKey = `${sceneId}:${width}x${height}:${angleKey}:${visorKey}`;
      lumBuffer = luminanceCache.get(cacheKey);
      if (!lumBuffer) {
        lumBuffer = renderSceneLum(sceneId, width, height, {
          lightAngle: sceneId === 'hero-guardian' ? lightAngle : 0.65,
          visorOpen: sceneId === 'hero-guardian' ? visorOpen : false
        });
        if (luminanceCache.size > 24) {
          const oldestKey = luminanceCache.keys().next().value;
          luminanceCache.delete(oldestKey);
        }
        luminanceCache.set(cacheKey, lumBuffer);
      }
    }

    // Optional pixel-scale downsampling/upsampling for retro 1x/2x/3x pixel blocks
    let workingLum = lumBuffer;
    if (pixelScale > 1) {
      const scaledLum = new Uint8Array(width * height);
      for (let y = 0; y < height; y += pixelScale) {
        for (let x = 0; x < width; x += pixelScale) {
          const sample = lumBuffer[y * width + x];
          for (let dy = 0; dy < pixelScale && y + dy < height; dy++) {
            const rowOffset = (y + dy) * width;
            for (let dx = 0; dx < pixelScale && x + dx < width; dx++) {
              scaledLum[rowOffset + x + dx] = sample;
            }
          }
        }
      }
      workingLum = scaledLum;
    }

    const quantized = ditherGrayscale(workingLum, width, height, {
      kernel,
      threshold,
      palette
    });

    let imgData = canvasImageDataCache.get(canvasEl);
    if (!imgData || imgData.width !== width || imgData.height !== height) {
      imgData = typeof ctx.createImageData === 'function'
        ? ctx.createImageData(width, height)
        : { width, height, data: new Uint8ClampedArray(width * height * 4) };
      canvasImageDataCache.set(canvasEl, imgData);
    }

    applyPalette(quantized, width, height, palette, imgData.data);
    if (typeof ctx.putImageData === 'function') {
      ctx.putImageData(imgData, 0, 0);
    }

    return Number.isFinite(quantized?.frameMs) ? quantized.frameMs : 0.75;
  }

  /**
   * Renders the "I VOTED — NOVEMBER 3, 2026" heraldic crest canvas.
   */
  function renderVotedCrestStudioCanvas(stateSnapshot) {
    const crestCanvas = q('#canvas-voted-crest');
    if (!crestCanvas) return;

    const studio = stateSnapshot.ditherConfig || stateSnapshot.studio || {};
    const crest = stateSnapshot.crestConfig || stateSnapshot.crest || {};

    const callsign = crest.callsign || 'KNIGHT OF PRECINCT 04';
    const orderId = crest.orderId || 'order-4-champion';
    const kernel = studio.kernel || crest.kernel || 'atkinson-1bit';
    const palette = studio.palette || crest.palette || 'obsidian-bone';
    const threshold = Number.isFinite(Number(studio.threshold)) ? Number(studio.threshold) : 128;

    if (typeof renderCrestCanvas === 'function') {
      const crestRes = renderCrestCanvas(
        crestCanvas,
        {
          callsign,
          orderId,
          kernel,
          palette,
          threshold,
          sealMinted: Boolean(crest.sealMinted)
        },
        {
          ditherGrayscaleBuffer: ditherGrayscale,
          applyPaletteToQuantized: applyPalette
        }
      );
      if (crestRes?.rgba && typeof crestCanvas.getContext === 'function') {
        const width = Number(crestCanvas.width) || 360;
        const height = Number(crestCanvas.height) || 360;
        const ctx = crestCanvas.getContext('2d');
        if (ctx && typeof ctx.putImageData === 'function' && crestRes.rgba.length === width * height * 4) {
          let imgData = canvasImageDataCache.get(crestCanvas);
          if (!imgData || imgData.width !== width || imgData.height !== height) {
            imgData = typeof ctx.createImageData === 'function'
              ? ctx.createImageData(width, height)
              : { width, height, data: new Uint8ClampedArray(width * height * 4) };
            canvasImageDataCache.set(crestCanvas, imgData);
          }
          imgData.data.set(crestRes.rgba);
          ctx.putImageData(imgData, 0, 0);
        }
      }
    } else {
      const width = Number(crestCanvas.width) || 360;
      const height = Number(crestCanvas.height) || 360;
      const lum = renderCrestLum({ callsign, orderId }, width, height);
      const qBuf = ditherGrayscale(lum, width, height, { kernel, threshold });
      const ctx = crestCanvas.getContext?.('2d');
      if (ctx && typeof ctx.createImageData === 'function') {
        const imgData = ctx.createImageData(width, height);
        applyPalette(qBuf, width, height, palette, imgData.data);
        ctx.putImageData(imgData, 0, 0);
      }
    }
  }

  /**
   * Renders all 6 dithered canvases (#canvas-hero-knight, #canvas-order-1..4, #canvas-voted-crest).
   */
  function renderAllCanvases() {
    if (!doc) return;
    const snap = store.getState();
    const studio = snap.ditherConfig || snap.studio || {};

    const heroCanvas = q('#canvas-hero-knight');
    if (heroCanvas) {
      lastHeroFrameMs = renderDitheredCanvas(heroCanvas, 'hero-guardian', studio);
    }

    const orderScenes = [
      { id: '#canvas-order-1', scene: 'order-1-recon' },
      { id: '#canvas-order-2', scene: 'order-2-warrant' },
      { id: '#canvas-order-3', scene: 'order-3-queue' },
      { id: '#canvas-order-4', scene: 'order-4-champion' }
    ];

    for (const item of orderScenes) {
      const c = q(item.id);
      if (c) {
        const sceneAttr = c.getAttribute?.('data-scene') || item.scene;
        renderDitheredCanvas(c, sceneAttr, studio);
      }
    }

    renderVotedCrestStudioCanvas(snap);
    updateTelemetryDom(snap);
  }

  /**
   * Updates all HUD telemetry readouts, Readiness Gauntlet progress indicators,
   * Sample Ballot lock counters, and Dither Forge active control states.
   */
  function updateTelemetryDom(stateSnapshot = store.getState()) {
    if (!doc) return;
    const readout = formatHudTelemetryReadout(stateSnapshot, { frameMs: lastHeroFrameMs });
    const studio = stateSnapshot.ditherConfig || stateSnapshot.studio || {};
    const crest = stateSnapshot.crestConfig || stateSnapshot.crest || {};

    syncPaletteDomAttribute(studio.palette || 'obsidian-bone');

    const setTxt = (selector, text) => {
      for (const el of qa(selector)) {
        el.textContent = text;
      }
    };

    const setPillStrongOrText = (selector, prefixText, strongText) => {
      for (const el of qa(selector)) {
        const strongEl = typeof el.querySelector === 'function' ? el.querySelector('strong') : null;
        if (strongEl) {
          strongEl.textContent = strongText;
        } else {
          el.textContent = `${prefixText}${strongText}`;
        }
      }
    };

    // Top HUD bar pills & generic telemetry selectors
    setTxt('[data-hud-kernel], #hud-kernel-readout', readout.kernelReadout);
    setTxt('#hud-val-kernel', readout.kernelCode);
    setTxt('[data-hud-err-prop], #hud-err-prop', readout.errorPropagation);
    setTxt('#hud-val-errprop', readout.errorPropText);
    setTxt('[data-hud-frame-ms], #hud-frame-ms', readout.frameLatency);
    setTxt('#hud-val-latency', readout.frameLatencyText);
    setTxt('#hero-frame-perf-readout', `SHADE+DITHER: ${readout.frameLatencyText}`);
    setTxt('#hero-canvas-spec-readout', `320×240 // ${readout.kernelCode} (${readout.errorPropText} PROP)`);

    setTxt('[data-hud-readiness], #hud-val-readiness', `${readout.readinessPercentage}%`);
    setPillStrongOrText('#hud-readiness-progress', 'GAUNTLET PROGRESS: ', `${readout.completedStepCount} / 5 (${readout.readinessPercentage}%)`);
    setTxt('[data-hud-aegis-rank], #hud-val-rank', readout.aegisRank.toUpperCase());
    setPillStrongOrText('#hud-aegis-rank', 'RANK: ', readout.aegisRank.toUpperCase());
    setTxt('[data-hud-ballot-ratio], #hud-ballot-lock-ratio, #hud-val-ballot', readout.ballotLockRatio);
    setTxt('#hud-ballot-count-badge', `${readout.lockedContestsCount} / ${readout.totalContestsCount}`);
    setTxt('[data-hud-storage-mode], #hud-storage-mode, #hud-val-storage', readout.storageMode);

    setTxt('#hud-threshold-value, #val-dither-threshold, [data-hud-threshold]', String(studio.threshold ?? 128));
    setTxt('#hud-pixel-scale-value, #val-pixel-scale, [data-hud-pixel-scale]', `${studio.pixelScale ?? 1}x`);
    setTxt('#label-active-kernel', String(studio.kernel || 'atkinson-1bit'));
    setTxt('#label-active-palette', String(studio.palette || 'obsidian-bone'));
    setTxt('#val-light-angle', `${Number(studio.lightAngle ?? 0.65).toFixed(2)} rad`);

    const progressFill = q('#gauntlet-progress-fill, #readiness-progress-fill, [data-readiness-bar-fill]');
    if (progressFill && progressFill.style) {
      progressFill.style.width = `${readout.readinessPercentage}%`;
    }

    // Sync Dither Forge selects & buttons
    const kernelSelect = q('#select-dither-kernel');
    if (kernelSelect && kernelSelect.value !== studio.kernel) {
      kernelSelect.value = studio.kernel || 'atkinson-1bit';
    }
    for (const btn of qa('[data-kernel]')) {
      const isMatch = btn.getAttribute('data-kernel') === (studio.kernel || 'atkinson-1bit');
      btn.classList?.toggle('is-active', isMatch);
      btn.setAttribute?.('aria-pressed', isMatch ? 'true' : 'false');
    }

    const paletteSelect = q('#select-dither-palette');
    if (paletteSelect && paletteSelect.value !== studio.palette) {
      paletteSelect.value = studio.palette || 'obsidian-bone';
    }
    for (const btn of qa('[data-palette]')) {
      if (btn.tagName === 'HTML' || btn.tagName === 'BODY') continue;
      const isMatch = btn.getAttribute('data-palette') === (studio.palette || 'obsidian-bone');
      btn.classList?.toggle('is-active', isMatch);
      btn.setAttribute?.('aria-pressed', isMatch ? 'true' : 'false');
    }

    const thresholdSlider = q('#slider-dither-threshold');
    if (thresholdSlider && String(thresholdSlider.value) !== String(studio.threshold ?? 128)) {
      thresholdSlider.value = String(studio.threshold ?? 128);
    }

    const pixelScaleSelect = q('#select-pixel-scale');
    if (pixelScaleSelect && String(pixelScaleSelect.value) !== String(studio.pixelScale ?? 1)) {
      pixelScaleSelect.value = String(studio.pixelScale ?? 1);
    }
    for (const btn of qa('[data-pixel-scale]')) {
      const isMatch = String(btn.getAttribute('data-pixel-scale')) === String(studio.pixelScale ?? 1);
      btn.classList?.toggle('is-active', isMatch);
      btn.setAttribute?.('aria-pressed', isMatch ? 'true' : 'false');
    }

    const lightSlider = q('#slider-light-angle');
    if (lightSlider && String(lightSlider.value) !== String(Number(studio.lightAngle ?? 0.65).toFixed(2))) {
      lightSlider.value = String(Number(studio.lightAngle ?? 0.65).toFixed(2));
    }

    const lightBtn = q('#btn-toggle-light');
    if (lightBtn) {
      const active = studio.animateLight !== false;
      lightBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
      lightBtn.classList?.toggle('is-active', active);
      lightBtn.textContent = active ? '[L] TORCH ORBIT: ACTIVE' : '[L] TORCH ORBIT: PAUSED';
    }

    // Sync Readiness Gauntlet items & checkboxes
    const completedSet = new Set(stateSnapshot.completedSteps || []);
    for (const item of qa('li[data-step-id], .gauntlet-step-item[data-step-id]')) {
      const stepId = item.getAttribute('data-step-id');
      const isDone = completedSet.has(stepId);
      item.classList?.toggle('is-completed', isDone);
      item.setAttribute?.('aria-checked', isDone ? 'true' : 'false');
    }
    for (const checkbox of qa('input[type="checkbox"][data-step-id]')) {
      const stepId = checkbox.getAttribute('data-step-id');
      const isDone = completedSet.has(stepId);
      if (checkbox.checked !== isDone) {
        checkbox.checked = isDone;
      }
    }

    // Sync Sample Ballot option buttons & per-contest status labels
    const selections = stateSnapshot.ballotSelections || {};
    for (const btn of qa('[data-contest-id][data-option]')) {
      const contestId = btn.getAttribute('data-contest-id');
      const optionVal = btn.getAttribute('data-option');
      const selected = (selections[contestId] || 'UNDECIDED') === optionVal;
      btn.classList?.toggle('is-selected', selected);
      btn.classList?.toggle('is-active', selected);
      btn.setAttribute?.('aria-pressed', selected ? 'true' : 'false');
    }
    for (const statusSpan of qa('[data-contest-status]')) {
      const contestId = statusSpan.getAttribute('data-contest-status');
      const choice = selections[contestId] || 'UNDECIDED';
      statusSpan.textContent = `CHOICE: ${choice}`;
    }

    // Sync Crest Studio inputs & status
    const callsignText = crest.callsign || 'KNIGHT OF PRECINCT 04';
    const callsignInput = q('#input-crest-callsign');
    if (callsignInput && doc.activeElement !== callsignInput && callsignInput.value !== callsignText) {
      callsignInput.value = callsignText;
    }
    const crestOrderSelect = q('#select-crest-order');
    if (crestOrderSelect && crest.orderId && crestOrderSelect.value !== crest.orderId) {
      crestOrderSelect.value = crest.orderId;
    }

    setPillStrongOrText(
      '#crest-mint-status, [data-crest-mint-status], #hud-crest-seal-status',
      'SEAL STATUS: ',
      crest.sealMinted ? `MINTED (${callsignText})` : 'READY TO MINT'
    );
    setTxt(
      '#crest-status-readout',
      crest.sealMinted
        ? `MINTED SEAL // I VOTED NOV 3, 2026 // ${callsignText} // FNV1A ${stateSnapshot.checksum || ''}`
        : `SEAL: I VOTED // NOVEMBER 3, 2026 // ${callsignText}`
    );
  }

  /**
   * Updates all 6 U.S. timezone poll-closing countdown cards in #section-nov3-command.
   */
  function updateCountdowns(overrideEpoch = Date.now()) {
    const countdowns = computeAllZoneCountdowns(overrideEpoch, dataset);
    if (!doc) return countdowns;

    const snap = store.getState();
    const selectedZone = snap.selectedZone || 'EST';

    for (const cd of countdowns) {
      const card = q(`[data-zone-id="${cd.zoneId}"]`);
      if (!card) continue;

      const isSelected = cd.zoneId === selectedZone;
      card.classList?.toggle('is-selected-zone', isSelected);
      card.classList?.toggle('is-selected', isSelected);
      card.classList?.toggle('is-closed', cd.isClosed);
      card.classList?.toggle('is-final-hour', cd.status === 'FINAL_HOUR_CRITICAL');
      card.setAttribute?.('data-zone-status', cd.status);
      card.setAttribute?.('data-status', cd.status);

      const clockEl = card.querySelector?.('.tz-countdown-clock, [data-tz-clock]');
      if (clockEl) clockEl.textContent = cd.formattedClock;

      const statusEl = card.querySelector?.('.tz-status-badge, [data-tz-status]');
      if (statusEl) statusEl.textContent = cd.statusBadge;

      const progressEl = card.querySelector?.('.tz-progress-fill, [data-tz-progress]');
      if (progressEl && progressEl.style) {
        progressEl.style.width = `${cd.percentDayElapsed}%`;
      }
    }

    const activeCd = countdowns.find((c) => c.zoneId === selectedZone) || countdowns[0];
    if (activeCd) {
      const headerClockEl = q('#hud-active-zone-clock, [data-hud-active-clock]');
      if (headerClockEl) {
        headerClockEl.textContent = `${activeCd.zoneId} ${activeCd.formattedClock}`;
      }
      const activeZoneLabelEl = q('#hud-active-zone-label');
      if (activeZoneLabelEl) {
        activeZoneLabelEl.textContent = `${activeCd.zoneId} (UTC${activeCd.utcOffsetHours}) // ${activeCd.formattedClock}`;
      }
    }

    return countdowns;
  }

  // Event Listener Registration & Cleanup Tracking
  const cleanups = [];
  const bind = (target, eventName, handler, opts) => {
    if (!target || typeof target.addEventListener !== 'function') return;
    target.addEventListener(eventName, handler, opts);
    cleanups.push(() => target.removeEventListener(eventName, handler, opts));
  };

  if (doc) {
    // 1. Dither Kernel Select & Buttons
    const kernelSelect = q('#select-dither-kernel');
    bind(kernelSelect, 'change', (e) => {
      applyStudioPatchToStore(store, { kernel: e.target.value });
      renderAllCanvases();
    });

    for (const btn of qa('[data-kernel]')) {
      bind(btn, 'click', () => {
        const k = btn.getAttribute('data-kernel');
        if (k) {
          applyStudioPatchToStore(store, { kernel: k });
          renderAllCanvases();
        }
      });
    }

    // 2. Palette Select & Buttons
    const paletteSelect = q('#select-dither-palette');
    bind(paletteSelect, 'change', (e) => {
      applyStudioPatchToStore(store, { palette: e.target.value });
      renderAllCanvases();
    });

    for (const btn of qa('[data-palette]')) {
      if (btn.tagName === 'HTML' || btn.tagName === 'BODY') continue;
      bind(btn, 'click', () => {
        const p = btn.getAttribute('data-palette');
        if (p) {
          applyStudioPatchToStore(store, { palette: p });
          renderAllCanvases();
        }
      });
    }

    // 3. Threshold Slider
    const thresholdSlider = q('#slider-dither-threshold');
    bind(thresholdSlider, 'input', (e) => {
      const val = Math.max(1, Math.min(254, Number(e.target.value) || 128));
      applyStudioPatchToStore(store, { threshold: val });
      renderAllCanvases();
    });

    // 4. Pixel Scale Select & Buttons
    const pixelScaleSelect = q('#select-pixel-scale');
    bind(pixelScaleSelect, 'change', (e) => {
      const scale = Math.max(1, Math.min(4, Number(e.target.value) || 1));
      applyStudioPatchToStore(store, { pixelScale: scale });
      renderAllCanvases();
    });

    for (const btn of qa('[data-pixel-scale]')) {
      bind(btn, 'click', () => {
        const scale = Math.max(1, Math.min(4, Number(btn.getAttribute('data-pixel-scale')) || 1));
        applyStudioPatchToStore(store, { pixelScale: scale });
        renderAllCanvases();
      });
    }

    // 5. Light Angle Slider, Orbit Toggle & Visor Toggle
    const lightSlider = q('#slider-light-angle');
    bind(lightSlider, 'input', (e) => {
      const angle = Number(e.target.value) || 0;
      applyStudioPatchToStore(store, { lightAngle: angle, animateLight: false });
      const heroCanvas = q('#canvas-hero-knight');
      if (heroCanvas) {
        lastHeroFrameMs = renderDitheredCanvas(heroCanvas, 'hero-guardian', store.getState().ditherConfig || {});
        updateTelemetryDom();
      }
    });

    const toggleLightBtn = q('#btn-toggle-light');
    bind(toggleLightBtn, 'click', () => {
      const cur = store.getState().ditherConfig || store.getState().studio || {};
      applyStudioPatchToStore(store, { animateLight: cur.animateLight === false });
      updateTelemetryDom();
    });

    const toggleVisorBtn = q('#btn-toggle-visor');
    bind(toggleVisorBtn, 'click', () => {
      visorOpen = !visorOpen;
      toggleVisorBtn.setAttribute('aria-pressed', visorOpen ? 'true' : 'false');
      toggleVisorBtn.classList?.toggle('is-active', visorOpen);
      toggleVisorBtn.textContent = visorOpen ? 'ARMET VISOR: OPEN' : 'ARMET VISOR: CLOSED';
      const heroCanvas = q('#canvas-hero-knight');
      if (heroCanvas) {
        lastHeroFrameMs = renderDitheredCanvas(heroCanvas, 'hero-guardian', store.getState().ditherConfig || {});
        updateTelemetryDom();
      }
    });

    // 6. Hero Canvas Cursor Reticle Readout
    const heroCanvas = q('#canvas-hero-knight');
    const reticleReadout = q('#hud-reticle-readout');
    bind(heroCanvas, 'mousemove', (e) => {
      if (!reticleReadout || !heroCanvas.getBoundingClientRect) return;
      const rect = heroCanvas.getBoundingClientRect();
      const w = Number(heroCanvas.width) || 320;
      const h = Number(heroCanvas.height) || 240;
      const relX = Math.max(0, Math.min(w - 1, Math.floor(((e.clientX - rect.left) / Math.max(1, rect.width)) * w)));
      const relY = Math.max(0, Math.min(h - 1, Math.floor(((e.clientY - rect.top) / Math.max(1, rect.height)) * h)));
      const studio = store.getState().ditherConfig || store.getState().studio || {};
      const angleKey = Number(studio.lightAngle ?? 0.65).toFixed(2);
      const cacheKey = `hero-guardian:${w}x${h}:${angleKey}:${String(visorOpen)}`;
      const lumBuf = customHeroLuminance || luminanceCache.get(cacheKey);
      const lumVal = lumBuf ? lumBuf[relY * w + relX] : 184;
      const thresholdVal = Number(studio.threshold ?? 128);
      const quantVal = lumVal >= thresholdVal ? 255 : 0;
      reticleReadout.textContent = `RETICLE: X=${String(relX).padStart(3, '0')} Y=${String(relY).padStart(3, '0')} // LUM=${String(lumVal).padStart(3, '0')} // QUANT=${String(quantVal).padStart(3, '0')}`;
    });

    // 7. Custom Image Upload & Restore in Dither Forge
    const uploadInput = q('#input-upload-image');
    bind(uploadInput, 'change', (e) => {
      const file = e.target?.files?.[0];
      if (!file || typeof FileReader === 'undefined' || typeof Image === 'undefined') return;
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const img = new Image();
        img.onload = () => {
          const offCanvas = doc.createElement('canvas');
          offCanvas.width = customHeroWidth;
          offCanvas.height = customHeroHeight;
          const offCtx = offCanvas.getContext('2d');
          if (!offCtx) return;
          offCtx.drawImage(img, 0, 0, customHeroWidth, customHeroHeight);
          const rgba = offCtx.getImageData(0, 0, customHeroWidth, customHeroHeight).data;
          const lum = new Uint8Array(customHeroWidth * customHeroHeight);
          for (let i = 0, p = 0; i < lum.length; i++, p += 4) {
            lum[i] = (77 * rgba[p] + 150 * rgba[p + 1] + 29 * rgba[p + 2]) >> 8;
          }
          customHeroLuminance = lum;
          renderAllCanvases();
        };
        img.src = String(loadEvt.target?.result || '');
      };
      reader.readAsDataURL(file);
    });

    const restoreProcBtn = q('#btn-restore-procedural');
    bind(restoreProcBtn, 'click', () => {
      customHeroLuminance = null;
      renderAllCanvases();
    });

    // 8. Timezone Card Selection (Click & Keyboard Enter/Space)
    const selectZoneCard = (tzCard) => {
      const zId = tzCard.getAttribute('data-zone-id');
      if (zId && POLL_ZONE_IDS.includes(zId)) {
        if (typeof store.setSelectedZone === 'function') {
          store.setSelectedZone(zId);
        } else if (typeof store.setZone === 'function') {
          store.setZone(zId);
        }
        updateCountdowns();
      }
    };
    for (const tzCard of qa('[data-zone-id]')) {
      bind(tzCard, 'click', () => selectZoneCard(tzCard));
      bind(tzCard, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault?.();
          selectZoneCard(tzCard);
        }
      });
    }

    // 9. Readiness Gauntlet Step Toggles (handle checkboxes cleanly without double-firing on label/li bubble)
    const checkboxes = qa('input[type="checkbox"][data-step-id]');
    if (checkboxes.length > 0) {
      for (const chk of checkboxes) {
        bind(chk, 'change', (e) => {
          const stepId = chk.getAttribute('data-step-id');
          if (!stepId) return;
          if (typeof store.toggleStep === 'function') {
            store.toggleStep(stepId, Boolean(e.target.checked));
          } else if (typeof store.completeGauntletStep === 'function') {
            store.completeGauntletStep(stepId);
          }
          updateTelemetryDom();
        });
      }
    } else {
      for (const stepEl of qa('[data-step-id]')) {
        bind(stepEl, 'click', () => {
          const stepId = stepEl.getAttribute('data-step-id');
          if (!stepId) return;
          if (typeof store.toggleStep === 'function') {
            store.toggleStep(stepId);
          } else if (typeof store.completeGauntletStep === 'function') {
            store.completeGauntletStep(stepId);
          }
          updateTelemetryDom();
        });
      }
    }

    // 10. Sample Ballot Option Buttons & Export/Reset
    for (const optBtn of qa('[data-contest-id][data-option]')) {
      bind(optBtn, 'click', () => {
        const contestId = optBtn.getAttribute('data-contest-id');
        const option = optBtn.getAttribute('data-option');
        if (!contestId || !option) return;
        if (typeof store.setBallotSelection === 'function') {
          store.setBallotSelection(contestId, option);
        } else if (typeof store.setBallotChoice === 'function') {
          store.setBallotChoice(contestId, option);
        }
        updateTelemetryDom();
      });
    }

    const exportBallotBtn = q('#btn-export-ballot');
    const ballotOutputEl = q('#ballot-export-output');
    bind(exportBallotBtn, 'click', () => {
      const jsonStr = typeof store.exportJson === 'function'
        ? store.exportJson()
        : JSON.stringify(store.getState(), null, 2);
      if (ballotOutputEl) {
        if ('value' in ballotOutputEl) {
          ballotOutputEl.value = jsonStr;
        } else {
          ballotOutputEl.textContent = jsonStr;
        }
      }
    });

    const resetStoreBtn = q('#btn-reset-store');
    bind(resetStoreBtn, 'click', () => {
      customHeroLuminance = null;
      if (typeof store.resetStore === 'function') {
        store.resetStore();
      } else if (typeof store.reset === 'function') {
        store.reset();
      }
      renderAllCanvases();
      if (ballotOutputEl) {
        if ('value' in ballotOutputEl) {
          ballotOutputEl.value = '';
        } else {
          ballotOutputEl.textContent = '';
        }
      }
    });

    // 11. "I VOTED — NOV 3" Crest Studio Controls
    const callsignInput = q('#input-crest-callsign');
    bind(callsignInput, 'input', (e) => {
      const val = String(e.target.value || '').slice(0, 28).toUpperCase();
      if (typeof store.updateCrestConfig === 'function') {
        store.updateCrestConfig({ callsign: val || 'KNIGHT OF PRECINCT 04' });
      } else if (typeof store.setCrestParams === 'function') {
        store.setCrestParams({ callsign: val || 'KNIGHT OF PRECINCT 04' });
      }
      renderVotedCrestStudioCanvas(store.getState());
      updateTelemetryDom();
    });

    const crestOrderSelect = q('#select-crest-order');
    bind(crestOrderSelect, 'change', (e) => {
      const orderId = e.target.value || 'order-4-champion';
      if (typeof store.updateCrestConfig === 'function') {
        store.updateCrestConfig({ orderId });
      } else if (typeof store.setCrestParams === 'function') {
        store.setCrestParams({ orderId });
      }
      renderVotedCrestStudioCanvas(store.getState());
      updateTelemetryDom();
    });

    const mintCrestBtn = q('#btn-mint-crest');
    bind(mintCrestBtn, 'click', () => {
      const callsignVal = callsignInput?.value
        ? String(callsignInput.value).slice(0, 28).toUpperCase()
        : undefined;
      const orderVal = crestOrderSelect?.value || undefined;
      if (typeof store.mintCivicSeal === 'function') {
        store.mintCivicSeal(callsignVal, orderVal);
      } else if (typeof store.mintSeal === 'function') {
        store.mintSeal(callsignVal, orderVal);
      }
      renderVotedCrestStudioCanvas(store.getState());
      updateTelemetryDom();
    });

    const downloadCrestBtn = q('#btn-download-crest');
    bind(downloadCrestBtn, 'click', () => {
      const crestCanvas = q('#canvas-voted-crest');
      if (!crestCanvas || typeof crestCanvas.toDataURL !== 'function') return;
      const dataUrl = crestCanvas.toDataURL('image/png');
      const link = doc.createElement('a');
      link.download = 'nov3-i-voted-crest.png';
      link.href = dataUrl;
      link.click?.();
    });

    // 12. Global Keyboard Shortcut Listener
    const winTarget = typeof window !== 'undefined' ? window : doc;
    bind(winTarget, 'keydown', (evt) => {
      const result = dispatchHudHotkey(evt, store, {
        onPaletteChange: () => renderAllCanvases(),
        onKernelChange: () => renderAllCanvases(),
        onToggleLight: () => updateTelemetryDom(),
        onToggleHudOverlay: () => {
          hudOverlayVisible = !hudOverlayVisible;
          doc.documentElement?.classList?.toggle('hud-grid-hidden', !hudOverlayVisible);
          doc.documentElement?.setAttribute?.('data-hud-overlay', hudOverlayVisible ? 'true' : 'false');
          return hudOverlayVisible;
        },
        onMintCrest: () => {
          renderVotedCrestStudioCanvas(store.getState());
          updateTelemetryDom();
        }
      });
      if (result.handled) {
        updateTelemetryDom();
      }
    });
  }

  // Initial SVG injection, Canvas render, and Countdown update
  injectHeraldicSvgOrnaments();
  renderAllCanvases();
  updateCountdowns();

  // Subscribe to store mutations
  const unsubscribeStore = typeof store?.subscribe === 'function'
    ? store.subscribe((nextState) => {
        updateTelemetryDom(nextState);
      })
    : null;

  // 1Hz Poll-Closing Countdown Timer & Controlled Torch-Orbit Animation Timer
  let countdownIntervalId = null;
  let orbitIntervalId = null;

  if (typeof window !== 'undefined' && doc) {
    countdownIntervalId = setInterval(() => {
      updateCountdowns(Date.now());
    }, 1000);

    if (!reducedMotion) {
      orbitIntervalId = setInterval(() => {
        const snap = store.getState();
        const studio = snap.ditherConfig || snap.studio || {};
        if (studio.animateLight === false) return;
        const nextAngle = Number(((Number(studio.lightAngle || 0.65) + 0.08) % (Math.PI * 2)).toFixed(2));
        applyStudioPatchToStore(store, { lightAngle: nextAngle });
        const heroCanvas = q('#canvas-hero-knight');
        if (heroCanvas) {
          lastHeroFrameMs = renderDitheredCanvas(heroCanvas, 'hero-guardian', store.getState().ditherConfig || {});
          updateTelemetryDom();
        }
      }, 180);
    }
  }

  const controllerHandle = {
    store,
    dataset,
    renderAllCanvases,
    updateCountdowns,
    updateTelemetryDom,
    dispatchKey: (keyOrEvent) =>
      dispatchHudHotkey(keyOrEvent, store, {
        onPaletteChange: () => renderAllCanvases(),
        onKernelChange: () => renderAllCanvases(),
        onToggleLight: () => updateTelemetryDom(),
        onToggleHudOverlay: () => {
          hudOverlayVisible = !hudOverlayVisible;
          doc?.documentElement?.classList?.toggle('hud-grid-hidden', !hudOverlayVisible);
          doc?.documentElement?.setAttribute?.('data-hud-overlay', hudOverlayVisible ? 'true' : 'false');
          return hudOverlayVisible;
        },
        onMintCrest: () => {
          renderVotedCrestStudioCanvas(store.getState());
          updateTelemetryDom();
        }
      }),
    destroy() {
      if (countdownIntervalId !== null) {
        clearInterval(countdownIntervalId);
        countdownIntervalId = null;
      }
      if (orbitIntervalId !== null) {
        clearInterval(orbitIntervalId);
        orbitIntervalId = null;
      }
      if (typeof unsubscribeStore === 'function') {
        unsubscribeStore();
      }
      while (cleanups.length > 0) {
        const fn = cleanups.pop();
        try {
          fn();
        } catch {
          // Ignore teardown error
        }
      }
      if (root && typeof root === 'object' && root.__knightsHudController === controllerHandle) {
        delete root.__knightsHudController;
      }
      if (doc && typeof doc === 'object' && doc.__knightsHudController === controllerHandle) {
        delete doc.__knightsHudController;
      }
    }
  };

  if (root && typeof root === 'object') {
    root.__knightsHudController = controllerHandle;
  }
  if (doc && typeof doc === 'object') {
    doc.__knightsHudController = controllerHandle;
  }

  return controllerHandle;
}

export const initElectionHudApp = initHudController;

// Auto-bootstrap in browser if index.html loads src/hud_controller.mjs directly without calling initHudController
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const autoBoot = () => {
    if (!document.documentElement?.__knightsHudController && !document.__knightsHudController && !window.__CIVIC_AEGIS_APP__) {
      initHudController({ rootDocument: document });
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(autoBoot, 0), { once: true });
  } else {
    setTimeout(autoBoot, 0);
  }
}
