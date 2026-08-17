const CACHE_NAME = "fis-crg-phase2b-oem-shafts-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon.svg",
  "./data/club_specs.json",
  "./data/data_version.json",
  "./data/heads.json",
  "./styles.css",
  "./app.js",
  "./data/adapter_data.json",
  "./adapter.js",
  "./adapter.html",
  "./oem-shafts.html",
  "./oem-shafts.css",
  "./oem-shafts.js",
  "./data/oem_shaft_xref.json",
  "./data/shaft_families.json",
  "./data/shaft_family_details.json",
  "./data/head_reference.json",
  "./service-worker.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => key === CACHE_NAME ? null : caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match("./index.html")))
  );
});

// Layout refinement v3: blue Adapter Settings deep-link styling.
