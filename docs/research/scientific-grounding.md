# Wearable Hormonal-Health Signal Strength, Scientific Grounding

Research compiled 2026-07-19 for a women's hormonal-health app scoring condition "signal
strength" from consumer wearable daily exports (resting HR, HRV/rMSSD, nightly skin temp,
sleep efficiency, respiratory rate, SpO2, menstrual cycle/period log).

Every number below is traced to a primary published source. Where evidence is thin, that is
stated plainly. Verbatim STRAW+10 wording and the endometriosis anchor study were confirmed
directly against the primary full text, not secondary summaries.

---

## TOPIC 1, PERIMENOPAUSE / MENOPAUSE TRANSITION STAGING

### 1A. STRAW+10 cycle-variability criteria, CONFIRMED VERBATIM

Primary source (co-published, identical criteria in three journals):
> Harlow SD, Gass M, Hall JE, Lobo R, Maki P, Rebar RW, Sherman S, Sluss PM, de Villiers TJ;
> STRAW+10 Collaborative Group. "Executive summary of the Stages of Reproductive Aging
> Workshop +10: addressing the unfinished agenda of staging reproductive aging."
> **Menopause. 2012 Apr;19(4):387–395.** PMID 22344196. DOI 10.1097/gme.0b013e31824d8f40.
> PMC3340903. (Also Fertil Steril 2012;97(4):843–851; J Clin Endocrinol Metab
> 2012;97(4):1159–1168.)

Exact staging thresholds (quoted from primary full text):

| STRAW Stage | Name | Exact criterion (verbatim) |
|---|---|---|
| **-3b** | Late reproductive | Regular cycles, no length change; AMH low, antral follicle count low |
| **-3a** | Late reproductive | "subtle changes in menstrual cycle characteristics, specifically shorter cycles"; early-follicular (day 2–5) FSH rises |
| **-2** | **Early menopausal transition** | "increased variability in menstrual cycle length, defined as a **persistent difference of 7 days or more in the length of consecutive cycles.** Persistence is defined as **recurrence within 10 cycles** of the first variable length cycle." |
| **-1** | **Late menopausal transition** | "marked by the occurrence of **amenorrhea of 60 days or longer.**" |
| **0** | FMP (final menstrual period) | Defined retrospectively after 12 months of amenorrhea |
| **+1a** | Early postmenopause | "end of the 12-month period of amenorrhea required to define that the FMP has occurred" |
| **+1b / +1c** | Early postmenopause | +1b = rapid FSH/E2 change; +1c = stabilized high FSH / low E2 (~3–6 yr) |

**Load-bearing numbers, both confirmed exact:**
- Stage -2 trigger: **≥7-day persistent difference between consecutive cycle lengths**, where
  "persistent" = **recurs within 10 cycles** of the first variable cycle.
- Stage -1 trigger: **≥60 days of amenorrhea**.

No discrepancy across sources. **This is directly implementable** from a period log, it is the
canonical clinical staging standard.

### 1B. Autonomic / cardiovascular / sleep / temperature changes across the transition

Direction is consistent across the literature; the single biggest confounder throughout is
**age** (partly separable from menopause per se). Evidence-strength grades below are honest.

**HRV declines (vagal tone falls), MODERATE evidence, age-confounded**
- Direction: rMSSD, HF power, pNN50, SDNN all lower in postmenopausal vs premenopausal.
- Ramesh et al. Physiol Rep 2022;10:e15298 (PMC9127980): postmenopausal had lower LF (p=0.01)
  and HF (p<0.001) vs premenopausal high-estradiol phase. **CRITICAL CAVEAT: all HRV
  differences vanished after adjusting for age and BMI** (LF p=0.7, HF p=0.3); serum estradiol
  did not track HRV. This is the study to respect, crude decline is largely age/adiposity.
- Fernandes/de Souza et al. PLOS ONE 2019;14(12):e0225866 (PMC6961890), n=109: worse menopausal
  symptoms track lower HRV, RMSSD 22.7 (mod/intense) vs 31.4 (mild); HF 247 vs 441 ms²;
  Cohen's d ~0.4–0.7. Cross-sectional.
- No pooled meta-analysis with effect sizes exists. Literature = scatter of small
  cross-sectional studies. Grade: **moderate direction, weak attribution to menopause itself.**

**Vagal withdrawal DURING hot flashes, STRONG (event-level, SWAN-linked)**
- Thurston et al. Menopause 2016 (PMC4844776), n=215, physiologically monitored VMS: significant
  acute drop in RSA (respiratory sinus arrhythmia = vagal HF) during hot flashes vs before/after
  (interaction p<.0001), more pronounced in sleep. Strongest SWAN-adjacent autonomic finding -
  but it is event-level, not a trajectory across the transition.

**Resting heart rate rises, WEAK**
- Direction plausible (estrogen loss → reduced parasympathetic, raised sympathetic tone). No
  clean large-cohort longitudinal effect size isolating RHR change over the transition. Grade:
  mechanism + reviews only.

**Autonomic balance shifts sympathetic (LF/HF up), WEAK–MODERATE, not universal**
- Supported by symptom-graded data (LF/HF 2.02 vs 1.63). Counter-evidence: Ramesh 2022 found
  LF:HF unchanged (p=0.08, p=0.5 adjusted). Real but weaker/more confounded than the vagal
  decline.

**Self-reported sleep disturbance worsens, STRONG**
- Kravitz et al. Sleep 2008;31(7):979–990 (PMC2491500), SWAN, **N=3,045**, ages 42–52,
  multi-ethnic. Difficulty-sleeping prevalence 28.2% (Japanese) → 40.3% (Caucasian). Progression
  through the transition independently associated with sleep disturbance; VMS contribute but are
  not the sole driver.
- Baker et al. Sleep Med Clin 2018;13(3):443–456 (PMC6092036): disturbance ~16–42% premenopause,
  39–47% perimenopause, 35–60% postmenopause. Commonly cited: ~33–36% → ~61% pre→post.

**Objective (PSG/actigraphy) sleep efficiency, WEAK / DIVERGENT**
- Baker Climacteric 2023;26(3):198–205 (PMC10416747): PSG studies "have not necessarily found
  evidence of objective sleep disturbance." Some show MORE slow-wave sleep in peri/post; Lampio
  6-yr longitudinal decline attributed to **age, not FSH**. Objective sleep efficiency does NOT
  robustly decline with menopause stage per se. Important mismatch vs the subjective signal.

**Thermoneutral zone narrows in symptomatic women, STRONG mechanistically (small N)**
- Freedman & Krell, Am J Obstet Gynecol 1999;181(1):66–70 (PMID 10411797), n=20: symptomatic
  postmenopausal women had a near-zero interthreshold ("null") zone, **0.0°C ± 0.06°C vs 0.4°C**
  in asymptomatic. Any small core-temp elevation crosses the sweat threshold → hot flash.
  Mechanism now tied to hypothalamic KNDy neurons (basis of NK3R-antagonist drugs).
- VMS affect up to 80% of women; median duration 7.4 years (SWAN).

**Nocturnal hot flash → awakening / skin signal, MODERATE (wearable-relevant)**
- de Zambotti, Colrain, Javitz, Baker, Fertil Steril 2014;102(6):1708–1715, n=34, 222 events via
  sternal skin conductance during PSG: **awakening within a 3-min window in 69.4% of events**.
- Skin-conductance can flag a hot flash ~17 s before subjective awareness (PMC12274639).
- Caveat: peer-reviewed quantification of nocturnal *skin-temperature* elevation specifically
  with night sweats is thin, mostly menstrual-cycle validation + patents. Treat as
  plausible/emerging, not firmly quantified in menopause.

**Respiratory rate / SpO2, WEAK / SPARSE**
- Nocturnal SpO2 slightly lower postmenopause (progesterone withdrawal → SDB risk): Saaresranta
  et al. Respir Physiol Neurobiol 2005, small sample. No population-scale resting RR shift
  attributable to menopause independent of age/BMI/SDB. Essentially unstudied at scale.

---

## TOPIC 2, ENDOMETRIOSIS DETECTABILITY FROM WEARABLES

### 2A. Endometriosis and autonomic markers, THIN, PRELIMINARY

**The core claim rests on ONE small case-control study.** Confirmed directly against primary full
text:
- Hao M, Liu X, Rong P, Li S, Guo SW. "Reduced vagal tone in women with endometriosis and
  auricular vagus nerve stimulation as a potential therapeutic approach." **Sci Rep. 2021;11:1345.**
  DOI 10.1038/s41598-020-79750-9. PMID 33446725.
- **n=45 patients vs 42 controls (87 total).** Single center. Subtype = ovarian endometrioma only,
  advanced disease (rASRM III 53.3%, IV 44.4%).
- Significant, all reduced/shifted in patients: RMSSD ↓, pNN50 ↓, HF ↓ (all p<0.035);
  **LF/HF ↑ (p=0.0067)**; LF not significant (p=0.43). Regression confirmed (p<0.012).
- **DECISIVE CAVEAT (verified):** "None of the above measurements was found to be associated with
  the rASRM scores, menstrual phase, or severity of dysmenorrhea (all p's > 0.10)." No
  dose-response, weakens the causal story. Age itself was associated with reduced pNN50/HF/LF.

Supporting studies do NOT strengthen it much:
- Zwenger/Moreira et al. Women & Health 2021;61(10):937–946 (PMID 34719338): 81 deep-endo + CPP
  patients, **NO healthy control arm**, within-patient correlation only (lower vmHRV ↔ worse
  pain). Does not establish endo-vs-non-endo.
- Adenomyosis (a DIFFERENT disease), same group 2025 (PMC12524039), 75 vs 75: same pattern
  (RMSSD/pNN50/HF ↓, LF/HF ↑). Reinforces plausibility, not endometriosis.

**Elevated resting HR in endometriosis:** NOT demonstrated for endometriosis specifically.

**Menstrual-phase autonomic dysfunction, real, but for DYSMENORRHEA, not endometriosis:**
- Hellman et al. Sci Rep 2019;9:2705 (PMC6379479): healthy n=34 vs dysmenorrheic n=103, resting
  HR ↑ (76.9 vs 71.5, p=0.007), RMSSD ↓ (p=0.019), HF ↓. **97% primary dysmenorrhea; only 3 had
  endometriosis.**
- Wang et al. Biol Res Nurs 2016 (PMID 27052671): 66 dysmenorrheic vs 54 controls, HF ↓ during
  menses; HR/BP/LF/LF-HF no difference.
- ⚠️ Conflating dysmenorrhea autonomic data with endometriosis would OVERSTATE the case. In the
  one real endo study, HRV did not vary with menstrual phase.

**Meta-analyses on endometriosis HRV/autonomic markers: ZERO.** (Endometriosis meta-analyses that
exist, e.g. PMC11748313, cover hard CVD outcomes in registries, a different question.)

### 2B. Wearable-based endometriosis detection, ESSENTIALLY NON-EXISTENT

- **Zero** published cohort/pilot studies use a consumer wearable (Oura/Fitbit/Apple Watch/
  Garmin/WHOOP) to detect, predict, or diagnose endometriosis.
- Anchor review: Cell Reports Medicine 2023;4(9):101192 (PMC10518625), DOI
  10.1016/j.xcrm.2023.101192, states digital/wearable tools "have not been specifically deployed
  or evaluated in patients with endometriosis-associated pain"; frames wearable use entirely as
  "future prospects." Oura's own 2025 messaging concedes wearables "can't assess conditions like
  endometriosis."
- Endometriosis digital-health studies that exist (e.g. JMIR 2024, PMC11909486, 92 vs 149;
  Endo-App) are **symptom-diary / CBT / QoL, no physiological wearable stream.**
- No study links a distinct skin-temperature or cycle-temperature signature to endometriosis
  (genuine gap).
- Nearest validated analogues, Apple Watch/Fitbit/Oura predicting IBD (PMID 39826619) and RA
  flares (2025), argue an endometriosis flare-monitoring study is worth RUNNING, but it has not
  been run.

**Background (established, do NOT conflate with detection):** wearables DO track cycle phase.
- Maijala et al. BMC Women's Health 2019 (PMC6883568), Oura, n=22: luteal distal skin temp
  +0.30°C; ovulation detected 83.3% sensitivity.
- Lang et al. FEMFIT, JMIR mHealth 2024;12:e50135, Fitbit, n=33: resting HR peaks mid/late luteal.

---

## VERDICTS

**Perimenopause / menopause transition, DEFENSIBLE. Build it.**
- Cycle-based STRAW+10 staging (≥7-day persistent variability → early transition; ≥60-day
  amenorrhea → late transition) is a canonical, exact, citable clinical standard directly
  computable from a period log. This is the strong core of the score.
- Autonomic/temperature/sleep signals are supportive but softer: honest weighting is
  cycle-log staging = primary/high-confidence; HRV decline, sympathetic shift, sleep
  disturbance, VMS-driven skin-temp events = corroborating/lower-confidence, and must be
  age-adjusted (Ramesh 2022 shows crude HRV decline is largely age). A defensible signal-strength
  score is buildable if the cycle criteria carry the weight and physiological signals modulate,
  not drive.

**Endometriosis, TOO SPECULATIVE for a defensible detection score today.**
- The entire "endo lowers HRV" claim = one small case-control (n=87), single center, one advanced
  subtype, no severity dose-response, no replication, zero meta-analyses, zero wearable studies.
- The stronger menstrual-phase autonomic data is about dysmenorrhea, not endometriosis, using it
  for endo would misrepresent the science.
- Honest framing for a public methods page: an endometriosis signal would be **exploratory /
  hypothesis-generating**, not a validated detector. Do not ship a sensitivity/specificity claim.
  Positioned as "we surface autonomic patterns that MAY correlate with pelvic-pain burden, based on
  a single small study," it is defensible as research-grade; positioned as detection, it is not.

---

## CITATION LIST (for the public Methods & Algorithms page)

STRAW+10:
- Harlow SD et al. Menopause 2012;19(4):387–395. PMID 22344196. DOI 10.1097/gme.0b013e31824d8f40.

Menopause autonomic / sleep / temperature:
- Ramesh et al. Physiol Rep 2022;10:e15298. PMC9127980.
- de Souza/Fernandes et al. PLOS ONE 2019;14(12):e0225866. PMC6961890.
- Thurston et al. Menopause 2016 (SWAN). PMC4844776.
- Kravitz HM et al. Sleep 2008;31(7):979–990 (SWAN). PMC2491500.
- Baker FC et al. Sleep Med Clin 2018;13(3):443–456. PMC6092036.
- Baker FC. Climacteric 2023;26(3):198–205. PMC10416747.
- Freedman RR, Krell W. Am J Obstet Gynecol 1999;181(1):66–70. PMID 10411797.
- de Zambotti M et al. Fertil Steril 2014;102(6):1708–1715.
- Saaresranta T et al. Respir Physiol Neurobiol 2005.

Endometriosis autonomic / wearable:
- Hao M et al. Sci Rep 2021;11:1345. DOI 10.1038/s41598-020-79750-9. PMID 33446725.
- Moreira/Zwenger et al. Women & Health 2021;61(10):937–946. PMID 34719338.
- Hellman et al. Sci Rep 2019;9:2705 (dysmenorrhea). PMC6379479.
- Wang et al. Biol Res Nurs 2016 (dysmenorrhea). PMID 27052671.
- Sikora M et al. Cell Reports Medicine 2023;4(9):101192. DOI 10.1016/j.xcrm.2023.101192. PMC10518625.
- Maijala A et al. BMC Women's Health 2019 (Oura, cycle tracking). PMC6883568.
- Lang AL et al. JMIR mHealth uHealth 2024;12:e50135 (FEMFIT/Fitbit, cycle tracking).

Note: one author-name detail (Cell Reports Medicine first author) did not fully render from PMC;
DOI/journal/issue confirmed. All other citations verified from primary sources.
