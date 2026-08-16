/**
 * Service worker: es lo que hace que el tamizaje funcione sin conexion.
 *
 * Estrategia deliberadamente simple, sin Workbox ni dependencias:
 *   - El cascaron de la app (HTML, JS, CSS) se sirve desde cache y se
 *     actualiza en segundo plano. El motor de tamizaje viaja ahi dentro, asi
 *     que el calculo funciona en modo avion.
 *   - Las llamadas al backend NUNCA se cachean aca. El panel de derivacion ya
 *     guarda su propia copia en localStorage y sabe avisar que los datos son
 *     de la ultima sincronizacion. Cachearlas dos veces solo generaria
 *     confusion sobre que tan viejos son los datos.
 */

const CACHE = "cardio-alerta-v3";
const ESENCIALES = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg"];

// Google Fonts. Se guardan tras la primera carga para que la tipografia de la
// interfaz tambien funcione sin conexion; si no, sin señal la app cae a las
// fuentes del sistema y se ve distinta a como se diseño.
const ORIGENES_FUENTES = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ESENCIALES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;

  if (peticion.method !== "GET") return;

  const url = new URL(peticion.url);

  // Las fuentes son de otro origen pero si se guardan: son inmutables y hacen
  // falta para que la interfaz se vea igual sin conexion.
  if (ORIGENES_FUENTES.includes(url.origin)) {
    evento.respondWith(
      caches.match(peticion).then(
        (cacheada) =>
          cacheada ||
          fetch(peticion)
            .then((respuesta) => {
              if (respuesta && (respuesta.ok || respuesta.type === "opaque")) {
                const copia = respuesta.clone();
                caches.open(CACHE).then((c) => c.put(peticion, copia));
              }
              return respuesta;
            })
            // Sin fuentes la app sigue funcionando con las del sistema.
            .catch(() => new Response("", { status: 504 }))
      )
    );
    return;
  }

  // El resto de otros origenes (el backend) pasa directo: sus respuestas no se
  // cachean aca porque el panel de derivacion ya guarda su propia copia y sabe
  // decir de cuando es.
  if (url.origin !== self.location.origin) return;

  evento.respondWith(
    caches.match(peticion).then((cacheada) => {
      const desdeRed = fetch(peticion)
        .then((respuesta) => {
          if (respuesta && respuesta.status === 200 && respuesta.type === "basic") {
            const copia = respuesta.clone();
            caches.open(CACHE).then((c) => c.put(peticion, copia));
          }
          return respuesta;
        })
        .catch(() => cacheada || caches.match("/index.html"));

      // Cache primero para que abra rapido; la red actualiza para la proxima vez.
      return cacheada || desdeRed;
    })
  );
});
