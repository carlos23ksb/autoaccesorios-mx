const CACHE = "aamx-v1-20261023";
const BASE = ["./", "./index.html", "./img/logo.webp", "./img/icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Páginas: red primero (precios y existencias siempre frescos), caché de respaldo
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const cp = r.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", cp));
          return r;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Imágenes: caché primero (carga rápida), red de respaldo
  if (url.pathname.includes("/img/")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((r) => {
            const cp = r.clone();
            caches.open(CACHE).then((c) => c.put(req, cp));
            return r;
          })
      )
    );
    return;
  }

  e.respondWith(fetch(req).catch(() => caches.match(req)));
});
