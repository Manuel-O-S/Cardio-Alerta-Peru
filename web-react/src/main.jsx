import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * Registro del service worker: es lo que permite que el tamizaje funcione sin
 * conexion.
 *
 * Va aca y no como <script> en index.html a proposito. La politica de
 * seguridad de contenido (ver netlify.toml) usa `script-src 'self'`, que
 * bloquea los scripts inline. Si el registro viviera en el HTML, el navegador
 * lo bloquearia en produccion y el modo sin conexion nunca se activaria —
 * fallando solo en el servidor, nunca en local.
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sin service worker la app sigue funcionando, solo pierde el offline.
    });
  });
}
