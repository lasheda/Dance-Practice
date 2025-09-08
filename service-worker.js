const CACHE_NAME = 'dmc-v11-cache-v1';
const ASSETS = ['./','./index.html','./style.css','./script.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS))); });
self.addEventListener('activate', e=>{ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e=>{ e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))); });