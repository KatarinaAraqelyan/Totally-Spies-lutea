# Lutea

**Hormonal intelligence from the wearable you already own.**
Upload a Fitbit, Oura or Garmin export and Lutea reads your menstrual cycle, surfaces
the hormonal patterns hiding in the data, and flags what is worth checking with a clinician.

Live: **[lutea.administration.ae](https://lutea.administration.ae)** · Built for Hack-Nation Challenge 05 (Women's Hormonal Health).

> Not medical advice. Lutea reads consumer wearable data and cannot diagnose. Percentages are pattern-match strengths, not disease probabilities.

## What it does

- **Cycle mapping** from the signals your device already records (resting HR, HRV, skin temperature, sleep, respiration, SpO2, steps). Uses your period log if present, otherwise infers phases from the biphasic temperature curve.
- **Hormonal read-out** per cycle phase: post-ovulation temperature signature, luteal autonomic load (the measurable side of PMS), sleep efficiency.
- **Resting-HR percentile** against real NHANES 2021–2023 clinical reference data for women your age.
- **Screening** ("What to check next"): signal-strength scores for a small set of conditions, each mapped to a real test and specialist, including a STRAW+10 menopause-transition stage from your cycle log.
- **Find where to check**: nearest matching clinic, hospital, doctor or lab to you, from OpenStreetMap.
- **Data donation**: contribute your de-identified export to a shared, openly-growing reference cohort that sharpens the read-out for everyone.

## How it works

1. **Everything runs in your browser.** Your CSV is parsed on-device; no export ever leaves your machine for the analysis. There is no account and no upload step for a normal read-out.
2. **Signals → cycle → insight.** A single daily-row schema (`date, age, phase, rhr, rmssd, nightly_temperature, sleep_efficiency, respiratory_rate, spo2, steps`) feeds phase detection, the NHANES percentile, and the screening scores.
3. **Every number is grounded in published science.** Thresholds and formulas come from the clinical literature, not invented values. They are shown in-product ("Methods & Algorithms") and cited in [`docs/research/scientific-grounding.md`](docs/research/scientific-grounding.md).
4. **The cohort learns transparently.** Donated data is de-identified and folded into per-signal statistics with Welford's online algorithm; once an age band has enough samples its learned percentiles supersede the static NHANES table. No black-box model, no fabricated weights.

## API

An open research API. No key, no account. The analysis is client-side; the API only grows and shares the reference cohort.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/cohort` | The current learned reference distribution (means, SDs, per-age-band RHR percentiles). |
| `POST` | `/api/donate` | Contribute de-identified daily records. Requires explicit `consent: true`. |
| `GET` | `/api/nearby?lat&lon` | Nearest health facilities (proxied + cached OpenStreetMap lookup). |

Rate-limited and size-capped. Donations are de-identified twice (client + server): identifier-shaped fields are rejected, dates become relative day offsets, age is coarsened to 5-year bands.

## Privacy

- Read-outs never transmit your data. Donation is opt-in and consent-gated (GDPR Art. 6).
- Two-stage de-identification (k-anonymity / HIPAA Safe-Harbor style). Only physiological signals survive; individual records are never served back, only aggregates.

## Run locally

```bash
docker compose up -d --build
# static app + analysis: http://127.0.0.1:5062
```

The app (`public/`) is static and needs no backend for a read-out. The donation, cohort and facility-lookup features are served by `api/server.js` (dependency-free Node).

## Data & science

We used the challenge-recommended open sources, transparently: **NHANES 2021–2023** as the
quantitative RHR reference (baked in and cited) and **mcPHASES** as the input-schema anchor.
Full dataset manifest, preprocessing and evaluation choices, and the file inventory:
**[`docs/DATA.md`](docs/DATA.md)**.

## Benchmarks

Two small, fully reproducible benchmarks live in **[`docs/benchmark/`](docs/benchmark/)**.
Each runs the *exact production code* it measures — no separate reimplementation — so the
numbers reflect what the app actually does. Zero dependencies; reproduce with plain `node`.

| Benchmark | Question it answers | Headline result | Reproduce |
|---|---|---|---|
| **[Cycle-phase classification](docs/benchmark/BENCHMARK.md)** | Does phase detection work? Predict Luteal vs Follicular per day from temperature, phase label held out. | **97.7%** leave-one-cycle-out accuracy (88 labeled days, demonstration scope) | `node docs/benchmark/evaluate.js` |
| **[Cohort-learning convergence](docs/benchmark/COHORT-CONVERGENCE.md)** | Does the shared cohort learn correctly? Feed NHANES-drawn donations through the real `sanitize → updateAgg → buildCohort` pipeline. | Learned RHR percentiles converge to CDC reference: **MAE 6.84 → 0.17 bpm** (97.5% reduction) | `node docs/benchmark/cohort_convergence.js` |

Both ship a labeled dataset / documented protocol and a runnable harness that generalises to
larger corpora (e.g. mcPHASES) unchanged. The convergence benchmark is also visualised
live in-app.

## Repository layout

| Path | What it is |
|---|---|
| `public/index.html`, `public/app.js` | The app and the client analysis engine. |
| `public/lutea-test-sample.csv` | Synthetic 88-day sample export to try the pipeline. |
| `api/server.js` | Donation + cohort-learning + facility-lookup backend. |
| `nginx.conf`, `docker-compose.yml` | Serving, rate-limiting, deployment. |
| `docs/benchmark/` | Two reproducible benchmarks: dataset, protocol, and eval harnesses. |
| `docs/` | Data manifest, cited scientific grounding, challenge brief. |

## License

**MIT License** — see [`LICENSE`](LICENSE). The code, the NHANES-derived reference
table, the input schema, and the API are free to use, modify, and redistribute
(including commercially), so the work can be reused and built on after the hackathon.

Two clarifications, not licence restrictions:
- **Not medical advice.** Lutea reads consumer wearable data and cannot diagnose.
- **Third-party data keeps its own terms.** We do not re-host NHANES or mcPHASES;
  we link to the sources, which stay under their original CDC / PhysioNet terms.
