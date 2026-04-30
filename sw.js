const CACHE_NAME = 'mzk-v1';
const URLS_TO_CACHE = [
  '/mugiwara-zk/',
  '/mugiwara-zk/index.html',
  '/mugiwara-zk/manifest.json',
  '/mugiwara-zk/icon-192.png',
  '/mugiwara-zk/icon-512.png'
];

// Installation : mise en cache des ressources essentielles
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[MZK SW] Mise en cache des ressources...');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation : suppression des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch : stratégie Network First (online prioritaire, cache en fallback)
self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes Firebase / externes
  const url = new URL(event.request.url);
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('discord.gg') ||
    url.hostname.includes('brawlstars.com')
  ) {
    return; // laisser passer sans interception
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mettre à jour le cache avec la réponse fraîche
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback sur le cache si pas de connexion
        return caches.match(event.request).then(cached => {
          return cached || caches.match('/mugiwara-zk/');
        });
      })
  );
});
