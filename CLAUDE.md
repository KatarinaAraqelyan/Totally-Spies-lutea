# Lutea — Agent Guide

Onboarding for whoever (human or AI) works on this next. Read this first, then the code.

## What Lutea is
Turns the data a woman's wearable (Fitbit / Oura / Garmin) already records into a
menstrual-cycle + hormonal-health read-out. No new device, no diagnosis. The read-out
runs entirely in the browser; an optional backend only grows a shared reference cohort.

**Not medical advice.** Percentages are pattern-match strengths, not disease odds. Keep
that framing in every string you touch.

## The one rule that shapes everything
The site publishes as **static files from the repo root**, but the homepage today lives at
`public/index.html`. For the live site to serve it, either the platform serves `public/`
or a root `index.html` must exist. Check this before assuming a deploy works.
There is **no build step** — plain HTML/CSS/JS. Edit files, that's the deliverable.

## Layout
| Path | What it is |
|---|---|
| `public/index.html` | Whole UI: markup + all CSS in one `<style>` block. |
| `public/app.js` | The client engine — parsing, cycle model, insights, journal. One IIFE. |
| `public/lutea-test-sample.csv` | 88-day synthetic export to exercise the pipeline. |
| `api/server.js` | Optional Node backend: donation, cohort learning, facility lookup. |
| `nginx.conf`, `docker-compose.yml` | Serving, rate-limiting, `/api` proxy, deploy. |
| `docs/` | Data manifest + cited scientific grounding. Numbers trace back here. |

## How the client engine works (`public/app.js`)
Read it top-to-bottom; it's ordered as data flows. Key pieces:

- **`SIGNALS`** — the dictionary of the 8 signals it reads (rhr, temp, hrv, cycle, sleep,
  resp, spo2, steps), each with the column-name aliases used to match messy CSV headers
  and the plain-language "what does this mean?" copy shown in the explainer modal.
- **`store` + `phaseByDay`** — the single source of truth. `store[key]` is a
  `Map(dayIndex → {sum,n})` per signal; `phaseByDay` maps a day to its cycle phase.
  **Everything downstream reads from these two.** CSV upload AND the manual journal both
  write here, so they share one code path.
- **`ingest()`** — parses a CSV, matches columns to signals, fills `store`/`phaseByDay`.
- **`buildPhaseModel()`** — decides follicular vs. luteal per day, by priority:
  period log → temperature biphasic split → resting-HR rhythm. This gates every insight.
- **`renderInsights()` / `computeRisks()`** — the read-out cards and the "what to check
  next" screening scores. All heuristics calibrated to published ranges (see `docs/`),
  not a trained model. Scores are 0–100 signal-strength, capped by `clamp`.
- **`rhrPercentile()` + `NHANES_RHR`** — ranks resting HR against real CDC reference data;
  a live cohort (`COHORT_REF`, fetched from `/api/cohort`) supersedes it once a 5-year age
  band has ≥50 donated samples.
- **Period Journal** (section 8b) — manual calendar for users with no wearable. Tapping a
  day opens an entry; **period-day (yes/no) is the only required field**, the 7 signals are
  optional. Entries persist in `localStorage` (`lutea_journal_v1`) and feed the SAME
  `store`/`phaseByDay`, so a hand-logged cycle drives the exact same insights. `recompute()`
  re-renders everything; the calendar replays saved entries on load.

## How the backend works (`api/server.js`)
Dependency-free Node, all data on disk under `$LUTEA_DATA` (default `/data`). Endpoints:
- `GET /api/cohort` — the learned reference distribution (means, SDs, per-band RHR
  percentiles). Public, no auth.
- `POST /api/donate` — de-identified daily records. Requires `consent: true` (GDPR Art. 6).
  `sanitize()` rejects identifier-shaped fields, coarsens age to 5-year bands and dates to
  relative day offsets, then `updateAgg()` folds signals in via **Welford's online algorithm**
  and rebuilds `cohort.json`. Real learning, not a mock.
- `GET /api/nearby?lat&lon` — proxies OpenStreetMap Overpass (races mirrors, caches ~1 km
  cells) for the "find where to check" button. Client never hits Overpass directly.

De-identification happens **twice**: once on-device before sending, once here server-side.

## Working agreement
- **Smallest change that works.** Match the surrounding style; don't rewrite what works.
- **One source of truth.** New signals or inputs flow through `store`/`phaseByDay` — don't
  add a parallel data path.
- **Verify before "done".** There's no GUI here; drive `app.js` headlessly (jsdom) or reason
  through the DOM. State plainly what you checked and what you couldn't.
- **Every number is grounded.** If you add a threshold or score, cite it in `docs/` and, if
  user-facing, in the Methods & Algorithms modal. No invented values.

## UI floors (non-negotiable)
- Max 2 font families (serif for headings, sans for body); type on a fixed scale.
- Body text ≥16px, line-height ≥1.5, contrast ≥4.5:1.
- Spacing on a 4px scale (4 / 8 / 12 / 16 / 24 / 32). Motion smooth and eased.
- Mobile-first: works at 390px wide, no sideways scroll, tap targets ≥44px.
- One consistent look across every screen (colors, spacing, buttons, motion).

## Git
Work on a branch, open a PR to `main` — never commit straight to `main`. Keep the tree
clean; whatever's in the folder when you finish is what ships.
