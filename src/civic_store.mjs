/**
 * @file src/civic_store.mjs
 * @description Track 2: November 3, 2026 Civic Dataset & Deterministic Snapshot Store.
 *
 * Implements the two-tier persistence and data-consistency architecture:
 * - Tier 1: Immutable Static Reference Catalog (`DEFAULT_ELECTION_DATASET`, mirrored in
 *   `data/election_nov3_dataset.json`) indexed in O(1) secondary hash maps (`zonesById`,
 *   `ordersById`, `stepsById`, `contestsById`).
 * - Tier 2: Copy-on-Write (CoW) Single-Key Atomic Snapshot Store backed by
 *   `window.localStorage` (`knights_ditherpunk_nov3_v1`) with automatic, zero-exception
 *   failover to an in-memory Map ledger (`storageMode: "MEMORY_FALLBACK"`), protected by
 *   monotonic revision counters (`revision`), Snapshot Isolation (SI), cross-tab OCC
 *   set-union merging, and 32-bit FNV-1a integrity checksums (`checksum`).
 *
 * Zero external or internal imports (DAG Level 0 leaf foundation).
 */

export const STORAGE_KEY = 'knights_ditherpunk_nov3_v1';

const VALID_ZONES = ['EST', 'CST', 'MST', 'PST', 'AKST', 'HST'];
const VALID_KERNELS = ['atkinson-1bit', 'atkinson-2bit', 'floyd-steinberg', 'bayer-8x8'];
const VALID_PALETTES = ['obsidian-bone', 'crimson-herald', 'phosphor-hud', 'cobalt-aegis'];
const CANONICAL_STEP_IDS = ['step-1', 'step-2', 'step-3', 'step-4', 'step-5'];
const CANONICAL_CONTEST_IDS = ['contest-1', 'contest-2', 'contest-3', 'contest-4', 'contest-5', 'contest-6'];

const ORDER_ID_CANONICAL_MAP = Object.freeze({
  'order-1': 'order-1-recon',
  'order-1-recon': 'order-1-recon',
  'order-2': 'order-2-warrant',
  'order-2-warrant': 'order-2-warrant',
  'order-3': 'order-3-queue',
  'order-3-queue': 'order-3-queue',
  'order-4': 'order-4-champion',
  'order-4-champion': 'order-4-champion'
});

const RIGHTS_CATALOG = [
  {
    id: 'right-inline',
    rightId: 'right-inline',
    title: 'Right to Stay in Line Before Poll Close',
    statuteSummary: 'Any eligible voter standing in the polling place queue at the scheduled closing time on November 3 must be permitted to vote.',
    description: 'Any eligible voter standing in the polling place queue at the scheduled closing time on November 3 must be permitted to vote.',
    hudDirective: 'HOLD_QUEUE_POSITION // DO_NOT_DEPART'
  },
  {
    id: 'right-spoiled',
    rightId: 'right-spoiled',
    title: 'Right to a Replacement Ballot if Spoiled',
    statuteSummary: 'If you make a mistake or tear your paper ballot before casting it, you have the right to request a fresh replacement ballot from poll workers.',
    description: 'If you make a mistake or tear your paper ballot before casting it, you have the right to request a fresh replacement ballot from poll workers.',
    hudDirective: 'REQUEST_REPLACEMENT_WARRANT'
  },
  {
    id: 'right-provisional',
    rightId: 'right-provisional',
    title: 'Right to Cast a Provisional Ballot',
    statuteSummary: 'If your name is missing from the precinct roll or your ID is challenged, demand a provisional ballot so your eligibility can be verified and counted.',
    description: 'If your name is missing from the precinct roll or your ID is challenged, demand a provisional ballot so your eligibility can be verified and counted.',
    hudDirective: 'INVOKE_PROVISIONAL_SAFEGUARD'
  },
  {
    id: 'right-accessibility',
    rightId: 'right-accessibility',
    title: 'Right to Accessible Voting Machines & Assistance',
    statuteSummary: "Every polling place must provide an operational accessible voting system and permit voter-chosen assistance (excluding the voter's employer or union agent).",
    description: "Every polling place must provide an operational accessible voting system and permit voter-chosen assistance (excluding the voter's employer or union agent).",
    hudDirective: 'ENGAGE_ACCESSIBLE_TERMINAL'
  }
];

/**
 * Authoritative embedded fallback dataset matching `data/election_nov3_dataset.json`.
 */
export const DEFAULT_ELECTION_DATASET = Object.freeze({
  schemaVersion: '1.0.0',
  electionDate: '2026-11-03',
  electionTitle: 'General Election Day — Tuesday, November 3, 2026',
  portalTitle: 'ORDER OF THE CIVIC AEGIS // NOVEMBER III BALLOT COMMAND',
  portalBanner: 'ORDER OF THE CIVIC AEGIS // NOVEMBER III BALLOT COMMAND',
  inLineVotingMandate: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.',
  inLineProtectionMandate: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.',
  pollClosingZones: [
    {
      id: 'EST',
      zoneId: 'EST',
      label: 'Eastern Standard Time (UTC-5)',
      utcOffset: 'UTC-05:00',
      utcOffsetIso: '-05:00',
      utcOffsetHours: -5,
      standardCloseLocal: '19:00',
      primaryCloseLocal: '19:00',
      primaryClosingLocalTime: '19:00',
      extendedCloseLocal: '20:00',
      secondaryCloseLocal: '20:00',
      secondaryClosingLocalTime: '20:00',
      earliestClosingIsoUtc: '2026-11-04T00:00:00Z',
      earlyCloseIsoUtc: '2026-11-04T00:00:00Z',
      closingIsoUtc: '2026-11-04T01:00:00Z',
      closeIsoUtc: '2026-11-04T01:00:00Z',
      states: ['NY', 'PA', 'GA', 'MI', 'NC', 'OH', 'VA', 'FL', 'MA', 'IN', 'KY', 'VT', 'WV'],
      representativeStates: ['NY', 'PA', 'GA', 'MI', 'NC', 'OH', 'VA', 'FL', 'MA', 'IN', 'KY', 'VT', 'WV'],
      sampleStates: ['NY', 'PA', 'GA', 'MI', 'NC', 'OH', 'VA', 'FL', 'MA', 'IN', 'KY', 'VT', 'WV'],
      inLineProtectionRule: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.',
      inLineRule: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.'
    },
    {
      id: 'CST',
      zoneId: 'CST',
      label: 'Central Standard Time (UTC-6)',
      utcOffset: 'UTC-06:00',
      utcOffsetIso: '-06:00',
      utcOffsetHours: -6,
      standardCloseLocal: '19:00',
      primaryCloseLocal: '19:00',
      primaryClosingLocalTime: '19:00',
      extendedCloseLocal: '20:00',
      secondaryCloseLocal: '20:00',
      secondaryClosingLocalTime: '20:00',
      earliestClosingIsoUtc: '2026-11-04T01:00:00Z',
      earlyCloseIsoUtc: '2026-11-04T01:00:00Z',
      closingIsoUtc: '2026-11-04T02:00:00Z',
      closeIsoUtc: '2026-11-04T02:00:00Z',
      states: ['IL', 'TX', 'WI', 'MN', 'MO', 'LA', 'AL', 'TN', 'MS', 'OK', 'AR'],
      representativeStates: ['IL', 'TX', 'WI', 'MN', 'MO', 'LA', 'AL', 'TN', 'MS', 'OK', 'AR'],
      sampleStates: ['IL', 'TX', 'WI', 'MN', 'MO', 'LA', 'AL', 'TN', 'MS', 'OK', 'AR'],
      inLineProtectionRule: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.',
      inLineRule: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.'
    },
    {
      id: 'MST',
      zoneId: 'MST',
      label: 'Mountain Standard Time (UTC-7)',
      utcOffset: 'UTC-07:00',
      utcOffsetIso: '-07:00',
      utcOffsetHours: -7,
      standardCloseLocal: '19:00',
      primaryCloseLocal: '19:00',
      primaryClosingLocalTime: '19:00',
      extendedCloseLocal: '20:00',
      secondaryCloseLocal: '20:00',
      secondaryClosingLocalTime: '20:00',
      earliestClosingIsoUtc: '2026-11-04T02:00:00Z',
      earlyCloseIsoUtc: '2026-11-04T02:00:00Z',
      closingIsoUtc: '2026-11-04T03:00:00Z',
      closeIsoUtc: '2026-11-04T03:00:00Z',
      states: ['CO', 'AZ', 'NM', 'UT', 'MT', 'ID', 'WY'],
      representativeStates: ['CO', 'AZ', 'NM', 'UT', 'MT', 'ID', 'WY'],
      sampleStates: ['CO', 'AZ', 'NM', 'UT', 'MT', 'ID', 'WY'],
      inLineProtectionRule: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.',
      inLineRule: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.'
    },
    {
      id: 'PST',
      zoneId: 'PST',
      label: 'Pacific Standard Time (UTC-8)',
      utcOffset: 'UTC-08:00',
      utcOffsetIso: '-08:00',
      utcOffsetHours: -8,
      standardCloseLocal: '20:00',
      primaryCloseLocal: '20:00',
      primaryClosingLocalTime: '20:00',
      extendedCloseLocal: '20:00',
      secondaryCloseLocal: '20:00',
      secondaryClosingLocalTime: '20:00',
      earliestClosingIsoUtc: '2026-11-04T04:00:00Z',
      earlyCloseIsoUtc: '2026-11-04T04:00:00Z',
      closingIsoUtc: '2026-11-04T04:00:00Z',
      closeIsoUtc: '2026-11-04T04:00:00Z',
      states: ['CA', 'WA', 'OR', 'NV', 'ID'],
      representativeStates: ['CA', 'WA', 'OR', 'NV', 'ID'],
      sampleStates: ['CA', 'WA', 'OR', 'NV', 'ID'],
      inLineProtectionRule: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.',
      inLineRule: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.'
    },
    {
      id: 'AKST',
      zoneId: 'AKST',
      label: 'Alaska Standard Time (UTC-9)',
      utcOffset: 'UTC-09:00',
      utcOffsetIso: '-09:00',
      utcOffsetHours: -9,
      standardCloseLocal: '20:00',
      primaryCloseLocal: '20:00',
      primaryClosingLocalTime: '20:00',
      extendedCloseLocal: '20:00',
      secondaryCloseLocal: '20:00',
      secondaryClosingLocalTime: '20:00',
      earliestClosingIsoUtc: '2026-11-04T05:00:00Z',
      earlyCloseIsoUtc: '2026-11-04T05:00:00Z',
      closingIsoUtc: '2026-11-04T05:00:00Z',
      closeIsoUtc: '2026-11-04T05:00:00Z',
      states: ['AK'],
      representativeStates: ['AK'],
      sampleStates: ['AK'],
      inLineProtectionRule: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.',
      inLineRule: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.'
    },
    {
      id: 'HST',
      zoneId: 'HST',
      label: 'Hawaii-Aleutian Standard Time (UTC-10)',
      utcOffset: 'UTC-10:00',
      utcOffsetIso: '-10:00',
      utcOffsetHours: -10,
      standardCloseLocal: '19:00',
      primaryCloseLocal: '19:00',
      primaryClosingLocalTime: '19:00',
      extendedCloseLocal: '19:00',
      secondaryCloseLocal: '19:00',
      secondaryClosingLocalTime: '19:00',
      earliestClosingIsoUtc: '2026-11-04T05:00:00Z',
      earlyCloseIsoUtc: '2026-11-04T05:00:00Z',
      closingIsoUtc: '2026-11-04T05:00:00Z',
      closeIsoUtc: '2026-11-04T05:00:00Z',
      states: ['HI'],
      representativeStates: ['HI'],
      sampleStates: ['HI'],
      inLineProtectionRule: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.',
      inLineRule: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.'
    }
  ],
  knightOrders: [
    {
      id: 'order-1-recon',
      orderId: 'order-1-recon',
      shortId: 'order-1',
      romanNumeral: 'I',
      name: 'Sir Vance of the Roll',
      title: 'Order I — Sir Vance of the Roll (Precinct & Registration Recon)',
      motto: 'VERIFY THE ROLL // LOCK THE PRECINCT',
      sceneId: 'order-1-recon',
      armorNotes: 'Hounskull bascinet helm with articulated bevors, fluted reconnaissance pauldrons, and illuminated precinct scroll.',
      armorDescription: 'Hounskull bascinet helm with articulated bevors, fluted reconnaissance pauldrons, and illuminated precinct scroll.',
      hudDesignation: 'RECON_UNIT_01 // ROLL_VERIFIER',
      hudCallsign: 'RECON_UNIT_01 // ROLL_VERIFIER',
      civicMission: 'Verify active voter registration, confirm assigned November 3 polling place, and inspect precinct opening hours.',
      civicRole: 'Verify active voter registration, confirm assigned November 3 polling place, and inspect precinct opening hours.'
    },
    {
      id: 'order-2-warrant',
      orderId: 'order-2-warrant',
      shortId: 'order-2',
      romanNumeral: 'II',
      name: 'Dame Astraea of the Warrant',
      title: 'Order II — Dame Astraea of the Warrant (Ballot & Proposition Contemplation)',
      motto: 'WEIGH THE MEASURE // WIELD THE WARRANT',
      sceneId: 'order-2-warrant',
      armorNotes: 'Gothic Milanese plate cuirass with balanced civic scales and twin-fullered broadsword of equilibrium.',
      armorDescription: 'Gothic Milanese plate cuirass with balanced civic scales and twin-fullered broadsword of equilibrium.',
      hudDesignation: 'JUSTICIAR_02 // BALLOT_MATRIX',
      hudCallsign: 'JUSTICIAR_02 // BALLOT_MATRIX',
      civicMission: 'Contemplate nonpartisan sample ballot offices and civic propositions, locking deliberate choices prior to entering the booth.',
      civicRole: 'Contemplate nonpartisan sample ballot offices and civic propositions, locking deliberate choices prior to entering the booth.'
    },
    {
      id: 'order-3-queue',
      orderId: 'order-3-queue',
      shortId: 'order-3',
      romanNumeral: 'III',
      name: 'Sir Percival of the Queue',
      title: 'Order III — Sir Percival of the Queue (Line Steadfastness & Voter Protection)',
      motto: 'HOLD THE LINE // GUARD THE FRANCHISE',
      sceneId: 'order-3-queue',
      armorNotes: 'Heavy siege great-helm and fortress pavise tower shield engraved with the statutory In-Line Voting Right Mandate.',
      armorDescription: 'Heavy siege great-helm and fortress pavise tower shield engraved with the statutory In-Line Voting Right Mandate.',
      hudDesignation: 'SENTINEL_03 // QUEUE_PROTECTION',
      hudCallsign: 'SENTINEL_03 // QUEUE_PROTECTION',
      civicMission: 'Stand fast in queue before poll closing and uphold statutory voter rights, provisional ballot rules, and hotline access.',
      civicRole: 'Stand fast in queue before poll closing and uphold statutory voter rights, provisional ballot rules, and hotline access.'
    },
    {
      id: 'order-4-champion',
      orderId: 'order-4-champion',
      shortId: 'order-4',
      romanNumeral: 'IV',
      name: 'Sovereign Champion of November III',
      title: 'Order IV — Sovereign Champion of November III (Cast Seal & Civic Crest Minting)',
      motto: 'SEAL CAST // AEGIS ETERNAL',
      sceneId: 'order-4-champion',
      armorNotes: 'Crowned Maximilian fluted full plate with radiant sun-crest rondels and the sealed November III civic standard.',
      armorDescription: 'Crowned Maximilian fluted full plate with radiant sun-crest rondels and the sealed November III civic standard.',
      hudDesignation: 'CHAMPION_04 // SEAL_MINT_STUDIO',
      hudCallsign: 'CHAMPION_04 // SEAL_MINT_STUDIO',
      civicMission: "Cast the November 3 ballot and mint a verifiable Bill-Atkinson-dithered 'I VOTED — NOV 3, 2026' heraldic crest.",
      civicRole: "Cast the November 3 ballot and mint a verifiable Bill-Atkinson-dithered 'I VOTED — NOV 3, 2026' heraldic crest."
    }
  ],
  readinessGauntlet: [
    {
      id: 'step-1',
      stepId: 'step-1',
      stepNumber: 1,
      title: 'Verify Registration & Precinct Location',
      hudCode: 'GAUNTLET_01 // ROLL_RECON',
      tacticalObjective: 'Confirm active registration status and exact precinct polling address for Tuesday, November 3, 2026.',
      description: 'Confirm active registration status and exact precinct polling address for Tuesday, November 3, 2026.',
      instructions: 'Check official state/local election roll lookup and note precinct room number.',
      actionHint: 'Check official state/local election roll lookup and note precinct room number.',
      orderId: 'order-1-recon',
      required: true
    },
    {
      id: 'step-2',
      stepId: 'step-2',
      stepNumber: 2,
      title: 'Confirm Accepted Voter ID & Provisional Ballot Rights',
      hudCode: 'GAUNTLET_02 // WARRANT_ID',
      tacticalObjective: 'Pack required or backup voter identification and know your statutory right to cast a provisional ballot if challenged.',
      description: 'Pack required or backup voter identification and know your statutory right to cast a provisional ballot if challenged.',
      instructions: 'Verify state ID rules and remember: never leave a polling place without casting a regular or provisional ballot.',
      actionHint: 'Verify state ID rules and remember: never leave a polling place without casting a regular or provisional ballot.',
      orderId: 'order-1-recon',
      required: true
    },
    {
      id: 'step-3',
      stepId: 'step-3',
      stepNumber: 3,
      title: 'Lock Sample Ballot & Proposition Choices',
      hudCode: 'GAUNTLET_03 // BALLOT_LOCK',
      tacticalObjective: 'Review all 6 sample ballot offices and civic propositions below so you enter the voting booth prepared.',
      description: 'Review all 6 sample ballot offices and civic propositions below so you enter the voting booth prepared.',
      instructions: 'Use the Sample Ballot Simulator below to lock your selections and export or print your reference sheet.',
      actionHint: 'Use the Sample Ballot Simulator below to lock your selections and export or print your reference sheet.',
      orderId: 'order-2-warrant',
      required: true
    },
    {
      id: 'step-4',
      stepId: 'step-4',
      stepNumber: 4,
      title: 'Plan Transit & Poll-Closing Buffer Window',
      hudCode: 'GAUNTLET_04 // QUEUE_VECTOR',
      tacticalObjective: 'Schedule arrival well before local poll close and commit the In-Line Voting Right Mandate to memory.',
      description: 'Schedule arrival well before local poll close and commit the In-Line Voting Right Mandate to memory.',
      instructions: 'Arrive prior to local poll close; if queued before closing time, stay in line—your right to vote is protected by law.',
      actionHint: 'Arrive prior to local poll close; if queued before closing time, stay in line—your right to vote is protected by law.',
      orderId: 'order-3-queue',
      required: true
    },
    {
      id: 'step-5',
      stepId: 'step-5',
      stepNumber: 5,
      title: 'Cast Ballot on November 3 & Mint Civic Seal',
      hudCode: 'GAUNTLET_05 // SEAL_MINT',
      tacticalObjective: 'Submit your official ballot on Tuesday, November 3, 2026 and mint your Atkinson-dithered I VOTED crest.',
      description: 'Submit your official ballot on Tuesday, November 3, 2026 and mint your Atkinson-dithered I VOTED crest.',
      instructions: 'Verify ballot submission at the precinct scanner, then customize and export your heraldic crest below.',
      actionHint: 'Verify ballot submission at the precinct scanner, then customize and export your heraldic crest below.',
      orderId: 'order-4-champion',
      required: true
    }
  ],
  sampleBallotContests: [
    {
      id: 'contest-1',
      contestId: 'contest-1',
      category: 'FEDERAL OFFICE',
      code: 'FED-REP-01',
      title: 'United States Representative — Congressional District',
      summary: 'Two-year federal legislative mandate representing district constituents in the U.S. House of Representatives.',
      plainLanguageSummary: 'Two-year federal legislative mandate representing district constituents in the U.S. House of Representatives.',
      fiscalImpact: 'Direct oversight of federal appropriations, infrastructure grants, and civic technology standards.',
      pros: 'Candidate A emphasizes local transit modernization and election security grants.',
      cons: 'Candidate B prioritizes regulatory streamlining and municipal tax relief.',
      options: ['CANDIDATE A', 'CANDIDATE B', 'WRITE-IN / OTHER', 'UNDECIDED'],
      defaultSelection: 'UNDECIDED'
    },
    {
      id: 'contest-2',
      contestId: 'contest-2',
      category: 'STATE OFFICE',
      code: 'STATE-EXEC-02',
      title: 'Governor & Statewide Constitutional Officers',
      summary: 'Four-year state executive mandate overseeing state agencies, emergency readiness, and statutory administration.',
      plainLanguageSummary: 'Four-year state executive mandate overseeing state agencies, emergency readiness, and statutory administration.',
      fiscalImpact: 'Shapes the biennial state budget, education funding formulas, and statewide infrastructure bonds.',
      pros: 'Candidate A proposes expanded public school endowments and regional rail corridors.',
      cons: 'Candidate B proposes small-business tax credits and expedited permitting.',
      options: ['CANDIDATE A', 'CANDIDATE B', 'WRITE-IN / OTHER', 'UNDECIDED'],
      defaultSelection: 'UNDECIDED'
    },
    {
      id: 'contest-3',
      contestId: 'contest-3',
      category: 'MUNICIPAL CHARTER',
      code: 'PROP-CHARTER-03',
      title: 'Municipal Charter Amendment — Independent Redistricting & Ethics Commission',
      summary: 'Establishes an 11-member nonpartisan citizen commission to draw municipal ward boundaries and audit public contracts.',
      plainLanguageSummary: 'Establishes an 11-member nonpartisan citizen commission to draw municipal ward boundaries and audit public contracts.',
      fiscalImpact: 'Estimated $1.2M annual administrative allocation (0.04% of municipal general fund).',
      pros: 'FOR removes partisan conflict of interest from ward boundary drawing and strengthens open-records enforcement.',
      cons: 'AGAINST argues elected council members should retain direct accountability over redistricting.',
      options: ['FOR', 'AGAINST', 'UNDECIDED'],
      defaultSelection: 'UNDECIDED'
    },
    {
      id: 'contest-4',
      contestId: 'contest-4',
      category: 'INFRASTRUCTURE BOND',
      code: 'BOND-INFRA-04',
      title: 'Clean Water, Grid Resilience & Transit Modernization Bond',
      summary: 'Authorizes $450M in general obligation bonds to replace lead water mains, harden microgrids, and expand electric bus fleets.',
      plainLanguageSummary: 'Authorizes $450M in general obligation bonds to replace lead water mains, harden microgrids, and expand electric bus fleets.',
      fiscalImpact: 'Financed over 25 years via existing debt-service millage without raising baseline residential property tax rates.',
      pros: 'FOR accelerates critical water pipe replacement and unlocks 2:1 federal matching funds.',
      cons: 'AGAINST cautions against long-term municipal bond obligations during higher interest cycles.',
      options: ['FOR', 'AGAINST', 'UNDECIDED'],
      defaultSelection: 'UNDECIDED'
    },
    {
      id: 'contest-5',
      contestId: 'contest-5',
      category: 'CIVIC TECHNOLOGY',
      code: 'INIT-ALGO-05',
      title: 'Digital Privacy & Public Algorithmic Transparency Initiative',
      summary: 'Requires municipal agencies to publish open-source algorithmic impact assessments and prohibits warrantless biometric surveillance.',
      plainLanguageSummary: 'Requires municipal agencies to publish open-source algorithmic impact assessments and prohibits warrantless biometric surveillance.',
      fiscalImpact: 'Minimal net fiscal cost ($350K annual audit compliance offset by software procurement savings).',
      pros: 'FOR protects resident data privacy and ensures public auditability of automated civic decision systems.',
      cons: 'AGAINST raises concerns about additional procurement review steps for vendor software.',
      options: ['FOR', 'AGAINST', 'UNDECIDED'],
      defaultSelection: 'UNDECIDED'
    },
    {
      id: 'contest-6',
      contestId: 'contest-6',
      category: 'LOCAL LEVY',
      code: 'LEVY-LIB-06',
      title: 'Public School & Evening Library Civic Access Renewal Levy',
      summary: 'Renews an existing 8-year local levy funding universal after-school STEM labs and 7-day neighborhood library hours.',
      plainLanguageSummary: 'Renews an existing 8-year local levy funding universal after-school STEM labs and 7-day neighborhood library hours.',
      fiscalImpact: 'Renews existing $18 per $100,000 assessed valuation levy with no increase over current tax bills.',
      pros: 'FOR preserves evening library hours, free community broadband terminals, and youth maker labs.',
      cons: 'AGAINST favors sunsetting dedicated levies in favor of general-fund budget appropriations.',
      options: ['FOR', 'AGAINST', 'UNDECIDED'],
      defaultSelection: 'UNDECIDED'
    }
  ],
  voterRightsAndHotlines: {
    inLineMandateHeadline: 'STAY IN LINE IF QUEUED BEFORE POLL CLOSE ON NOVEMBER 3',
    inLineMandateDetail: 'If you are in line before polls close on November 3, stay in line—your right to cast a ballot is protected by law.',
    hotlines: [
      {
        id: 'hotline-en',
        code: '866-OUR-VOTE',
        phone: '866-OUR-VOTE',
        phoneDisplay: '866-OUR-VOTE (866-687-8683)',
        phoneNumeric: '1-866-687-8683',
        numeric: '866-687-8683',
        language: 'English',
        languages: 'English',
        organization: 'Election Protection Coalition',
        sponsor: 'Election Protection Coalition'
      },
      {
        id: 'hotline-es',
        code: '888-VE-Y-VOTA',
        phone: '888-VE-Y-VOTA',
        phoneDisplay: '888-VE-Y-VOTA (888-839-8682)',
        phoneNumeric: '1-888-839-8682',
        numeric: '888-839-8682',
        language: 'Español',
        languages: 'Spanish / Español',
        organization: 'NALEO Educational Fund',
        sponsor: 'NALEO Educational Fund'
      },
      {
        id: 'hotline-api',
        code: '888-API-VOTE',
        phone: '888-API-VOTE',
        phoneDisplay: '888-API-VOTE (888-274-8683)',
        phoneNumeric: '1-888-274-8683',
        numeric: '888-274-8683',
        language: 'Asian Languages',
        languages: 'Asian Languages (Mandarin, Cantonese, Korean, Vietnamese, Tagalog, Urdu, Hindi, Bengali)',
        organization: 'APIAVote & Asian Americans Advancing Justice',
        sponsor: 'APIAVote & AAJC'
      },
      {
        id: 'hotline-ar',
        code: '844-YALLA-US',
        phone: '844-YALLA-US',
        phoneDisplay: '844-YALLA-US (844-925-5287)',
        phoneNumeric: '1-844-925-5287',
        numeric: '844-925-5287',
        language: 'Arabic',
        languages: 'Arabic / العربية',
        organization: 'Arab American Institute',
        sponsor: 'Arab American Institute'
      }
    ],
    rights: RIGHTS_CATALOG,
    legalRights: RIGHTS_CATALOG,
    cardinalRights: RIGHTS_CATALOG
  }
});

/**
 * Builds O(1) secondary lookup hash maps for a dataset catalog.
 * @param {object} dataset
 */
function buildCatalogIndexes(dataset = DEFAULT_ELECTION_DATASET) {
  const zonesById = new Map();
  const ordersById = new Map();
  const stepsById = new Map();
  const contestsById = new Map();

  const zones = Array.isArray(dataset?.pollClosingZones)
    ? dataset.pollClosingZones
    : DEFAULT_ELECTION_DATASET.pollClosingZones;
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    const id = z.zoneId || z.id;
    if (id) {
      zonesById.set(id, z);
      zonesById.set(String(id).toUpperCase(), z);
    }
  }

  const orders = Array.isArray(dataset?.knightOrders)
    ? dataset.knightOrders
    : DEFAULT_ELECTION_DATASET.knightOrders;
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    if (o.orderId) ordersById.set(o.orderId, o);
    if (o.id) ordersById.set(o.id, o);
    if (o.shortId) ordersById.set(o.shortId, o);
  }

  const steps = Array.isArray(dataset?.readinessGauntlet)
    ? dataset.readinessGauntlet
    : DEFAULT_ELECTION_DATASET.readinessGauntlet;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const id = s.stepId || s.id;
    if (id) stepsById.set(id, s);
  }

  const contests = Array.isArray(dataset?.sampleBallotContests)
    ? dataset.sampleBallotContests
    : DEFAULT_ELECTION_DATASET.sampleBallotContests;
  for (let i = 0; i < contests.length; i++) {
    const c = contests[i];
    const id = c.contestId || c.id;
    if (id) contestsById.set(id, c);
  }

  return { zonesById, ordersById, stepsById, contestsById };
}

const DEFAULT_INDEXES = buildCatalogIndexes(DEFAULT_ELECTION_DATASET);

/**
 * O(1) dataset lookup helper for poll closing zones (`EST`..`HST`).
 * @param {string} zoneId
 * @param {object} [dataset=DEFAULT_ELECTION_DATASET]
 * @returns {object|null}
 */
export function getDatasetZoneById(zoneId, dataset = DEFAULT_ELECTION_DATASET) {
  if (!zoneId) return DEFAULT_INDEXES.zonesById.get('EST') || null;
  const key = String(zoneId).trim().toUpperCase();
  if (dataset === DEFAULT_ELECTION_DATASET || !dataset) {
    return DEFAULT_INDEXES.zonesById.get(key) || null;
  }
  const zones = Array.isArray(dataset.pollClosingZones) ? dataset.pollClosingZones : [];
  return zones.find((z) => (z.zoneId || z.id) === key) || DEFAULT_INDEXES.zonesById.get(key) || null;
}

/**
 * O(1) dataset lookup helper for Knight Orders (supports both `'order-1'` and `'order-1-recon'`).
 * @param {string} orderId
 * @param {object} [dataset=DEFAULT_ELECTION_DATASET]
 * @returns {object|null}
 */
export function getDatasetOrderById(orderId, dataset = DEFAULT_ELECTION_DATASET) {
  if (!orderId) return DEFAULT_INDEXES.ordersById.get('order-1-recon') || null;
  const key = String(orderId).trim();
  const canonical = ORDER_ID_CANONICAL_MAP[key] || key;
  if (dataset === DEFAULT_ELECTION_DATASET || !dataset) {
    return DEFAULT_INDEXES.ordersById.get(canonical) || DEFAULT_INDEXES.ordersById.get(key) || null;
  }
  const orders = Array.isArray(dataset.knightOrders) ? dataset.knightOrders : [];
  return (
    orders.find((o) => o.orderId === canonical || o.id === canonical || o.shortId === key) ||
    DEFAULT_INDEXES.ordersById.get(canonical) ||
    null
  );
}

/**
 * Canonicalizes a state or payload object into a deterministic string for FNV-1a hashing.
 * Excludes volatile envelope metadata (`checksum`, `lastSavedIso`, `storageMode`) so
 * checksums are 100% reproducible across export/import and cross-tab sync.
 * @param {any} input
 * @returns {string}
 */
function canonicalizeForChecksum(input) {
  if (typeof input === 'string') return input;
  if (input === null || input === undefined || typeof input !== 'object') {
    return JSON.stringify(input);
  }

  // Extract core state whether passed a full snapshot envelope or nested state object
  const src = input.state && typeof input.state === 'object' && !Array.isArray(input.state)
    ? { ...input.state, ...input }
    : input;

  const selectedZone = typeof src.selectedZone === 'string' ? src.selectedZone : 'EST';
  const completedSteps = Array.isArray(src.completedSteps)
    ? [...src.completedSteps].map(String).sort()
    : [];

  const rawBallot = src.ballotSelections && typeof src.ballotSelections === 'object'
    ? src.ballotSelections
    : {};
  const sortedBallotKeys = Object.keys(rawBallot).sort();
  const ballotSelections = {};
  for (let i = 0; i < sortedBallotKeys.length; i++) {
    const k = sortedBallotKeys[i];
    ballotSelections[k] = String(rawBallot[k]);
  }

  const rawDither = src.ditherConfig || src.studio || {};
  const contrastVal = Number.isFinite(Number(rawDither.contrast))
    ? Number(rawDither.contrast)
    : Number.isFinite(Number(rawDither.contrastGain))
      ? Number(rawDither.contrastGain)
      : 1.0;

  const ditherConfig = {
    kernel: String(rawDither.kernel || 'atkinson-1bit'),
    palette: String(rawDither.palette || 'obsidian-bone'),
    threshold: Number.isFinite(Number(rawDither.threshold)) ? Math.round(Number(rawDither.threshold)) : 128,
    pixelScale: Number.isFinite(Number(rawDither.pixelScale)) ? Math.round(Number(rawDither.pixelScale)) : 1,
    contrast: Number(contrastVal.toFixed(4)),
    animateLight: Boolean(rawDither.animateLight !== undefined ? rawDither.animateLight : true)
  };

  const rawCrest = src.crestConfig || src.crest || {};
  const crestConfig = {
    callsign: String(rawCrest.callsign ?? 'KNIGHT OF PRECINCT 04'),
    orderId: String(rawCrest.orderId || 'order-4-champion'),
    kernel: String(rawCrest.kernel || 'atkinson-1bit'),
    palette: String(rawCrest.palette || 'obsidian-bone'),
    sealMinted: Boolean(rawCrest.sealMinted)
  };

  const canonicalPayload = {
    version: 1,
    electionDate: String(src.electionDate || '2026-11-03'),
    selectedZone,
    completedSteps,
    ballotSelections,
    ditherConfig,
    crestConfig
  };

  return JSON.stringify(canonicalPayload);
}

/**
 * Pure 32-bit FNV-1a checksum computation.
 * Uses offset basis `0x811c9dc5` and prime `0x01000193` via `Math.imul`.
 * Returns an 8-character zero-padded lowercase hexadecimal string.
 *
 * @param {string|object} input
 * @returns {string} 8-character hex string (e.g. `"1a2b3c4d"`)
 */
export function computeFnv1aChecksum(input) {
  const str = typeof input === 'string' ? input : canonicalizeForChecksum(input);
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export const computeChecksum = computeFnv1aChecksum;

/**
 * Computes deterministic Knight Rank & Order progression from completed step count.
 * @param {number} count
 * @returns {{ unlockedKnightRank: string, unlockedOrderId: string }}
 */
function resolveKnightRank(count) {
  if (count >= 5) {
    return {
      unlockedKnightRank: 'Sovereign Champion of November III',
      unlockedOrderId: 'order-4-champion'
    };
  }
  if (count === 4) {
    return {
      unlockedKnightRank: 'Sentinel of the November Queue',
      unlockedOrderId: 'order-3-queue'
    };
  }
  if (count === 3) {
    return {
      unlockedKnightRank: 'Sworn Guardian of the Ballot',
      unlockedOrderId: 'order-2-warrant'
    };
  }
  if (count === 2) {
    return {
      unlockedKnightRank: 'Knight-Justiciar of the Warrant',
      unlockedOrderId: 'order-2-warrant'
    };
  }
  if (count === 1) {
    return {
      unlockedKnightRank: 'Vanguard Scout of the Roll',
      unlockedOrderId: 'order-1-recon'
    };
  }
  return {
    unlockedKnightRank: 'Initiate of the Roll',
    unlockedOrderId: 'order-1-recon'
  };
}

/**
 * Materializes derived readiness and sample ballot telemetry metrics.
 * @param {string[]} completedSteps
 * @param {Record<string, string>} ballotSelections
 * @param {object} [dataset=DEFAULT_ELECTION_DATASET]
 */
function materializeDerivedMetrics(completedSteps, ballotSelections, dataset = DEFAULT_ELECTION_DATASET) {
  const totalSteps = Array.isArray(dataset?.readinessGauntlet)
    ? dataset.readinessGauntlet.length
    : 5;
  const completedCount = Array.isArray(completedSteps) ? completedSteps.length : 0;
  const readinessPercentage = totalSteps > 0
    ? Math.min(100, Math.round((completedCount / totalSteps) * 100))
    : 0;

  const { unlockedKnightRank, unlockedOrderId } = resolveKnightRank(completedCount);

  const contests = Array.isArray(dataset?.sampleBallotContests)
    ? dataset.sampleBallotContests
    : DEFAULT_ELECTION_DATASET.sampleBallotContests;
  const totalContests = contests.length || 6;

  let ballotCompletionCount = 0;
  if (ballotSelections && typeof ballotSelections === 'object') {
    for (let i = 0; i < contests.length; i++) {
      const cid = contests[i].contestId || contests[i].id;
      const choice = ballotSelections[cid];
      if (typeof choice === 'string' && choice.trim() !== '' && choice.toUpperCase() !== 'UNDECIDED') {
        ballotCompletionCount++;
      }
    }
  }

  const ballotLockRatio = `${ballotCompletionCount}/${totalContests}`;

  return {
    readinessPercentage,
    completedStepCount: completedCount,
    completedStepsCount: completedCount,
    totalSteps,
    totalStepCount: totalSteps,
    totalStepsCount: totalSteps,
    unlockedKnightRank,
    unlockedOrderId,
    ballotCompletionCount,
    totalContests,
    totalBallotContests: totalContests,
    ballotLockRatio
  };
}

/**
 * Normalizes and validates raw state fields against the immutable domain catalog.
 */
function normalizeCoreState(raw = {}, indexes = DEFAULT_INDEXES) {
  const src = raw && typeof raw === 'object'
    ? (raw.state && typeof raw.state === 'object' && !Array.isArray(raw.state) ? { ...raw.state, ...raw } : raw)
    : {};

  // 1. Selected Zone
  const rawZone = typeof src.selectedZone === 'string' ? src.selectedZone.trim().toUpperCase() : 'EST';
  const selectedZone = VALID_ZONES.includes(rawZone) ? rawZone : 'EST';

  // 2. Completed Readiness Steps (preserve canonical order step-1..step-5, filter phantom IDs)
  const rawSteps = Array.isArray(src.completedSteps) ? src.completedSteps : [];
  const stepSet = new Set();
  for (let i = 0; i < rawSteps.length; i++) {
    const id = String(rawSteps[i]).trim();
    if (indexes.stepsById.has(id) || CANONICAL_STEP_IDS.includes(id)) {
      stepSet.add(id);
    }
  }
  const completedSteps = CANONICAL_STEP_IDS.filter((id) => stepSet.has(id));

  // 3. Sample Ballot Selections
  const ballotSelections = {};
  for (let i = 0; i < CANONICAL_CONTEST_IDS.length; i++) {
    ballotSelections[CANONICAL_CONTEST_IDS[i]] = 'UNDECIDED';
  }
  const rawBallot = src.ballotSelections && typeof src.ballotSelections === 'object'
    ? src.ballotSelections
    : {};
  for (const [k, v] of Object.entries(rawBallot)) {
    if ((indexes.contestsById.has(k) || CANONICAL_CONTEST_IDS.includes(k)) && typeof v === 'string' && v.trim() !== '') {
      ballotSelections[k] = v.trim();
    }
  }

  // 4. Dither Studio Configuration
  const rawDither = {
    ...(src.studio && typeof src.studio === 'object' ? src.studio : {}),
    ...(src.ditherConfig && typeof src.ditherConfig === 'object' ? src.ditherConfig : {})
  };
  const kernel = VALID_KERNELS.includes(rawDither.kernel) ? rawDither.kernel : 'atkinson-1bit';
  const palette = VALID_PALETTES.includes(rawDither.palette) ? rawDither.palette : 'obsidian-bone';
  const rawThreshold = Number(rawDither.threshold);
  const threshold = Number.isFinite(rawThreshold)
    ? Math.max(1, Math.min(254, Math.round(rawThreshold)))
    : 128;
  const rawScale = Number(rawDither.pixelScale);
  const pixelScale = Number.isFinite(rawScale)
    ? Math.max(1, Math.min(4, Math.round(rawScale)))
    : 1;
  const rawContrast = Number.isFinite(Number(rawDither.contrast))
    ? Number(rawDither.contrast)
    : Number.isFinite(Number(rawDither.contrastGain))
      ? Number(rawDither.contrastGain)
      : 1.0;
  const contrast = Math.max(0.5, Math.min(2.0, Number(rawContrast.toFixed(4))));
  const rawAngle = Number(rawDither.lightAngle);
  const lightAngle = Number.isFinite(rawAngle) ? rawAngle : 0.65;
  const animateLight = rawDither.animateLight !== undefined ? Boolean(rawDither.animateLight) : true;

  const ditherConfig = {
    kernel,
    palette,
    threshold,
    pixelScale,
    contrast,
    contrastGain: contrast,
    lightAngle,
    animateLight
  };

  // 5. Crest Studio Configuration
  const rawCrest = {
    ...(src.crest && typeof src.crest === 'object' ? src.crest : {}),
    ...(src.crestConfig && typeof src.crestConfig === 'object' ? src.crestConfig : {})
  };
  const rawCallsign = typeof rawCrest.callsign === 'string' ? rawCrest.callsign.trim() : '';
  const callsign = (rawCallsign || 'KNIGHT OF PRECINCT 04').slice(0, 42);
  const rawOrderId = typeof rawCrest.orderId === 'string' ? rawCrest.orderId.trim() : 'order-4-champion';
  const orderId = indexes.ordersById.has(rawOrderId) ? rawOrderId : 'order-4-champion';
  const crestKernel = VALID_KERNELS.includes(rawCrest.kernel) ? rawCrest.kernel : kernel;
  const crestPalette = VALID_PALETTES.includes(rawCrest.palette) ? rawCrest.palette : palette;
  const sealMinted = Boolean(rawCrest.sealMinted);
  const mintedIsoVal = typeof rawCrest.mintedAtIso === 'string'
    ? rawCrest.mintedAtIso
    : typeof rawCrest.mintedAt === 'string'
      ? rawCrest.mintedAt
      : null;

  const crestConfig = {
    callsign,
    orderId,
    kernel: crestKernel,
    palette: crestPalette,
    sealMinted,
    mintedAtIso: sealMinted ? (mintedIsoVal || '2026-11-03T18:00:00.000Z') : null,
    mintedAt: sealMinted ? (mintedIsoVal || '2026-11-03T18:00:00.000Z') : null
  };

  return {
    selectedZone,
    completedSteps,
    ballotSelections,
    ditherConfig,
    crestConfig
  };
}

/**
 * Constructs a complete, dual-compatible snapshot envelope with synchronized
 * top-level and nested `.state`, `.studio`, `.crest`, and `.metrics` views.
 */
function buildSnapshotEnvelope(core, meta, dataset = DEFAULT_ELECTION_DATASET) {
  const completedSteps = [...core.completedSteps];
  const ballotSelections = { ...core.ballotSelections };
  const ditherConfig = { ...core.ditherConfig };
  const studio = { ...core.ditherConfig };
  const crestConfig = { ...core.crestConfig };
  const crest = { ...core.crestConfig };
  const metrics = materializeDerivedMetrics(completedSteps, ballotSelections, dataset);

  const checksumInput = {
    version: 1,
    electionDate: '2026-11-03',
    selectedZone: core.selectedZone,
    completedSteps,
    ballotSelections,
    ditherConfig,
    crestConfig
  };
  const checksum = computeFnv1aChecksum(checksumInput);

  const nestedState = {
    completedSteps,
    ballotSelections,
    selectedZone: core.selectedZone,
    ditherConfig,
    studio,
    crestConfig,
    crest,
    metrics
  };

  return {
    version: 1,
    schemaVersion: '1.0.0',
    revision: meta.revision,
    electionDate: '2026-11-03',
    lastSavedIso: meta.lastSavedIso,
    storageMode: meta.storageMode,
    checksum,
    selectedZone: core.selectedZone,
    completedSteps,
    ballotSelections,
    ditherConfig,
    studio,
    crestConfig,
    crest,
    metrics,
    state: nestedState
  };
}

/**
 * Creates a defensive clone of a snapshot so caller mutations cannot corrupt internal store state
 * (preventing Non-Repeatable Reads and Direct Mutation Side-Effects).
 */
function cloneSnapshot(snap) {
  const completedSteps = [...snap.completedSteps];
  const ballotSelections = { ...snap.ballotSelections };
  const ditherConfig = { ...snap.ditherConfig };
  const studio = { ...snap.ditherConfig };
  const crestConfig = { ...snap.crestConfig };
  const crest = { ...snap.crestConfig };
  const metrics = { ...snap.metrics };

  return {
    version: snap.version,
    schemaVersion: snap.schemaVersion,
    revision: snap.revision,
    electionDate: snap.electionDate,
    lastSavedIso: snap.lastSavedIso,
    storageMode: snap.storageMode,
    checksum: snap.checksum,
    selectedZone: snap.selectedZone,
    completedSteps,
    ballotSelections,
    ditherConfig,
    studio,
    crestConfig,
    crest,
    metrics,
    state: {
      completedSteps: [...completedSteps],
      ballotSelections: { ...ballotSelections },
      selectedZone: snap.selectedZone,
      ditherConfig: { ...ditherConfig },
      studio: { ...studio },
      crestConfig: { ...crestConfig },
      crest: { ...crest },
      metrics: { ...metrics }
    }
  };
}

/**
 * Determines whether an argument passed to `createCivicStore(arg1, arg2)` is an options configuration object
 * versus an initial state override object.
 */
function isOptionsArgument(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return (
    'storage' in obj ||
    'storageKey' in obj ||
    'initialDataset' in obj ||
    'dataset' in obj ||
    'initialState' in obj
  );
}

/**
 * Creates a deterministic Copy-on-Write (CoW) Civic Store instance.
 *
 * Supports both calling conventions:
 * - `createCivicStore(options)`
 * - `createCivicStore(initialState, options)`
 *
 * @param {object} [arg1={}]
 * @param {object} [arg2={}]
 */
export function createCivicStore(arg1 = {}, arg2 = {}) {
  let initialStateArg = {};
  let options = {};

  if (isOptionsArgument(arg1) && Object.keys(arg2 || {}).length === 0) {
    options = arg1;
    initialStateArg = arg1.initialState || {};
  } else {
    initialStateArg = arg1 || {};
    options = arg2 || {};
  }

  const storageKey = typeof options.storageKey === 'string' && options.storageKey.trim() !== ''
    ? options.storageKey.trim()
    : STORAGE_KEY;
  const dataset = options.initialDataset || options.dataset || DEFAULT_ELECTION_DATASET;
  const indexes = dataset === DEFAULT_ELECTION_DATASET
    ? DEFAULT_INDEXES
    : buildCatalogIndexes(dataset);

  const memoryLedger = new Map();
  let storageBackend = null;
  let storageMode = 'MEMORY_FALLBACK';
  let recoveryCount = 0;

  // 1. Storage Backend Capability Probe
  const candidateStorage = options.storage !== undefined
    ? options.storage
    : typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? globalThis.localStorage
      : null;

  if (
    candidateStorage &&
    typeof candidateStorage.getItem === 'function' &&
    typeof candidateStorage.setItem === 'function'
  ) {
    try {
      const probeKey = `${storageKey}__probe`;
      candidateStorage.setItem(probeKey, '1');
      if (typeof candidateStorage.removeItem === 'function') {
        candidateStorage.removeItem(probeKey);
      }
      storageBackend = candidateStorage;
      storageMode = 'LOCAL_STORAGE';
    } catch (_err) {
      storageBackend = null;
      storageMode = 'MEMORY_FALLBACK';
    }
  }

  /**
   * Reads raw serialized JSON string from active persistence medium.
   */
  function readRawStorage() {
    if (storageMode === 'LOCAL_STORAGE' && storageBackend) {
      try {
        return storageBackend.getItem(storageKey);
      } catch (_err) {
        storageMode = 'MEMORY_FALLBACK';
        storageBackend = null;
      }
    }
    return memoryLedger.get(storageKey) ?? null;
  }

  /**
   * Atomically writes serialized JSON snapshot to active persistence medium,
   * failing over to `MEMORY_FALLBACK` on `QuotaExceededError` or `SecurityError`.
   */
  function writeRawStorage(serializedJson) {
    memoryLedger.set(storageKey, serializedJson);
    if (storageMode === 'LOCAL_STORAGE' && storageBackend) {
      try {
        storageBackend.setItem(storageKey, serializedJson);
        return true;
      } catch (_err) {
        storageMode = 'MEMORY_FALLBACK';
        storageBackend = null;
        return false;
      }
    }
    return true;
  }

  // 2. Cold-Boot Hydration & Checksum Verification
  let initialCore = normalizeCoreState(initialStateArg, indexes);
  let initialRevision = 0;
  let initialSavedIso = new Date().toISOString();

  const existingRaw = readRawStorage();
  if (typeof existingRaw === 'string' && existingRaw.trim() !== '') {
    try {
      const parsed = JSON.parse(existingRaw);
      const isSchemaValid =
        parsed &&
        typeof parsed === 'object' &&
        (parsed.version === 1 || parsed.schemaVersion === '1.0.0') &&
        (!parsed.electionDate || parsed.electionDate === '2026-11-03');

      if (isSchemaValid) {
        const hydratedCore = normalizeCoreState(parsed, indexes);
        const expectedChecksum = computeFnv1aChecksum({
          version: 1,
          electionDate: '2026-11-03',
          ...hydratedCore
        });

        if (!parsed.checksum || parsed.checksum === expectedChecksum) {
          // Merge explicit initialStateArg overrides on top of hydrated state if provided
          const hasExplicitOverrides = Object.keys(initialStateArg || {}).length > 0;
          initialCore = hasExplicitOverrides
            ? normalizeCoreState(
                {
                  ...hydratedCore,
                  ...initialStateArg,
                  ditherConfig: {
                    ...hydratedCore.ditherConfig,
                    ...(initialStateArg.ditherConfig || initialStateArg.studio || {})
                  },
                  crestConfig: {
                    ...hydratedCore.crestConfig,
                    ...(initialStateArg.crestConfig || initialStateArg.crest || {})
                  }
                },
                indexes
              )
            : hydratedCore;
          initialRevision = Number.isInteger(parsed.revision) && parsed.revision >= 0 ? parsed.revision : 0;
          initialSavedIso = typeof parsed.lastSavedIso === 'string' ? parsed.lastSavedIso : initialSavedIso;
        } else {
          // Corrupt checksum: quarantine and reset to clean baseline
          recoveryCount++;
        }
      } else {
        recoveryCount++;
      }
    } catch (_err) {
      recoveryCount++;
    }
  }

  let currentSnapshot = buildSnapshotEnvelope(
    initialCore,
    {
      revision: initialRevision,
      lastSavedIso: initialSavedIso,
      storageMode
    },
    dataset
  );

  // Persist initial snapshot envelope
  writeRawStorage(JSON.stringify(currentSnapshot));
  if (currentSnapshot.storageMode !== storageMode) {
    currentSnapshot = buildSnapshotEnvelope(
      initialCore,
      {
        revision: initialRevision,
        lastSavedIso: initialSavedIso,
        storageMode
      },
      dataset
    );
  }

  const listeners = new Set();

  function notifyListeners() {
    if (listeners.size === 0) return;
    const snapClone = cloneSnapshot(currentSnapshot);
    for (const listener of listeners) {
      try {
        listener(snapClone, snapClone.metrics);
      } catch (_err) {
        // Isolate subscriber callback errors so store state remains consistent
      }
    }
  }

  /**
   * Atomic Copy-on-Write (CoW) state transition commit pipeline.
   * @param {object} nextCoreCandidate
   * @param {{ persist?: boolean }} [commitOptions={ persist: true }]
   */
  function commitStateTransition(nextCoreCandidate, commitOptions = { persist: true }) {
    const normalizedCore = normalizeCoreState(nextCoreCandidate, indexes);
    const nextRevision = currentSnapshot.revision + 1;
    const nextSavedIso = new Date().toISOString();

    let nextSnap = buildSnapshotEnvelope(
      normalizedCore,
      {
        revision: nextRevision,
        lastSavedIso: nextSavedIso,
        storageMode
      },
      dataset
    );

    const shouldPersist = commitOptions?.persist !== false;
    if (shouldPersist) {
      const serialized = JSON.stringify(nextSnap);
      writeRawStorage(serialized);
      if (nextSnap.storageMode !== storageMode) {
        nextSnap = buildSnapshotEnvelope(
          normalizedCore,
          {
            revision: nextRevision,
            lastSavedIso: nextSavedIso,
            storageMode
          },
          dataset
        );
      }
    } else {
      memoryLedger.set(storageKey, JSON.stringify(nextSnap));
    }

    currentSnapshot = nextSnap;
    notifyListeners();
    return cloneSnapshot(currentSnapshot);
  }

  // 3. Cross-Tab OCC + CRDT Set-Union Storage Listener (Browser Environments)
  let windowStorageHandler = null;
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.addEventListener === 'function' &&
    storageMode === 'LOCAL_STORAGE'
  ) {
    windowStorageHandler = (event) => {
      if (!event || event.key !== storageKey || typeof event.newValue !== 'string') return;
      try {
        const incoming = JSON.parse(event.newValue);
        if (!incoming || typeof incoming !== 'object') return;
        const incomingCore = normalizeCoreState(incoming, indexes);
        const recomputedChecksum = computeFnv1aChecksum({
          version: 1,
          electionDate: '2026-11-03',
          ...incomingCore
        });
        if (incoming.checksum !== recomputedChecksum) return;

        const incomingRev = Number.isInteger(incoming.revision) ? incoming.revision : 0;
        if (incomingRev < currentSnapshot.revision) return;

        // CRDT Set-Union for completed readiness steps and minted seal
        const mergedStepsSet = new Set([
          ...currentSnapshot.completedSteps,
          ...incomingCore.completedSteps
        ]);
        const mergedSteps = CANONICAL_STEP_IDS.filter((id) => mergedStepsSet.has(id));
        const mergedSealMinted = Boolean(
          currentSnapshot.crestConfig.sealMinted || incomingCore.crestConfig.sealMinted
        );

        const mergedCore = {
          ...incomingCore,
          completedSteps: mergedSteps,
          crestConfig: {
            ...incomingCore.crestConfig,
            sealMinted: mergedSealMinted,
            mintedAtIso:
              incomingCore.crestConfig.mintedAtIso ||
              currentSnapshot.crestConfig.mintedAtIso ||
              (mergedSealMinted ? new Date().toISOString() : null)
          }
        };

        currentSnapshot = buildSnapshotEnvelope(
          mergedCore,
          {
            revision: Math.max(currentSnapshot.revision, incomingRev),
            lastSavedIso: incoming.lastSavedIso || new Date().toISOString(),
            storageMode
          },
          dataset
        );
        notifyListeners();
      } catch (_err) {
        // Ignore malformed cross-tab frames
      }
    };
    try {
      globalThis.addEventListener('storage', windowStorageHandler);
    } catch (_err) {
      windowStorageHandler = null;
    }
  }

  // --- Public Store API Surface & Aliases ---

  function getState() {
    return cloneSnapshot(currentSnapshot);
  }

  function getDerivedMetrics(customDataset = dataset) {
    return materializeDerivedMetrics(
      currentSnapshot.completedSteps,
      currentSnapshot.ballotSelections,
      customDataset || dataset
    );
  }

  function getDataset() {
    return dataset;
  }

  function toggleStep(stepId, forceState) {
    if (typeof stepId !== 'string' || !stepId.trim()) {
      return getState();
    }
    const id = stepId.trim();
    if (!indexes.stepsById.has(id) && !CANONICAL_STEP_IDS.includes(id)) {
      return getState();
    }
    const stepSet = new Set(currentSnapshot.completedSteps);
    const shouldComplete = typeof forceState === 'boolean' ? forceState : !stepSet.has(id);
    if (shouldComplete) {
      stepSet.add(id);
    } else {
      stepSet.delete(id);
    }
    const nextSteps = CANONICAL_STEP_IDS.filter((s) => stepSet.has(s));
    return commitStateTransition({
      ...currentSnapshot,
      completedSteps: nextSteps
    });
  }

  function completeGauntletStep(stepId) {
    return toggleStep(stepId, true);
  }

  function setBallotSelection(contestId, optionValue) {
    if (typeof contestId !== 'string' || !contestId.trim()) {
      return getState();
    }
    const cid = contestId.trim();
    if (!indexes.contestsById.has(cid) && !CANONICAL_CONTEST_IDS.includes(cid)) {
      return getState();
    }
    const choice = typeof optionValue === 'string' && optionValue.trim() !== ''
      ? optionValue.trim()
      : 'UNDECIDED';

    return commitStateTransition({
      ...currentSnapshot,
      ballotSelections: {
        ...currentSnapshot.ballotSelections,
        [cid]: choice
      }
    });
  }

  function setSelectedZone(zoneId) {
    if (typeof zoneId !== 'string' || !zoneId.trim()) {
      return getState();
    }
    const zid = zoneId.trim().toUpperCase();
    if (!VALID_ZONES.includes(zid)) {
      return getState();
    }
    return commitStateTransition({
      ...currentSnapshot,
      selectedZone: zid
    });
  }

  function updateDitherConfig(partialConfig = {}, commitOptions) {
    if (!partialConfig || typeof partialConfig !== 'object') {
      return getState();
    }
    const keys = Object.keys(partialConfig);
    // Ephemeral write partitioning: if only lightAngle is updated during animation orbit,
    // default to in-memory update unless caller explicitly passes `{ persist: true }`.
    const isLightAngleOnly = keys.length === 1 && keys[0] === 'lightAngle';
    const effectiveOptions = commitOptions !== undefined
      ? commitOptions
      : { persist: !isLightAngleOnly };

    return commitStateTransition(
      {
        ...currentSnapshot,
        ditherConfig: {
          ...currentSnapshot.ditherConfig,
          ...partialConfig
        }
      },
      effectiveOptions
    );
  }

  function updateCrestConfig(partialCrest = {}) {
    if (!partialCrest || typeof partialCrest !== 'object') {
      return getState();
    }
    return commitStateTransition({
      ...currentSnapshot,
      crestConfig: {
        ...currentSnapshot.crestConfig,
        ...partialCrest
      }
    });
  }

  function mintCivicSeal(callsign, orderId) {
    const nextCrest = {
      ...currentSnapshot.crestConfig,
      sealMinted: true,
      mintedAtIso: new Date().toISOString()
    };
    if (typeof callsign === 'string' && callsign.trim() !== '') {
      nextCrest.callsign = callsign.trim().slice(0, 42);
    }
    if (typeof orderId === 'string' && orderId.trim() !== '' && indexes.ordersById.has(orderId.trim())) {
      nextCrest.orderId = orderId.trim();
    }
    return commitStateTransition({
      ...currentSnapshot,
      crestConfig: nextCrest
    });
  }

  function updateState(partial = {}) {
    if (!partial || typeof partial !== 'object') {
      return getState();
    }
    const nested = partial.state && typeof partial.state === 'object' ? partial.state : {};
    const mergedDither = {
      ...currentSnapshot.ditherConfig,
      ...(partial.studio || {}),
      ...(partial.ditherConfig || {}),
      ...(nested.studio || {}),
      ...(nested.ditherConfig || {})
    };
    const mergedCrest = {
      ...currentSnapshot.crestConfig,
      ...(partial.crest || {}),
      ...(partial.crestConfig || {}),
      ...(nested.crest || {}),
      ...(nested.crestConfig || {})
    };
    const mergedBallot = {
      ...currentSnapshot.ballotSelections,
      ...(partial.ballotSelections || {}),
      ...(nested.ballotSelections || {})
    };
    const nextSteps = Array.isArray(partial.completedSteps)
      ? partial.completedSteps
      : Array.isArray(nested.completedSteps)
        ? nested.completedSteps
        : currentSnapshot.completedSteps;
    const nextZone = partial.selectedZone || nested.selectedZone || currentSnapshot.selectedZone;

    return commitStateTransition({
      selectedZone: nextZone,
      completedSteps: nextSteps,
      ballotSelections: mergedBallot,
      ditherConfig: mergedDither,
      crestConfig: mergedCrest
    });
  }

  function exportSnapshotJson() {
    return JSON.stringify(currentSnapshot, null, 2);
  }

  /**
   * Strictly validates and imports a serialized JSON snapshot.
   * Enforces fail-fast verification: throws a descriptive Error if JSON is malformed,
   * schema fields are invalid, or the 32-bit FNV-1a checksum mismatches.
   *
   * @param {string} jsonString
   */
  function importSnapshotJson(jsonString) {
    if (typeof jsonString !== 'string' || jsonString.trim() === '') {
      throw new Error('CIVIC_STORE_INVALID_SNAPSHOT: Snapshot input must be a non-empty JSON string.');
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (err) {
      throw new Error(`CIVIC_STORE_INVALID_JSON: Failed to parse snapshot JSON (${err.message}).`);
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('CIVIC_STORE_INVALID_SNAPSHOT: Root snapshot payload must be a JSON object.');
    }

    if (parsed.electionDate !== undefined && parsed.electionDate !== '2026-11-03') {
      throw new Error(
        `CIVIC_STORE_INVALID_ELECTION_DATE: Expected electionDate "2026-11-03", received "${parsed.electionDate}".`
      );
    }

    if (typeof parsed.checksum !== 'string' || !/^[0-9a-f]{8}$/i.test(parsed.checksum)) {
      throw new Error('CIVIC_STORE_MISSING_CHECKSUM: Snapshot is missing a valid 8-char hex FNV-1a checksum.');
    }

    // Verify FNV-1a checksum both against raw canonicalized payload and normalized core
    const rawExpectedChecksum = computeFnv1aChecksum(parsed);
    const normalizedCore = normalizeCoreState(parsed, indexes);
    const normalizedExpectedChecksum = computeFnv1aChecksum({
      version: 1,
      electionDate: '2026-11-03',
      ...normalizedCore
    });

    const providedChecksum = parsed.checksum.toLowerCase();
    if (providedChecksum !== rawExpectedChecksum && providedChecksum !== normalizedExpectedChecksum) {
      throw new Error(
        `CIVIC_STORE_CHECKSUM_MISMATCH: Expected FNV-1a checksum "${normalizedExpectedChecksum}", received "${providedChecksum}".`
      );
    }

    return commitStateTransition(normalizedCore, { persist: true });
  }

  function resetStore() {
    const cleanCore = normalizeCoreState({}, indexes);
    return commitStateTransition(cleanCore, { persist: true });
  }

  function subscribe(listenerFn) {
    if (typeof listenerFn !== 'function') {
      return () => {};
    }
    listeners.add(listenerFn);
    return () => {
      listeners.delete(listenerFn);
    };
  }

  function destroy() {
    listeners.clear();
    if (windowStorageHandler && typeof globalThis !== 'undefined' && typeof globalThis.removeEventListener === 'function') {
      try {
        globalThis.removeEventListener('storage', windowStorageHandler);
      } catch (_err) {
        // Ignore cleanup errors
      }
      windowStorageHandler = null;
    }
  }

  function getDiagnostics() {
    return {
      storageKey,
      storageMode,
      revision: currentSnapshot.revision,
      checksum: currentSnapshot.checksum,
      recoveryCount,
      subscriberCount: listeners.size
    };
  }

  return {
    // State & Metrics Readers
    getState,
    getDerivedMetrics,
    getReadinessStats: getDerivedMetrics,
    getDataset,
    getDiagnostics,

    // Readiness Gauntlet Mutators
    toggleStep,
    toggleReadinessStep: toggleStep,
    completeGauntletStep,

    // Sample Ballot Mutators
    setBallotSelection,
    setBallotChoice: setBallotSelection,

    // Timezone Mutators
    setSelectedZone,
    setZone: setSelectedZone,

    // Dither Studio Parameter Mutators
    updateDitherConfig,
    setStudioParams: updateDitherConfig,

    // Crest Studio & Minting Mutators
    updateCrestConfig,
    setCrestParams: updateCrestConfig,
    mintCivicSeal,
    mintSeal: mintCivicSeal,

    // Generic Partial State Updater
    updateState,

    // Snapshot Import / Export / Reset
    exportSnapshotJson,
    exportJson: exportSnapshotJson,
    importSnapshotJson,
    importJson: importSnapshotJson,
    resetStore,
    resetState: resetStore,
    reset: resetStore,

    // Pub/Sub Listener Registration & Lifecycle
    subscribe,
    destroy
  };
}
