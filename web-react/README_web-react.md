# web-react

Web del proyecto, desplegada en Vercel. Responsable: **Said**, con apoyo de
**Angel** en documentación.

Contiene el formulario de tamizaje completo — **es parte del flujo clínico
crítico**, no un sitio informativo. Ver
[`../docs/Tamizaje_Numerico.md`](../docs/Tamizaje_Numerico.md).

```
web-react/
  src/
    App.jsx
    auth/
    tamizaje/
```

## Módulo de tamizaje

`src/tamizaje/` tiene el motor y el formulario, listos para usar:

| Archivo | Qué es |
|---|---|
| `motorTamizaje.js` | El motor. JavaScript puro, sin dependencias. |
| `motorTamizaje.test.js` | Comprobaciones del motor. Corre con `node src/tamizaje/motorTamizaje.test.js`, sin instalar nada. |
| `FormularioTamizaje.jsx` | El formulario completo, cableado al motor. |

```jsx
import FormularioTamizaje from "./tamizaje/FormularioTamizaje.jsx";
```

## Datos sin conexión: es opcional y con permiso

La lista de hospitales **no se descarga sola**. La app muestra un aviso que
explica exactamente qué se guarda y qué no, y nada baja hasta que la persona
acepta. Si rechaza, todo funciona igual consultando el servidor; lo único que
se pierde es poder derivar sin conexión.

Se puede borrar en cualquier momento desde el mismo panel (`PanelDerivacion.jsx`).

El paquete (`GET /centros-cercanos/paquete-offline`, unos 7 KB) contiene solo
establecimientos de salud, nunca datos de pacientes. Hay una suite en el
backend (`tests/test_paquete_offline.py`) que falla si alguien agrega un campo
de paciente por error.

El componente no necesita Tailwind, ni librerías de formularios, ni llamadas al
backend para calcular: los estilos van en un `<style>` local y **todo el
cálculo del tamizaje pasa en el navegador**. Eso significa que dentro de un PWA
el tamizaje funciona sin conexión, sin TFLite y sin APK — es la forma más
barata de cumplir el requisito offline de la arquitectura del proyecto.

Si prefieres tu propio formulario, usa solo `motorTamizaje.js` y toma el
`.jsx` como referencia de cableado.

## Cómo levantarlo

```bash
cd web-react
npm install
npm run dev      # desarrollo, en http://localhost:5173
npm run build    # produce dist/
npm test         # comprobaciones del motor, sin instalar nada
```

El proyecto está montado con Vite + React 18, sin Tailwind ni librerías de UI.

## Despliegue en Vercel

El proyecto se despliega en Vercel apuntando el **root directory** del
proyecto a `web-react` (configuración del framework: Vite). Comando de build
`npm run build`, carpeta de salida `dist`.

Al ser una SPA de una sola página, hace falta un rewrite para que cualquier
ruta resuelva `index.html` — en Vercel esto se define con un `vercel.json` en
`web-react/` (o en la raíz, ajustando el `root directory`):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Si el backend cambia de URL, definir la variable de entorno `VITE_API_URL` en
el panel de Vercel (Project Settings → Environment Variables). Por defecto
apunta a `https://cardio-alerta-peru.onrender.com`.

**Pendiente de verificar al migrar desde Netlify:** las cabeceras de seguridad
(CSP, `X-Frame-Options`, `Cache-Control` del service worker) que antes vivían
en `netlify.toml` deben migrarse a la sección `headers` de `vercel.json`, o el
service worker puede quedar cacheado por el CDN y los usuarios se quedan con
una versión vieja de la app.

## Qué hay dentro

| Archivo | Qué hace |
|---|---|
| `src/App.jsx` | Cáscara: pestañas principales, indicador de conexión |
| `src/tamizaje/FormularioTamizaje.jsx` | El tamizaje completo |
| `src/tamizaje/PanelDerivacion.jsx` | Centros cercanos, con copia local para offline |
| `src/tamizaje/PanelDerivacionHospitales.jsx` | Listado y filtro de hospitales por red de seguro |
| `src/tamizaje/PanelPendientes.jsx` | Casos en espera de repetición |
| `src/tamizaje/casosPendientes.js` | Persistencia del retamizaje |
| `src/tamizaje/AvisoDatosOffline.jsx` | Pide permiso antes de guardar datos en el dispositivo |
| `src/tamizaje/datosOffline.js` | Descarga, búsqueda local y borrado de la copia offline |
| `src/tamizaje/geolocalizacion.js` | Ubicación del dispositivo, con mensaje distinto por cada causa de fallo |
| `src/tamizaje/PanelUbicacion.jsx` | Configura dónde está el establecimiento |
| `src/tamizaje/ubicacion.js` | Catálogo, persistencia y validación de coordenadas |
| `src/tamizaje/elevacion.js` | Cálculo/consulta de altitud del establecimiento |
| `src/tamizaje/motorTamizaje.js` | El motor de reglas. Sin dependencias. |
| `src/tamizaje/CalculadoraPGE1.jsx` | Referencia informativa de dosis de prostaglandina E1 (no reemplaza criterio médico) |
| `src/tamizaje/CalculadoraHidratacion.jsx` | Referencia informativa de hidratación |
| `src/HistorialClinico.jsx` | Historial de casos tamizados |
| `src/auth/PantallaLogin.jsx` | Login (Supabase Auth) |
| `public/sw.js` | Service worker: es lo que da el modo sin conexión |

## Falta un detalle antes de instalar como app

`public/manifest.webmanifest` declara `icono-192.png` e `icono-512.png`, que
todavía no existen. La web funciona igual, pero sin ellos Android no ofrece
"añadir a pantalla de inicio". Son dos PNG cuadrados del logo, pendientes.
