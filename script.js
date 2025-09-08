// Lógica principal simplificada de DMC v10
console.log("DMC v10 iniciado");

// Variables base
let lists = JSON.parse(localStorage.getItem("dmc_lists")||"[]");
let usedSteps = [];
let running = false;
let wakeLock = null;

// DOM
const listNameInput = document.getElementById("listNameInput");
const addListBtn = document.getElementById("addListBtn");
const listSelect = document.getElementById("listSelect");
const editListBtn = document.getElementById("editListBtn");
const deleteListBtn = document.getElementById("deleteListBtn");
const nameInput = document.getElementById("nameInput");
const timeInput = document.getElementById("timeInput");
const addStepBtn = document.getElementById("addStepBtn");
const stepsList = document.getElementById("stepsList");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const saveBtn = document.getElementById("saveBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const exportBtn = document.getElementById("exportBtn");
const currentStep = document.getElementById("currentStep");
const speedInput = document.getElementById("speedInput");
const speedSlider = document.getElementById("speedSlider");
const volumeSlider = document.getElementById("volumeSlider");
const modeSelect = document.getElementById("modeSelect");
const toggleCountBtn = document.getElementById("toggleCountBtn");
const countControls = document.getElementById("countControls");
const countVolume = document.getElementById("countVolume");
const offsetInput = document.getElementById("offsetInput");
const offsetValue = document.getElementById("offsetValue");
const offsetMode = document.getElementById("offsetMode");

// Render inicial
function renderLists() {
  listSelect.innerHTML = "";
  lists.forEach((list,i)=>{
    const opt=document.createElement("option");
    opt.value=i; opt.textContent=list.name;
    listSelect.appendChild(opt);
  });
  renderSteps();
}
function renderSteps() {
  stepsList.innerHTML="";
  if(listSelect.value==="") return;
  const list=lists[listSelect.value];
  list.steps.forEach((step,i)=>{
    const li=document.createElement("li");
    li.textContent=`${step.name} (${step.tiempos})`;
    stepsList.appendChild(li);
  });
}
renderLists();

// Eventos básicos
addListBtn.onclick=()=>{
  const name=listNameInput.value.trim();
  if(!name) return;
  lists.push({name,steps:[]});
  listNameInput.value="";
  renderLists();
};
editListBtn.onclick=()=>{
  if(listSelect.value==="") return;
  const list=lists[listSelect.value];
  const newName=prompt("Nuevo nombre",list.name);
  if(newName){ list.name=newName; renderLists(); }
};
deleteListBtn.onclick=()=>{
  if(listSelect.value==="") return;
  lists.splice(listSelect.value,1);
  renderLists();
};
listSelect.onchange=renderSteps;

addStepBtn.onclick=()=>{
  if(listSelect.value==="") return;
  const stepName=nameInput.value.trim();
  const tiempos=parseInt(timeInput.value);
  if(!stepName||isNaN(tiempos)) return;
  lists[listSelect.value].steps.push({name:stepName,tiempos});
  nameInput.value=""; timeInput.value="";
  renderSteps();
};

saveBtn.onclick=()=>{
  localStorage.setItem("dmc_lists",JSON.stringify(lists));
  currentStep.textContent="💾 Guardado";
};
exportBtn.onclick=()=>{
  let csv="Lista,Nombre,Tiempos\n";
  lists.forEach(l=>l.steps.forEach(s=>csv+=`${l.name},${s.name},${s.tiempos}\n`));
  const blob=new Blob([csv],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="listas.csv";a.click();
  URL.revokeObjectURL(url);
};
importBtn.onclick=()=>importFile.click();
importFile.onchange=(e)=>{
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const lines=ev.target.result.trim().split("\n").slice(1);
    lists=[];
    lines.forEach(line=>{
      const [listName,stepName,t]=line.split(",");
      let list=lists.find(l=>l.name===listName);
      if(!list){list={name:listName,steps:[]};lists.push(list);}
      list.steps.push({name:stepName,tiempos:parseInt(t)});
    });
    renderLists(); currentStep.textContent="📂 Importado";
  };
  reader.readAsText(file);
};

// Wake lock
async function requestWakeLock(){
  try{ wakeLock=await navigator.wakeLock.request("screen"); }
  catch(e){ console.log("WakeLock no soportado",e); }
}

// Conteo toggle
toggleCountBtn.onclick=()=>{
  countControls.style.display=countControls.style.display==="none"?"block":"none";
};

// Sincronizar sliders
speedInput.oninput=()=>{speedSlider.value=speedInput.value;};
speedSlider.oninput=()=>{speedInput.value=speedSlider.value;};
offsetInput.oninput=()=>{offsetValue.textContent=offsetInput.value;};

// Placeholder: Randomizer
startBtn.onclick=()=>{running=true; currentStep.textContent="▶ Empezado"; requestWakeLock();};
stopBtn.onclick=()=>{running=false; currentStep.textContent="⏸ Parado";};
resetBtn.onclick=()=>{running=false;usedSteps=[];currentStep.textContent="🔄 Reset";};