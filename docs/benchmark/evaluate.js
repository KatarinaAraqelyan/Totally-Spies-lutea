#!/usr/bin/env node
'use strict';
/* Lutea cycle-phase benchmark — evaluation harness.
 *
 * Task A: per-day binary cycle-phase classification, Luteal vs Follicular-phase,
 * predicted from nightly skin temperature alone (the menstrual-cycle phase label
 * is held out and used only as ground truth).
 *
 * Baseline = Lutea's own deployed estimator: the biphasic temperature split from
 * public/app.js buildPhaseModel() — threshold at the 55th percentile of the
 * nightly-temperature distribution; a day at or above it is Luteal, below it is
 * Follicular-phase. Parameter-free (no training), so it is evaluated directly on
 * the held-out labels; the train/val/test split below is documented for future
 * supervised methods and reported as a robustness check.
 *
 * Zero dependencies. Run: node docs/benchmark/evaluate.js [path-to-labeled.csv]
 */
const fs = require('fs');
const path = require('path');

const FILE = process.argv[2] || path.join(__dirname, 'cycle-phase-benchmark.csv');

/* ---- parse the labeled CSV (same canonical schema the app ingests) ---- */
function parse(text){
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.length);
  const header = lines[0].split(',').map(s => s.trim().toLowerCase());
  const col = name => header.indexOf(name);
  const iDate = col('date'), iPhase = col('phase'), iTemp = col('nightly_temperature');
  if (iDate < 0 || iPhase < 0 || iTemp < 0)
    throw new Error('CSV must have date, phase, nightly_temperature columns');
  const rows = [];
  for (let i = 1; i < lines.length; i++){
    const c = lines[i].split(',');
    const day = Math.floor(Date.parse(c[iDate]) / 86400000);
    const temp = parseFloat(c[iTemp]);
    const phase = (c[iPhase] || '').trim();
    if (!isNaN(day) && !isNaN(temp) && phase) rows.push({ day, temp, phase });
  }
  rows.sort((a, b) => a.day - b.day);
  return rows;
}

/* ---- ground truth: the biphasic curve separates the warm luteal phase from the
   cool follicular phase (menstrual, follicular and the fertile/ovulation window all
   sit BEFORE the post-ovulation temperature rise). So the honest binary label is
   Luteal (positive) vs non-Luteal follicular-phase (negative). ---- */
const truth = r => (r.phase.toLowerCase() === 'luteal' ? 'Luteal' : 'Follicular');

/* ---- baseline estimator, verbatim logic from app.js buildPhaseModel() ---- */
function predict(rows){
  const vals = rows.map(r => r.temp).slice().sort((a, b) => a - b);
  const thr = vals[Math.floor(vals.length * 0.55)];         // biphasic split point
  return rows.map(r => (r.temp >= thr ? 'Luteal' : 'Follicular'));
}

/* ---- metrics (Luteal = positive class) ---- */
function metrics(rows, pred){
  let tp = 0, fp = 0, fn = 0, tn = 0;
  rows.forEach((r, i) => {
    const t = truth(r), p = pred[i];
    if (t === 'Luteal' && p === 'Luteal') tp++;
    else if (t !== 'Luteal' && p === 'Luteal') fp++;
    else if (t === 'Luteal' && p !== 'Luteal') fn++;
    else tn++;
  });
  const acc = (tp + tn) / rows.length;
  const prec = tp + fp ? tp / (tp + fp) : 0;
  const rec = tp + fn ? tp / (tp + fn) : 0;
  const f1 = prec + rec ? 2 * prec * rec / (prec + rec) : 0;
  return { n: rows.length, tp, fp, fn, tn, acc, prec, rec, f1 };
}
const pct = x => (x * 100).toFixed(1) + '%';

/* ---- segment into cycles at each menstrual onset (for the split protocol) ---- */
function cycles(rows){
  const out = []; let cur = [];
  let prevMenstrual = false;
  for (const r of rows){
    const isMenstrual = r.phase.toLowerCase() === 'menstrual';
    if (isMenstrual && !prevMenstrual && cur.length){ out.push(cur); cur = []; }
    cur.push(r); prevMenstrual = isMenstrual;
  }
  if (cur.length) out.push(cur);
  return out;
}

/* ---- run ---- */
const rows = parse(fs.readFileSync(FILE, 'utf8'));
const cy = cycles(rows);

console.log('Lutea cycle-phase benchmark — Task A (Luteal vs Follicular from temperature)');
console.log('dataset:', path.basename(FILE), '·', rows.length, 'labeled days ·', cy.length, 'cycles\n');

// 1. As-deployed: one global threshold over the whole record (exactly what the app does)
const asDeployed = metrics(rows, predict(rows));
console.log('AS-DEPLOYED (global threshold over all days)');
console.log(`  accuracy ${pct(asDeployed.acc)}  precision ${pct(asDeployed.prec)}  recall ${pct(asDeployed.rec)}  F1 ${pct(asDeployed.f1)}`);
console.log(`  confusion: TP ${asDeployed.tp}  FP ${asDeployed.fp}  FN ${asDeployed.fn}  TN ${asDeployed.tn}\n`);

// 2. Held-out test split: 60/20/20 by whole cycles (no day leaks across splits).
//    Documented for future SUPERVISED entrants. The parameter-free baseline needs
//    no training, so when the demo set is too small to spare a test cycle we fall
//    back to leave-one-cycle-out CV (each cycle scored as the held-out fold).
const nTrain = Math.max(1, Math.round(cy.length * 0.6));
const nVal = Math.max(1, Math.round(cy.length * 0.2));
const testRows = cy.slice(nTrain + nVal).flat();
console.log(`SPLIT (by cycle, 60/20/20): train ${nTrain} · val ${nVal} · test ${cy.length - nTrain - nVal} cycles`);
if (testRows.length){
  const m = metrics(testRows, predict(testRows));
  console.log(`  test-split accuracy ${pct(m.acc)}  F1 ${pct(m.f1)}  (n=${m.n} days)\n`);
} else {
  const folds = cy.map(c => metrics(c, predict(c)));
  const mean = k => folds.reduce((a, m) => a + m[k], 0) / folds.length;
  console.log(`  test set empty at this size → leave-one-cycle-out CV over ${cy.length} folds:`);
  console.log(`  mean accuracy ${pct(mean('acc'))}  mean F1 ${pct(mean('f1'))}\n`);
}

// 3. Per-cycle robustness (leave the metric on each cycle independently)
console.log('PER-CYCLE (robustness across cycles)');
cy.forEach((c, i) => {
  const m = metrics(c, predict(c));
  console.log(`  cycle ${i + 1}: accuracy ${pct(m.acc)}  F1 ${pct(m.f1)}  (${m.n} days)`);
});
