// Service Worker pour l'application PWA Prière ICC
const CACHE_NAME = "priere-icc-v1";
const OFFLINE_URL = "/offline";

// Fichiers essentiels à mettre en cache lors de l'installation
const PRECACHE_ASSETS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-32x32.png",
  "/icons/favicon-16x16.png",
];

// Installation : mise en cache préalable des ressources critiques
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Erreur de pré-cachement:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches et prise de contrôle immédiate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Suppression de l'ancien cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes réseau
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Ignorer les requêtes non-GET et les requêtes chrome-extension / non-http
  if (request.method !== "GET" || !request.url.startsWith("http")) {
    return;
  }

  const url = new URL(request.url);

  // 1. Requêtes API et authentification : Réseau d'abord (Network Only ou fallback JSON)
  if (url.pathname.startsWith("/api/") || url.pathname.includes("/auth/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: "Hors ligne", offline: true }),
          {
            headers: { "Content-Type": "application/json" },
            status: 503,
          }
        );
      })
    );
    return;
  }

  // 2. Navigation de page HTML : Network First avec fallback Offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Si la réponse est valide, on la met en cache pour consultation hors-ligne
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // En cas d'échec réseau, on tente le cache de la page demandée
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si la page n'est pas en cache, on sert la page hors-ligne dédiée
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) {
            return offlinePage;
          }
          return new Response("Application hors ligne. Veuillez vous reconnecter à Internet.", {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        })
    );
    return;
  }

  // 3. Fichiers statiques Next.js, images, polices, icônes : Cache First avec mise à jour en arrière-plan (Stale-While-Revalidate)
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Par défaut : réseau avec fallback cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Notifications Push natives (sur l'écran verrouillé et le centre de notifications)
self.addEventListener("push", (event) => {
  let title = "Ministère de la Prière ICC";
  let body = "Vous avez une nouvelle notification.";
  let url = "/dashboard";
  let tag = "priere-icc-alert";
  let icon = "/icons/icon-192x192.png";
  let badge = "/icons/icon-96x96.png";

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) body = data.body;
      if (data.url) url = data.url;
      if (data.tag) tag = data.tag;
      if (data.icon) icon = data.icon;
      if (data.badge) badge = data.badge;
    } catch {
      try {
        const text = event.data.text();
        if (text) body = text;
      } catch {}
    }
  }

  const options = {
    body,
    icon,
    badge,
    tag,
    renotify: true,
    data: {
      url,
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch((err) => {
      console.warn("[SW] Erreur showNotification standard, tentative fallback:", err);
      return self.registration.showNotification(title, {
        body,
        data: { url },
      });
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Résolution de l'URL absolue par rapport à l'origine du site
      const targetUrl = new URL(rawUrl, self.location.origin).href;

      // 1. Si un onglet de l'application est déjà ouvert, naviguer vers l'URL et mettre au premier plan
      for (const client of clientList) {
        if ("navigate" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      // 2. Sinon ouvrir une nouvelle fenêtre vers la page
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
