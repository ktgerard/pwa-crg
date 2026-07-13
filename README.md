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
        <span id="selectedHeadLabel" class="pill muted">Select a head</span>
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
