'use strict';
/* Lutea donation + learning backend.
 * Real, dependency-free Node service. Accepts de-identified wearable records
 * donated by users, enforces GDPR / HIPAA Safe-Harbor de-identification server-side,
 * appends them to a persistent research corpus, and incrementally re-learns the
 * reference cohort statistics the app compares users against.
 *
 * NOT a mock: every accepted record is written to disk (JSONL corpus) and folded
 * into agg.json via Welford's online algorithm; the public reference distribution
 * (cohort.json) is recomputed on every donation and served back at GET /api/cohort.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA = process.env.LUTEA_DATA || '/data';
const CORPUS = path.join(DATA, 'corpus.jsonl');       // append-only de-identified records
const AGG = path.join(DATA, 'agg.json');              // running aggregates (private)
const COHORT = path.join(DATA, 'cohort.json');        // public learned reference
const PORT = process.env.PORT || 8080;
const MAX_RECORDS = 800;                               // per-donation cap (abuse guard)

fs.mkdirSync(DATA, { recursive: true });

/* ---- canonical signals + physiological plausibility ranges ---- */
const SIGMAP = {
  rhr:'rhr', resting_heart_rate:'rhr', restingheartrate:'rhr',
  hrv:'hrv', rmssd:'hrv',
  nightly_temperature:'temp', skin_temperature:'temp', temperature:'temp', temp:'temp',
  sleep_efficiency:'sleep', sleep:'sleep',
  respiratory_rate:'resp', respiration:'resp', resp:'resp',
  spo2:'spo2', blood_oxygen:'spo2',
  steps:'steps'
};
const RANGE = {
  rhr:[30,140], hrv:[3,220], temp:[33,40], sleep:[20,100],
  resp:[6,30], spo2:[80,100], steps:[0,60000]
};
const PHASES = { menstrual:'Menstrual', follicular:'Follicular', fertility:'Fertility',
  fertile:'Fertility', ovulation:'Fertility', luteal:'Luteal', menses:'Menstrual', period:'Menstrual' };

/* ---- nearby-facility proxy (Overpass / OpenStreetMap) ----
 * The browser used to call public Overpass instances directly and sequentially,
 * so one slow/overloaded mirror stalled the whole "find where to check" feature.
 * We proxy it server-side: race several mirrors in parallel, take the first that
 * returns data, cache the result per ~1 km cell, and always answer fast — the
 * client never waits on Overpass and never hangs. */
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter'
];
const NEARBY_TTL = 12 * 3600e3;   // cache facilities for 12h
const NEARBY_MAX = 500;           // cache entries cap
const nearbyCache = new Map();    // "lat,lon,r" -> { at, facilities }

function overpassQuery(lat, lon, r){
  return `[out:json][timeout:25];(`
    + `nwr[amenity=hospital](around:${r},${lat},${lon});`
    + `nwr[amenity=clinic](around:${r},${lat},${lon});`
    + `nwr[amenity=doctors](around:${r},${lat},${lon});`
    + `nwr[healthcare=laboratory](around:${r},${lat},${lon});`
    + `);out center 60 tags;`;
}
async function fetchOverpass(url, body){
  const res = await fetch(url, {
    method:'POST',
    headers:{
      'Content-Type':'application/x-www-form-urlencoded',
      'Accept':'application/json',
      // Public Overpass mirrors reject UA-less requests (406/429); identify politely per OSM etiquette.
      'User-Agent':'Lutea/1.0 (hormonal-health wearable analysis; +https://lutea.administration.ae)'
    },
    body:'data=' + encodeURIComponent(body),
    signal: AbortSignal.timeout(12000)              // hard per-mirror ceiling (main instance can take ~10s)
  });
  if(!res.ok) throw new Error('status ' + res.status);
  const j = await res.json();
  if(!j || !Array.isArray(j.elements) || !j.elements.length) throw new Error('empty');
  return j.elements;                                 // reject empties so a mirror WITH data wins the race
}
async function nearbyFacilities(lat, lon, r){
  const body = overpassQuery(lat, lon, r);
  let elements;
  // Race every mirror; first one with data wins (single pass to stay within the
  // proxy's read budget). Reliability comes from not caching empties + serving the
  // last good result on failure, so a warmed cell stays useful even when Overpass blips.
  try { elements = await Promise.any(OVERPASS.map(u => fetchOverpass(u, body))); }
  catch { return []; }                               // every mirror failed / area genuinely empty
  const out = [];
  for(const el of elements){
    const la = el.lat != null ? el.lat : (el.center && el.center.lat);
    const lo = el.lon != null ? el.lon : (el.center && el.center.lon);
    if(la == null || lo == null) continue;
    out.push({ name:(el.tags && el.tags.name) || null, lat:la, lon:lo,
      lab: !!(el.tags && el.tags.healthcare === 'laboratory') });
    if(out.length >= 60) break;
  }
  return out;
}

/* ---- obfuscation / identifier detection (GDPR Art.4, HIPAA Safe Harbor) ---- */
const ID_KEY = /(name|email|mail|phone|tel|user|account|address|street|city|zip|postal|ssn|mrn|nhs|passport|dob|birth|gps|lat|lon|lng|ip|device|serial|uuid|guid|mac)/i;
const ID_VAL = [
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,        // email
  /\+\d[\d ().-]{6,}\d/,                                    // phone (must start with +)
  /(?:\d[ ().-]?){10,}/,                                    // 10+ digit run (phone, not an 8-digit ISO date)
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // uuid
  /([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}/,                    // mac
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/                 // ipv4
];
function looksLikeIdentifier(v){
  if (typeof v !== 'string') return false;
  return ID_VAL.some(re => re.test(v));
}

function ageBandLower(a){
  a = Number(a);
  if (!isFinite(a) || a < 12 || a > 90) return null;
  return Math.floor(a / 5) * 5;   // coarsen to 5-year band (k-anonymity)
}

/* De-identify + validate one donation. Returns {records, dropped, identifiersFound}. */
function sanitize(payload){
  const rows = Array.isArray(payload && payload.records) ? payload.records.slice(0, MAX_RECORDS) : [];
  const band = ageBandLower(payload && payload.age);
  const out = [];
  let dropped = 0, identifiersFound = 0, dayIdx = 0;
  for (const raw of rows){
    if (!raw || typeof raw !== 'object'){ dropped++; continue; }
    const rec = {};
    let bad = false;
    for (const k of Object.keys(raw)){
      const key = String(k).toLowerCase().replace(/[^a-z0-9_]/g,'');
      const val = raw[k];
      // obfuscation check: reject any identifier-shaped key outright
      if (ID_KEY.test(key)){ identifiersFound++; bad = true; break; }
      const canon = SIGMAP[key];
      if (canon){
        const num = Number(val);
        const [lo,hi] = RANGE[canon];
        if (isFinite(num) && num >= lo && num <= hi) rec[canon] = num;
      } else if (key === 'phase' && typeof val === 'string'){
        const p = PHASES[val.toLowerCase().trim()];
        if (p) rec.phase = p;
      } else if (looksLikeIdentifier(val)){
        // an unknown field carrying an identifier-shaped value → reject the record
        identifiersFound++; bad = true; break;
      }
      // any other unknown field is silently dropped (data minimisation)
    }
    if (bad){ dropped++; continue; }
    if (!Object.keys(rec).length){ dropped++; continue; }
    rec.d = dayIdx++;                 // date coarsened to a relative day index, no calendar date kept
    out.push(rec);
  }
  return { records: out, dropped, identifiersFound, band };
}

/* ---- incremental learning: Welford online mean/variance + per-band RHR reservoir ---- */
function loadAgg(){
  try { return JSON.parse(fs.readFileSync(AGG,'utf8')); }
  catch { return { donations:0, days:0, signals:{}, rhrBands:{} }; }
}
function updateAgg(agg, san){
  agg.donations += 1;
  agg.days += san.records.length;
  for (const rec of san.records){
    for (const key of Object.keys(rec)){
      if (key === 'd' || key === 'phase') continue;
      const s = agg.signals[key] || (agg.signals[key] = { n:0, mean:0, m2:0 });
      const x = rec[key];
      s.n += 1; const delta = x - s.mean; s.mean += delta / s.n; s.m2 += delta * (x - s.mean);
    }
    if (san.band != null && typeof rec.rhr === 'number'){
      const b = agg.rhrBands[san.band] || (agg.rhrBands[san.band] = []);
      b.push(rec.rhr);
      if (b.length > 5000) b.splice(0, b.length - 5000);   // capped reservoir
    }
  }
  return agg;
}
function pct(sorted, q){
  if (!sorted.length) return null;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))));
  return Math.round(sorted[i] * 10) / 10;
}
function buildCohort(agg){
  const signals = {};
  for (const k of Object.keys(agg.signals)){
    const s = agg.signals[k];
    signals[k] = { n:s.n, mean:Math.round(s.mean*100)/100, sd: s.n>1 ? Math.round(Math.sqrt(s.m2/(s.n-1))*100)/100 : null };
  }
  const rhrByAge = {};
  for (const b of Object.keys(agg.rhrBands)){
    const arr = agg.rhrBands[b].slice().sort((a,c)=>a-c);
    rhrByAge[b] = { n:arr.length, p:[pct(arr,.05),pct(arr,.25),pct(arr,.5),pct(arr,.75),pct(arr,.95)] };
  }
  return { updated:new Date().toISOString(), donations:agg.donations, days:agg.days, signals, rhr_by_age:rhrByAge };
}

function readCohort(){
  try { return fs.readFileSync(COHORT,'utf8'); }
  catch { return JSON.stringify({ updated:null, donations:0, days:0, signals:{}, rhr_by_age:{} }); }
}

/* ---- HTTP ---- */
function json(res, code, obj){
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type':'application/json', 'Cache-Control':'no-store' });
  res.end(body);
}

const server = http.createServer(async (req,res)=>{
  const url = (req.url||'').split('?')[0];

  if (req.method === 'GET' && (url === '/healthz' || url === '/api/healthz'))
    return res.writeHead(200,{'Content-Type':'text/plain'}), res.end('ok\n');

  if (req.method === 'GET' && (url === '/cohort' || url === '/api/cohort')){
    res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
    return res.end(readCohort());
  }

  if (req.method === 'GET' && (url === '/nearby' || url === '/api/nearby')){
    const qp = new URL(req.url, 'http://x').searchParams;
    const lat = Number(qp.get('lat')), lon = Number(qp.get('lon'));
    let r = Number(qp.get('r')) || 15000;
    if (!isFinite(lat) || !isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180)
      return json(res, 400, { ok:false, error:'bad coordinates' });
    r = Math.min(Math.max(r, 1000), 25000);
    const key = lat.toFixed(2) + ',' + lon.toFixed(2) + ',' + r;   // ~1 km cell
    const hit = nearbyCache.get(key);
    if (hit && (Date.now() - hit.at) < NEARBY_TTL)
      return json(res, 200, { ok:true, cached:true, facilities:hit.facilities });
    let facilities = [];
    try { facilities = await nearbyFacilities(lat, lon, r); } catch { facilities = []; }
    if (facilities.length){                          // only cache real results, never freeze a failure
      nearbyCache.set(key, { at:Date.now(), facilities });
      if (nearbyCache.size > NEARBY_MAX) nearbyCache.delete(nearbyCache.keys().next().value);
    } else if (hit && hit.facilities.length){        // live fetch failed → serve the last good (stale) result
      return json(res, 200, { ok:true, stale:true, facilities:hit.facilities });
    }
    return json(res, 200, { ok:true, facilities });
  }

  if (req.method === 'POST' && (url === '/donate' || url === '/api/donate')){
    let body = ''; let tooBig = false;
    req.on('data', c => { body += c; if (body.length > 4e6){ tooBig = true; req.destroy(); } });
    req.on('end', ()=>{
      if (tooBig) return json(res,413,{ ok:false, error:'payload too large' });
      let payload; try { payload = JSON.parse(body); } catch { return json(res,400,{ ok:false, error:'invalid json' }); }
      if (!payload || payload.consent !== true)
        return json(res,400,{ ok:false, error:'consent required' });   // GDPR Art.6 lawful basis: explicit consent

      const san = sanitize(payload);
      if (!san.records.length)
        return json(res,422,{ ok:false, error:'no valid physiological records after de-identification', dropped:san.dropped });

      // persist de-identified rows (one JSONL line per donation batch, hashed batch id, no PII)
      const batchId = crypto.randomBytes(8).toString('hex');
      const line = JSON.stringify({ id:batchId, band:san.band, records:san.records }) + '\n';
      fs.appendFileSync(CORPUS, line);

      const agg = updateAgg(loadAgg(), san);
      fs.writeFileSync(AGG, JSON.stringify(agg));
      const cohort = buildCohort(agg);
      fs.writeFileSync(COHORT, JSON.stringify(cohort));

      return json(res,200,{
        ok:true,
        accepted:san.records.length,
        dropped:san.dropped,
        identifiers_removed:san.identifiersFound,
        cohort_size:cohort.donations,
        cohort_days:cohort.days
      });
    });
    return;
  }

  json(res,404,{ ok:false, error:'not found' });
});
server.listen(PORT, ()=> console.log('lutea-api on :'+PORT+' data='+DATA));
