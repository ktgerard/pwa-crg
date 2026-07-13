<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#101827" />
  <title>Club Reference Guide PWA POC</title>
  <link rel="manifest" href="manifest.json" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="app-header">
    <div>
      <div class="eyebrow">FIS Proof of Concept</div>
      <h1>Club Reference Guide</h1>
    </div>
    <div id="versionBadge" class="version-badge">Loading data…</div>
  </header>

  <main class="layout layout-v2">
    <section class="panel controls selector-bar" aria-label="Lookup controls">
      <h2>Lookup</h2>
      <label>Club Type<select id="clubTypeSelect"></select></label>
      <label>Brand<select id="brandSelect"></select></label>
      <label>Model<select id="modelSelect"></select></label>
      <label>Variant<select id="variantSelect"></select></label>
      <label>Release Year<select id="yearSelect"></select></label>
      <label>Search<input id="searchInput" type="search" placeholder="HeadID, notes, category…" /></label>
      <button id="resetBtn" type="button">Reset Filters</button>
    </section>

    <section class="panel detail specs-panel" aria-label="Selected club detail">
      <div class="section-title-row">
        <h2>Specs</h2>
        <div class="spec-actions"><span id="selectedHeadLabel" class="pill muted">Select a head</span><button id="printSpecsBtn" class="secondary-action" type="button" disabled>Print Specifications</button></div>
      </div>
      <div id="headDetail" class="head-detail empty">Choose a club head from the list to view the spec matrix.</div>
      <div class="table-wrap">
        <table id="specTable">
          <thead></thead>
          <tbody></tbody>
        </table>
      </div>
    </section>


    <section class="panel results heads-panel" aria-label="Club results">
      <div class="section-title-row">
        <h2>Heads</h2>
        <span id="resultCount" class="pill">0 results</span>
      </div>
      <div id="headCards" class="head-cards"></div>
    </section>
  </main>


  <div id="specFormModal" class="spec-modal" hidden aria-hidden="true">
    <div class="spec-modal-backdrop" data-close-spec-form></div>
    <section class="spec-form-dialog" role="dialog" aria-modal="true" aria-labelledby="specFormTitle">
      <div class="spec-form-toolbar no-print">
        <strong>Specifications Form Preview</strong>
        <div class="toolbar-actions">
          <button id="closeSpecFormBtn" type="button" class="secondary-action">Close</button>
          <button id="doPrintSpecsBtn" type="button">Print</button>
        </div>
      </div>
      <article id="specPrintSheet" class="spec-print-sheet">
        <header class="print-title">
          <h1 id="specFormTitle">CLUB SPECIFICATIONS SHEET</h1>
          <div>(With Factory Standards)</div>
        </header>
        <div class="job-grid">
          <label>Customer's Name:<input id="printCustomer" type="text"></label>
          <label>Ticket #:<input id="printTicket" type="text"></label>
          <label>Loft Adjust:<input id="printLoftAdjust" type="text"></label>
          <label>Lie Adjust:<input id="printLieAdjust" type="text"></label>
          <label>Length Adjust:<input id="printLengthAdjust" type="text"></label>
          <label>Swingweight Adjust:<input id="printSwingweightAdjust" type="text"></label>
        </div>
        <div id="printClubIdentity" class="print-club-identity"></div>
        <div id="printHeadFacts" class="print-head-facts"></div>
        <div id="printBendNotes" class="print-bend-notes"></div>
        <div class="print-spec-table-wrap">
          <table class="print-spec-table">
            <thead>
              <tr class="group-row"><th rowspan="2">Club</th><th colspan="3">Loft</th><th colspan="3">Lie</th><th colspan="3">Length</th><th colspan="3">Swingweight</th><th colspan="2">Bounce/Grind</th><th rowspan="2">Notes</th></tr>
              <tr><th>Current</th><th>Standard</th><th>Final</th><th>Current</th><th>Standard</th><th>Final</th><th>Current</th><th>Standard</th><th>Final</th><th>Current</th><th>Standard</th><th>Final</th><th>Bounce</th><th>Grind</th></tr>
            </thead>
            <tbody id="printSpecBody"></tbody>
          </table>
        </div>
      </article>
    </section>
  </div>

  <footer class="app-footer">
    <span>Offline-first PWA shell. Data files are replaceable snapshots.</span>
  </footer>

  <script src="app.js"></script>
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}
</script>
</body>
</html>
