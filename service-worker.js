// Nombre y versión de la caché
const CACHE_NAME = "music-app-v8";

// Archivos principales de la aplicación
const ARCHIVOS = [
    "./",
    "./index.html",
    "./login.html",
    "./inicio.html",
    "./buscar.html",
    "./favoritos.html",
    "./listas.html",
    "./manifest.json",

    "./src/css/reproductor.css",
    "./src/css/login.css",
    "./src/css/inicio.css",
    "./src/css/buscar.css",
    "./src/css/favoritos.css",
    "./src/css/listas.css",

    "./src/js/reproductor.js",
    "./src/js/login.js",
    "./src/js/firebase-config.js",
    "./src/js/auth-guard.js",
    "./src/js/inicio.js",
    "./src/js/buscar.js",
    "./src/js/favoritos.js",
    "./src/js/listas-reproduccion.js",
    "./src/js/listas.js",
    "./src/js/itunes-api.js",
    "./src/js/pwa.js",

    "./src/img/logo.svg",
    "./src/img/icon-192.png",
    "./src/img/icon-512.png",
    "./src/img/screenshot-desktop.png",
    "./src/img/screenshot-mobile.png",
    "./src/icons/Heart.svg",
    "./src/icons/Home.svg",
    "./src/icons/Menu.svg",
    "./src/icons/Pause.svg",
    "./src/icons/Play.svg",
    "./src/icons/Plus Math.svg",
    "./src/icons/search.svg",
    "./src/icons/Skip Backward.svg"
];

// Instalar y guardar archivos
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ARCHIVOS))
            .then(() => self.skipWaiting())
    );
});

// Activar y eliminar cachés anteriores
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(
                        key =>
                            key.startsWith("music-app-") &&
                            key !== CACHE_NAME
                    )
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptar solicitudes
self.addEventListener("fetch", event => {
    // Solo guardar archivos del mismo sitio
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) return;

    const networkResponse = fetch(event.request);

    event.waitUntil(
        networkResponse
            .then(response => {
                if (response.status !== 200) return;

                return caches.open(CACHE_NAME).then(cache =>
                    cache.put(event.request, response.clone())
                );
            })
            .catch(error => {
                console.error("No se pudo actualizar la caché:", error);
            })
    );

    event.respondWith(
        networkResponse.catch(async error => {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(event.request);

            if (cachedResponse) return cachedResponse;
            throw error;
        })
    );
});