// 오프라인 플레이용 캐시 (네트워크 우선, 실패 시 캐시)
const CACHE = 'saberduel-v1';
const FILES = [
  './', './index.html', './manifest.json', './css/style.css', './icons/icon.svg',
  './js/config.js', './js/audio.js', './js/skins.js', './js/effects.js', './js/arena.js',
  './js/fighter.js', './js/ai.js', './js/game.js', './js/main.js',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request))
  );
});
