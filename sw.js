// Uygulama dosyaları önce ağdan, ağ yoksa önbellekten gelir. Veri istekleri hiç önbelleğe alınmaz.
const CACHE = "defas-portal-v22";
const SHELL = ["./", "index.html", "style.css", "app.js", "config.js", "manifest.webmanifest", "assets/logo.png", "assets/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => {
    const copy = r.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
// Telefon bildirimi (Web Push): sistemdeki her bildirim telefona düşer; dokununca ilgili ekran açılır
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "DEFAS", {
    body: d.body || "Yeni bildiriminiz var",
    icon: "assets/icon-192.png",
    badge: "assets/icon-192.png",
    tag: d.tag || undefined,
    data: { view: d.view || "notif" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL("./#" + (e.notification.data?.view || "notif"), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url.startsWith(self.registration.scope)) { c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
