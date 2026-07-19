# Lutea Benchmark 2 — Cohort-learning convergence

Companion to the [cycle-phase benchmark](BENCHMARK.md). That one scores a
*prediction task*; this one validates the **learning mechanism** behind the
shared reference cohort. No black boxes: it drives the **same code that runs in
production** and reports a metric you can re-derive.

**Claim under test.** From the README and the demo:
> *"The cohort learns transparently. Once an age band has enough samples its
> learned percentiles supersede the static NHANES table."*

This benchmark turns that sentence into a number.

## What it does
1. Draws synthetic donations whose resting-HR values follow the **published
   NHANES 2021–2023** female distribution, per age band (piecewise-linear
   inverse-CDF sampling through the [p5, p25, p50, p75, p95] breakpoints).
2. Feeds every donation through the **exact production pipeline** exported by
   [`../../api/server.js`](../../api/server.js):
   `sanitize()` (two-stage de-identification + physiological range checks) →
   `updateAgg()` (Welford online mean/variance + per-band RHR reservoir) →
   `buildCohort()` (percentile recomputation). The algorithm is **imported, not
   re-implemented**, so the benchmark validates what actually ships.
3. At a grid of cumulative sample sizes `n`, measures how far the **learned**
   percentiles sit from the NHANES reference they should converge to.

## Metric
`MAE = mean( |learned_p − NHANES_p| )` over the five breakpoints, in **bpm**.
Lower is better. Reported per band and pooled across bands vs `n`.

## Result (seed `0x1abe1`, reproducible)
| n (samples/band) | pooled MAE | status |
|---|---|---|
| 5 (cold start) | **6.84 bpm** | below threshold |
| 50 (supersede) | **2.19 bpm** | learned percentiles now drive the app |
| 3000 (warm) | **0.17 bpm** | 97.5% lower than cold start |

The learned reference collapses onto the published clinical values as the cohort
grows — the "it gets sharper for everyone" claim, quantified. Full curve and
per-band breakdown in [`cohort-convergence-results.json`](cohort-convergence-results.json);
the API page renders it live from `public/benchmark-results.json`.

## Honest notes (transparent methods)
- **This validates the *mechanism*, not a medical outcome.** It proves the
  online statistics converge to their reference given data from that reference —
  i.e. the learning code is correct and unbiased. It is **not** a claim that
  wearable RHR predicts any disease.
- **Band mapping.** The server coarsens age to 5-year bands keyed by lower bound
  (`floor(age/5)*5`), and `app.js` reads the learned cohort with that same key.
  NHANES ships a 7-year youngest band (18–24), so each 5-year cohort band is
  compared against the NHANES band it falls inside. Mapping is stated in the
  script and here.
- **Supersede threshold (n ≥ 50)** matches `cohortRHR()` in `app.js`.
- A built-in **de-identification sanity check** feeds identifier-shaped keys
  (email, device MAC, phone, address) and an identifier-shaped value (UUID)
  through `sanitize()` and asserts none survive into the cohort, and that age is
  coarsened to a band. The run exits non-zero if anything leaks or if
  convergence regresses — so this doubles as a regression test.

## Run

```bash
node docs/benchmark/cohort_convergence.js
```

Writes `docs/benchmark/cohort-convergence-results.json` (canonical) and
`public/benchmark-results.json` (served copy the app charts). Deterministic:
same seed → identical output.
