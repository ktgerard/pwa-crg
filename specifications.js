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
const pdfText = v => String(v ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2013\u2014]/g,'-').replace(/[^\x20-\x7e\u00b1]/g, '?');
const pdfEscape = v => pdfText(v).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/\u00b1/g,'\\261');
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
  const ctx=document.createElement('canvas').getContext('2d');
  const widthOf=(v,size=8,bold=false)=>{ctx.font=`${bold?'bold ':''}${size}px Arial`;return ctx.measureText(pdfText(v)).width*1.04;};
  const wrap=(v,w,size=8,bold=false)=>{
    const result=[];let current='';
    for(const word of pdfText(v).split(/\s+/)){
      if(!word)continue;
      const candidate=current?current+' '+word:word;
      if(widthOf(candidate,size,bold)<=w){current=candidate;continue;}
      if(current){result.push(current);current='';}
      if(widthOf(word,size,bold)<=w){current=word;continue;}
      let part='';for(const ch of word){if(part&&widthOf(part+ch,size,bold)>w){result.push(part);part='';}part+=ch;}current=part;
    }
    if(current)result.push(current);
    return result.length?result:[''];
  };
  const center=(x,w,y,v,size=8,bold=false)=>{text(x+(w-widthOf(v,size,bold))/2,y,v,size,bold);};
  const widths=landscape?[47,...Array(12).fill(39),35,35,149]:[42,...Array(12).fill(28),30,30,116];
  const scale=usable/widths.reduce((a,b)=>a+b,0),ws=widths.map(v=>v*scale);
  const xAt=i=>margin+ws.slice(0,i).reduce((a,b)=>a+b,0);
  const groups=[['Loft',1,3],['Lie',4,3],['Length',7,3],['Swingweight',10,3],['Wedge',13,2]];
  const sublabels=['','Current','Standard','Final','Current','Standard','Final','Current','Standard','Final','Current','Standard','Final','Bounce','Grind',''];
  const labelValue=(x,y,label,value,w,fs=7.8)=>{
    const labelW=widthOf(label,fs,true)+5;text(x,y,label,fs,true);
    const lines=wrap(value,Math.max(8,w-labelW),fs);
    lines.forEach((v,i)=>text(x+labelW,y-i*(fs+2),v,fs));
    return Math.max(1,lines.length)*(fs+2);
  };
  const drawMainHeader=()=>{
    let y=H-35;text(margin,y,'CLUB SPECIFICATIONS SHEET',15,true);y-=14;
    text(margin,y,'(With Factory Standards)',9,true);y-=22;
    const customerHeight=labelValue(margin,y,'Customer:',meta('customerName'),usable*.62,8);
    const ticketHeight=labelValue(margin+usable*.64,y,'Ticket #:',meta('ticketNumber'),usable*.36,8);
    y-=Math.max(customerHeight,ticketHeight)+6;
    const fields=[['Loft Adjust:','loftAdjust'],['Lie Adjust:','lieAdjust'],['Length Adjust:','lengthAdjust'],['Swingweight Adjust:','swingweightAdjust']];
    const q=usable/4;let adjustmentHeight=0;
    fields.forEach(([label,id],i)=>{adjustmentHeight=Math.max(adjustmentHeight,labelValue(margin+i*q,y,label,meta(id),q-4,7));});
    y-=adjustmentHeight+8;
    const identity=[['Club Type','clubType'],['Club Brand','clubBrand'],['Club Model','clubModel'],['Variant','clubVariant'],['Year','releaseYear']];
    const proportions=[1.05,1.35,1.35,1.1,.7],sum=proportions.reduce((a,b)=>a+b,0),iw=proportions.map(v=>usable*v/sum);
    const idLines=identity.map(([label,id],i)=>wrap(meta(id),iw[i]-8,8.2,true));
    const ih=Math.max(36,23+Math.max(...idLines.map(a=>a.length))*10);
    rect(margin,y-ih,usable,ih);line(margin,y-16,margin+usable,y-16);
    let x=margin;
    identity.forEach(([label,id],i)=>{
      if(i)line(x,y-ih,x,y);
      center(x,iw[i],y-11,label,7.5,true);
      idLines[i].forEach((v,k)=>center(x,iw[i],y-27-k*10,v,8.2,true));x+=iw[i];
    });
    y-=ih+12;
    const left=[['Category:','modelCategory'],['Construction:','construction'],['Face Tech:','faceTech'],['Core Tech:','coreTech'],['Hosel Type:','hoselType'],['Bend Risk:','bendRisk']];
    const right=[['Launch:','launchProfile'],['Spin:','spinProfile'],['Offset:','offsetProfile'],['Loft Structure:','loftStructure'],['Hosel Size:','hoselSize'],['Source:','sourceStatus']];
    const half=usable/2,fs=landscape?7.6:6.9;
    for(let i=0;i<6;i++){
      const a=labelValue(margin,y,left[i][0],meta(left[i][1]),half-10,fs);
      const b=labelValue(margin+half,y,right[i][0],meta(right[i][1]),half-10,fs);
      y-=Math.max(12,a,b)+2;
    }
    line(margin,y+5,margin+usable,y+5);
    const bend=wrap('Bend Notes: '+meta('bendNotes'),usable-4,7.5);
    bend.forEach(v=>{text(margin,y-5,v,7.5);y-=10;});
    return y-14;
  };
  const drawContinuationHeader=(pageNo)=>{
    const heading=`${meta('clubBrand')} ${meta('clubModel')} - Specifications (continued)`;
    const lines=wrap(heading,usable-65,9.5,true);
    let y=H-34;lines.forEach(v=>{text(margin,y,v,9.5,true);y-=11;});
    text(W-margin-45,H-34,`Page ${pageNo}`,8);
    return y-9;
  };
  const drawTableHeader=top=>{
    const gh=20,ch=20,bottom=top-gh-ch;
    rect(margin,bottom,usable,gh+ch);
    // Club and Notes span both header rows: do not draw a line through them.
    line(xAt(1),top-gh,xAt(15),top-gh);
    [1,4,7,10,13,15].forEach(i=>line(xAt(i),top-gh,xAt(i),top));
    for(let i=1;i<16;i++)line(xAt(i),bottom,xAt(i),top-gh);
    center(margin,ws[0],bottom+17,'Club',7.8,true);
    center(xAt(15),ws[15],bottom+17,'Notes',7.8,true);
    groups.forEach(([name,start,count])=>center(xAt(start),ws.slice(start,start+count).reduce((a,b)=>a+b,0),top-13,name,7.8,true));
    for(let i=1;i<15;i++)center(xAt(i),ws[i],bottom+7,sublabels[i],landscape?6.8:5.5,true);
    return bottom;
  };
  const valSize=landscape?7.4:6.6,noteSize=landscape?7.0:6.0;
  const rowInfo=vals=>{
    const notes=wrap(vals[15]||'',ws[15]-7,noteSize);
    const other=vals.slice(0,15).map((v,i)=>wrap(v||'',ws[i]-5,valSize,i===0||[2,5,8,11].includes(i)));
    const lines=Math.max(notes.length,...other.map(a=>a.length));
    return {notes,other,height:Math.max(23,lines*(Math.max(noteSize,valSize)+2)+8)};
  };
  const drawRow=(vals,top,info)=>{
    rect(margin,top-info.height,usable,info.height);
    for(let i=1;i<16;i++)line(xAt(i),top-info.height,xAt(i),top);
    for(let i=0;i<15;i++){
      const arr=info.other[i],bold=i===0||[2,5,8,11].includes(i);
      const topLine=top-(info.height-arr.length*(valSize+2))/2-valSize;
      arr.forEach((v,k)=>center(xAt(i),ws[i],topLine-k*(valSize+2),v,valSize,bold));
    }
    info.notes.forEach((v,k)=>text(xAt(15)+3,top-9-k*(noteSize+2),v,noteSize));
  };
  let idx=0,pageNo=0;
  while(true){
    stream='0 G 0.55 w\n';pageNo++;
    let y=pageNo===1?drawMainHeader():drawContinuationHeader(pageNo);
    y=drawTableHeader(y);
    const reserve=52;
    while(idx<cells.length){
      const info=rowInfo(cells[idx]);
      if(y-info.height<margin+reserve)break;
      drawRow(cells[idx],y,info);y-=info.height;idx++;
    }
    if(idx===cells.length){
      const noteLines=wrap(workNotes,usable-89,8);
      const noteHeight=Math.max(38,noteLines.length*10+12);
      if(y-noteHeight-8<margin+10){
        text(W-margin-55,16,`Page ${pageNo}`,8);pages.push(stream);
        stream='0 G 0.55 w\n';pageNo++;
        y=drawContinuationHeader(pageNo)-8;
      }
      text(margin,y-14,'Work Notes:',8.5,true);
      rect(margin+79,y-noteHeight,usable-79,noteHeight-4);
      noteLines.forEach((v,i)=>text(margin+83,y-16-i*10,v,8));
    }
    text(W-margin-55,16,`Page ${pageNo}`,8);pages.push(stream);
    if(idx===cells.length)break;
    // A row too tall for the available page area must not cause an endless loop.
    if(pageNo>1 && idx<cells.length && rowInfo(cells[idx]).height>H-2*margin-120)throw new Error('Specification row exceeds printable page height');
  }
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
