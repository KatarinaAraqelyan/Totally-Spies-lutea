# Lutea Cycle-Phase Benchmark

A small, fully reproducible benchmark for **menstrual cycle-phase classification from
consumer-wearable signals** — the core task Lutea performs. It ships as a reusable
scientific asset: a labeled dataset, a documented split protocol, an evaluation metric,
and a zero-dependency harness that reproduces every number below.

> **Scope, stated up front.** This is a *demonstration* benchmark: 88 labeled days from
> a single subject (3 cycles). It validates that the method works and gives future teams
> a runnable harness — it is **not** a population-scale validation. The same harness runs
> unchanged on a larger labeled corpus (e.g. mcPHASES) for a real multi-subject number.

## The prediction task

**Task A — daily cycle-phase classification (binary).**
For each day, predict whether the subject is in the **Luteal** phase (post-ovulation) or
the **Follicular** phase (pre-ovulation), from physiological signals alone. The menstrual
cycle-phase label is **held out** and used only as ground truth.

Why binary Luteal vs Follicular: the biphasic temperature curve separates the *warm*
luteal phase from the *cool* pre-ovulatory phase. Menstrual, follicular and the
fertile/ovulation window all precede the post-ovulation temperature rise, so they map to
the Follicular (negative) class; Luteal is the positive class.

## Dataset

- **File:** [`cycle-phase-benchmark.csv`](cycle-phase-benchmark.csv) — 88 labeled days, 3 cycles, 1 subject.
- **Schema (one row per day):** `date, age, phase, rhr, rmssd, nightly_temperature, sleep_efficiency, respiratory_rate, spo2, steps` — the canonical daily schema Lutea ingests, matching the shape of the mcPHASES longitudinal record.
- **Ground-truth label:** the `phase` column (`Menstrual`, `Follicular`, `Fertility`, `Luteal`). Mapped for Task A as `Luteal → Luteal`, everything else `→ Follicular`.

## Split protocol

Splits are drawn **by whole cycle**, never by day, so no cycle's days leak across the
train / validation / test boundary.

- **Canonical split:** 60 / 20 / 20 by cycle — 60% of cycles for training, 20% for validation, 20% held out for test. Intended for **supervised** entrants that learn parameters.
- **This demo set (3 cycles):** the baseline below is *parameter-free* (nothing to train), so at this size the 60/20/20 split rounds to 2 train / 1 val / 0 test cycles — no test cycle to spare. We therefore report the baseline via **leave-one-cycle-out cross-validation** (each cycle scored as the held-out fold) plus the as-deployed global number. A supervised entrant with more cycles would use the 60/20/20 split directly.

## Baseline: Lutea's deployed estimator

The reference method is Lutea's own production logic (`public/app.js` →
`buildPhaseModel()`), reproduced verbatim in the harness:

> Take the nightly skin-temperature series, find the value at the **55th percentile** of
> its distribution, and label every day at or above that threshold **Luteal**, below it
> **Follicular**.

It is unsupervised, deterministic, and explainable — no black box, no learned weights.

## Results

Reproduce with: `node docs/benchmark/evaluate.js`

| Evaluation | Accuracy | F1 (Luteal) | Notes |
|---|---:|---:|---|
| **As-deployed** (global threshold, all 88 days) | 100.0% | 100.0% | TP 40 · FP 0 · FN 0 · TN 48 |
| **Leave-one-cycle-out CV** (3 folds) | 97.7% | 97.5% | mean across held-out cycles |
| Per-cycle — cycle 1 | 96.6% | 96.3% | 29 days |
| Per-cycle — cycle 2 | 100.0% | 100.0% | 30 days |
| Per-cycle — cycle 3 | 96.6% | 96.3% | 29 days |

**Reading the numbers honestly.** The as-deployed 100% reflects that this demonstration
export is a clean, strongly biphasic curve — a global threshold separates it perfectly.
The **leave-one-cycle-out figure (97.7%)** is the more trustworthy estimate of
generalisation, and the small per-cycle drop (a day or two misassigned near each phase
boundary, where temperature transitions gradually) is the realistic error mode. On noisier
real-world data expect lower numbers; that is exactly what running this harness on a larger
corpus would quantify.

## Extending this benchmark

- **Bigger data:** point the harness at any CSV with the same schema — `node docs/benchmark/evaluate.js path/to/data.csv`. On mcPHASES this yields a multi-subject number.
- **Further tasks** the same dataset and harness structure support: **Task B** — ovulation-occurred detection (biphasic shift ≥ 0.20 °C per cycle, yes/no); **Task C** — STRAW+10 menopause-transition stage from the cycle log (see [`../research/scientific-grounding.md`](../research/scientific-grounding.md)).
- **Stronger baselines:** any supervised classifier can be dropped in and compared on the same split protocol and metric.

## Files

| File | What it is |
|---|---|
| `BENCHMARK.md` | This document — task, dataset, splits, metric, results. |
| `cycle-phase-benchmark.csv` | The labeled benchmark dataset (88 days, 3 cycles). |
| `evaluate.js` | Zero-dependency Node harness that reproduces every number above. |
