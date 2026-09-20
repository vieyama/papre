const CACHE_PREFIX = "papre";
const STATIC_CACHE = `${CACHE_PREFIX}-static-v2`;
const PAGE_CACHE = `${CACHE_PREFIX}-pages-v1`;
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/favicon-96x96.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/apple-touch-icon.png",
];

function isAppPage(pathname) {
  return /^\/(?:en\/|id\/)?(?:home|pages|calendar|book|account)(?:\/|$)/.test(pathname);
}

function rscCacheKey(url) {
  const cacheUrl = new URL(url);
  cacheUrl.searchParams.delete("_rsc");
  cacheUrl.searchParams.set("__papre_rsc", "1");
  return cacheUrl.toString();
}

async function cacheFullPage(url) {
  const pageUrl = new URL(url);
  pageUrl.searchParams.delete("_rsc");

  try {
    const response = await fetch(pageUrl, {
      credentials: "include",
      headers: { Accept: "text/html" },
    });
    const responseUrl = new URL(response.url);

    if (
      response.ok &&
      isAppPage(pageUrl.pathname) &&
      isAppPage(responseUrl.pathname)
    ) {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(pageUrl, response);
    }
  } catch {
    // The RSC response can still serve an already-open app while offline.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith(`${CACHE_PREFIX}-`) &&
                key !== STATIC_CACHE &&
                key !== PAGE_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          const responseUrl = new URL(networkResponse.url);
          if (
            networkResponse.ok &&
            isAppPage(url.pathname) &&
            isAppPage(responseUrl.pathname)
          ) {
            const cache = await caches.open(PAGE_CACHE);
            await cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;

          const offlinePage = await caches.match(OFFLINE_URL);
          return offlinePage ?? Response.error();
        }),
    );
    return;
  }

  const isRscRequest = request.headers.get("RSC") === "1";

  if (isRscRequest && isAppPage(url.pathname)) {
    const cacheKey = rscCacheKey(url);
    event.waitUntil(cacheFullPage(url));
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse.ok) {
            const cache = await caches.open(PAGE_CACHE);
            await cache.put(cacheKey, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => (await caches.match(cacheKey)) ?? Response.error()),
    );
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:css|js|png|jpg|jpeg|svg|ico|webp|woff|woff2)$/.test(url.pathname);

  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      const networkResponse = await fetch(request);
      if (networkResponse.ok && networkResponse.type === "basic") {
        const cache = await caches.open(STATIC_CACHE);
        await cache.put(request, networkResponse.clone());
      }

      return networkResponse;
    }),
  );
});
