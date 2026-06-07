const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const requestedFamily = params.get('family') || '';
function esc(v){return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function table(headers, rows){
  if(!rows || !rows.length) return '<div class="empty-adapter">No settings table found for this adapter family.</div>';
  return `<table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${headers.map((_,i)=>`<td>${esc(r[i]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function normalizeFamily(data, family){return (data.aliases && data.aliases[family]) || family;}
async function loadAdapter(){
  const data = await fetch('data/adapter_data.json').then(r=>r.json());
  const canonical = normalizeFamily(data, requestedFamily);
  const adapter = data.adapters.find(a => a.family === canonical);
  if(!requestedFamily || !adapter){
    $('adapterTitle').textContent = requestedFamily ? 'Adapter chart not mapped' : 'Adapter Reference';
    $('adapterMeta').innerHTML = requestedFamily ? `<b>Requested family:</b> ${esc(requestedFamily)}` : 'Open from a club head Hosel link to jump directly to the correct adapter.';
    $('adapterNotice').textContent = requestedFamily ? 'This head has an AdapterFamily value, but no chart is mapped yet. No alternate OEM chart was shown.' : '';
    $('quickTable').innerHTML = '';
    $('matrixTable').innerHTML = '';
    $('adapterNotes').innerHTML = '';
    return;
  }
  $('adapterTitle').textContent = adapter.title || adapter.family;
  const yearRange = [adapter.yearsStart, adapter.yearsEnd].filter(Boolean).join('–');
  $('adapterMeta').innerHTML = `<div class="adapter-family"><b>${esc(adapter.family)}</b></div><div>${esc(adapter.oem || adapter.manufacturer || '')} ${yearRange ? '• '+esc(yearRange) : ''} ${adapter.clubTypes ? '• '+esc(adapter.clubTypes) : ''}</div>${requestedFamily !== canonical ? `<div class="alias-note">Routed from: ${esc(requestedFamily)}</div>` : ''}`;
  $('adapterNotice').textContent = 'Verify adapter generation visually before adjusting. This page is a service reference, not an OEM replacement.';
  $('quickTable').innerHTML = table(adapter.quickHeaders || [], adapter.quick || []);
  $('matrixTable').innerHTML = table(adapter.matrixHeaders || [], adapter.matrix || []);
  const notes = [...(adapter.notes||[]), ...(adapter.workflow||[])];
  $('adapterNotes').innerHTML = notes.length ? notes.map(n=>`<p>${esc(n)}</p>`).join('') : '<p>—</p>';
}
loadAdapter().catch(err=>{
  $('adapterTitle').textContent='Adapter load failed';
  $('adapterMeta').textContent='Could not load adapter_data.json.';
  console.error(err);
});
