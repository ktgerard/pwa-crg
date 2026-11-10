const els={
  loadStatus:document.getElementById('loadStatus'),printBtn:document.getElementById('printBtn'),closeBtn:document.getElementById('closeBtn'),
  specBody:document.getElementById('specBody'),errorMessage:document.getElementById('errorMessage')
};

function norm(value){return String(value??'').trim();}
function display(value,fallback=''){const text=norm(value);return text||fallback;}
function formatHoselSize(value){const text=norm(value);if(!text)return '';const number=Number(text);return Number.isFinite(number)?number.toFixed(3):text;}
function formatMeasurement(value){const text=norm(value);if(!text)return '';const number=Number(text);return Number.isFinite(number)?String(number):text;}
function usefulSpec(row){return Boolean(norm(row.Club)&&['Loft','Lie','Length','SwingWeight','Bounce','Offset','HoselSize','Notes'].some(key=>norm(row[key])));}
function extractGrind(notes){const match=norm(notes).match(/(?:^|[;,.\s])Grind:\s*([^;,.]+)/i);return match?match[1].trim():'';}
function notesWithoutSource(notes){return norm(notes).split(/\s*SourceURL:\s*/i)[0].trim().replace(/[;,]\s*$/,'');}
function setText(id,value,fallback=''){document.getElementById(id).textContent=display(value,fallback);}
function inputCell(className='',value=''){const td=document.createElement('td');const input=document.createElement('input');input.type='text';input.value=value;input.className=className;td.append(input);return td;}
function staticCell(value,className='standard-cell'){const td=document.createElement('td');td.className=className;const span=document.createElement('span');span.className='static-value';span.textContent=formatMeasurement(value);td.append(span);return td;}

function populateHead(head){
  setText('clubType',head.ClubType,'—');setText('clubBrand',head.OEM,'—');setText('clubModel',head.Model,'—');
  setText('clubVariant',head.Variant,'Standard');setText('releaseYear',head.ReleaseYear,'—');setText('modelCategory',head.ModelCategory,'Unavailable');
  setText('construction',head.Construction,'Unavailable');setText('faceTech',head.FaceTech,'Unavailable');setText('coreTech',head.CoreTech,'Unavailable');
  setText('hoselType',head.HoselType,'Unavailable');setText('bendRisk',head.BendRisk,'Unavailable');setText('launchProfile',head.LaunchProfile,'Unavailable');
  setText('spinProfile',head.SpinProfile,'Unavailable');setText('offsetProfile',head.OffsetProfile,'Unavailable');setText('loftStructure',head.LoftStructure,'Unavailable');
  setText('hoselSize',formatHoselSize(head.HoselSizeDefault),'Unavailable');setText('sourceStatus',head.SourceStatus,'Unavailable');
  setText('bendNotes',head.BendNotes||head.Notes,'Unavailable');
  document.title=`Specifications – ${display(head.OEM)} ${display(head.Model)}`.trim();
}

function populateSpecs(rows){
  els.specBody.innerHTML='';
  rows.forEach(row=>{
    const tr=document.createElement('tr');
    const club=document.createElement('td');club.className='club-cell';club.textContent=norm(row.Club);tr.append(club);
    tr.append(inputCell(),staticCell(row.Loft),inputCell());
    tr.append(inputCell(),staticCell(row.Lie),inputCell());
    tr.append(inputCell(),staticCell(row.Length),inputCell());
    tr.append(inputCell(),staticCell(row.SwingWeight),inputCell());
    tr.append(staticCell(row.Bounce),staticCell(extractGrind(row.Notes)));
    tr.append(inputCell('notes-input',notesWithoutSource(row.Notes)));
    els.specBody.append(tr);
  });
  if(!rows.length){
    const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=16;td.textContent='No useful specification rows were found for this head.';td.className='standard-cell';tr.append(td);els.specBody.append(tr);
  }
}

function showError(message){
  els.errorMessage.hidden=false;els.errorMessage.textContent=message;els.loadStatus.textContent='Unable to load worksheet';els.printBtn.disabled=true;
}

async function loadWorksheet(){
  const headId=new URLSearchParams(window.location.search).get('headId');
  if(!headId){showError('No HeadID was supplied. Return to the Club Reference Guide, select a head, and use Print Specifications.');return;}
  try{
    const [headsResponse,specsResponse]=await Promise.all([fetch('data/heads.json',{cache:'no-store'}),fetch('data/club_specs.json',{cache:'no-store'})]);
    if(!headsResponse.ok||!specsResponse.ok)throw new Error(`Data request failed (${headsResponse.status}/${specsResponse.status})`);
    const [heads,specs]=await Promise.all([headsResponse.json(),specsResponse.json()]);
    const head=heads.find(item=>norm(item.HeadID)===headId);
    if(!head){showError(`The selected HeadID was not found: ${headId}`);return;}
    const rows=specs.filter(item=>norm(item.HeadID)===headId&&usefulSpec(item)).sort((a,b)=>Number(a.ClubSort||999)-Number(b.ClubSort||999)||Number(a.GrindSort||999)-Number(b.GrindSort||999)||norm(a.Club).localeCompare(norm(b.Club),undefined,{numeric:true}));
    populateHead(head);populateSpecs(rows);
    els.loadStatus.textContent=`${head.OEM} ${head.Model} • ${rows.length} specification row${rows.length===1?'':'s'}`;
    els.printBtn.disabled=false;
  }catch(error){console.error(error);showError('The worksheet data could not be loaded. Open it from the hosted CRG or a local web server, not directly from a file folder.');}
}


// Explicit print pagination: independent tables and headers on every page.
// Keeps the editable on-screen worksheet untouched.
const PRINT_FIRST_ROWS = 12;
const PRINT_CONTINUATION_ROWS = 16;
function syncClonedFields(original, clone) {
  const from = original.querySelectorAll('input, textarea');
  const to = clone.querySelectorAll('input, textarea');
  from.forEach((field, i) => {
    if (!to[i]) return;
    if (field.type === 'checkbox' || field.type === 'radio') to[i].checked = field.checked;
    else to[i].value = field.value;
    if (to[i].tagName === 'TEXTAREA') to[i].textContent = field.value;
    else to[i].setAttribute('value', field.value);
  });
}
function buildPrintPages() {
  const target = document.getElementById('printPages');
  if (!target) return;
  target.replaceChildren();
  const liveSheet = document.getElementById('sheet');
  const liveRows = [...els.specBody.querySelectorAll('tr')];
  const chunks = [];
  let start = 0;
  while (start < liveRows.length) {
    const size = chunks.length === 0 ? PRINT_FIRST_ROWS : PRINT_CONTINUATION_ROWS;
    chunks.push(liveRows.slice(start, start + size));
    start += size;
  }
  if (!chunks.length) chunks.push([]);
  chunks.forEach((rows, index) => {
    const page = document.createElement('div');
    page.className = 'print-page';
    const sheet = liveSheet.cloneNode(true);
    sheet.removeAttribute('id');
    sheet.removeAttribute('aria-live');
    syncClonedFields(liveSheet, sheet);
    if (index > 0) {
      // Only page 1 needs the customer, model and factory reference fields.
      ['.sheet-header', '.work-order-grid', '.identity-grid', '.reference-grid']
        .forEach(selector => sheet.querySelector(selector)?.remove());
    }
    if (index !== chunks.length - 1) sheet.querySelector('.bottom-grid')?.remove();
    const body = sheet.querySelector('#specBody');
    body.removeAttribute('id');
    body.replaceChildren(...rows.map(row => {
      const clone = row.cloneNode(true);
      syncClonedFields(row, clone);
      return clone;
    }));
    sheet.querySelector('#errorMessage')?.remove();
    page.append(sheet);
    target.append(page);
  });
}
window.addEventListener('beforeprint', buildPrintPages);

els.printBtn.addEventListener('click',()=>{buildPrintPages();window.print();});
els.closeBtn.addEventListener('click',()=>window.close());
loadWorksheet();
