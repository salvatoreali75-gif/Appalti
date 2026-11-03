importScripts("version.js");   // VERSION unica, in version.js
var CACHE = "appalti-v" + self.APPALTI_VERSION;
var CORE = ["./", "index.html", "version.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
var SHARED_HOSTS = ["www.gstatic.com", "fonts.gstatic.com", "fonts.googleapis.com"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(CORE.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }).then(function () {
    // prima installazione: attiva subito; aggiornamento: aspetta il via dalla pagina, che avvisa
    if (!self.registration.active) return self.skipWaiting();
  }));
});
self.addEventListener("message", function (e) { if (e.data === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("appalti-") === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  var mine = url.origin === self.location.origin;
  if (!mine && SHARED_HOSTS.indexOf(url.hostname) < 0) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && (res.status === 200 || res.type === "opaque")) cache.put(e.request, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
