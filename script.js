/* DANCE MEMORY COACH v11 - completo */
// Data and state
let lists = [];
let lastListIndex = null;
let usedSteps = [];
let running = false;
let wakeLock = null;
let countTimeouts = [];
const LS_KEY = "dmc_v11_lists";
const LS_LAST = "dmc_v11_lastList";

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
const countToggles = Array.from(document.querySelectorAll("#countToggles input"));

// voices
let stepVoice = null;
let countVoice = null;
function pickVoices(){
  const v = speechSynthesis.getVoices();
  if(!v || v.length===0) return;
  stepVoice = v.find(x=>/es|spa/i.test(x.lang)) || v[0];
  countVoice = v.find(x=> x !== stepVoice && /es|spa/i.test(x.lang)) || v.find(x=>x!==stepVoice) || stepVoice;
}
speechSynthesis.onvoiceschanged = pickVoices;
pickVoices();

// Persistence: load and default
function loadData(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw){ lists = JSON.parse(raw); }
    else { lists = [{name:"Ejemplo", steps:[{name:"Basico",tiempos:8},{name:"Giro",tiempos:8}]}]; }
    const last = localStorage.getItem(LS_LAST);
    if(last!==null){ lastListIndex = parseInt(last); }
  }catch(e){ console.warn("loadData",e); lists = [{name:"Ejemplo", steps:[{name:"Basico",tiempos:8}]}]; }
}
function saveData(){ localStorage.setItem(LS_KEY, JSON.stringify(lists)); localStorage.setItem(LS_LAST, String(listSelect.value)); alert("Listas guardadas"); }

// render lists & steps
function renderLists(){
  listSelect.innerHTML = "";
  lists.forEach((lst,idx)=>{
    const opt = document.createElement("option"); opt.value = idx; opt.textContent = lst.name;
    listSelect.appendChild(opt);
  });
  // if lastListIndex exists, set it
  if(lastListIndex!==null && lists[lastListIndex]){ listSelect.value = String(lastListIndex); }
  else if(listSelect.options.length) listSelect.selectedIndex = 0;
  renderSteps();
}
function renderSteps(){
  stepsList.innerHTML = "";
  if(listSelect.value==="") return;
  const idx = parseInt(listSelect.value); lastListIndex = idx;
  const steps = lists[idx].steps || [];
  steps.forEach((s,i)=>{
    const li = document.createElement("li");
    const left = document.createElement("div"); left.textContent = `${s.name} (${s.tiempos})`;
    const right = document.createElement("div");
    // controls: up, down, edit, delete
    const up = document.createElement("button"); up.textContent="⬆"; up.title="Subir";
    const down = document.createElement("button"); down.textContent="⬇"; down.title="Bajar";
    const edit = document.createElement("button"); edit.textContent="✏"; edit.title="Editar";
    const del = document.createElement("button"); del.textContent="🗑"; del.title="Borrar";
    up.onclick = ()=>{ if(i>0){ [steps[i-1],steps[i]]=[steps[i],steps[i-1]]; renderSteps(); } };
    down.onclick = ()=>{ if(i<steps.length-1){ [steps[i+1],steps[i]]=[steps[i],steps[i+1]]; renderSteps(); } };
    edit.onclick = ()=>{ const nn=prompt("Nuevo nombre",s.name); const nt=parseInt(prompt("Nuevos tiempos",s.tiempos)); if(nn && !isNaN(nt)){ steps[i]={name:nn,tiempos:nt}; renderSteps(); } };
    del.onclick = ()=>{ if(confirm("Borrar paso?")){ steps.splice(i,1); renderSteps(); } };
    right.append(up,down,edit,del);
    li.append(left,right);
    stepsList.appendChild(li);
  });
}

// List operations
addListBtn.onclick = ()=>{
  const name = (listNameInput.value||"").trim(); if(!name) return alert("Nombre inválido");
  lists.push({name,steps:[]}); listNameInput.value=""; renderLists(); listSelect.value = String(lists.length-1); renderSteps();
};
renameListBtn.onclick = ()=>{ if(listSelect.value==="") return alert("Selecciona lista"); const i=parseInt(listSelect.value); const nn=prompt("Nuevo nombre",lists[i].name); if(nn){ lists[i].name=nn; renderLists(); listSelect.value=String(i); } };
deleteListBtn.onclick = ()=>{ if(listSelect.value==="") return alert("Selecciona lista"); const i=parseInt(listSelect.value); if(confirm("Borrar lista?")){ lists.splice(i,1); renderLists(); } };
listSelect.onchange = ()=>{ renderSteps(); saveLast(); };

addStepBtn.onclick = ()=>{
  if(listSelect.value==="") return alert("Selecciona lista");
  const name = (nameInput.value||"").trim(); const tiempos = parseInt(timeInput.value);
  if(!name || isNaN(tiempos) || tiempos<=0) return alert("Datos inválidos");
  lists[parseInt(listSelect.value)].steps.push({name,tiempos}); nameInput.value=""; timeInput.value=""; renderSteps();
};

// Save/import/export
saveBtn.onclick = ()=>{ saveData(); };
exportBtn.onclick = ()=>{
  let csv = "Lista,Nombre,Tiempos\n";
  lists.forEach(lst=> lst.steps.forEach(s=> { csv += `${escapeCSV(lst.name)},${escapeCSV(s.name)},${s.tiempos}\n`; }));
  const blob = new Blob([csv], {type:"text/csv"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="listas.csv"; a.click(); URL.revokeObjectURL(url);
};
function escapeCSV(s){ if(/[,\"\n]/.test(s)) return `"${s.replace(/"/g,'""')}"`; return s; }

importBtn.onclick = ()=> importFile.click();
importFile.onchange = (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const text = ev.target.result.replace(/\r/g,''); const lines = text.split("\n").filter(Boolean); // allow quoted CSV
    // skip header if present
    if(lines[0] && /lista.*nombre.*tiempos/i.test(lines[0])) lines.shift();
    const out = {};
    lines.forEach(line => {
      const cols = parseCSVLine(line);
      if(cols.length<3) return;
      const ln = cols[0], sn = cols[1], t = parseInt(cols[2])||1;
      if(!out[ln]) out[ln]=[];
      out[ln].push({name:sn,tiempos:t});
    });
    // merge to lists (replace current)
    lists = Object.keys(out).map(k=>({name:k,steps:out[k]}));
    renderLists();
    currentStep.textContent = "📂 Importado (recuerda GUARDAR para persistir)";
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

// Playback loop and modes
async function startRandomizer(){
  if(listSelect.value==="") return alert("Selecciona lista");
  const idx = parseInt(listSelect.value); if(!lists[idx] || (lists[idx].steps||[]).length===0) return alert("La lista está vacía");
  running = true; usedSteps = []; saveLast();
  await requestWakeLock();
  while(running){
    const mode = modeSelect.value; let step=null;
    const steps = lists[idx].steps;
    if(mode==="normal"||mode==="loop"){
      if(usedSteps.length===0) usedSteps = [...steps];
      if(usedSteps.length===0){ currentStep.textContent="✅ Lista completada"; break; }
      const r = Math.floor(Math.random()*usedSteps.length); step = usedSteps.splice(r,1)[0];
      if(usedSteps.length===0 && mode==="loop") usedSteps = [...steps];
    } else if(mode==="random"){
      const r = Math.floor(Math.random()*steps.length); step = steps[r];
    } else if(mode==="choreo"||mode==="choreoLoop"){
      if(usedSteps.length===0) usedSteps = [...steps];
      step = usedSteps.shift();
      if(!step){ if(mode==="choreoLoop"){ usedSteps=[...steps]; step=usedSteps.shift(); } else { currentStep.textContent="✅ Coreografía completada"; break; } }
    }
    const speed = Math.max(0.01, parseFloat(speedInput.value)||1);
    const unitSec = 1 / speed;
    const duration = step.tiempos * unitSec;
    currentStep.textContent = step.name;
    speak(step.name, parseFloat(volumeSlider.value), stepVoice);
    if(countControls && countControls.classList && !countControls.classList.contains('hidden')) {
      scheduleCounting(step.tiempos, unitSec);
    }
    await sleep(duration*1000);
  }
  running=false; releaseWakeLock();
}

startBtn.onclick = ()=>{ if(!running) startRandomizer(); };
stopBtn.onclick = ()=>{ running=false; cancelCounting(); releaseWakeLock(); currentStep.textContent="⏸ Detenido"; };
resetBtn.onclick = ()=>{ running=false; usedSteps=[]; cancelCounting(); releaseWakeLock(); currentStep.textContent="🔄 Reiniciado"; };

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

// Speech utilities
function speak(text, vol=1, voice=null){
  if(!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  if(voice) u.voice = voice;
  u.lang = (voice && voice.lang) || "es-ES";
  u.volume = Math.max(0, Math.min(1, vol));
  speechSynthesis.speak(u);
}

// Counting scheduling
function scheduleCounting(totalTiempos, unitSec){
  cancelCounting();
  const selected = Array.from(document.querySelectorAll("#countToggles input")).map(cb=>cb.checked);
  const dec = parseFloat(decalajeSlider.value)||0;
  const mode = decalajeMode.value || "t";
  const delaySec = Math.abs(dec) * (mode==='t' ? unitSec : 1);
  const cycles = Math.floor(totalTiempos / 8);
  const rem = totalTiempos % 8;
  let t = delaySec;
  // full cycles
  for(let c=0;c<cycles;c++){
    for(let i=1;i<=8;i++){
      if(selected[i-1]) scheduleSpeakAt(t, String(i), parseFloat(countVolume.value));
      t += unitSec;
    }
  }
  // remainder
  for(let i=1;i<=rem;i++){
    if(selected[i-1]) scheduleSpeakAt(t, String(i), parseFloat(countVolume.value));
    t += unitSec;
  }
}
function scheduleSpeakAt(delaySec, text, vol){
  if(delaySec<0) return;
  const id = setTimeout(()=> speak(text, vol, countVoice), Math.max(0, delaySec*1000));
  countTimeouts.push(id);
}
function cancelCounting(){ countTimeouts.forEach(id=>clearTimeout(id)); countTimeouts=[]; }

// Wake lock
async function requestWakeLock(){
  try{
    if('wakeLock' in navigator){ wakeLock = await navigator.wakeLock.request('screen'); }
  }catch(e){ console.warn("wakeLock:", e); }
}
function releaseWakeLock(){ try{ if(wakeLock){ wakeLock.release(); wakeLock=null; } }catch(e){ console.warn(e); } }

// UI: countControls toggle & decalaje display
toggleCountBtn.onclick = ()=>{
  if(countControls.classList.contains('hidden')){ countControls.classList.remove('hidden'); toggleCountBtn.textContent="Desactivar conteo"; }
  else{ countControls.classList.add('hidden'); toggleCountBtn.textContent="Activar conteo"; cancelCounting(); }
};
decalajeSlider.oninput = ()=> decalajeValue.textContent = parseFloat(decalajeSlider.value).toFixed(1);
speedSlider.oninput = ()=> speedInput.value = parseFloat(speedSlider.value).toFixed(2);
speedInput.oninput = ()=> speedSlider.value = parseFloat(speedInput.value);

// helpers
function saveLast(){ try{ localStorage.setItem(LS_LAST, String(listSelect.value)); }catch(e){} }

// init
loadData();
renderLists();
decalajeValue.textContent = parseFloat(decalajeSlider.value).toFixed(1);

// service worker register
if('serviceWorker' in navigator){ window.addEventListener('load', ()=> navigator.serviceWorker.register('service-worker.js').catch(()=>{})); }
