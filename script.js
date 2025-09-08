/* DANCE MEMORY COACH v12 - Full implementation */

// State
let lists = [];
let usedSteps = [];
let running = false;
let wakeLock = null;
let countTimeouts = [];
let activeTimers = [];

// Keys
const LS_LISTS = "dmc_v12_lists";
const LS_LAST = "dmc_v12_lastList";

// DOM refs
const listNameInput = document.getElementById("listNameInput");
const addListBtn = document.getElementById("addListBtn");
const listSelect = document.getElementById("listSelect");
const renameListBtn = document.getElementById("renameListBtn");
const deleteListBtn = document.getElementById("deleteListBtn");
const nameInput = document.getElementById("nameInput");
const timeInput = document.getElementById("timeInput");
const addStepBtn = document.getElementById("addStepBtn");
const stepsList = document.getElementById("stepsList");

const speedInput = document.getElementById("speedInput");
const speedSlider = document.getElementById("speedSlider");
const volumeSlider = document.getElementById("volumeSlider");
const modeSelect = document.getElementById("modeSelect");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const currentStep = document.getElementById("currentStep");

const saveBtn = document.getElementById("saveBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const exportBtn = document.getElementById("exportBtn");

const toggleCountBtn = document.getElementById("toggleCountBtn");
const countControls = document.getElementById("countControls");
const countVolume = document.getElementById("countVolume");
const decalajeSlider = document.getElementById("decalajeSlider");
const decalajeValue = document.getElementById("decalajeValue");
const decalajeMode = document.getElementById("decalajeMode");
const countToggles = () => Array.from(document.querySelectorAll("#countToggles input"));

// Voices
let stepVoice = null;
let countVoice = null;
function pickVoices(){
  const v = speechSynthesis.getVoices();
  if(!v || v.length===0) return;
  stepVoice = v.find(x=>/es|spa/i.test(x.lang)) || v[0];
  countVoice = v.find(x=> x!==stepVoice && /es|spa/i.test(x.lang)) || v.find(x=>x!==stepVoice) || stepVoice;
}
speechSynthesis.onvoiceschanged = pickVoices;
pickVoices();

// Persistence
function loadData(){
  try{
    const raw = localStorage.getItem(LS_LISTS);
    lists = raw ? JSON.parse(raw) : [{name:"Ejemplo", steps:[{name:"Básico", tiempos:8},{name:"Giro", tiempos:8}]}];
    const last = localStorage.getItem(LS_LAST);
    if(last !== null) listSelect.selectedIndex = parseInt(last);
  }catch(e){ console.warn(e); lists = [{name:"Ejemplo", steps:[{name:"Básico", tiempos:8}]}]; }
}
function saveData(){
  try{
    localStorage.setItem(LS_LISTS, JSON.stringify(lists));
    localStorage.setItem(LS_LAST, String(listSelect.value));
    alert("✅ Guardado en dispositivo");
  }catch(e){ alert("No se pudo guardar"); }
}

// Render lists and steps
function renderLists(){
  listSelect.innerHTML = "";
  lists.forEach((l,i)=>{
    const opt = document.createElement("option");
    opt.value = i; opt.textContent = l.name;
    listSelect.appendChild(opt);
  });
  renderSteps();
}
function renderSteps(){
  stepsList.innerHTML = "";
  if(listSelect.value === "") return;
  const idx = parseInt(listSelect.value);
  const steps = lists[idx].steps || [];
  steps.forEach((s,i)=>{
    const li = document.createElement("li");
    li.innerHTML = `<div>${s.name} (${s.tiempos})</div>`;
    const ctrl = document.createElement("div");
    ctrl.className = "step-controls";
    const up = document.createElement("button"); up.textContent="⬆"; up.title="Subir";
    const down = document.createElement("button"); down.textContent="⬇"; down.title="Bajar";
    const edit = document.createElement("button"); edit.textContent="✏"; edit.title="Editar";
    const del = document.createElement("button"); del.textContent="🗑"; del.title="Borrar";
    up.onclick = ()=>{ if(i>0){ [steps[i-1],steps[i]]=[steps[i],steps[i-1]]; renderSteps(); } };
    down.onclick = ()=>{ if(i<steps.length-1){ [steps[i+1],steps[i]]=[steps[i],steps[i+1]]; renderSteps(); } };
    edit.onclick = ()=>{ const nn=prompt("Nuevo nombre",s.name); const nt=parseInt(prompt("Nuevos tiempos",s.tiempos)); if(nn && !isNaN(nt) && nt>0){ steps[i]={name:nn,tiempos:nt}; renderSteps(); } };
    del.onclick = ()=>{ if(confirm("Borrar paso?")){ steps.splice(i,1); renderSteps(); } };
    ctrl.append(up,down,edit,del);
    li.appendChild(ctrl);
    stepsList.appendChild(li);
  });
}

// List controls
addListBtn.onclick = ()=>{
  const name = (listNameInput.value||"").trim();
  if(!name) return alert("Nombre inválido");
  lists.push({name, steps:[]});
  listNameInput.value = "";
  renderLists();
  listSelect.value = String(lists.length-1);
  renderSteps();
};
renameListBtn.onclick = ()=>{ if(listSelect.value==="") return alert("Selecciona una lista"); const idx=parseInt(listSelect.value); const nn=prompt("Nuevo nombre", lists[idx].name); if(nn){ lists[idx].name=nn; renderLists(); listSelect.value=String(idx);} };
deleteListBtn.onclick = ()=>{ if(listSelect.value==="") return alert("Selecciona una lista"); const idx=parseInt(listSelect.value); if(confirm("Borrar lista?")){ lists.splice(idx,1); renderLists(); } };
listSelect.onchange = ()=>{ renderSteps(); saveLast(); };

addStepBtn.onclick = ()=>{
  if(listSelect.value==="") return alert("Selecciona lista");
  const name = (nameInput.value||"").trim();
  const tiempos = parseInt(timeInput.value);
  if(!name||isNaN(tiempos)||tiempos<=0) return alert("Datos inválidos");
  lists[parseInt(listSelect.value)].steps.push({name,tiempos});
  nameInput.value=""; timeInput.value="";
  renderSteps();
};

// Save / Import / Export
saveBtn.onclick = saveData;
exportBtn.onclick = ()=>{
  let csv="Lista,Nombre,Tiempos\n";
  lists.forEach(l=> l.steps.forEach(s => { csv += `${escapeCSV(l.name)},${escapeCSV(s.name)},${s.tiempos}\n`; }));
  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download="listas.csv"; a.click(); URL.revokeObjectURL(url);
};
function escapeCSV(s){ if(/[,\"\n]/.test(s)) return `"${s.replace(/"/g,'""')}"`; return s; }
importBtn.onclick = ()=> importFile.click();
importFile.onchange = e=>{
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    const text = ev.target.result.replace(/\r/g,'');
    const lines = text.split('\n').filter(Boolean);
    if(lines[0] && /lista.*nombre.*tiempos/i.test(lines[0])) lines.shift();
    const out = {};
    lines.forEach(line => {
      const cols = parseCSVLine(line);
      if(cols.length<3) return;
      const ln = cols[0], sn = cols[1], t = parseInt(cols[2])||1;
      if(!out[ln]) out[ln]=[];
      out[ln].push({name:sn,tiempos:t});
    });
    lists = Object.keys(out).map(k=>({name:k,steps:out[k]}));
    renderLists();
    currentStep.textContent = "📂 Listas importadas (pulsa Guardar para persistir)";
  };
  reader.readAsText(f);
};
function parseCSVLine(line){
  const res=[]; let cur=""; let inq=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='"'){ if(inq && line[i+1]==='"'){ cur+='"'; i++; } else inq=!inq; }
    else if(c===',' && !inq){ res.push(cur); cur=""; }
    else cur+=c;
  }
  res.push(cur); return res;
}

// Playback core (per-beat so speed changes and pause are responsive)
async function startRandomizer(){
  if(listSelect.value==="") return alert("Selecciona una lista");
  const idx = parseInt(listSelect.value);
  if(!lists[idx] || lists[idx].steps.length===0) return alert("La lista está vacía");
  running = true;
  usedSteps = [];
  saveLast();
  await requestWakeLock();
  while(running){
    const mode = modeSelect.value;
    let step = null;
    const steps = lists[idx].steps;
    if(mode==="normal"||mode==="loop"){
      if(usedSteps.length===0) usedSteps = [...steps];
      if(usedSteps.length===0){ currentStep.textContent="✅ Lista completada"; break; }
      const r = Math.floor(Math.random()*usedSteps.length); step = usedSteps.splice(r,1)[0];
      if(usedSteps.length===0 && mode==="loop") usedSteps = [...steps];
    } else if(mode==="random"){
      step = steps[Math.floor(Math.random()*steps.length)];
    } else if(mode==="choreo"||mode==="choreoLoop"){
      if(usedSteps.length===0) usedSteps=[...steps];
      step = usedSteps.shift();
      if(!step){ if(mode==="choreoLoop"){ usedSteps=[...steps]; step=usedSteps.shift(); } else { currentStep.textContent="✅ Coreografía completada"; break; } }
    }

    currentStep.textContent = step.name;
    speakText(step.name, parseFloat(volumeSlider.value), stepVoice);

    // counting: schedule per-beat with responsiveness to speed changes
    const totalBeats = step.tiempos;
    let beat = 0;
    // initial decalaje
    const decalaje = parseFloat(decalajeSlider.value) || 0;
    const decalajeModeVal = decalajeMode.value || "t";
    const baseUnit = () => 1 / Math.max(0.01, parseFloat(speedInput.value) || 1);
    const initialDelay = Math.abs(decalaje) * (decalajeModeVal==='t' ? baseUnit() : 1);

    // start time loop
    // We use incremental waits so stop/pause takes effect immediately
    // first wait initialDelay, then loop baseUnit() per beat
    if(initialDelay > 0){
      await waitCancel(initialDelay);
    }
    while(running && beat < totalBeats){
      // recalc unit in case speed changed
      const unit = baseUnit();
      beat++;
      // speak counting if enabled
      const checkbox = document.querySelector(`#countToggles input[data-beat="${((beat-1)%8)+1}"]`);
      if(checkbox && checkbox.checked){
        humanCountSpeak(((beat-1)%8)+1, parseFloat(countVolume.value));
      }
      // wait for next beat, but allow interruption
      await waitCancel(unit);
    }
    // clear any pending count timers
    cancelScheduledCounts();
  }
  running = false;
  releaseWakeLock();
}

// Utilities: wait that can be cancelled
function waitCancel(seconds){
  return new Promise(resolve=>{
    const id = setTimeout(()=>{ activeTimers = activeTimers.filter(t=>t!==id); resolve(); }, Math.max(0, seconds*1000));
    activeTimers.push(id);
  });
}
function clearActiveTimers(){ activeTimers.forEach(id=>clearTimeout(id)); activeTimers=[]; }

// humanized counting: jitter, accents, rate/pitch tweaks
function humanCountSpeak(num, vol){
  // small random jitter (ms)
  const jitter = (Math.random()-0.5) * 0.08; // seconds
  const isAccent = (num===1 || num===5);
  const rate = isAccent ? 0.95 + Math.random()*0.04 : 1.02 + Math.random()*0.06;
  const pitch = isAccent ? 0.9 : 1.0 + Math.random()*0.12;
  const u = new SpeechSynthesisUtterance(String(num));
  u.lang = "es-ES"; u.volume = Math.max(0, Math.min(1, vol)); u.rate = Math.max(0.4, Math.min(2, rate)); u.pitch = Math.max(0.1, Math.min(2, pitch));
  if(countVoice) u.voice = countVoice;
  const id = setTimeout(()=> speechSynthesis.speak(u), Math.max(0, jitter*1000));
  countTimeouts.push(id);
}
function cancelScheduledCounts(){ countTimeouts.forEach(id=>clearTimeout(id)); countTimeouts=[]; }

// speak step names
function speakText(text, vol=1, voice=null){
  if(!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  if(voice) u.voice = voice;
  u.lang = (voice && voice.lang) || "es-ES";
  u.volume = Math.max(0, Math.min(1, vol));
  speechSynthesis.speak(u);
}

// stop/pause/reset handlers
startBtn.addEventListener("click", ()=>{ if(!running) startRandomizer(); });
stopBtn.addEventListener("click", ()=>{ running=false; clearActiveTimers(); cancelScheduledCounts(); speechSynthesis.cancel(); currentStep.textContent="⏸ Pausado"; releaseWakeLock(); });
resetBtn.addEventListener("click", ()=>{ running=false; clearActiveTimers(); cancelScheduledCounts(); speechSynthesis.cancel(); usedSteps=[]; currentStep.textContent="🔄 Reiniciado"; releaseWakeLock(); });

// wake lock request
async function requestWakeLock(){
  try{ if('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); }catch(e){ console.warn("wakeLock:", e); }
}
function releaseWakeLock(){ try{ if(wakeLock){ wakeLock.release(); wakeLock=null; } }catch(e){ console.warn(e); } }

// count controls
toggleCountBtn.addEventListener("click", ()=>{
  countControls.classList.toggle("hidden");
  toggleCountBtn.textContent = countControls.classList.contains("hidden") ? "Activar conteo" : "Desactivar conteo";
});
decalajeSlider.addEventListener("input", ()=> decalajeValue.textContent = parseFloat(decalajeSlider.value).toFixed(1));
speedSlider.addEventListener("input", ()=> speedInput.value = parseFloat(speedSlider.value).toFixed(2));
speedInput.addEventListener("input", ()=> speedSlider.value = parseFloat(speedInput.value).toFixed(2));

// helper save last selected list
function saveLast(){ try{ localStorage.setItem(LS_LAST, String(listSelect.value)); }catch(e){} }

// select voices once available
speechSynthesis.onvoiceschanged = pickVoices;
pickVoices();

// init
loadData();
renderLists();
decalajeValue.textContent = parseFloat(decalajeSlider.value).toFixed(1);

// service worker register
if('serviceWorker' in navigator){ window.addEventListener('load', ()=> navigator.serviceWorker.register('service-worker.js').catch(()=>{})); }
