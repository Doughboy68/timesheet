/* Service worker: makes the app open offline and instantly, and gives updates
   a visible, deliberate moment rather than leaving them to the browser cache.

   BUILD is rewritten on every deploy, so the cache name changes and the old
   one is deleted on activate. Nothing here calls skipWaiting on its own — a
   new version waits until the page asks, which is what makes the
   "new version available" prompt honest. */
const BUILD = "2026-08-06.1638";

/* Cache storage is shared across the whole origin, so the beta copy at
   /timesheet/beta/ must not tidy away the live copy's cache. Namespace both
   the cache and the cleanup by the folder this worker was served from. */
const PREFIX = "timesheet" + location.pathname.replace(/sw\.js$/, "");
const CACHE  = PREFIX + BUILD;

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener("activate", e=>{
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith(PREFIX) && k !== CACHE)   // only this copy's old builds
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", e=>{
  if(e.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== location.origin) return;

  /* The page itself: network first, so a deploy is picked up as soon as there
     is a connection, falling back to the cached copy when there isn't. */
  if(req.mode === "navigate"){
    e.respondWith((async ()=>{
      try{
        const fresh = await fetch(req);
        const c = await caches.open(CACHE);
        c.put("./index.html", fresh.clone());
        return fresh;
      }catch(err){
        const c = await caches.open(CACHE);
        return (await c.match("./index.html")) || (await c.match("./")) || Response.error();
      }
    })());
    return;
  }

  /* Icons and the manifest change rarely: serve from cache, fetch if absent. */
  e.respondWith((async ()=>{
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    if(hit) return hit;
    try{
      const res = await fetch(req);
      if(res.ok) c.put(req, res.clone());
      return res;
    }catch(err){
      return hit || Response.error();
    }
  })());
});
