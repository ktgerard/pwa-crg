<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#101827" />
  <title>FIS Adapter Reference</title>
  <link rel="manifest" href="manifest.json" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="app-header adapter-header">
    <div>
      <div class="eyebrow">FIS Adapter Reference</div>
      <h1 id="adapterTitle">Adapter Settings</h1>
    </div>
    <a class="adapter-back" href="index.html">Club Reference</a>
  </header>
  <main class="adapter-layout">
    <section class="panel adapter-panel">
      <div id="adapterMeta" class="adapter-meta">Loading adapter…</div>
      <div id="adapterNotice" class="adapter-notice"></div>
    </section>
    <section class="panel adapter-panel">
      <h2>Quick Reference</h2>
      <div id="quickTable" class="table-wrap adapter-table"></div>
    </section>
    <section class="panel adapter-panel">
      <h2>OEM Matrix</h2>
      <div id="matrixTable" class="table-wrap adapter-table"></div>
    </section>
    <section class="panel adapter-panel">
      <h2>Notes</h2>
      <div id="adapterNotes" class="adapter-notes"></div>
    </section>
  </main>
  <script>
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const requestedFamily = params.get('family') || '';
function esc(v){return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function table(headers, rows){
  if(!rows || !rows.length) return '<div class="empty-adapter">No settings table found for this adapter family.</div>';
  return `<table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${headers.map((_,i)=>`<td>${esc(r[i]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function normalizeFamily(data, family){
  const raw = String(family || '').trim();
  if(!raw) return raw;
  const aliases = data.aliases || {};
  if(aliases[raw]) return aliases[raw];
  const compact = raw.replace(/[\s-]+/g, '_');
  if(aliases[compact]) return aliases[compact];
  const lower = raw.toLowerCase();
  const key = Object.keys(aliases).find(k => k.toLowerCase() === lower || k.replace(/[\s-]+/g, '_').toLowerCase() === compact.toLowerCase());
  if(key) return aliases[key];
  // Safety fallback: never show a driver/fairway chart for an explicitly hybrid Titleist request.
  if(lower.includes('titleist') && lower.includes('hybrid')) return 'TITLEIST_SUREFIT_HYBRID_816_PLUS';
  if(lower.includes('titleist') && lower.includes('surefit')) return 'TITLEIST_SUREFIT_DRIVER_FW';
  return raw;
}
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

  </script>
</body>
</html>
