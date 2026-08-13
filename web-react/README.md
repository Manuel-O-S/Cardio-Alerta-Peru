# web-react

Web del proyecto, desplegada en Netlify. Responsable: **Said** (tareas W03-W13
del cronograma).

> **Ojo, esto cambió.** Antes esta carpeta era "sitio informativo, fuera del flujo
> clínico crítico". Ahora contiene el formulario de tamizaje, así que **sí es parte
> del flujo clínico**. Ver `docs/Tamizaje_Numerico.md`.

Cuando arranques con **W03**, crea aquí el proyecto (por ejemplo con
`npm create vite@latest . -- --template react`) y organiza:

```
web-react/
  src/
    pages/
    components/
```

## Módulo de tamizaje

`src/tamizaje/` ya tiene el motor y el formulario, listos para usar:

| Archivo | Qué es |
|---|---|
| `motorTamizaje.js` | El motor. JavaScript puro, sin dependencias. |
| `motorTamizaje.test.js` | 114 comprobaciones. Corre con `node src/tamizaje/motorTamizaje.test.js`, sin instalar nada. |
| `FormularioTamizaje.jsx` | El formulario completo, cableado al motor. |

```jsx
import FormularioTamizaje from "./tamizaje/FormularioTamizaje.jsx";
```

## Datos sin conexión: es opcional y con permiso

La lista de hospitales **no se descarga sola**. La app muestra un aviso que
explica exactamente qué se guarda y qué no, y nada baja hasta que la persona
acepta. Si rechaza, todo funciona igual consultando el servidor; lo único que
se pierde es poder derivar sin conexión.

Se puede borrar en cualquier momento desde el mismo panel.

El paquete (`GET /centros-cercanos/paquete-offline`, unos 7 KB) contiene solo
establecimientos de salud. Hay una suite en el backend
(`tests/test_paquete_offline.py`) que falla si alguien agrega un campo de
paciente.

El componente no necesita Tailwind, ni librerías de formularios, ni llamadas al
backend: los estilos van en un `<style>` local y **todo el cálculo pasa en el
navegador**. Eso significa que dentro de un PWA el tamizaje funciona sin conexión,
sin TFLite y sin APK — es la forma más barata de cumplir el requisito offline del
documento de arquitectura.

Si prefieres tu propio formulario, usa solo `motorTamizaje.js` y toma el `.jsx`
como referencia de cableado.

## Cómo levantarlo

```bash
cd web-react
npm install
npm run dev      # desarrollo, en http://localhost:5173
npm run build    # produce dist/
npm test         # 114 comprobaciones del motor, sin instalar nada
```

El proyecto ya está montado: Vite + React 18, sin Tailwind ni librerías de UI.

## Despliegue en Netlify

`netlify.toml` ya trae la configuración. En el panel de Netlify, conectar el
repo y verificar que la **base directory** sea `web-react`. El resto lo toma del
archivo.

Si el backend cambia de URL, definir la variable de entorno `VITE_API_URL` en
Netlify. Por defecto apunta a `https://cardio-alerta-peru.onrender.com`.

## Qué hay dentro

| Archivo | Qué hace |
|---|---|
| `src/App.jsx` | Cáscara: dos pestañas, indicador de conexión |
| `src/tamizaje/FormularioTamizaje.jsx` | El tamizaje completo |
| `src/tamizaje/PanelDerivacion.jsx` | Centros cercanos, con copia local para offline |
| `src/tamizaje/PanelPendientes.jsx` | Casos en espera de repetición |
| `src/tamizaje/casosPendientes.js` | Persistencia del retamizaje |
| `src/tamizaje/AvisoDatosOffline.jsx` | Pide permiso antes de guardar datos en el dispositivo |
| `src/tamizaje/datosOffline.js` | Descarga, búsqueda local y borrado de la copia |
| `src/tamizaje/PanelUbicacion.jsx` | Configura dónde está el establecimiento |
| `src/tamizaje/ubicacion.js` | Catálogo, persistencia y validación de coordenadas |
| `src/tamizaje/motorTamizaje.js` | El motor. Sin dependencias. |
| `public/sw.js` | Service worker: es lo que da el modo sin conexión |

## Falta un detalle antes de instalar como app

`public/manifest.webmanifest` declara `icono-192.png` e `icono-512.png`, que
todavía no existen. La web funciona igual, pero sin ellos Android no ofrece
"añadir a pantalla de inicio". Son dos PNG cuadrados del logo.
