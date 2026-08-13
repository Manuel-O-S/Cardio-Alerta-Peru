import { useState } from "react";
import {
  QUE_NO_SE_GUARDA,
  QUE_SE_GUARDA,
  borrarDatos,
  descargarDatos,
  resumenDatos,
} from "./datosOffline.js";

/**
 * Pide permiso antes de guardar datos en el dispositivo.
 *
 * Aparece solo si NO hay datos guardados. Nada se descarga hasta que la
 * persona pulse el boton: no hay descarga automatica, ni al abrir la
 * aplicacion, ni en segundo plano.
 *
 * Es opcional de verdad. Si se rechaza, la aplicacion funciona igual
 * consultando el servidor; lo unico que se pierde es poder derivar sin
 * conexion. El rechazo no se vuelve a preguntar en la misma sesion.
 */
export default function AvisoDatosOffline({ onCambio }) {
  const [resumen, setResumen] = useState(resumenDatos);
  const [rechazado, setRechazado] = useState(false);
  const [detalle, setDetalle] = useState(false);
  const [estado, setEstado] = useState("inicial"); // inicial | descargando | error
  const [error, setError] = useState("");
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [resultadoSync, setResultadoSync] = useState(""); // texto tras sincronizar

  const descargar = async () => {
    setEstado("descargando");
    setError("");
    setResultadoSync("");

    // Se guarda la version previa para poder decir si algo cambio. Un
    // "sincronizado" que no distingue entre "habia cambios" y "no habia" no
    // le sirve a nadie: la duda es justamente si el dato esta al dia.
    const versionPrevia = resumen?.version;

    const r = await descargarDatos();
    if (r.ok) {
      const nuevo = resumenDatos();
      setResumen(nuevo);
      setEstado("inicial");
      if (versionPrevia) {
        setResultadoSync(
          nuevo.version === versionPrevia
            ? "Sin cambios: los datos ya estaban al dia."
            : `Actualizado: ${nuevo.total} hospitales.`
        );
      }
      onCambio?.();
    } else {
      setEstado("error");
      // Importante: si falla, NO se borra lo que ya habia. Quedarse sin datos
      // por un fallo de red seria peor que tener datos algo viejos.
      setError(
        resumen
          ? `No se pudo sincronizar (${r.error}). Se conservan los datos guardados.`
          : r.error
      );
    }
  };

  const borrar = () => {
    borrarDatos();
    setResumen(null);
    setConfirmandoBorrado(false);
    setResultadoSync("");
    setError("");
    // NO se pone `rechazado`: tras borrar, el panel vuelve a ofrecer la
    // descarga. Antes se ocultaba y no habia forma de volver a bajar los
    // datos sin recargar la pagina.
    onCambio?.();
  };

  // --- Ya hay datos guardados: solo un resumen y la opcion de borrarlos ---
  if (resumen) {
    const dias = Math.floor(resumen.antiguedadHoras / 24);
    const antiguedad =
      resumen.antiguedadHoras < 1
        ? "hace menos de una hora"
        : dias >= 1
          ? `hace ${dias} ${dias === 1 ? "dia" : "dias"}`
          : `hace ${resumen.antiguedadHoras} h`;
    const viejo = resumen.antiguedadHoras >= 24;

    return (
      <section className="tz-card off-guardado">
        <style>{CSS_OFF}</style>
        <div className="off-fila">
          <div className="off-info">
            <span className="off-etiqueta">Datos sin conexion</span>
            <p className="off-resumen">
              {resumen.total} hospitales guardados en este dispositivo
            </p>
            <p className={`off-antiguedad ${viejo ? "off-antiguedad-vieja" : ""}`}>
              Sincronizados {antiguedad}
              {viejo && " · la disponibilidad puede haber cambiado"}
            </p>
          </div>
        </div>

        {/* Los dos botones van completos y etiquetados, no como iconos: quien
            usa esto puede estar apurada y no debe dudar de que hace cada uno. */}
        <div className="off-botones">
          <button
            type="button"
            className="off-boton"
            onClick={descargar}
            disabled={estado === "descargando"}
          >
            {estado === "descargando" ? "Sincronizando…" : "Sincronizar ahora"}
          </button>
          <button
            type="button"
            className="off-boton off-boton-borrar"
            onClick={() => setConfirmandoBorrado(true)}
            disabled={estado === "descargando"}
          >
            Borrar lista
          </button>
        </div>

        {resultadoSync && <p className="off-sync-ok">{resultadoSync}</p>}
        {error && <p className="off-sync-error">{error}</p>}

        {/* Confirmacion antes de borrar. Sin datos guardados la derivacion deja
            de funcionar sin conexion, asi que un toque accidental no deberia
            bastar para perderlos. */}
        {confirmandoBorrado && (
          <div className="off-confirmar">
            <p className="off-confirmar-texto">
              Al borrar la lista, la derivacion volvera a necesitar internet en
              cada busqueda. Se puede descargar de nuevo cuando haya conexion.
            </p>
            <div className="off-botones">
              <button type="button" className="off-boton off-boton-peligro" onClick={borrar}>
                Si, borrar
              </button>
              <button
                type="button"
                className="off-boton"
                onClick={() => setConfirmandoBorrado(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  if (rechazado) return null;

  // --- No hay datos: se pide permiso ---
  return (
    <section className="tz-card off-aviso">
      <style>{CSS_OFF}</style>
      <span className="off-etiqueta">Uso sin conexion</span>
      <p className="off-titulo">
        Guardar la lista de hospitales en este dispositivo
      </p>
      <p className="off-texto">
        Sin esto, la derivacion necesita internet cada vez. Con esto, funciona
        aunque se caiga la señal. Son unos 7 KB y podes borrarlos cuando
        quieras.
      </p>

      <button
        type="button"
        className="off-detalle-btn"
        onClick={() => setDetalle(!detalle)}
        aria-expanded={detalle}
      >
        {detalle ? "Ocultar detalle" : "Ver exactamente que se guarda"}
      </button>

      {detalle && (
        <div className="off-detalle">
          <p className="off-sub">Se guarda</p>
          <ul className="off-lista">
            {QUE_SE_GUARDA.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="off-sub">No se guarda</p>
          <ul className="off-lista off-lista-no">
            {QUE_NO_SE_GUARDA.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="off-nota-tec">
            Los datos quedan solo en este navegador. No se envian a ningun
            servidor y se borran al limpiar los datos del navegador.
          </p>
        </div>
      )}

      {estado === "error" && <p className="tz-alerta">{error}</p>}

      <div className="tz-acciones">
        <button
          type="button"
          className="tz-boton"
          onClick={descargar}
          disabled={estado === "descargando"}
        >
          {estado === "descargando" ? "Descargando…" : "Guardar en el dispositivo"}
        </button>
        <button
          type="button"
          className="tz-boton tz-boton-sec"
          onClick={() => setRechazado(true)}
        >
          Ahora no
        </button>
      </div>
    </section>
  );
}

const CSS_OFF = `
.off-aviso { border-color:#cfd9e3; background:linear-gradient(180deg,#fff,var(--campo)); }
.off-guardado { padding:14px 16px; }
.off-etiqueta { font-size:10.5px; font-weight:600; letter-spacing:.12em;
                text-transform:uppercase; color:var(--suave);
                font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.off-titulo { margin:8px 0 6px; font-size:15.5px; font-weight:600; color:var(--tinta);
              line-height:1.35; }
.off-texto { margin:0 0 12px; font-size:13.5px; color:var(--suave); line-height:1.5; }
.off-detalle-btn { background:none; border:none; padding:0; font-family:inherit;
                   font-size:13px; color:var(--marino-alto); cursor:pointer;
                   text-decoration:underline; }
.off-detalle { margin:12px 0 4px; padding:13px; border-radius:9px;
               background:var(--campo); border:1px solid var(--linea); }
.off-sub { margin:0 0 6px; font-size:11px; font-weight:600; letter-spacing:.1em;
           text-transform:uppercase; color:var(--suave);
           font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.off-lista { margin:0 0 14px; padding-left:17px; }
.off-lista li { font-size:13px; line-height:1.55; color:var(--tinta); }
.off-lista-no li { color:var(--verde); }
.off-nota-tec { margin:0; font-size:12px; color:var(--suave); line-height:1.5; }
.off-fila { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
.off-resumen { margin:5px 0 2px; font-size:14.5px; font-weight:500; color:var(--tinta); }
.off-antiguedad { margin:0; font-size:12px; color:var(--suave); line-height:1.4; }
.off-antiguedad-vieja { color:var(--ambar); }
.off-info { min-width:0; }
.off-botones { display:flex; gap:8px; margin-top:13px; flex-wrap:wrap; }
.off-boton { flex:1 1 auto; min-width:130px; background:#fff;
             border:1px solid var(--linea); border-radius:9px; padding:10px 14px;
             font-family:inherit; font-size:13.5px; color:var(--marino-alto);
             cursor:pointer; white-space:nowrap; }
.off-boton:hover:not(:disabled) { border-color:var(--marino-tenue); }
.off-boton:disabled { opacity:.5; cursor:default; }
.off-boton-borrar { color:var(--suave); }
.off-boton-peligro { background:var(--rojo); border-color:var(--rojo); color:#fff; }
.off-sync-ok { margin:11px 0 0; font-size:12.5px; color:var(--verde); line-height:1.45; }
.off-sync-error { margin:11px 0 0; padding:10px 12px; border-radius:9px;
                  background:var(--ambar-suave); border:1px solid var(--ambar-linea);
                  color:var(--ambar); font-size:12.5px; line-height:1.45; }
.off-confirmar { margin-top:13px; padding:13px; border-radius:9px;
                 background:var(--rojo-suave); border:1px solid var(--rojo-linea); }
.off-confirmar-texto { margin:0; font-size:13px; color:var(--tinta); line-height:1.5; }
`;
