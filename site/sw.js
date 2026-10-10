const CACHE = 'wear-the-bear-20261011b';
const SHELL = [
  '/', '/index.html', '/main.js?v=20261011b', '/sim/world.js', '/sim/save.js',
  '/input/browser.js', '/input/controls.js', '/render/renderer.js', '/render/sprites.js',
  '/audio/audio.js', '/assets/titan.webp'
];
const SHELL_PATHS = new Set(SHELL.map(path => new URL(path, self.location.origin).pathname));

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === '/research' || url.pathname.startsWith('/research/') || url.pathname === '/art' || url.pathname.startsWith('/art/')) return;
  if (url.pathname === '/main.js' && url.search !== '?v=20261011b') return;
  const navigation = request.mode === 'navigate' || request.destination === 'document' || /\.html?$/i.test(url.pathname);
  if (navigation) {
    if (!['/', '/index.html'].includes(url.pathname)) return;
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match('/index.html'))));
    return;
  }
  if (!SHELL_PATHS.has(url.pathname)) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});
