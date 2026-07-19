# Lutea: Data & Methods

Hack-Nation Challenge 05 · Foundation Models for Women's Hormonal Health.
This document states, transparently, every dataset and reference we used, how each
one is used, and where every file lives. Nothing about our methods is hidden or invented.

## Datasets we used

The challenge recommended two open data sources (mcPHASES, NHANES). We engaged both:

| Dataset | Provided by challenge | How we use it | Shipped in this repo? |
|---|---|---|---|
| **NHANES 2021–2023** (CDC) | Yes | Quantitative reference. The resting-heart-rate percentile card compares a user against real US-female pulse distributions. Values are derived from the NHANES `BPXO_L` oscillometric pulse file (mean of 3 seated readings) joined to `DEMO_L` demographics: n = 1,236 women aged 18–45, per 5-year age band, breakpoints [p5, p25, p50, p75, p95]. Baked into `public/app.js` (`NHANES_RHR`). | Reference values: yes (in code, cited). Raw NHANES files: no (public at CDC, link below). |
| **mcPHASES** (PhysioNet) | Yes | Schema anchor. Lutea ingests exactly the longitudinal, multimodal record mcPHASES represents (Fitbit-style wearable signals + menstrual-cycle phase + sleep + symptoms). Our input schema and the analysis pipeline are built to accept this shape. | No, PhysioNet credentialed access + data-use agreement prohibit re-hosting. Users bring their own equivalent export (Fitbit / Oura / Garmin). |

**Honest scope note:** NHANES is the dataset whose numbers we actually embedded and
compute against. mcPHASES is the schema/benchmark we target and cite; we do not
redistribute it (licensing), and we make no claim to have trained a model on it.
Analysis runs entirely on the user's own device from their own export, no third-party
personal data is used, stored, or shipped.

### Source links
- NHANES 2021–2023 pulse: https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/BPXO_L.htm
- NHANES 2021–2023 demographics: https://wwwn.cdc.gov/nchs/nhanes/
- mcPHASES: https://physionet.org/content/mcphases

## Clinical frameworks & literature we used

Every threshold and formula is grounded in published science, no invented numbers.
Full evidence with grades and citations: [`docs/research/scientific-grounding.md`](research/scientific-grounding.md).

- **STRAW+10** menopause-transition staging (Harlow et al., *Menopause* 2012;19(4):387–395), drives the menopause-transition score from the user's cycle log.
- Autonomic / temperature / sleep evidence for the perimenopause transition (see the grounding doc for the graded citation list).
- **Endometriosis was deliberately NOT scored**, the only autonomic evidence is a single small case-control study (Hao et al., *Sci Rep* 2021) with no wearable validation. Scoring it would misrepresent the science, so we left it out and say so. This refusal is documented in-product and in the grounding doc.

## Preprocessing & evaluation (transparent by design)

- **Input schema** (one row per day): `date, age, phase, rhr, rmssd, nightly_temperature, sleep_efficiency, respiratory_rate, spo2, steps`. See the sample file below.
- **Cycle phase resolution**: explicit period log if present → otherwise a biphasic split of the nightly skin-temperature curve → otherwise a weaker resting-HR rhythm split. Order = descending trust.
- **RHR percentile**: linear interpolation of the user's mean against the NHANES age-band breakpoints.
- **Screening scores** are *signal-strength* values (0–100, "how strongly your pattern matches"), explicitly **not** probabilities of disease. Thresholds and formulas are listed in-product ("Methods & Algorithms") and in the grounding doc.
- **Donation & cohort learning**: donated exports are de-identified in two stages (client + server), reduced to physiological signals only, dates coarsened to relative day offsets, age coarsened to 5-year bands (k-anonymity / HIPAA Safe-Harbor style). The reference cohort is updated with **Welford's online mean/variance** + per-age-band RHR percentile reservoirs, transparent, reproducible statistics, no black-box weights. Once a band reaches ≥50 donated samples its learned percentiles supersede the static NHANES table for that band.

## Files in this repository

| Path | What it is |
|---|---|
| `public/index.html` | The app (UI, in-product Methods & Algorithms, API & donation pages). |
| `public/app.js` | Client analysis engine: CSV parsing, cycle detection, screening scores, NHANES reference table, donation flow. |
| `public/lutea-test-sample.csv` | **Synthetic** 88-day sample export (schema above) for demoing the pipeline. Not real patient data. |
| `api/server.js` | Donation + cohort-learning backend (de-identification, Welford learning) and the facility-lookup proxy. |
| `nginx.conf` · `docker-compose.yml` | Serving + rate-limiting + deployment. |
| `docs/DATA.md` | This document. |
| `docs/research/scientific-grounding.md` | Cited scientific grounding for every threshold. |
| `docs/Challenge_05.pdf` | The original challenge brief, for reviewer context. |
| `assets-src/` | Source for the icon / social-preview images. |

## Data we do NOT ship (and why)

- **Raw NHANES / mcPHASES files**, public / credentialed at source; we link instead of re-hosting.
- **Donated user data** (`corpus.jsonl`, `agg.json`, `cohort.json`), generated at runtime, de-identified, and git-ignored. Only the aggregate reference statistics are ever served, never any individual record.
