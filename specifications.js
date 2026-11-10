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



// Self-contained PDF writer: no CDN dependency and no HTML print pagination.
const pdfText = v => String(v ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g, '?');
const pdfEscape = v => pdfText(v).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
function makePDF() {
  const landscape = document.getElementById('pdfOrientation').value === 'landscape';
  const W = landscape ? 792 : 612, H = landscape ? 612 : 792;
  const margin = 29, usable = W - 2*margin;
  const rows = [...els.specBody.querySelectorAll('tr')];
  const cells = rows.map(tr => [...tr.cells].map(td => td.querySelector('input')?.value ?? td.textContent.trim()));
  const workNotes = document.getElementById('workNotes').value;
  const meta = id => document.getElementById(id)?.value || document.getElementById(id)?.textContent || '';
  const pages=[]; let stream='';
  const line=(x1,y1,x2,y2)=>{stream+=`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`;};
  const rect=(x,y,w,h)=>{stream+=`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S\n`;};
  const text=(x,y,v,size=8,bold=false)=>{stream+=`BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(v)}) Tj ET\n`;};
  const trunc=(v,n)=>{const s=pdfText(v);return s.length>n?s.slice(0,Math.max(0,n-1))+'~':s;};
  const header=()=>{
    text(margin,H-39,'CLUB SPECIFICATIONS SHEET',15,true);
    text(margin,H-53,'(With Factory Standards)',9,true);
    text(margin,H-75,`Customer: ${trunc(meta('customerName'),27)}    Ticket #: ${trunc(meta('ticketNumber'),15)}`,9);
    text(margin,H-89,`Loft Adjust: ${trunc(meta('loftAdjust'),12)}   Lie Adjust: ${trunc(meta('lieAdjust'),12)}   Length Adjust: ${trunc(meta('lengthAdjust'),12)}   Swingweight Adjust: ${trunc(meta('swingweightAdjust'),12)}`,8);
    text(margin,H-107,`${trunc(meta('clubBrand'),16)}  ${trunc(meta('clubModel'),26)}  ${trunc(meta('clubVariant'),12)}  ${trunc(meta('releaseYear'),6)}  (${trunc(meta('clubType'),12)})`,10,true);
    text(margin,H-121,`Hosel: ${trunc(meta('hoselSize'),9)}   Construction: ${trunc(meta('construction'),24)}   Bend risk: ${trunc(meta('bendRisk'),17)}`,8);
    text(margin,H-135,`Bend Notes: ${trunc(meta('bendNotes'),landscape?110:77)}`,8);
  };
  const widths = landscape ? [47,...Array(12).fill(39),35,35,149] : [42,...Array(12).fill(28),30,30,116];
  const scale=usable/widths.reduce((a,b)=>a+b,0);
  const ws=widths.map(v=>v*scale);
  const labels=['Club','Current','Std','Final','Current','Std','Final','Current','Std','Final','Current','Std','Final','Bounce','Grind','Notes'];
  const groups=[['Loft',1,3],['Lie',4,3],['Length',7,3],['Swingweight',10,3],['Wedge',13,2]];
  const drawTableHeader=(top)=>{
    const gh=19,ch=19;rect(margin,top-gh-ch,usable,gh+ch);
    let x=margin;for(let i=0;i<ws.length;i++){if(i)line(x,top-gh-ch,x,top);x+=ws[i];}
    line(margin,top-gh,margin+usable,top-gh);
    groups.forEach(([name,start,count])=>{const xx=margin+ws.slice(0,start).reduce((a,b)=>a+b,0);text(xx+3,top-13,name,8,true);});
    let xx=margin;labels.forEach((v,i)=>{text(xx+2,top-gh-12,trunc(v,Math.max(3,Math.floor(ws[i]/4.1))),landscape?7:6,true);xx+=ws[i];});
    return top-gh-ch;
  };
  const drawRow=(vals,top,rh)=>{rect(margin,top-rh,usable,rh);let x=margin;for(let i=0;i<ws.length;i++){if(i)line(x,top-rh,x,top);const v=vals[i]||'';const max=Math.max(2,Math.floor((ws[i]-4)/(i===0?4.4:4.0)));text(x+2,top-rh/2-3,trunc(v,max),landscape?7.6:6.8,i===0||[2,5,8,11].includes(i));x+=ws[i];}};
  let idx=0, pageNo=0;
  do {
    stream='0 G 0.55 w\n';pageNo++;
    header();
    let y=H-150; y=drawTableHeader(y);
    const rh=landscape?22:23;
    const reserve=52;
    while(idx<cells.length && y-rh>=margin+reserve){drawRow(cells[idx],y,rh);y-=rh;idx++;}
    // Work notes on final page, with enough space for handwriting.
    if(idx===cells.length){
      text(margin,y-18,'Work Notes:',9,true);
      rect(margin+68,y-44,usable-68,34);
      text(margin+73,y-25,trunc(workNotes,landscape?112:78),8);
    }
    text(W-margin-72,17,`Page ${pageNo}`,8);
    pages.push(stream);
  } while(idx<cells.length);
  // Build PDF 1.4 objects and cross-reference offsets.
  const objects=[null];
  const add=s=>{objects.push(s);return objects.length-1;};
  const catalog=add('');const pagesId=add('');
  const font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageIds=[];
  pages.forEach(content=>{const contentId=add(`<< /Length ${content.length} >>\nstream\n${content}endstream`);pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font} 0 R /F2 ${bold} 0 R >> >> /Contents ${contentId} 0 R >>`));});
  objects[catalog]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let pdf='%PDF-1.4\n';const offsets=[0];
  for(let i=1;i<objects.length;i++){offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}
  const xref=pdf.length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for(let i=1;i<objects.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
  pdf+=`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const blob=new Blob([pdf],{type:'application/pdf'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';
  a.download=`CRG_Specifications_${landscape?'L':'P'}.pdf`;
  document.body.append(a);a.click();a.remove();
  // Keep object URL alive for iOS Safari's asynchronous file handling.
}
els.printBtn.addEventListener('click',makePDF);
els.closeBtn.addEventListener('click',()=>window.close());
loadWorksheet();
