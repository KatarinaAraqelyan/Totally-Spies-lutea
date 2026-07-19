/* ============================================================
   LUTEA: hormonal intelligence from your wearable
   One-file client engine: Three.js hero · GSAP reveals ·
   CSV parse · signal detection · coverage · insight algorithms
   ============================================================ */
(() => {
'use strict';

/* ---------- 0. THREE.JS HERO WAVE ---------------------------- */
(function heroWave(){
  const canvas = document.getElementById('gl');
  if(!window.THREE) return;
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 100);
  camera.position.set(0, 3.4, 9.2);
  camera.lookAt(0, -0.6, 0);

  const NX = 150, NZ = 110, GAP = 0.16;
  const count = NX*NZ;
  const pos = new Float32Array(count*3);
  const col = new Float32Array(count*3);
  const base = new Float32Array(count*2); // x,z home
  let i=0;
  const cRose = new THREE.Color('#e0566c'), cBlush = new THREE.Color('#f6b8c4'), cPlum = new THREE.Color('#8b6ad0');
  for(let z=0; z<NZ; z++) for(let x=0; x<NX; x++){
    const px = (x-NX/2)*GAP, pz = (z-NZ/2)*GAP;
    pos[i*3]=px; pos[i*3+1]=0; pos[i*3+2]=pz;
    base[i*2]=px; base[i*2+1]=pz;
    const t = z/NZ;
    const c = cPlum.clone().lerp(cBlush,0.5).lerp(cRose, 1-t);
    col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
    i++;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color', new THREE.BufferAttribute(col,3));
  const mat = new THREE.PointsMaterial({size:0.035, vertexColors:true, transparent:true,
    opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true});
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  let mx=0,my=0, tmx=0,tmy=0;
  addEventListener('pointermove', e=>{ tmx=(e.clientX/innerWidth-0.5); tmy=(e.clientY/innerHeight-0.5); }, {passive:true});

  function resize(){ renderer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  // layered "cycle" waves, periodicity evokes a hormonal rhythm
  const p = geo.attributes.position.array;
  let running = true;
  document.addEventListener('visibilitychange', ()=> running = !document.hidden);
  let t0 = 0;
  function frame(ms){
    requestAnimationFrame(frame);
    if(!running) return;
    const t = ms*0.00035;
    for(let k=0;k<count;k++){
      const bx=base[k*2], bz=base[k*2+1];
      const r = Math.sqrt(bx*bx+bz*bz);
      const y = Math.sin(bx*0.9 + t*1.3)*0.28
              + Math.cos(bz*0.7 - t*1.0)*0.24
              + Math.sin(r*1.1 - t*1.6)*0.30*Math.exp(-r*0.11);
      p[k*3+1] = y;
    }
    geo.attributes.position.needsUpdate = true;
    mx += (tmx-mx)*0.04; my += (tmy-my)*0.04;
    points.rotation.y = mx*0.35;
    camera.position.x = mx*1.4;
    camera.position.y = 3.4 - my*1.1;
    camera.lookAt(0,-0.6,0);
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
})();

/* ---------- 1. GSAP REVEALS --------------------------------- */
if(window.gsap && window.ScrollTrigger){
  gsap.registerPlugin(ScrollTrigger);
  gsap.set('.hero .kicker,.hero h1,.hero .sub,.hero .cta-row',{opacity:0,y:30});
  gsap.timeline({defaults:{ease:'power3.out'}})
    .to('.hero .kicker',{opacity:1,y:0,duration:.8,delay:.2})
    .to('.hero h1',{opacity:1,y:0,duration:1.1},'-=.5')
    .to('.hero .sub',{opacity:1,y:0,duration:.9},'-=.7')
    .to('.hero .cta-row',{opacity:1,y:0,duration:.8},'-=.6');
  gsap.utils.toArray('.rv').forEach(el=>{
    gsap.to(el,{opacity:1,y:0,duration:.9,ease:'power3.out',
      scrollTrigger:{trigger:el,start:'top 88%'}});
  });
}
addEventListener('scroll',()=>{ document.getElementById('topbar').classList.toggle('solid', scrollY>40); });

/* ---------- 2. SIGNAL DICTIONARY ---------------------------- */
const SIGNALS = [
  {key:'rhr',   name:'Resting heart rate', unit:'bpm',  keys:['resting_heart_rate','restingheart','resting heart','rhr'],
   why:'This is how fast your heart beats when you’re doing nothing, just chilling. Lower usually means your heart doesn’t have to work as hard. In the week or two before your period it naturally speeds up a few beats, so it helps us tell which half of your cycle you’re in. The bar on the card shows where your number sits compared to other women your age.'},
  {key:'temp',  name:'Skin temperature', unit:'°C', keys:['nightly_temperature','wrist_temp','skin_temp','temperature','temp_deviation','deviation'],
   why:'Right after you ovulate, your skin gets about a third of a degree warmer, and stays warmer until your period starts. So if your temperature looks like “low half of the month, then high half,” that’s solid proof ovulation happened. A flat line all month is worth asking a doctor about.'},
  {key:'hrv',   name:'Heart-rate variability', unit:'ms', keys:['rmssd','hrv','heart_rate_variability','variability'],
   why:'HRV measures the tiny timing changes between heartbeats while you sleep. Bigger changes = your body is relaxed and recovering well. Smaller = stressed or run down. For most women it dips before their period, that dip is basically PMS you can actually measure.'},
  {key:'cycle', name:'Cycle / period log', unit:'', keys:['phase','cycle_phase','menstru','period','ovulation','cycle_day'], nolabel:true,
   why:'If your export includes your period dates, we don’t have to guess anything. We use your own log to mark exactly which days belong to which phase of your cycle, way more accurate than estimating.'},
  {key:'sleep', name:'Sleep', unit:'%', keys:['efficiency','sleep_score','minutesasleep','time_asleep','sleep_duration','deep_sleep','total_sleep'],
   why:'This is how much of your time in bed you actually spent asleep. Bad sleep makes PMS hit noticeably harder, so this number shows how much you could win back just by fixing your sleep.'},
  {key:'resp',  name:'Respiratory rate', unit:'br/min', keys:['respiratory','respiration','breaths','breath_rate','average_breath'],
   why:'How many breaths you take per minute at night. It creeps up a little after ovulation, one more clue that helps confirm where you are in your cycle.'},
  {key:'spo2',  name:'Blood oxygen', unit:'%', keys:['spo2','o2_saturation','oxygen','infrared_to_red'],
   why:'How much oxygen is in your blood while you sleep. It should stay high and steady. If it dips a lot, your sleep data is less trustworthy, and it’s worth mentioning to a doctor.'},
  {key:'steps', name:'Activity', unit:'steps', keys:['steps','step_count'],
   why:'How much you move each day. It gives us context: if your recovery numbers drop but your steps show you ran ten miles, that’s the workout talking, not your hormones.'},
];
/* clinical "normal" reference bands per signal (rhr is handled separately via NHANES age band).
   Honest, textbook ranges, shown as a shaded zone on each chart. */
const REF = {
  hrv:  {lo:40, hi:70,  src:'Typical night-time rMSSD, healthy adults'},
  temp: null,                                   // no fixed normal, the SHAPE (biphasic) is what matters
  sleep:{lo:85, hi:100, src:'Restorative sleep efficiency'},
  resp: {lo:12, hi:20,  src:'Normal resting respiratory rate'},
  spo2: {lo:95, hi:100, src:'Normal blood-oxygen saturation'},
  steps:null,                                   // no medical normal
};
const DATE_KEYS = ['date','timestamp','datetime','day_in_study','sleep_start_day_in_study','day','time','start_time','start'];
const PHASE_WORDS = {follicular:'Follicular',fertility:'Fertility',fertile:'Fertility',ovulation:'Fertility',luteal:'Luteal',menstrual:'Menstrual',menses:'Menstrual',period:'Menstrual'};

/* NHANES 2021-2023, resting pulse (BPXO oscillometric, mean of 3 readings),
   US women 18-45. Percentile breakpoints [p5,p25,p50,p75,p95], n = women per band.
   Real reference: 1,236 women; source wwwn.cdc.gov BPXO_L + DEMO_L. */
const NHANES_RHR = {
  '18-24':{n:286, p:[62.1,71.7,76.7,84.6,96.6]},
  '25-29':{n:188, p:[59.9,68.3,75.7,82.4,97.8]},
  '30-34':{n:253, p:[58.9,67.3,76.0,83.7,94.3]},
  '35-39':{n:236, p:[56.7,66.3,73.7,79.8,91.3]},
  '40-45':{n:273, p:[59.0,66.7,72.7,81.3,96.3]},
  'all'  :{n:1236,p:[59.0,68.0,75.7,82.7,95.4]},
};
const NHANES_Q = [5,25,50,75,95];
function ageBand(a){ if(a==null||isNaN(a))return 'all'; if(a<25)return '18-24'; if(a<30)return '25-29'; if(a<35)return '30-34'; if(a<40)return '35-39'; if(a<=45)return '40-45'; return 'all'; }

/* Learned reference cohort, the RHR percentiles the community's own donations
   produce. Fetched live from the donation backend; once a 5-year age band holds
   enough donated samples it supersedes the static NHANES table for that band. */
let COHORT_REF = null;
function refreshCohort(){ fetch('/api/cohort').then(r=>r.json()).then(c=>{ COHORT_REF=c; }).catch(()=>{}); }
function cohortRHR(age){
  if(!COHORT_REF || !COHORT_REF.rhr_by_age || age==null || isNaN(age)) return null;
  const e = COHORT_REF.rhr_by_age[Math.floor(age/5)*5];
  return (e && e.n>=50 && e.p && e.p.every(x=>x!=null)) ? e.p : null;
}
function rhrPercentile(rhr, band){
  const p = cohortRHR(meta.age) || NHANES_RHR[band].p;
  if(rhr<=p[0]) return Math.max(1, Math.round(NHANES_Q[0]*rhr/p[0]));
  if(rhr>=p[4]) return 99;
  for(let i=0;i<p.length-1;i++) if(rhr<=p[i+1]){
    const f=(rhr-p[i])/(p[i+1]-p[i]); return Math.round(NHANES_Q[i]+f*(NHANES_Q[i+1]-NHANES_Q[i]));
  }
  return 50;
}

/* ---------- 3. CSV PARSING ---------------------------------- */
function parseCSV(text){
  const lines = text.replace(/\r/g,'').split('\n').filter(l=>l.length);
  if(!lines.length) return {header:[],rows:[]};
  const header = lines[0].split(',').map(s=>s.trim());
  const rows = [];
  for(let i=1;i<lines.length;i++){
    const c = lines[i].split(',');
    if(c.length>1) rows.push(c);
  }
  return {header, rows};
}
function idxOf(header, keyList){
  const H = header.map(h=>h.toLowerCase());
  for(let i=0;i<H.length;i++) for(const k of keyList) if(H[i].includes(k)) return i;
  return -1;
}
function toDayIndex(raw){
  if(raw==null) return null;
  const s = String(raw).trim();
  if(/^\d+(\.\d+)?$/.test(s)) return Math.floor(parseFloat(s));         // day_in_study integer
  const d = Date.parse(s);
  if(!isNaN(d)) return Math.floor(d/86400000);                          // ISO/date → epoch day
  return null;
}

/* Global store: per signal → Map(day → {sum,n}), plus phaseByDay */
const store = {};                 // key → Map(day→{sum,n})
const phaseByDay = new Map();     // day → phase label (if a cycle column exists)
const meta = {age:null};          // static attributes (age for NHANES percentile)
SIGNALS.forEach(s=>store[s.key]=new Map());
let fileCount = 0;

function ingest(text, fname){
  const {header, rows} = parseCSV(text);
  if(!rows.length) return {fname, matched:[]};
  const dcol = idxOf(header, DATE_KEYS);
  // age (exact-match headers only, avoid 'sleep_stage'/'average' false hits)
  if(meta.age==null){
    const H = header.map(h=>h.toLowerCase().trim());
    const acol = H.findIndex(x=>x==='age'||x==='ridageyr'||x==='age_years'||x==='ageyears');
    const ycol = H.findIndex(x=>x==='birth_year'||x==='year_of_birth'||x==='yob');
    for(const c of rows){
      if(acol>=0){ const v=parseFloat(c[acol]); if(v>0&&v<120){ meta.age=v; break; } }
      else if(ycol>=0){ const y=parseFloat(c[ycol]); if(y>1900&&y<2100){ meta.age=new Date().getFullYear()-y; break; } }
      else break;
    }
  }
  const matched = [];
  for(const sig of SIGNALS){
    const vcol = idxOf(header, sig.keys);
    if(vcol<0) continue;
    if(sig.key==='cycle'){
      // phase label column
      if(dcol<0) continue;
      let hit=0;
      for(const c of rows){
        const day = toDayIndex(c[dcol]); if(day==null) continue;
        const val = (c[vcol]||'').toLowerCase().trim();
        let ph=null; for(const w in PHASE_WORDS) if(val.includes(w)) ph=PHASE_WORDS[w];
        if(ph){ phaseByDay.set(day, ph); hit++; }
      }
      if(hit) matched.push(sig.key);
      continue;
    }
    if(dcol<0) continue;
    const m = store[sig.key];
    let hit=0;
    for(const c of rows){
      const day = toDayIndex(c[dcol]); if(day==null) continue;
      let v = parseFloat(c[vcol]); if(isNaN(v)) continue;
      const rec = m.get(day) || {sum:0,n:0};
      rec.sum+=v; rec.n++; m.set(day,rec);
      hit++;
    }
    if(hit) matched.push(sig.key);
  }
  return {fname, matched};
}

/* daily mean series for a signal, sorted by day */
function series(key){
  const m = store[key]; const out=[];
  for(const [day,rec] of m) out.push([day, rec.sum/rec.n]);
  out.sort((a,b)=>a[0]-b[0]);
  return out;
}
/* ---------- 4. PHASE MODEL --------------------------------- */
/* Returns fn(day) -> 'Follicular' | 'Luteal' | null, and a source label */
function buildPhaseModel(){
  if(phaseByDay.size>20){
    return {fn:(d)=>{const p=phaseByDay.get(d); return p==='Luteal'?'Luteal':(p==='Follicular'?'Follicular':(p?'other':null));},
            source:'cycle log'};
  }
  const temp = series('temp');
  if(temp.length>14){
    const vals = temp.map(x=>x[1]).sort((a,b)=>a-b);
    const thr = vals[Math.floor(vals.length*0.55)];   // biphasic split point
    const map = new Map(temp.map(([d,v])=>[d, v>=thr?'Luteal':'Follicular']));
    return {fn:(d)=>map.get(d)||null, source:'temperature (estimated)'};
  }
  const rhr = series('rhr');
  if(rhr.length>14){
    const vals = rhr.map(x=>x[1]).sort((a,b)=>a-b);
    const thr = vals[Math.floor(vals.length*0.55)];
    const map = new Map(rhr.map(([d,v])=>[d, v>=thr?'Luteal':'Follicular']));
    return {fn:(d)=>map.get(d)||null, source:'resting HR (estimated)'};
  }
  return {fn:()=>null, source:null};
}

function phaseSplit(key, phaseFn, transform){
  let s = series(key); if(transform) s=transform(s);
  const F={sum:0,n:0}, L={sum:0,n:0}, ALL={sum:0,n:0};
  for(const [d,v] of s){ ALL.sum+=v;ALL.n++; const ph=phaseFn(d);
    if(ph==='Luteal'){L.sum+=v;L.n++;} else if(ph==='Follicular'){F.sum+=v;F.n++;} }
  const mean=o=>o.n?o.sum/o.n:NaN;
  return {all:mean(ALL), foll:mean(F), lut:mean(L), shift:mean(L)-mean(F), n:ALL.n};
}

/* ---------- 4b. MINI CHART (health.administration.ae style) ---
   line series + shaded normal band + dashed median + avg/trend header.
   Returns an HTML block; scales to card width via SVG viewBox. */
function dayTxt(day){ return day>8000 ? new Date(day*86400000).toISOString().slice(0,10) : 'Day '+day; }
function axTxt(day){ return day>8000 ? new Date(day*86400000).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'Day '+day; }
function miniChart(s, unit, band, dec, key){
  if(!s || s.length<2) return '';
  const vals=s.map(x=>x[1]);
  const mean=vals.reduce((a,v)=>a+v,0)/vals.length;
  let lo=Math.min(...vals), hi=Math.max(...vals);
  if(band){ lo=Math.min(lo,band.lo); hi=Math.max(hi,band.hi); }
  const pad=(hi-lo)*0.18||1; lo-=pad; hi+=pad;
  const W=300,H=96,n=s.length;
  const X=i=> n<=1?0:(i/(n-1))*W;
  const Y=v=> H-((v-lo)/(hi-lo))*H;
  const fmtN=v=> unit==='steps'?Math.round(v).toLocaleString():(+v).toFixed(dec);
  const unitTxt=unit==='steps'?'steps':unit;
  // trend: last quarter vs first quarter of the window
  const q=Math.max(1,Math.floor(n/4));
  const a0=vals.slice(0,q).reduce((a,v)=>a+v,0)/q, a1=vals.slice(-q).reduce((a,v)=>a+v,0)/q;
  const dlt=a1-a0, pct=a0?dlt/a0*100:0;
  const arrow=Math.abs(pct)<1?'→':(dlt>0?'▲':'▼');
  const trendTxt=`${arrow} ${dlt>0?'+':''}${fmtN(dlt)} ${unitTxt} (${pct>0?'+':''}${pct.toFixed(0)}%) over window`;
  // band rect + midpoint line (with invisible fat "hit" twins for hover labels)
  let bandSvg='';
  if(band){ const yTop=Y(band.hi), yBot=Y(band.lo), yMid=Y((band.lo+band.hi)/2).toFixed(1);
    bandSvg=`<rect x="0" y="${yTop.toFixed(1)}" width="${W}" height="${Math.max(0,yBot-yTop).toFixed(1)}" class="ch-band"/>
      <line x1="0" y1="${yMid}" x2="${W}" y2="${yMid}" class="ch-bandline"/>
      <line x1="0" y1="${yMid}" x2="${W}" y2="${yMid}" class="ch-hit" data-tip="Middle of the normal range · ${fmtN((band.lo+band.hi)/2)} ${unitTxt}"/>`; }
  const meanY=Y(mean).toFixed(1);
  const pts=s.map((x,i)=>`${X(i).toFixed(1)},${Y(x[1]).toFixed(1)}`).join(' ');
  const dots=n<=70? s.map((x,i)=>`<path d="M ${X(i).toFixed(1)} ${Y(x[1]).toFixed(1)} l 0.01 0" class="ch-dot"/>`).join('') : '';
  const bandCap=band?`<span class="ch-norm">Normal range <b>${fmtN(band.lo)}–${fmtN(band.hi)} ${unitTxt}</b></span>`:'';
  // x-axis: 4 date ticks across the window
  const ti=[0,Math.round((n-1)/3),Math.round(2*(n-1)/3),n-1];
  const axis=`<div class="ch-axis">${ti.map(i=>`<span>${axTxt(s[i][0])}</span>`).join('')}</div>`;
  return `<div class="chart">
    <div class="ch-head"><span class="ch-avg">avg <b>${fmtN(mean)}</b> ${unitTxt}</span><span class="ch-trend">${trendTxt}</span></div>
    <div class="ch-wrap" data-key="${key}" data-unit="${unit}" data-dec="${dec}">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="ch-svg">
        ${bandSvg}
        <line x1="0" y1="${meanY}" x2="${W}" y2="${meanY}" class="ch-mean"/>
        <line x1="0" y1="${meanY}" x2="${W}" y2="${meanY}" class="ch-hit" data-tip="Your average · ${fmtN(mean)} ${unitTxt}"/>
        <polyline points="${pts}" class="ch-line"/>
        ${dots}
      </svg>
      <div class="ch-cross"></div>
      <div class="ch-tipbox"></div>
    </div>
    ${axis}
    ${band?`<div class="ch-foot">${bandCap}</div>`:''}
  </div>`;
}

/* ---------- 5. RENDER: signal grid ------------------------- */
function renderSignals(){
  const grid = document.getElementById('sigGrid');
  grid.innerHTML='';
  for(const sig of SIGNALS){
    if(sig.key==='cycle') continue;   // cycle lives in the Insights tab (renderCycle)
    const has = store[sig.key].size>0;
    const s = series(sig.key);
    const metaTxt = has ? '' : (fileCount>0 ? 'not found in this upload' : 'waiting for your data');
    const el = document.createElement('div');
    el.className='sig'+(has?' on':'');
    const dec = sig.key==='temp'?2:0;
    let chart='';
    if(has){
      let band=REF[sig.key]||null;
      if(sig.key==='rhr'){ const B=NHANES_RHR[ageBand(meta.age)]; band={lo:B.p[1],hi:B.p[3]}; }
      if(sig.key==='sleep'){ const mn=s.reduce((a,x)=>a+x[1],0)/s.length; if(!(mn>40&&mn<=100)) band=null; } // minutes, not efficiency
      chart=miniChart(s, sig.unit||'', band, dec, sig.key);
    }
    el.innerHTML = `
      <div class="row"><span class="nm">${sig.name}</span>
      <span class="tick">${has?'✓':''}</span></div>
      ${metaTxt?`<div class="meta">${metaTxt}</div>`:''}
      ${chart}
      <button type="button" class="whylink" data-sig="${sig.key}">What does this mean?</button>`;
    if(sig.key==='rhr' && has){
      el.className='sig featured on';
      const band=ageBand(meta.age), B=NHANES_RHR[band];
      const q=B.p, spanQ=q[4]-q[0];
      const P=x=>Math.max(0,Math.min(100,(x-q[0])/spanQ*100));
      const bandTxt=band==='all'?'women 18–45':'women aged '+band;
      const r=series('rhr'); const mean=r.reduce((a,x)=>a+x[1],0)/r.length;
      const dot=`<div class="norm-dot" style="left:${P(mean).toFixed(1)}%"><span class="norm-tip">This is you · ${Math.round(mean)} bpm</span></div>`;
      el.querySelector('.whylink').insertAdjacentHTML('beforebegin', `<div class="norm">
        <div class="norm-top"><span class="cap">Where you sit vs peers · ${bandTxt}</span><span class="rng">${Math.round(q[1])}–${Math.round(q[3])} bpm</span></div>
        <div class="norm-track"><div class="norm-band" style="left:${P(q[1]).toFixed(1)}%;width:${(P(q[3])-P(q[1])).toFixed(1)}%"></div>${dot}</div>
        <div class="norm-scale"><span>${Math.round(q[0])} bpm</span><span>median ${Math.round(q[2])}</span><span>${Math.round(q[4])} bpm</span></div>
        <a class="norm-src" href="https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/BPXO_L.htm" target="_blank" rel="noopener">Source: CDC · NHANES 2021–2023 · n=${B.n.toLocaleString()} women ↗</a>
      </div>`);
    }
    grid.appendChild(el);
  }
}

/* ---------- 5b. RENDER: cycle strip (Insights tab) --------- */
function renderCycle(){
  const box = document.getElementById('cycleStrip');
  if(!box) return;
  if(!phaseByDay.size){ box.innerHTML='<div class="empty">No period log or temperature pattern found yet.</div>'; return; }
  const days=[...phaseByDay.keys()], mn=Math.min(...days), mx=Math.max(...days), total=mx-mn+1;
  const COL={Menstrual:'#e0566c',Follicular:'#f6b8c4',Fertility:'#d8a657',Luteal:'#8b6ad0'};
  const segs=[]; let cur=null;
  for(let d=mn;d<=mx;d++){ const ph=phaseByDay.get(d)||null;
    if(cur&&cur.ph===ph) cur.len++; else { cur={ph,len:1}; segs.push(cur); } }
  const strip=segs.map(g=>`<span class="ph-seg" style="width:${(g.len/total*100).toFixed(2)}%;background:${g.ph?(COL[g.ph]||'#666'):'transparent'}"></span>`).join('');
  const ticks=[mn, mn+Math.round(total/3), mn+Math.round(2*total/3), mx];
  const counts={}; for(const [,p] of phaseByDay) counts[p]=(counts[p]||0)+1;
  box.innerHTML=`<div class="ph-wrap" data-mn="${mn}" data-mx="${mx}">
      <div class="ph-strip">${strip}</div>
      <div class="ch-cross"></div><div class="ch-tipbox"></div>
    </div>
    <div class="ch-axis">${ticks.map(d=>`<span>${axTxt(d)}</span>`).join('')}</div>
    <div class="ph-legend">${Object.keys(COL).filter(k=>counts[k]).map(k=>`<span class="ph-lg"><i style="background:${COL[k]}"></i>${k} · ${counts[k]}d</span>`).join('')}</div>`;
}

/* ---------- 6. RENDER: data-trust gauge -------------------- */
/* One honest number: how far the read-out below can be trusted.
   Blends cycle-model quality + overlapping cycles + signal breadth. */
function renderConfidence(){
  const box = document.getElementById('confidence');
  if(!box) return;
  const active = SIGNALS.filter(s=>s.key!=='cycle' && store[s.key].size>0);
  if(!active.length){ box.innerHTML='<div class="empty">Upload your data to see how far the read-out can be trusted.</div>'; return; }
  // overlap window shared by every signal
  const ranges = active.map(sig=>{ const s=series(sig.key); return {sig, mn:s[0][0], mx:s[s.length-1][0], span:s[s.length-1][0]-s[0][0]+1}; });
  const oMin = Math.max(...ranges.map(r=>r.mn)), oMax = Math.min(...ranges.map(r=>r.mx));
  const overlapDays = Math.max(0, oMax-oMin+1);
  const cyclesF = overlapDays/29;                 // fractional cycles of shared coverage
  const model = buildPhaseModel();

  // --- score the three things that actually make a read-out trustworthy ---
  let conf=0, srcTxt;
  if(model.source==='cycle log'){ conf+=45; srcTxt='your period log pins every phase'; }
  else if(model.source && /temperature/.test(model.source)){ conf+=32; srcTxt='we placed your cycle from your temperature curve'; }
  else if(model.source && /resting HR/.test(model.source)){ conf+=22; srcTxt='we estimated your cycle from resting heart rate'; }
  else { conf+=5; srcTxt='we could not place your cycle yet'; }
  conf += clamp(cyclesF/2*35, 0, 35);             // 2+ shared cycles → full marks
  conf += clamp(active.length/6*20, 0, 20);       // signal breadth
  conf = Math.round(clamp(conf));

  const lab = conf>=75?['g','High confidence']:(conf>=50?['a','Moderate confidence']:(conf>=25?['r','Low confidence']:['r','Not enough yet']));
  const cycTxt = overlapDays<=0 ? 'no shared window'
    : cyclesF<1 ? 'under one shared cycle' : `~${Math.round(cyclesF)} shared cycle${Math.round(cyclesF)>1?'s':''}`;
  const verdict = conf>=75 ? `Strong footing, ${srcTxt}, and your signals overlap for ${cycTxt}. Everything below is worth acting on with your clinician.`
    : conf>=50 ? `Decent footing, ${srcTxt}, across ${cycTxt}. The direction of each read-out is reliable; the exact numbers, less so.`
    : `Read this as a preview, ${srcTxt}. With ${cycTxt}, treat the numbers below as hints, not conclusions.`;

  // signals with a noticeably short history vs the longest one → the honest caveat
  const maxSpan = Math.max(...ranges.map(r=>r.span));
  const weak = ranges.filter(r=>r.span < maxSpan*0.6).map(r=>r.sig.name);
  const warn = weak.length ? `<div class="conf-warn">Shorter history, so they lean on less data: <b style="color:inherit">${weak.join(', ')}</b>.</div>` : '';

  box.innerHTML=`<div class="conf">
    <div class="conf-gauge">
      <div class="conf-ring" style="--p:${conf}"><div class="conf-in"><div class="conf-pct">${conf}%</div></div></div>
      <div class="conf-lab ${lab[0]}">${lab[1]}</div>
    </div>
    <div class="conf-body">
      <p>${verdict}</p>
      <div class="conf-facts">
        <span class="conf-chip"><b>${overlapDays>0?overlapDays:'-'}</b> shared days</span>
        <span class="conf-chip"><b>${cycTxt}</b></span>
        <span class="conf-chip"><b>${active.length}</b> signals</span>
        <span class="conf-chip">cycle: <b>${model.source||'unresolved'}</b></span>
      </div>${warn}
    </div>
  </div>`;
  const ring=box.querySelector('.conf-ring'); if(ring){ ring.style.setProperty('--p',0); requestAnimationFrame(()=>{ ring.style.transition='--p 1s'; ring.style.setProperty('--p',conf); }); }
}

/* ---------- 7. INSIGHT ALGORITHMS -------------------------- */
function fmt(v,d=1){ return (v==null||isNaN(v))?'-':(+v).toFixed(d); }
function flagEl(cls,txt){ return `<span class="flag ${cls}">${txt}</span>`; }

function renderInsights(){
  const box = document.getElementById('insights');
  const model = buildPhaseModel();
  const cards = [];

  // -- CARD: cycle detection
  if(model.source){
    const nL = countPhase(model.fn,'Luteal'), nF = countPhase(model.fn,'Follicular');
    cards.push(card('Cycle','g','Cycle detected',
      `${nF+nL}<small> phase-days</small>`,
      `We split your record into follicular and luteal days from your <b>${model.source}</b>. Every read-out below is computed on that split.`,
      [['follicular days',nF],['luteal days',nL]]));
  } else {
    cards.push(card('Cycle','a','Cycle not resolved','-',
      'We need skin temperature, a period log, or a longer record to place your cycle. Means are still shown, but phase-shifts are unavailable.',
      [['have',SIGNALS.filter(s=>store[s.key]&&store[s.key].size).length+' signals'],['need','temp or period']]));
  }

  const has = k => store[k] && store[k].size>3;
  const canSplit = !!model.source;

  // -- CARD: resting heart rate vs peers (NHANES percentile)
  if(has('rhr')){
    const r = series('rhr'); const mean = r.reduce((a,x)=>a+x[1],0)/r.length;
    const band = ageBand(meta.age);
    const pc = rhrPercentile(mean, band);
    const cls = pc<=75 ? 'g' : (pc<=90?'a':'r');
    const bandTxt = band==='all' ? 'women 18–45' : 'women aged '+band;
    const verdict = pc<50 ? 'below the clinical median, a calmer resting heart'
                  : pc<=75 ? 'right in the healthy middle'
                  : 'above the typical range, worth keeping an eye on';
    cards.push(card('Population',cls,'Resting heart rate vs peers',
      `${pc}<small>th percentile</small>`,
      `Your resting heart rate averages <b>${Math.round(mean)} bpm</b>. Against <b>${NHANES_RHR[band].n.toLocaleString()}</b> ${bandTxt} in the NHANES 2021–2023 survey, that lands at the ${pc}th percentile, ${verdict}.`,
      [['NHANES median',`${NHANES_RHR[band].p[2]} bpm`],[band==='all'?'age':'your age band', band==='all'?'not in file':band]]));
  }

  // -- CARD: ovulation / temperature biphasic
  if(has('temp') && canSplit){
    const t = phaseSplit('temp', model.fn);
    const clear = t.shift>=0.20;
    cards.push(card('Ovulation',clear?'g':'a','Temperature confirms a shift',
      `${t.shift>0?'+':''}${fmt(t.shift,2)}<small> °C luteal</small>`,
      clear? 'Your skin runs warmer through the luteal phase, the classic post-ovulation signature. A biphasic curve means you are very likely ovulating.'
           : 'Your temperature is nearly flat across the cycle. A weak biphasic shift can be normal, but persistent flatness is worth raising with a clinician.',
      [['reference','+0.30 to +0.45 °C'],['your shift',`${t.shift>0?'+':''}${fmt(t.shift,2)} °C`]]));
  }

  // -- CARD: autonomic PMS load (HRV drop + RHR rise)
  if((has('hrv')||has('rhr')) && canSplit){
    let hrvDrop=null, rhrRise=null, hrvPct=null;
    if(has('hrv')){ const h=phaseSplit('hrv',model.fn); hrvDrop=-h.shift; hrvPct=h.foll? (hrvDrop/h.foll*100):null; }
    if(has('rhr')){ const r=phaseSplit('rhr',model.fn); rhrRise=r.shift; }
    const load = (hrvPct||0)*0.6 + (rhrRise||0)*4;
    const cls = load>28?'r':(load>14?'a':'g');
    const big = hrvPct!=null ? `${hrvPct>0?'−':'+'}${fmt(Math.abs(hrvPct),0)}<small>% HRV</small>` : `+${fmt(rhrRise,1)}<small> bpm RHR</small>`;
    cards.push(card('Autonomic',cls,'Luteal autonomic load',big,
      cls==='r'? 'Your nervous system takes a real hit before your period, HRV falls and resting HR climbs together. This is the physiology behind heavy PMS.'
      : cls==='a'? 'A moderate luteal dip in recovery, common, and a good target for sleep and stress habits in the second half of your cycle.'
      : 'Your autonomic balance holds steady across the cycle. That is a strong recovery signal.',
      [['HRV luteal',hrvPct!=null?`${hrvPct>0?'−':'+'}${fmt(Math.abs(hrvPct),0)}%`:'-'],['RHR luteal',rhrRise!=null?`+${fmt(rhrRise,1)} bpm`:'-']]));
  }

  // -- CARD: sleep
  if(has('sleep')){
    const s=series('sleep'); const mean=s.reduce((a,x)=>a+x[1],0)/s.length;
    const isEff = mean>40 && mean<=100;      // efficiency %  vs minutes
    const cls = isEff ? (mean>=88?'g':(mean>=80?'a':'r')) : 'g';
    cards.push(card('Recovery',cls, isEff?'Sleep efficiency':'Sleep tracked',
      isEff?`${fmt(mean,0)}<small>%</small>`:`${fmt(mean,0)}<small> avg</small>`,
      isEff? (mean>=88? 'Your sleep is consolidated and restorative, the foundation your hormones rebuild on each night.'
             : 'Fragmented sleep amplifies luteal symptoms. Protecting the second half of your cycle here pays back the most.')
           : 'Sleep is in the record and feeding the cycle model.',
      [['reference','≥ 88% efficiency'],['nights',s.length]]));
  }

  if(!cards.length){
    box.innerHTML='<div class="empty" style="grid-column:1/-1">Your read-out appears once we have a cycle to work with.</div>';
    return;
  }
  box.innerHTML = cards.join('');
}
function countPhase(fn,label){ let n=0; for(const k in store) for(const [d] of store[k]) if(fn(d)===label){}
  // count distinct days with this phase across union
  const days=new Set(); for(const k in store) for(const [d] of store[k]) days.add(d);
  let c=0; for(const d of days) if(fn(d)===label) c++; return c; }
function card(cat,cls,title,big,desc,refs){
  const flags={g:['g','healthy'],a:['a','watch'],r:['r','flag']};
  const f=flags[cls]||flags.g;
  const refHtml=(refs||[]).map(r=>`<span>${r[0]} <span class="v">${r[1]}</span></span>`).join('');
  return `<div class="icard"><div class="top"><span class="cat">${cat}</span>${flagEl(f[0],f[1])}</div>
    <h3>${title}</h3><div class="num-big">${big}</div><div class="desc">${desc}</div>
    <div class="ref">${refHtml}</div></div>`;
}

/* ---------- 7b. SCREENING / RISK TABLE --------------------- */
/* Honest screening scores (0-100 "signal strength", NOT probability of disease)
   derived from the same phase-split metrics used above. Sorted desc, top 3 shown.
   Each condition maps to a real test + a facility class for the "find nearby" flow. */
const clamp = v => Math.max(0, Math.min(100, v));
function computeRisks(){
  const model = buildPhaseModel(), canSplit = !!model.source;
  const has = k => store[k] && store[k].size>3;
  const band = ageBand(meta.age);
  let rhrMean=null, rhrPct=null;
  if(has('rhr')){ const r=series('rhr'); rhrMean=r.reduce((a,x)=>a+x[1],0)/r.length; rhrPct=rhrPercentile(rhrMean,band); }
  const tShift = (has('temp')&&canSplit) ? phaseSplit('temp',model.fn).shift : null;
  let hrvMean=null, hrvDropPct=null;
  if(has('hrv')){ const h=series('hrv'); hrvMean=h.reduce((a,x)=>a+x[1],0)/h.length;
    if(canSplit){ const ps=phaseSplit('hrv',model.fn); hrvDropPct = ps.foll? (ps.foll-ps.lut)/ps.foll*100 : null; } }
  let respMean=null; if(has('resp')){ const r=series('resp'); respMean=r.reduce((a,x)=>a+x[1],0)/r.length; }
  let spo2Min=null,sleepMean=null;
  if(has('spo2')){ const o=series('spo2'); spo2Min=Math.min(...o.map(x=>x[1])); }
  if(has('sleep')){ const s=series('sleep'); const m=s.reduce((a,x)=>a+x[1],0)/s.length; if(m>40&&m<=100) sleepMean=m; }
  let menstDays=0; for(const [,p] of phaseByDay) if(p==='Menstrual') menstDays++;

  const C=[];
  // Ovulation / PCOS-type pattern, driven by a weak biphasic temp shift
  if(tShift!=null){
    const sc = clamp((0.32 - tShift)/0.32*88 + 6);
    C.push({name:'Ovulation / PCOS pattern', score:sc,
      why: tShift>=0.25 ? 'Your temperature shows a clear post-ovulation rise, the reassuring sign. Low priority.'
         : tShift>=0.12 ? 'Your post-ovulation temperature rise is weaker than textbook, ovulation may be inconsistent.'
         : 'Your temperature stays nearly flat all month, a sign ovulation may not be happening reliably.',
      test:'gynaecologist · pelvic ultrasound & hormone panel', fac:'clinic', label:'women’s health clinic'});
  }
  // Iron-deficiency anemia, fast resting heart, low HRV, quick breathing, heavy periods
  if(rhrPct!=null){
    let sc = clamp((rhrPct-55)/45*55);
    if(hrvMean!=null) sc += clamp((45-hrvMean)/45*20);
    if(respMean!=null) sc += clamp((respMean-15.5)/4*15);
    sc += clamp((menstDays-25)/20*12);
    sc = clamp(sc*0.92 + 6);
    C.push({name:'Iron-deficiency anemia', score:sc,
      why: rhrPct>60 ? 'Thin blood makes the heart beat faster to keep up. Your resting heart rate sits high for your age'+(respMean>16?' and your night breathing runs quick.':'.')
         : 'Your heart-rate signals look calm, the reassuring direction here.',
      test:'ferritin + full blood count (CBC)', fac:'laboratory', label:'blood-test lab'});
  }
  // Thyroid imbalance, resting HR far from the population median
  if(rhrPct!=null){
    let sc = rhrPct>50 ? clamp((rhrPct-50)/45*70) : clamp((50-rhrPct)/50*22);
    if(hrvMean!=null) sc += clamp((45-hrvMean)/45*14);
    sc = clamp(sc*0.85 + 5);
    C.push({name:'Thyroid imbalance', score:sc,
      why: rhrPct>62 ? 'A persistently fast resting heart can point to an overactive thyroid.'
         : rhrPct<20 ? 'A very calm resting heart is usually healthy, but occasionally an underactive thyroid, only a mild signal.'
         : 'Your resting heart rate sits mid-range, only a faint thyroid signal.',
      test:'TSH blood test', fac:'laboratory', label:'blood-test lab'});
  }
  // Premenstrual load (PMS / PMDD), big luteal HRV collapse
  if(hrvDropPct!=null){
    const sc = clamp(hrvDropPct/25*72 + 8);
    C.push({name:'Severe PMS / PMDD', score:sc,
      why: hrvDropPct>15 ? 'Your recovery collapses in the two weeks before your period, a large HRV drop that tracks with heavy PMS.'
         : 'Your nervous system stays fairly steady across the cycle, only a mild luteal dip.',
      test:'GP or gynaecologist · symptom diary', fac:'clinic', label:'clinic'});
  }
  // Sleep-disordered breathing, overnight oxygen dips
  if(spo2Min!=null){
    let sc = clamp((95-spo2Min)/8*72);
    if(sleepMean!=null) sc += clamp((85-sleepMean)/25*18);
    sc = clamp(sc*0.9 + 4);
    C.push({name:'Sleep-disordered breathing', score:sc,
      why: spo2Min<93 ? 'Your blood oxygen dips at night below where it should sit, worth ruling out sleep apnea.'
         : 'Your overnight blood oxygen stays healthy, the reassuring direction.',
      test:'overnight oximetry / sleep screen', fac:'clinic', label:'sleep clinic'});
  }
  // Menopause transition, STRAW+10 cycle staging (Harlow et al., Menopause 2012),
  // age-adjusted autonomic corroboration (Ramesh 2022: crude HRV decline is largely age).
  const lens = cycleLengths();
  if(lens.length>=1){
    let maxDiff=0; for(let i=1;i<lens.length;i++) maxDiff=Math.max(maxDiff,Math.abs(lens[i]-lens[i-1]));
    const longest=Math.max(...lens);
    const varTerm = clamp((maxDiff-2)/8*62);     // STRAW -2: ≥7-day persistent difference between consecutive cycles
    const ameTerm = clamp((longest-40)/30*85);   // STRAW -1: amenorrhea ≥60 days
    let sc = Math.max(varTerm, ameTerm);          // either STRAW criterion independently stages
    if(hrvMean!=null && rhrPct!=null && rhrPct>60 && hrvMean<40) sc += 8;  // small, age-gated autonomic signal
    if(meta.age!=null && !isNaN(meta.age)){       // reproductive-aging prior, transition is rare before ~40
      sc *= meta.age>=45?1 : meta.age>=40?0.85 : meta.age>=35?0.6 : 0.4;
    }
    sc = clamp(sc);
    C.push({name:'Menopause transition', score:sc,
      why: sc>=55 ? 'Your cycle length swings month to month'+(longest>=60?', with a long gap between periods,':'')+', the STRAW+10 pattern that stages the menopause transition.'
         : sc>=30 ? 'Your cycles vary more than a steady baseline, an early sign the transition may be starting.'
         : 'Your cycle length holds steady month to month, no menopause-transition pattern.',
      test:'gynaecologist · FSH + estradiol (day 2–5)', fac:'clinic', label:'women’s health clinic'});
  }
  C.forEach(c=>c.score=Math.round(c.score));
  return C.sort((a,b)=>b.score-a.score).slice(0,3);
}
/* Cycle lengths (days between menstrual onsets) from the period log, feeds STRAW+10 staging.
   An onset = first Menstrual day of a block (gap > 3 days from the previous menstrual day). */
function cycleLengths(){
  const md=[...phaseByDay.entries()].filter(([,p])=>p==='Menstrual').map(([d])=>d).sort((a,b)=>a-b);
  if(md.length<2) return [];
  const onsets=[md[0]];
  for(let i=1;i<md.length;i++) if(md[i]-md[i-1]>3) onsets.push(md[i]);
  const lens=[]; for(let i=1;i<onsets.length;i++) lens.push(onsets[i]-onsets[i-1]);
  return lens;
}
function renderRisk(){
  const box=document.getElementById('riskWrap');
  if(!box) return;
  const risks=computeRisks();
  if(!risks.length){
    box.innerHTML='<div class="empty">Upload data to see what your signals suggest checking.</div>';
    return;
  }
  const fl=s=> s>=55?['r','flag']:(s>=30?['a','watch']:['g','low priority']);
  box.innerHTML=risks.map((r,i)=>{
    const [cls,txt]=fl(r.score);
    return `<div class="risk-row" data-fac="${r.fac}" data-label="${encodeURIComponent(r.label)}">
      <div class="rk">${i+1}</div>
      <div class="rbody">
        <div class="rtop"><span class="rname">${r.name}</span><span class="rflag ${cls}">${txt}</span></div>
        <div class="rwhy">${r.why}</div>
        <div class="rmeta">Best check: <b>${r.test}</b></div>
      </div>
      <div class="rscore"><div class="rpct">${r.score}%</div><div class="rbar"><i data-w="${r.score}"></i></div><div class="rlabel">signal strength</div></div>
      <div class="raction"><button type="button" class="findbtn">Find where to check ↗</button><div class="rloc"></div></div>
    </div>`;
  }).join('');
  requestAnimationFrame(()=>box.querySelectorAll('.rbar i').forEach(b=>b.style.width=b.dataset.w+'%'));
}

/* geolocation → nearest matching facility via Overpass (OpenStreetMap) */
function haversine(a,b,c,d){const R=6371,r=x=>x*Math.PI/180,dLat=r(c-a),dLon=r(d-b);
  const h=Math.sin(dLat/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(h));}
async function findFacility(lat,lon,fac,label,out){
  out.innerHTML='<span class="dist">Searching near you…</span>';
  const R=15000;
  const mapsNear=`https://www.google.com/maps/search/${encodeURIComponent(label)}/@${lat},${lon},13z`;
  // Our backend races several Overpass mirrors and caches — it answers fast and never hangs.
  let list=null;
  try{
    const res=await fetch(`/api/nearby?lat=${lat}&lon=${lon}&r=${R}`,{signal:AbortSignal.timeout(15000)});
    if(res.ok){ const j=await res.json(); if(j&&Array.isArray(j.facilities)) list=j.facilities; }
  }catch(e){}
  if(!list||!list.length){
    out.innerHTML=`<a href="${mapsNear}" target="_blank" rel="noopener">Open ${label} near you in maps ↗</a>`;
    return;
  }
  const prefLab = fac==='laboratory';
  const scored=list.map(el=>{
    const la=el.lat, lo=el.lon;
    if(la==null) return null;
    const isLab = !!el.lab;
    const named = el.name;
    let pri = prefLab ? (isLab?0:1) : (isLab?1:0);
    if(!named) pri+=0.5;
    return {name:named||'Unnamed clinic', la, lo, d:haversine(lat,lon,la,lo), pri};
  }).filter(Boolean).sort((a,b)=> (a.pri-b.pri) || (a.d-b.d));
  const top=scored[0];
  const mapUrl=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(top.name)}&query_place_id=`;
  const dirUrl=`https://www.google.com/maps/dir/?api=1&destination=${top.la},${top.lo}`;
  out.innerHTML=`Nearest: <a href="${dirUrl}" target="_blank" rel="noopener">${top.name}</a> <span class="dist">· ${top.d<1?Math.round(top.d*1000)+' m':top.d.toFixed(1)+' km'} away</span><br>
    <a href="${mapsNear}" target="_blank" rel="noopener" class="dist">see more ${label}s ↗</a>`;
}
document.getElementById('riskWrap').addEventListener('click',e=>{
  const btn=e.target.closest('.findbtn'); if(!btn) return;
  const row=btn.closest('.risk-row'), out=row.querySelector('.rloc');
  const fac=row.dataset.fac, label=decodeURIComponent(row.dataset.label);
  if(!navigator.geolocation){ out.textContent='Location isn’t available in this browser.'; return; }
  btn.disabled=true; btn.textContent='Locating…';
  navigator.geolocation.getCurrentPosition(
    pos=>{ btn.textContent='Located ✓'; findFacility(pos.coords.latitude,pos.coords.longitude,fac,label,out); },
    ()=>{ btn.disabled=false; btn.textContent='Find where to check ↗';
      out.innerHTML=`Location permission denied. <a href="https://www.google.com/maps/search/${encodeURIComponent(label)}" target="_blank" rel="noopener">Search ${label} in maps ↗</a>`; },
    {enableHighAccuracy:false,timeout:10000,maximumAge:600000});
});

/* ---------- 7c. CONVERGENCE BENCHMARK CHART (API page) -----
   Renders docs/benchmark/cohort-convergence-results.json (served as
   /benchmark-results.json): learned cohort percentiles converging to the
   NHANES reference vs n. Proof that "the cohort learns" is a measured fact. */
function renderBenchmark(){
  const box=document.getElementById('benchmarkChart'); if(!box) return;
  fetch('/benchmark-results.json').then(r=>r.json()).then(R=>{
    const pts=R.pooled; if(!pts||pts.length<2){ box.innerHTML='<div class="bench-empty">No benchmark data.</div>'; return; }
    const h=R.headline, thr=R.supersede_threshold;
    const W=320,H=140,pL=8,pR=8,pT=10,pB=22;
    const ns=pts.map(p=>p.n), maes=pts.map(p=>p.mae);
    const lx=Math.log(ns[0]), hx=Math.log(ns[ns.length-1]);
    const ymax=Math.max(...maes)*1.06||1;
    const X=n=>pL+(Math.log(n)-lx)/(hx-lx)*(W-pL-pR);
    const Y=m=>pT+(1-m/ymax)*(H-pT-pB);
    const line=pts.map(p=>`${X(p.n).toFixed(1)},${Y(p.mae).toFixed(1)}`).join(' ');
    const mx=X(thr).toFixed(1);
    const xPct=n=>(X(n)/W*100).toFixed(2);
    const yPct=m=>(Y(m)/H*100).toFixed(2);
    const ticks=[ns[0],thr,500,ns[ns.length-1]].filter((v,i,a)=>a.indexOf(v)===i&&v>=ns[0]&&v<=ns[ns.length-1]);
    const xlab=ticks.map(n=>`<span class="bench-lab" style="left:${xPct(n)}%;top:${((H-pB+9)/H*100).toFixed(2)}%;transform:translateX(-50%)">${n>=1000?(n/1000)+'k':n}</span>`).join('');
    const stat=(n,mae,lab)=>`<div class="bench-stat"><div class="bs-n">${mae.toFixed(2)}<small> bpm off</small></div><div class="bs-l">${lab} · ${n>=1000?(n/1000)+'k':n} people/band</div></div>`;
    box.innerHTML=`
      <div class="bench-stats">
        ${stat(h.cold_start.n,h.cold_start.mae,'barely any data')}
        ${stat(h.at_supersede.n,h.at_supersede.mae,'switch-over point')}
        ${stat(h.warm.n,h.warm.mae,'fully warmed up')}
      </div>
      <div class="bench-plot">
      <svg viewBox="0 0 ${W} ${H}" class="bench-svg" preserveAspectRatio="none" aria-label="Learned-vs-NHANES error decreasing as donations grow">
        <line x1="${pL}" y1="${(H-pB).toFixed(1)}" x2="${W-pR}" y2="${(H-pB).toFixed(1)}" class="bench-grid"/>
        <line x1="${mx}" y1="${pT}" x2="${mx}" y2="${(H-pB).toFixed(1)}" class="bench-mark"/>
        <polyline points="${line}" class="bench-line"/>
        <circle class="bench-hoverdot" r="3" style="display:none"/>
      </svg>
      <span class="bench-lab" style="left:${(pL/W*100).toFixed(2)}%;top:${yPct(ymax)}%;transform:translateY(-50%)">${ymax.toFixed(1)}</span>
      <span class="bench-lab" style="left:${(pL/W*100).toFixed(2)}%;top:${yPct(0)}%;transform:translateY(-50%)">0</span>
      <span class="bench-mklab" style="left:${xPct(thr)}%;top:${(pT/H*100).toFixed(2)}%">starts trusting itself · ${thr}+</span>
      ${xlab}
      <div class="bench-tip" hidden></div>
      </div>
      <div class="bench-cap">How far the app's learned numbers sit from trusted medical data (heart-beats per minute), as more people share — <b>${h.error_reduction_pct}% closer</b> once warmed up. Hover for any point.</div>`;

    // hover: show the value under the cursor
    const plot=box.querySelector('.bench-plot');
    const svg=box.querySelector('.bench-svg');
    const tip=box.querySelector('.bench-tip');
    const hdot=box.querySelector('.bench-hoverdot');
    const at=cx=>{
      const rect=svg.getBoundingClientRect();
      const sx=rect.width/W, sy=rect.height/H;
      const vx=(cx-rect.left)/sx;
      let best=pts[0],bd=Infinity;
      for(const p of pts){ const d=Math.abs(X(p.n)-vx); if(d<bd){bd=d;best=p;} }
      hdot.setAttribute('cx',X(best.n).toFixed(1));
      hdot.setAttribute('cy',Y(best.mae).toFixed(1));
      hdot.style.display='';
      tip.innerHTML=`<b>${best.mae.toFixed(2)} bpm</b> off<br><small>${best.n>=1000?(best.n/1000)+'k':best.n} people per age band</small>`;
      tip.style.left=(X(best.n)*sx).toFixed(1)+'px';
      tip.style.top=(Y(best.mae)*sy).toFixed(1)+'px';
      tip.hidden=false;
    };
    const hide=()=>{ tip.hidden=true; hdot.style.display='none'; };
    plot.addEventListener('mousemove',e=>at(e.clientX));
    plot.addEventListener('mouseleave',hide);
    plot.addEventListener('touchstart',e=>at(e.touches[0].clientX),{passive:true});
    plot.addEventListener('touchmove',e=>at(e.touches[0].clientX),{passive:true});
  }).catch(()=>{ box.innerHTML='<div class="bench-empty">Run <code>node docs/benchmark/cohort_convergence.js</code> to generate results.</div>'; });
}

/* ---------- 8. PIPELINE DRIVER ----------------------------- */
function recompute(){
  renderSignals(); renderConfidence(); renderCycle(); renderInsights(); renderRisk();
  if(window.ScrollTrigger) window.ScrollTrigger.refresh();
}
function resetStore(){ SIGNALS.forEach(s=>store[s.key].clear()); phaseByDay.clear(); fileCount=0;
  document.getElementById('filelist').innerHTML=''; }

/* ---------- 8b. PERIOD JOURNAL (manual calendar entry) -----
   Lets someone without a wearable export log a day by hand. Marking a
   period day is the only requirement; other signals are optional and
   feed the very same `store`/`phaseByDay` the CSV pipeline uses, so a
   hand-logged cycle drives the same insights and screening above.
   Persisted client-side only (localStorage), never uploaded on its own. */
const JOURNAL_KEY = 'lutea_journal_v1';
const JR_FIELDS = [
  {key:'rhr',   id:'jrRhr'},
  {key:'hrv',   id:'jrHrv'},
  {key:'temp',  id:'jrTemp'},
  {key:'sleep', id:'jrSleep'},
  {key:'resp',  id:'jrResp'},
  {key:'spo2',  id:'jrSpo2'},
  {key:'steps', id:'jrSteps'},
];
function loadJournal(){ try{ return JSON.parse(localStorage.getItem(JOURNAL_KEY)||'{}'); }catch(e){ return {}; } }
function saveJournal(){ localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal)); }
const journal = loadJournal();   // {dayIndex: {period:'yes'|'no', rhr,hrv,temp,sleep,resp,spo2,steps}}

function addSample(key, day, val){ const m=store[key]; const rec=m.get(day)||{sum:0,n:0}; rec.sum+=val; rec.n++; m.set(day,rec); }
function removeSample(key, day, val){ const m=store[key]; const rec=m.get(day); if(!rec) return;
  rec.sum-=val; rec.n--; if(rec.n<=0) m.delete(day); else m.set(day,rec); }
function applyJournalEntry(day, entry){
  for(const f of JR_FIELDS) if(entry[f.key]!=null) addSample(f.key, day, entry[f.key]);
  if(entry.period==='yes') phaseByDay.set(day, 'Menstrual');
}
function unapplyJournalEntry(day){
  const old = journal[day]; if(!old) return;
  for(const f of JR_FIELDS) if(old[f.key]!=null) removeSample(f.key, day, old[f.key]);
  if(old.period==='yes') phaseByDay.delete(day);
}
for(const d in journal) applyJournalEntry(+d, journal[d]);   // replay saved entries into the store on load

function dayIndexFromYMD(y,m,d){ return Math.floor(Date.UTC(y,m,d)/86400000); }
function ymdFromDayIndex(day){ const dt=new Date(day*86400000); return {y:dt.getUTCFullYear(), m:dt.getUTCMonth(), d:dt.getUTCDate()}; }

let jrViewYear=null, jrViewMonth=null;
function renderJournalCal(){
  const grid=document.getElementById('jrGrid'); if(!grid) return;
  const today=new Date();
  if(jrViewYear==null){ jrViewYear=today.getUTCFullYear(); jrViewMonth=today.getUTCMonth(); }
  const first=new Date(Date.UTC(jrViewYear,jrViewMonth,1));
  const startWd=first.getUTCDay();
  const daysInMonth=new Date(Date.UTC(jrViewYear,jrViewMonth+1,0)).getUTCDate();
  document.getElementById('jrMonthLbl').textContent=first.toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
  const todayIdx=dayIndexFromYMD(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate());
  let html='';
  ['S','M','T','W','T','F','S'].forEach(d=>html+=`<div class="jr-dow">${d}</div>`);
  for(let i=0;i<startWd;i++) html+='<div class="jr-cell empty"></div>';
  for(let d=1; d<=daysInMonth; d++){
    const day=dayIndexFromYMD(jrViewYear,jrViewMonth,d);
    const entry=journal[day];
    const isPeriod = entry && entry.period==='yes';
    const hasDetail = entry && JR_FIELDS.some(f=>entry[f.key]!=null);
    const future = day>todayIdx;   // can't log a day that hasn't happened yet
    html+=`<button type="button" class="jr-cell${day===todayIdx?' today':''}${entry?' has':''}${future?' future':''}" data-day="${day}"${future?' disabled aria-disabled="true"':''}>
      <span class="jr-daynum">${d}</span>
      ${isPeriod?'<i class="jr-dot period"></i>':''}${hasDetail?'<i class="jr-dot detail"></i>':''}
    </button>`;
  }
  grid.innerHTML=html;
  renderJournalSummary();
}
/* on-page summary of what's been logged + a live link to the read-out.
   Re-runs on every calendar render, so it updates the moment you save/delete. */
function renderJournalSummary(){
  const el=document.getElementById('jrSummary'); if(!el) return;
  const keys=Object.keys(journal);
  if(!keys.length){
    el.innerHTML='<span class="jr-sum-hint">Tap a past day to log your first entry — it saves instantly, on this device only.</span>';
    return;
  }
  let period=0, detail=0;
  for(const k of keys){ const e=journal[k];
    if(e.period==='yes') period++;
    if(JR_FIELDS.some(f=>e[f.key]!=null)) detail++; }
  const ready = !!buildPhaseModel().source;
  el.innerHTML =
    `<span class="jr-sum-stat"><b>${keys.length}</b> day${keys.length===1?'':'s'} logged</span>`
    + `<span class="jr-sum-stat"><b>${period}</b> period</span>`
    + (detail?`<span class="jr-sum-stat"><b>${detail}</b> with detail</span>`:'')
    + (ready?'':'<span class="jr-sum-hint">log more of your cycle to sharpen it</span>')
    + `<span class="jr-sum-link">${ready?'View your read-out':'See your read-out'} →</span>`;
}

let jrActiveDay=null, jrPeriodVal=null;
const jVeil=document.getElementById('journalVeil');
function openJournalDay(day){
  jrActiveDay=day;
  const entry=journal[day]||{};
  jrPeriodVal=entry.period||null;
  const {y,m,d}=ymdFromDayIndex(day);
  document.getElementById('jrDate').textContent=new Date(Date.UTC(y,m,d)).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
  document.querySelectorAll('#jrPeriodToggle .jr-opt').forEach(b=>b.classList.toggle('sel', b.dataset.val===jrPeriodVal));
  for(const f of JR_FIELDS) document.getElementById(f.id).value = entry[f.key]!=null ? entry[f.key] : '';
  const hasDetail = JR_FIELDS.some(f=>entry[f.key]!=null);
  document.getElementById('jrOptional').hidden = !hasDetail;
  const moreBtn=document.getElementById('jrMoreBtn');
  moreBtn.classList.toggle('open', hasDetail);
  moreBtn.setAttribute('aria-expanded', hasDetail);
  document.getElementById('jrDelete').hidden = !journal[day];
  document.getElementById('jrHint').textContent='';
  jVeil.classList.add('open');
}
document.getElementById('journalX').addEventListener('click',()=>jVeil.classList.remove('open'));
jVeil.addEventListener('click',e=>{ if(e.target===jVeil) jVeil.classList.remove('open'); });
document.getElementById('jrPeriodToggle').addEventListener('click',e=>{
  const b=e.target.closest('.jr-opt'); if(!b) return;
  jrPeriodVal=b.dataset.val;
  document.querySelectorAll('#jrPeriodToggle .jr-opt').forEach(x=>x.classList.toggle('sel', x===b));
});
document.getElementById('jrMoreBtn').addEventListener('click',()=>{
  const box=document.getElementById('jrOptional'); const willOpen=box.hidden;
  box.hidden=!willOpen;
  const moreBtn=document.getElementById('jrMoreBtn');
  moreBtn.classList.toggle('open', willOpen);
  moreBtn.setAttribute('aria-expanded', willOpen);
});
document.getElementById('jrSave').addEventListener('click',()=>{
  if(!jrPeriodVal){ document.getElementById('jrHint').textContent='Please mark whether this was a period day, it’s the one thing we need.'; return; }
  const entry={period:jrPeriodVal};
  for(const f of JR_FIELDS){
    const raw=document.getElementById(f.id).value;
    if(raw!=='' && !isNaN(parseFloat(raw))) entry[f.key]=parseFloat(raw);
  }
  unapplyJournalEntry(jrActiveDay);
  applyJournalEntry(jrActiveDay, entry);
  journal[jrActiveDay]=entry;
  saveJournal();
  recompute(); renderJournalCal();
  jVeil.classList.remove('open');
});
document.getElementById('jrDelete').addEventListener('click',()=>{
  unapplyJournalEntry(jrActiveDay);
  delete journal[jrActiveDay];
  saveJournal();
  recompute(); renderJournalCal();
  jVeil.classList.remove('open');
});
document.getElementById('jrGrid').addEventListener('click',e=>{
  const cell=e.target.closest('.jr-cell');
  if(!cell || cell.classList.contains('empty') || cell.classList.contains('future')) return;
  openJournalDay(+cell.dataset.day);
});
document.getElementById('jrSummary').addEventListener('click',e=>{
  if(e.target.closest('.jr-sum-link')){ showPage('insights'); window.scrollTo({top:0,behavior:'smooth'}); }
});
document.getElementById('jrPrev').addEventListener('click',()=>{ jrViewMonth--; if(jrViewMonth<0){jrViewMonth=11;jrViewYear--;} renderJournalCal(); });
document.getElementById('jrNext').addEventListener('click',()=>{ jrViewMonth++; if(jrViewMonth>11){jrViewMonth=0;jrViewYear++;} renderJournalCal(); });

/* staged analysis loader, 3–5.5s, randomised each run */
function runLoader(nFiles, done){
  const box=document.getElementById('loader');
  const dur=3000+Math.random()*2500;
  const labels=[
    `Reading your export · ${nFiles} file${nFiles===1?'':'s'}`,
    'Detecting known signals',
    'Aligning date ranges across signals',
    'Placing your cycle phases',
    'Comparing against clinical reference bands'];
  const w=labels.map(()=>0.7+Math.random()), tot=w.reduce((a,b)=>a+b,0);
  const cum=[]; let acc=0; for(const x of w){ acc+=x/tot; cum.push(acc); }
  const ul=box.querySelector('.ld-steps');
  ul.innerHTML=labels.map(l=>`<li class="ld-step"><span class="ld-tick">✓</span>${l}</li>`).join('');
  const fill=box.querySelector('.ld-fill'), pct=box.querySelector('.ld-pct');
  fill.style.width='0%'; pct.textContent='0%';
  box.hidden=false;
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
  const items=[...ul.children];
  const t0=performance.now();
  (function tick(){
    const p=Math.min(1,(performance.now()-t0)/dur);
    const e=p<.5 ? 2*p*p : 1-Math.pow(-2*p+2,2)/2;   // easeInOutQuad
    fill.style.width=(e*100).toFixed(1)+'%';
    pct.textContent=Math.round(e*100)+'%';
    items.forEach((li,i)=>{
      const dn=e>=cum[i]-0.001;
      li.classList.toggle('done',dn);
      li.classList.toggle('act',!dn && (i===0 || e>=cum[i-1]));
    });
    if(p<1) return requestAnimationFrame(tick);
    setTimeout(()=>{ box.hidden=true; done(); },250);
  })();
}

function handleFiles(files){
  const list = document.getElementById('filelist');
  const arr=[...files]; if(!arr.length) return;
  Promise.all(arr.map(file=>new Promise(res=>{
    const rdr=new FileReader();
    rdr.onload=e=>res({name:file.name, text:e.target.result});
    rdr.readAsText(file);
  }))).then(items=>{
    for(const it of items){
      const res = ingest(it.text, it.name);
      fileCount++;
      const row=document.createElement('div'); row.className='filerow';
      const ok = res.matched.length>0;
      const names = res.matched.map(k=>SIGNALS.find(s=>s.key===k).name).join(', ');
      row.innerHTML = `<span class="${ok?'ok':'warn'}">${ok?'✓':'!'}</span>
        <span class="nm">${it.name}</span>
        <span style="color:var(--ink-3)">${ok?names:'no known signals'}</span>`;
      list.appendChild(row);
    }
    runLoader(items.length, ()=>{
      recompute();
      showPage('raw');
      const p=document.getElementById('page-raw');
      p.classList.remove('flash'); void p.offsetWidth; p.classList.add('flash');
    });
  });
}

/* ---------- 9. WIRING (navbar single-page) ----------------- */
let currentPage='home';
function showPage(name){
  currentPage=name;
  document.querySelectorAll('.navlink').forEach(l=>l.classList.toggle('active', l.dataset.page===name));
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active', p.id==='page-'+name));
  window.scrollTo({top:0, behavior:'smooth'});
  if(window.ScrollTrigger) window.ScrollTrigger.refresh();
}
document.getElementById('nav').addEventListener('click',e=>{
  const l=e.target.closest('.navlink'); if(!l) return; showPage(l.dataset.page);
});

const drop=document.getElementById('drop'), input=document.getElementById('fileInput');
drop.addEventListener('click',()=>input.click());
input.addEventListener('change',e=>handleFiles(e.target.files));
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over');}));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over');}));
drop.addEventListener('drop',e=>{ if(e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); });
// hero "Proceed" → open the file picker; on success we jump to the Raw-data page
document.getElementById('ctaProceed').addEventListener('click',()=>input.click());

// back-to-top, appears near the bottom of the Raw / Insights / API pages
const goTop=document.getElementById('goTop');
goTop.addEventListener('click',()=>window.scrollTo({top:0, behavior:'smooth'}));
addEventListener('scroll',()=>{
  const nearBottom = innerHeight+scrollY >= document.body.scrollHeight-280;
  const show = currentPage!=='home' && nearBottom && scrollY>400;
  goTop.hidden=false; goTop.classList.toggle('show', show);
},{passive:true});

/* chart hover, crosshair + value tooltip; dashed lines announce themselves */
(function chartHover(){
  const grid=document.getElementById('pages');   // covers both the Raw-data charts and the Insights cycle strip
  function hide(w){ w.querySelector('.ch-cross').style.opacity=0; w.querySelector('.ch-tipbox').style.opacity=0; }
  function placeTip(wrap,tip,fx,txt){
    tip.textContent=txt; tip.style.opacity=1;
    const W=wrap.clientWidth, half=tip.offsetWidth/2, pad=4;
    let px=fx*W; px=Math.max(half+pad, Math.min(W-half-pad, px));
    tip.style.left=px+'px';
  }
  grid.addEventListener('mousemove',e=>{
    const pw=e.target.closest('.ph-wrap');
    if(pw){
      const r=pw.getBoundingClientRect();
      const fx=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
      const mn=+pw.dataset.mn, mx=+pw.dataset.mx;
      const d=Math.round(mn+fx*(mx-mn));
      const ph=phaseByDay.get(d);
      const cross=pw.querySelector('.ch-cross'), tip=pw.querySelector('.ch-tipbox');
      cross.style.left=(fx*100)+'%'; cross.style.opacity=1;
      placeTip(pw,tip,fx,`${dayTxt(d)} · ${ph||'no label'}`);
      return;
    }
    const wrap=e.target.closest('.ch-wrap'); if(!wrap) return;
    const cross=wrap.querySelector('.ch-cross'), tip=wrap.querySelector('.ch-tipbox');
    const hit=e.target.closest('.ch-hit');
    const r=wrap.getBoundingClientRect();
    const fx=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
    if(hit){
      cross.style.opacity=0;
      placeTip(wrap,tip,fx,hit.dataset.tip);
      return;
    }
    const s=series(wrap.dataset.key); if(s.length<2) return;
    const i=Math.round(fx*(s.length-1));
    const [day,v]=s[i];
    const dec=+wrap.dataset.dec, unit=wrap.dataset.unit;
    const vTxt=unit==='steps'?Math.round(v).toLocaleString()+' steps':(+v).toFixed(dec)+' '+unit;
    const cf=i/(s.length-1);
    cross.style.left=(cf*100)+'%'; cross.style.opacity=1;
    placeTip(wrap,tip,cf,`${dayTxt(day)} · ${vTxt}`);
  });
  grid.addEventListener('mouseout',e=>{
    const wrap=e.target.closest('.ch-wrap,.ph-wrap');
    if(wrap && !wrap.contains(e.relatedTarget)) hide(wrap);
  });
})();

/* explainer modal, "What does this mean?" on each signal card */
const veil=document.getElementById('modalVeil');
document.getElementById('sigGrid').addEventListener('click',e=>{
  const b=e.target.closest('.whylink'); if(!b) return;
  const s=SIGNALS.find(x=>x.key===b.dataset.sig); if(!s) return;
  document.getElementById('modalTitle').textContent=s.name;
  document.getElementById('modalBody').textContent=s.why;
  veil.classList.add('open');
});
document.getElementById('modalX').addEventListener('click',()=>veil.classList.remove('open'));
veil.addEventListener('click',e=>{ if(e.target===veil) veil.classList.remove('open'); });

/* Methods & Algorithms modal, footer link */
const mVeil=document.getElementById('methodsVeil');
document.getElementById('methodsBtn').addEventListener('click',()=>mVeil.classList.add('open'));
document.getElementById('methodsX').addEventListener('click',()=>mVeil.classList.remove('open'));
mVeil.addEventListener('click',e=>{ if(e.target===mVeil) mVeil.classList.remove('open'); });

/* ---------- Data donation modal ----------
   Reads a CSV, strips identifier-shaped columns/values ON DEVICE (data
   minimisation), then POSTs de-identified rows to the real /api/donate
   backend, which re-checks, coarsens, persists and re-learns the cohort. */
const dVeil=document.getElementById('donateVeil');
const dnConsent=document.getElementById('dnConsent');
const dnDrop=document.getElementById('dnDrop');
const dnFile=document.getElementById('dnFile');
const dnIntro=document.getElementById('dnIntro');
const dnLoad=document.getElementById('dnLoad');
const dnDone=document.getElementById('dnDone');

function donateReset(){
  dnIntro.hidden=false; dnLoad.hidden=true; dnDone.hidden=true;
  dnLoad.innerHTML=''; dnDone.innerHTML='';
  const err=dnIntro.querySelector('.dn-err'); if(err) err.remove();
  dnConsent.checked=false; dnDrop.classList.add('disabled'); dnFile.value='';
}
document.getElementById('donateBtn').addEventListener('click',()=>{ donateReset(); dVeil.classList.add('open'); });
document.getElementById('donateX').addEventListener('click',()=>dVeil.classList.remove('open'));
dVeil.addEventListener('click',e=>{ if(e.target===dVeil) dVeil.classList.remove('open'); });
dnConsent.addEventListener('change',()=>dnDrop.classList.toggle('disabled',!dnConsent.checked));
dnDrop.addEventListener('click',()=>{ if(dnConsent.checked) dnFile.click(); });
dnDrop.addEventListener('dragover',e=>{ e.preventDefault(); if(dnConsent.checked) dnDrop.classList.add('over'); });
dnDrop.addEventListener('dragleave',()=>dnDrop.classList.remove('over'));
dnDrop.addEventListener('drop',e=>{ e.preventDefault(); dnDrop.classList.remove('over');
  if(dnConsent.checked && e.dataTransfer.files[0]) handleDonation(e.dataTransfer.files[0]); });
dnFile.addEventListener('change',()=>{ if(dnFile.files[0]) handleDonation(dnFile.files[0]); });

const DN_ID_KEY=/(name|email|mail|phone|tel|user|account|address|street|city|zip|postal|ssn|mrn|nhs|passport|dob|birth|gps|lat|lon|lng|device|serial|uuid|guid|mac)/i;
const DN_ID_VAL=[/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,/\+\d[\d ().-]{6,}\d/,/(?:\d[ ().-]?){10,}/,/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i];
function buildDonationRecords(text){
  const {header,rows}=parseCSV(text);
  const keep=header.map(h=>!DN_ID_KEY.test(String(h).toLowerCase().trim()));
  let stripped=header.filter((h,i)=>!keep[i]).length;
  const records=[];
  for(const r of rows){
    const o={}; let has=false;
    header.forEach((h,i)=>{
      if(!keep[i]) return;
      const v=r[i]; if(v==null||v==='') return;
      if(DN_ID_VAL.some(re=>re.test(String(v)))) return;   // drop identifier-shaped value
      o[String(h).toLowerCase().trim()]=v; has=true;
    });
    if(has) records.push(o);
  }
  return {records, stripped};
}

const DN_STEPS=[
  'Scanning your file for personal identifiers',
  'Removing direct identifiers, GDPR Art. 4 &middot; HIPAA Safe Harbor',
  'Coarsening dates &amp; age for k-anonymity',
  'Validating physiological signal ranges',
  'Encrypting the transfer in transit (TLS)',
  'Storing on EU-resident research infrastructure',
  'Folding your record into the shared reference cohort'
];
async function handleDonation(file){
  dnIntro.hidden=true; dnDone.hidden=true; dnLoad.hidden=false;
  dnLoad.innerHTML=DN_STEPS.map((t,i)=>`<div class="dn-step" data-i="${i}"><div class="dn-ic"></div><div class="dn-tx">${t}</div></div>`).join('');
  const steps=[...dnLoad.querySelectorAll('.dn-step')];

  let payload=null, prepErr=null;
  try{
    const text=await file.text();
    const {records,stripped}=buildDonationRecords(text);
    if(!records.length) prepErr='No physiological rows found in this file.';
    else payload={consent:true, age:(meta.age!=null?meta.age:null), records, client_stripped_columns:stripped};
  }catch(err){ prepErr='Could not read this file.'; }

  const total=4000+Math.random()*4500;        // randomized 4.0–8.5s
  const post = payload
    ? fetch('/api/donate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(r=>r.json()).catch(()=>({ok:false,error:'network error'}))
    : Promise.resolve({ok:false,error:prepErr});

  for(let i=0;i<steps.length;i++){
    steps[i].classList.add('active');
    await new Promise(r=>setTimeout(r, total/steps.length*(0.6+Math.random()*0.8)));
    steps[i].classList.remove('active'); steps[i].classList.add('done');
  }
  const res=await post;
  dnLoad.hidden=true;
  if(res && res.ok){
    dnDone.hidden=false;
    dnDone.innerHTML=`<div class="dn-done"><div class="big">You're in the cohort.</div>
      <p><b>${res.accepted}</b> de-identified day${res.accepted===1?'':'s'} added${res.identifiers_removed?`, ${res.identifiers_removed} identifier field${res.identifiers_removed===1?'':'s'} stripped and discarded`:''}.
      The shared reference now holds <b>${res.cohort_size}</b> donation${res.cohort_size===1?'':'s'} across <b>${res.cohort_days}</b> days, every future read-out learns from it.</p></div>`;
    refreshCohort();
  } else {
    dnIntro.hidden=false;
    const msg=(res&&res.error)||'Something went wrong.';
    let e=dnIntro.querySelector('.dn-err'); if(!e){ e=document.createElement('p'); e.className='dn-err'; dnIntro.appendChild(e); }
    e.textContent='Donation not completed: '+msg;
  }
}

addEventListener('keydown',e=>{ if(e.key==='Escape'){ veil.classList.remove('open'); mVeil.classList.remove('open'); dVeil.classList.remove('open'); jVeil.classList.remove('open'); } });

/* the "Download a test file" button is a plain <a href download> to a
   static /lutea-test-sample.csv, no JS needed, cannot fail. */

/* initial paint: show the signal cards (with their "why") before any upload,
   so the user sees exactly what will light up; recompute (not just
   renderSignals) so any journal entries saved from a previous visit
   already drive the cycle/insights/screening views */
recompute();
renderJournalCal();
refreshCohort();
renderBenchmark();

})();
