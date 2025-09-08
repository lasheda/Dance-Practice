// DANCE MEMORY COACH v10 - lógica completa
let lists = [];            // [{ name, steps: [{name, tiempos}] }]
let running = false;
let usedSteps = [];
let choreoIndex = 0;
let wakeLock = null;

// Persistencia solo al pulsar Guardar
const LS_KEY = "dmc_lists_v10";
function loadFromStorage(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw){ lists = JSON.parse(raw); }
  }catch(e){ console.warn("No se pudo cargar LocalStorage", e); }
}
function saveToStorage(){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify(lists));
    alert("✅ Guardado en el dispositivo");
  }catch(e){ alert("No se pudo guardar"); }
}

// DOM
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

// Conteo
const toggleCountBtn = document.getElementById("toggleCountBtn");
const countControls = document.getElementById("countControls");
const countVolumeSlider = document.getElementById("countVolumeSlider");
const decalajeSlider = document.getElementById("decalajeSlider");
const decalajeValue = document.getElementById("decalajeValue");
const decalajeMode = document.getElementById("decalajeMode");
const countToggles = Array.from(document.querySelectorAll(".count-toggle input"));

let countEnabled = false;
let countTimeouts = [];

toggleCountBtn.addEventListener("click", () => {
  countEnabled = !countEnabled;
  countControls.classList.toggle("hidden", !countEnabled);
  toggleCountBtn.textContent = countEnabled ? "Desactivar conteo" : "Activar conteo";
});

decalajeSlider.addEventListener("input", () => {
  decalajeValue.textContent = parseFloat(decalajeSlider.value).toFixed(1);
});

// Sincronizar velocidad input/slider
speedSlider.addEventListener("input", ()=> speedInput.value = parseFloat(speedSlider.value).toFixed(2));
speedInput.addEventListener("input", ()=> speedSlider.value = speedInput.value);

// Listas
function renderLists(){
  listSelect.innerHTML = "";
  lists.forEach((l,idx)=>{
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = l.name;
    listSelect.appendChild(opt);
  });
  renderSteps();
}

addListBtn.addEventListener("click", () => {
  const name = (listNameInput.value||"").trim();
  if(!name) return alert("Nombre inválido");
  lists.push({ name, steps: [] });
  listNameInput.value = "";
  renderLists();
  listSelect.value = String(lists.length-1);
  renderSteps();
});

renameListBtn.addEventListener("click", () => {
  if(listSelect.value === "") return alert("Selecciona una lista");
  const idx = parseInt(listSelect.value);
  const newName = prompt("Nuevo nombre:", lists[idx].name);
  if(newName){
    lists[idx].name = newName.trim();
    renderLists();
    listSelect.value = String(idx);
  }
});
deleteListBtn.addEventListener("click", () => {
  if(listSelect.value === "") return alert("Selecciona una lista");
  const idx = parseInt(listSelect.value);
  if(!confirm("¿Borrar la lista seleccionada?")) return;
  lists.splice(idx,1);
  renderLists();
});

listSelect.addEventListener("change", renderSteps);

addStepBtn.addEventListener("click", () => {
  if(listSelect.value==="") return alert("Selecciona una lista");
  const stepName = (nameInput.value||"").trim();
  const tiempos = parseInt(timeInput.value);
  if(!stepName || isNaN(tiempos) || tiempos<=0) return alert("Datos inválidos");
  const idx = parseInt(listSelect.value);
  lists[idx].steps.push({ name: stepName, tiempos });
  nameInput.value = "";
  timeInput.value = "";
  renderSteps();
});

function renderSteps(){
  stepsList.innerHTML = "";
  if(listSelect.value === "") return;
  const idx = parseInt(listSelect.value);
  const steps = lists[idx].steps;
  steps.forEach((step,i)=>{
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.textContent = `${step.name} (${step.tiempos})`;
    const right = document.createElement("div");
    right.className = "step-controls";

    const up = document.createElement("button"); up.textContent = "⬆️";
    const down = document.createElement("button"); down.textContent = "⬇️";
    const edit = document.createElement("button"); edit.textContent = "✏️";
    const del = document.createElement("button"); del.textContent = "🗑️";

    up.addEventListener("click", ()=>{
      if(i>0){ [steps[i-1], steps[i]] = [steps[i], steps[i-1]]; renderSteps(); }
    });
    down.addEventListener("click", ()=>{
      if(i<steps.length-1){ [steps[i+1], steps[i]] = [steps[i], steps[i+1]]; renderSteps(); }
    });
    edit.addEventListener("click", ()=>{
      const nn = prompt("Nuevo nombre:", step.name);
      const nt = parseInt(prompt("Nuevos tiempos:", step.tiempos));
      if(nn && !isNaN(nt) && nt>0){ steps[i] = { name: nn.trim(), tiempos: nt }; renderSteps(); }
    });
    del.addEventListener("click", ()=>{
      steps.splice(i,1);
      renderSteps();
    });

    right.append(up,down,edit,del);
    li.append(left,right);
    stepsList.appendChild(li);
  });
}

// Guardar / Importar / Exportar CSV
saveBtn.addEventListener("click", saveToStorage);

exportBtn.addEventListener("click", () => {
  let csv = "Lista,Nombre,Tiempos\\n";
  lists.forEach(list => list.steps.forEach(step => {
    csv += `${list.name},${escapeCSV(step.name)},${step.tiempos}\\n`;
  }));
  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "listas.csv"; a.click();
  URL.revokeObjectURL(url);
});
function escapeCSV(s){
  if(/[,\"\\n]/.test(s)){ return `\"${s.replace(/\"/g,'\"\"')}\"`; }
  return s;
}

importBtn.addEventListener("click", ()=> importFile.click());
importFile.addEventListener("change", (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    const text = ev.target.result;
    const lines = text.trim().split(/\\r?\\n/);
    lines.shift(); // header
    const out = {};
    lines.forEach(line=>{
      if(!line.trim()) return;
      const cols = parseCSVLine(line);
      const listName = cols[0];
      const stepName = cols[1];
      const tiempos = parseInt(cols[2]);
      if(!out[listName]) out[listName] = [];
      out[listName].push({ name: stepName, tiempos: isNaN(tiempos)?1:tiempos });
    });
    lists = Object.entries(out).map(([name,steps])=>({name,steps}));
    renderLists();
    currentStep.textContent = "📂 Listas importadas";
  };
  reader.readAsText(f);
});
function parseCSVLine(line){
  const res=[]; let cur=\"\"; let inq=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='\"'){
      if(inq && line[i+1]==='\"'){ cur+='\"'; i++; }
      else inq=!inq;
    }else if(c===',' && !inq){
      res.push(cur); cur=\"\";
    }else{ cur+=c; }
  }
  res.push(cur);
  return res;
}

// Reproducción
startBtn.addEventListener("click", async ()=>{
  if(running) return;
  if(listSelect.value==="") return alert("Selecciona una lista");
  const idx = parseInt(listSelect.value);
  if(lists[idx].steps.length===0) return alert("La lista está vacía");
  running = true;
  usedSteps = [];
  choreoIndex = 0;
  await requestWakeLock();
  runLoop();
});

stopBtn.addEventListener("click", ()=>{
  running = false;
  cancelCounting();
  releaseWakeLock();
  currentStep.textContent = "⏸ Pausado";
});

resetBtn.addEventListener("click", ()=>{
  running = false;
  cancelCounting();
  usedSteps = [];
  choreoIndex = 0;
  releaseWakeLock();
  currentStep.textContent = "🔄 Reiniciado";
});

async function runLoop(){
  while(running){
    const idx = parseInt(listSelect.value);
    const steps = lists[idx].steps;
    const mode = modeSelect.value;
    let step;

    if(mode==="normal" || mode==="loop"){
      if(usedSteps.length===0) usedSteps = [...steps];
      if(usedSteps.length===0){ currentStep.textContent="✅ Lista completada"; break; }
      const r = Math.floor(Math.random()*usedSteps.length);
      step = usedSteps.splice(r,1)[0];
      if(usedSteps.length===0 && mode==="loop"){ usedSteps = [...steps]; }
    }else if(mode==="random"){
      const r = Math.floor(Math.random()*steps.length);
      step = steps[r];
    }else if(mode==="choreo" || mode==="choreoLoop"){
      if(choreoIndex>=steps.length){
        if(mode==="choreoLoop"){ choreoIndex=0; } else { currentStep.textContent="✅ Coreografía completada"; break; }
      }
      step = steps[choreoIndex++];
    }

    const speed = Math.max(0.01, parseFloat(speedInput.value)||1);
    const unitSec = 1 / speed;
    const duration = step.tiempos * unitSec;

    currentStep.textContent = step.name;
    speakText(step.name, parseFloat(volumeSlider.value), stepVoice);

    if(countEnabled){
      scheduleCounting(step.tiempos, unitSec);
    }

    await sleep(duration * 1000);
  }
  running=false;
  releaseWakeLock();
}

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

// Speech
let stepVoice = null;
let countVoice = null;

function pickVoices(){
  const voices = speechSynthesis.getVoices();
  if(!voices || voices.length===0) return;
  stepVoice = voices.find(v=>/es|spa/i.test(v.lang)) || voices[0];
  countVoice = voices.find(v=> v!==stepVoice && /es|spa/i.test(v.lang)) || voices.find(v=>v!==stepVoice) || stepVoice;
}
speechSynthesis.onvoiceschanged = pickVoices;
pickVoices();

function speakText(text, volume, voice){
  if(!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = (voice && voice.lang) || "es-ES";
  if(voice) u.voice = voice;
  u.volume = Math.max(0, Math.min(1, volume));
  speechSynthesis.speak(u);
}

// Conteo
function scheduleCounting(totalTiempos, unitSec){
  cancelCounting();
  const selected = countToggles.map(cb=>cb.checked);
  const dec = parseFloat(decalajeSlider.value);
  const mode = decalajeMode.value;
  const delaySec = Math.abs(dec) * (mode==='t' ? unitSec : 1);

  const fullCycles = Math.floor(totalTiempos / 8);
  const remainder = totalTiempos % 8;

  let t = delaySec;
  for(let c=0;c<fullCycles;c++){
    for(let i=1;i<=8;i++){
      if(selected[i-1]){
        const id = setTimeout(()=> speakText(String(i), parseFloat(countVolumeSlider.value), countVoice), t*1000);
        countTimeouts.push(id);
      }
      t += unitSec;
    }
  }
  for(let i=1;i<=remainder;i++){
    if(selected[i-1]){
      const id = setTimeout(()=> speakText(String(i), parseFloat(countVolumeSlider.value), countVoice), t*1000);
      countTimeouts.push(id);
    }
    t += unitSec;
  }
}
function cancelCounting(){
  countTimeouts.forEach(id=> clearTimeout(id));
  countTimeouts = [];
}

// Wake Lock
let wakeLock = null;
async function requestWakeLock(){
  try{
    if("wakeLock" in navigator){
      wakeLock = await navigator.wakeLock.request("screen");
    }
  }catch(e){ console.warn("WakeLock error", e); }
}
function releaseWakeLock(){
  try{
    if(wakeLock){ wakeLock.release(); wakeLock=null; }
  }catch(e){}
}

// Init
loadFromStorage();
renderLists();
decalajeValue.textContent = parseFloat(decalajeSlider.value).toFixed(1);
