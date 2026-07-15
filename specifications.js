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
    tr.append(inputCell('',formatMeasurement(row.Loft)),staticCell(row.Loft),inputCell());
    tr.append(inputCell('',formatMeasurement(row.Lie)),staticCell(row.Lie),inputCell());
    tr.append(inputCell('',formatMeasurement(row.Length)),staticCell(row.Length),inputCell());
    tr.append(inputCell('',formatMeasurement(row.SwingWeight)),staticCell(row.SwingWeight),inputCell());
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

els.printBtn.addEventListener('click',()=>window.print());
els.closeBtn.addEventListener('click',()=>window.close());
loadWorksheet();
