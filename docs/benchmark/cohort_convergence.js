'use strict';
/* ============================================================================
 * Lutea benchmark · Cohort-learning convergence  (Benchmark 2)
 * ----------------------------------------------------------------------------
 * Companion to the cycle-phase benchmark in this folder. Where that one scores
 * a prediction task, this one validates the LEARNING MECHANISM behind the
 * shared reference cohort.
 *
 * Claim under test (from the README / demo):
 *   "The cohort learns transparently. Once an age band has enough samples its
 *    learned percentiles supersede the static NHANES table."
 *
 * This turns that claim into a measured, reproducible fact:
 *   1. Draw synthetic donations whose resting-HR values follow the *published*
 *      NHANES 2021-2023 female distribution (per age band).
 *   2. Feed them through the EXACT production pipeline exported by api/server.js
 *      — sanitize() (two-stage de-identification + range checks) → updateAgg()
 *      (Welford online stats + per-band RHR reservoir) → buildCohort()
 *      (percentile recomputation). No re-implementation of the algorithm.
 *   3. At a grid of cumulative sample sizes n, measure how far the *learned*
 *      percentiles sit from the NHANES reference they should converge to.
 *
 * Metric:  MAE = mean |learned_p − NHANES_p| over the 5 breakpoints [p5..p95],
 *          in bpm. Lower is better. Reported per band and pooled vs n.
 *
 * Reproducible: a fixed-seed PRNG (mulberry32) drives every draw, so the
 * results JSON is byte-stable across runs on the same Node.
 *
 * Run:   node docs/benchmark/cohort_convergence.js
 * ==========================================================================*/

const fs = require('fs');
const path = require('path');
const { sanitize, updateAgg, buildCohort } = require('../../api/server.js');

/* ---- reference truth: NHANES 2021-2023 female resting pulse ----------------
 * Identical breakpoints to public/app.js `NHANES_RHR` (single source of truth
 * for the reference; kept here explicitly so the benchmark states what it
 * compares against). [p5, p25, p50, p75, p95]. */
const NHANES_RHR = {
  '18-24': [62.1, 71.7, 76.7, 84.6, 96.6],
  '25-29': [59.9, 68.3, 75.7, 82.4, 97.8],
  '30-34': [58.9, 67.3, 76.0, 83.7, 94.3],
  '35-39': [56.7, 66.3, 73.7, 79.8, 91.3],
  '40-45': [59.0, 66.7, 72.7, 81.3, 96.3],
};
const Q = [0.05, 0.25, 0.50, 0.75, 0.95];

/* The server coarsens age to 5-year bands keyed by lower bound (floor(age/5)*5),
 * and app.js reads the learned cohort with that same 5-year key. NHANES ships a
 * 7-year youngest band (18-24), so we map each 5-year cohort band onto the
 * NHANES band it falls inside. This mapping is exactly how the live app picks a
 * learned band, documented here for transparency. */
const BANDS = [
  { key: 20, ageLo: 20, ageHi: 24, nhanes: '18-24' },
  { key: 25, ageLo: 25, ageHi: 29, nhanes: '25-29' },
  { key: 30, ageLo: 30, ageHi: 34, nhanes: '30-34' },
  { key: 35, ageLo: 35, ageHi: 39, nhanes: '35-39' },
  { key: 40, ageLo: 40, ageHi: 44, nhanes: '40-45' },
];

const SEED = 0x1abe1;                 // fixed → reproducible results
const SUPERSEDE_N = 50;               // app.js threshold: learned band supersedes NHANES at n>=50
const NMAX = 3000;                    // samples per band to simulate
const GRID = [5, 10, 20, 35, 50, 75, 100, 150, 250, 500, 1000, 2000, 3000];

/* ---- deterministic PRNG (mulberry32) -------------------------------------- */
function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rand = mulberry32(SEED);

/* ---- sample a resting-HR value from a NHANES band's quantile function ------
 * Piecewise-linear inverse CDF through the 5 breakpoints, with linear tail
 * extrapolation beyond p5 / p95, clamped to a plausible physiological range.
 * By construction the empirical quantiles of these draws converge to the
 * NHANES breakpoints — which is exactly the convergence we then measure. */
function sampleRHR(bandName){
  const p = NHANES_RHR[bandName];
  const u = rand();
  let v;
  if (u <= Q[0]){
    const slope = (p[1] - p[0]) / (Q[1] - Q[0]);
    v = p[0] - (Q[0] - u) * slope;
  } else if (u >= Q[4]){
    const slope = (p[4] - p[3]) / (Q[4] - Q[3]);
    v = p[4] + (u - Q[4]) * slope;
  } else {
    let i = 0; while (i < Q.length - 1 && u > Q[i + 1]) i++;
    const f = (u - Q[i]) / (Q[i + 1] - Q[i]);
    v = p[i] + f * (p[i + 1] - p[i]);
  }
  return Math.max(35, Math.min(120, v));
}

const mean = a => a.reduce((s, x) => s + x, 0) / a.length;

/* ---- convergence run for one band ----------------------------------------- */
function runBand(band){
  let agg = { donations: 0, days: 0, signals: {}, rhrBands: {} };
  const curve = [];
  let gi = 0, n = 0;
  // one synthetic day per micro-donation → we can checkpoint at exact grid n
  // (batching donations does not change the per-value RHR reservoir statistics).
  while (n < NMAX && gi < GRID.length){
    const age = band.ageLo + Math.floor(rand() * (band.ageHi - band.ageLo + 1));
    const rec = {
      rhr: sampleRHR(band.nhanes),
      hrv: 20 + rand() * 60,
      sleep_efficiency: 78 + rand() * 20,
    };
    const san = sanitize({ consent: true, age, records: [rec] });
    updateAgg(agg, san);
    n = (agg.rhrBands[band.key] || []).length;
    while (gi < GRID.length && n >= GRID[gi]){
      const cohort = buildCohort(agg);
      const learned = cohort.rhr_by_age[String(band.key)].p;
      const truth = NHANES_RHR[band.nhanes];
      const errs = learned.map((val, i) => Math.abs(val - truth[i]));
      curve.push({ n: GRID[gi], mae: round(mean(errs), 2), maxErr: round(Math.max(...errs), 2) });
      gi++;
    }
  }
  return { key: band.key, nhanes: band.nhanes, curve };
}

/* ---- de-identification sanity: prove the same pipeline strips identifiers -- */
function deidentificationCheck(){
  const hostile = {
    consent: true, age: 33,
    records: [
      // identifier-shaped KEYS → whole record must be rejected
      { rhr: 61, email: 'jane.doe@example.com' },
      { rhr: 62, device_id: 'AA:BB:CC:DD:EE:FF' },
      { rhr: 63, phone: '+1 415 555 0198' },
      { rhr: 64, home_address: '221B Baker Street' },
      // identifier-shaped VALUE in an unknown field → record rejected
      { rhr: 65, note: '550e8400-e29b-41d4-a716-446655440000' },
      // clean record → must survive
      { rhr: 66, hrv: 44 },
    ],
  };
  const san = sanitize(hostile);
  const line = JSON.stringify(san.records);
  const leaked = /(@|baker street|415 555|AA:BB|550e8400)/i.test(line);
  return {
    records_in: hostile.records.length,
    accepted: san.records.length,
    identifiers_rejected: san.identifiersFound,
    leaked,                                  // must be false
    age_coarsened_to_band: san.band,         // 33 → 30 (5-year band)
  };
}

function round(x, d){ const m = Math.pow(10, d); return Math.round(x * m) / m; }

/* ---- ASCII sparkline for the console summary ------------------------------ */
function sparkline(values){
  const ticks = '▁▂▃▄▅▆▇█';
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  return values.map(v => ticks[Math.min(7, Math.floor((v - lo) / span * 7.999))]).join('');
}

/* ---- run --------------------------------------------------------------- */
console.log('\n  Lutea · cohort-learning convergence benchmark');
console.log('  reference: NHANES 2021-2023 female resting HR · metric: MAE(|learned − NHANES|) in bpm');
console.log('  ' + '─'.repeat(64));

const bands = BANDS.map(runBand);

// pooled curve: mean band-MAE at each grid point
const pooled = GRID.map((n, gi) => {
  const maes = bands.map(b => b.curve[gi].mae);
  const maxErrs = bands.map(b => b.curve[gi].maxErr);
  return { n, mae: round(mean(maes), 2), maxErr: round(Math.max(...maxErrs), 2), superseded: n >= SUPERSEDE_N };
});

// per-band final table
console.log('\n  Per-band MAE (bpm) vs cumulative samples n:');
console.log('  band    ' + GRID.map(n => String(n).padStart(6)).join(''));
for (const b of bands){
  console.log('  ' + (b.nhanes).padEnd(8) + b.curve.map(c => c.mae.toFixed(2).padStart(6)).join(''));
}

console.log('\n  Pooled convergence:');
console.log('     n      MAE   maxErr   status');
for (const p of pooled){
  const status = p.superseded ? 'learned supersedes NHANES' : 'below threshold';
  console.log('  ' + String(p.n).padStart(5) + '  ' + p.mae.toFixed(2).padStart(6) + '  '
    + p.maxErr.toFixed(2).padStart(6) + '   ' + status);
}
console.log('\n  MAE trend  ' + sparkline(pooled.map(p => p.mae)) + '  (n: ' + GRID[0] + ' → ' + GRID[GRID.length - 1] + ')');

const atStart = pooled[0];
const atSupersede = pooled.find(p => p.n === SUPERSEDE_N);
const atMax = pooled[pooled.length - 1];
const reductionPct = round((1 - atMax.mae / atStart.mae) * 100, 1);

const deid = deidentificationCheck();

console.log('\n  Headline:');
console.log(`    • at n=${atStart.n}  (cold start) : MAE ${atStart.mae.toFixed(2)} bpm`);
console.log(`    • at n=${atSupersede.n}  (supersede)  : MAE ${atSupersede.mae.toFixed(2)} bpm  ← learned percentiles now drive the app`);
console.log(`    • at n=${atMax.n} (warm)       : MAE ${atMax.mae.toFixed(2)} bpm  (${reductionPct}% lower than cold start)`);
console.log(`    • de-identification: ${deid.identifiers_rejected} identifier rows rejected, leaked=${deid.leaked}, age 33 → band ${deid.age_coarsened_to_band}`);
console.log('  ' + '─'.repeat(64) + '\n');

const results = {
  benchmark: 'cohort-learning-convergence',
  description: 'Learned RHR percentiles converge to the published NHANES reference as donations grow.',
  reference: 'NHANES 2021-2023 female resting HR (BPXO_L + DEMO_L)',
  metric: 'MAE(|learned_percentile − NHANES_percentile|) over [p5,p25,p50,p75,p95], bpm',
  pipeline: 'api/server.js sanitize() → updateAgg() (Welford + reservoir) → buildCohort()',
  seed: SEED,
  reproducible: true,
  supersede_threshold: SUPERSEDE_N,
  samples_per_band: NMAX,
  grid: GRID,
  headline: {
    cold_start: { n: atStart.n, mae: atStart.mae },
    at_supersede: { n: atSupersede.n, mae: atSupersede.mae },
    warm: { n: atMax.n, mae: atMax.mae },
    error_reduction_pct: reductionPct,
  },
  pooled,
  by_band: bands.map(b => ({ band_key: b.key, nhanes_band: b.nhanes, curve: b.curve })),
  deidentification: deid,
};

// canonical result (committed, next to this script) + web-served copy the
// API-page chart reads (public/ is the web root).
const canonical = path.join(__dirname, 'cohort-convergence-results.json');
const webCopy = path.join(__dirname, '..', '..', 'public', 'benchmark-results.json');
const repoRoot = path.join(__dirname, '..', '..');
fs.writeFileSync(canonical, JSON.stringify(results, null, 2) + '\n');
fs.writeFileSync(webCopy, JSON.stringify(results) + '\n');
console.log('  wrote ' + path.relative(repoRoot, canonical)
  + ' and ' + path.relative(repoRoot, webCopy) + '\n');

// non-zero exit if the claim fails: convergence must actually happen + no leak
if (deid.leaked || atMax.mae > atStart.mae || atSupersede.mae > atStart.mae){
  console.error('  BENCHMARK FAILED: convergence or de-identification regressed.');
  process.exit(1);
}
