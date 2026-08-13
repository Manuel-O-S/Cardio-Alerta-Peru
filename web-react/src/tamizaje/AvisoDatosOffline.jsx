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
 */
export default function AvisoDatosOffline({ onCambio }) {
  const [resumen, setResumen] = useState(resumenDatos);
  const [rechazado, setRechazado] = useState(false);
  const [detalle, setDetalle] = useState(false);
  const [estado, setEstado] = useState("inicial"); // inicial | descargando | error
  const [error, setError] = useState("");
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [resultadoSync, setResultadoSync] = useState("");

  const descargar = async () => {
    setEstado("descargando");
    setError("");
    setResultadoSync("");

    const versionPrevia = resumen?.version;

    const r = await descargarDatos();
    if (r.ok) {
      const nuevo = resumenDatos();
      setResumen(nuevo);
      setEstado("inicial");
      if (versionPrevia) {
        setResultadoSync(
          nuevo.version === versionPrevia
            ? "Sin cambios: los datos ya estaban al d\u00EDa."
            : `Actualizado: ${nuevo.total} hospitales.`
        );
      }
      onCambio?.();
    } else {
      setEstado("error");
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
    onCambio?.();
  };

  if (resumen) {
    const dias = Math.floor(resumen.antiguedadHoras / 24);
    const antiguedad =
      resumen.antiguedadHoras < 1
        ? "hace menos de una hora"
        : dias >= 1
          ? `hace ${dias} ${dias === 1 ? "d\u00EDa" : "d\u00EDas"}`
          : `hace ${resumen.antiguedadHoras} h`;
    const viejo = resumen.antiguedadHoras >= 24;

    return (
      <section className="tz-card off-guardado">
        <style>{CSS_OFF}</style>
        <div className="off-fila">
          <div className="off-info">
            <span className="off-etiqueta">{"Datos sin conexi\u00F3n"}</span>
            <p className="off-resumen">
              {resumen.total} hospitales guardados en este dispositivo
            </p>
            <p className={`off-antiguedad ${viejo ? "off-antiguedad-vieja" : ""}`}>
              Sincronizados {antiguedad}
              {viejo && " \u00B7 la disponibilidad puede haber cambiado"}
            </p>
          </div>
        </div>

        <div className="off-botones">
          <button
            type="button"
            className="tz-boton tz-boton-sec"
            onClick={descargar}
            disabled={estado === "descargando"}
          >
            {estado === "descargando" ? "Sincronizando\u2026" : "Sincronizar ahora"}
          </button>
          <button
            type="button"
            className="tz-boton tz-boton-sec off-boton-borrar"
            onClick={() => setConfirmandoBorrado(true)}
            disabled={estado === "descargando"}
          >
            Borrar lista
          </button>
        </div>

        {resultadoSync && <p className="off-sync-ok">{resultadoSync}</p>}
        {error && <p className="off-sync-error">{error}</p>}

        {confirmandoBorrado && (
          <div className="off-confirmar">
            <p className="off-confirmar-texto">
              {"Al borrar la lista, la derivaci\u00F3n volver\u00E1 a necesitar internet en cada b\u00FAsqueda. Se puede descargar de nuevo cuando haya conexi\u00F3n."}
            </p>
            <div className="off-botones">
              <button type="button" className="tz-boton tz-boton-pri" onClick={borrar}>
                {"S\u00ED, borrar"}
              </button>
              <button
                type="button"
                className="tz-boton tz-boton-sec"
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

  return (
    <section className="tz-card off-aviso">
      <style>{CSS_OFF}</style>
      <span className="off-etiqueta">{"Uso sin conexi\u00F3n"}</span>
      <p className="off-titulo">
        Guardar la lista de hospitales en este dispositivo
      </p>
      <p className="off-texto">
        {"Sin esto, la derivaci\u00F3n necesita internet cada vez. Con esto, funciona aunque se caiga la se\u00F1al. Son unos 7 KB y pod\u00E9s borrarlos cuando quieras."}
      </p>

      <button
        type="button"
        className="off-detalle-btn"
        onClick={() => setDetalle(!detalle)}
        aria-expanded={detalle}
      >
        {detalle ? "Ocultar detalle" : "Ver exactamente qu\u00E9 se guarda"}
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
            {"Los datos quedan solo en este navegador. No se env\u00EDan a ning\u00FAn servidor y se borran al limpiar los datos del navegador."}
          </p>
        </div>
      )}

      {estado === "error" && <p className="tz-alerta">{error}</p>}

      <div className="tz-acciones" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="tz-boton tz-boton-pri"
          onClick={descargar}
          disabled={estado === "descargando"}
        >
          {estado === "descargando" ? "Descargando\u2026" : "Guardar en el dispositivo"}
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
.off-aviso { border-color: var(--acento-linea); background: var(--carta); }
.off-guardado { padding: 16px; }
.off-etiqueta {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--acento);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.off-titulo { margin: 8px 0 6px; font-size: 15.5px; font-weight: 700; color: var(--tinta); line-height: 1.35; }
.off-texto { margin: 0 0 12px; font-size: 13.5px; color: var(--suave); line-height: 1.5; }
.off-detalle-btn {
  background: none;
  border: none;
  padding: 0;
  font-family: 'Inter', inherit;
  font-size: 13px;
  color: var(--acento);
  cursor: pointer;
  text-decoration: underline;
}
.off-detalle { margin: 12px 0 4px; padding: 14px; border-radius: var(--radio-sm); background: var(--campo); border: 1px solid var(--linea); }
.off-sub { margin: 0 0 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--suave); font-family: 'JetBrains Mono', ui-monospace, monospace; }
.off-lista { margin: 0 0 14px; padding-left: 17px; }
.off-lista li { font-size: 13px; line-height: 1.55; color: var(--tinta); }
.off-lista-no li { color: var(--verde); }
.off-nota-tec { margin: 0; font-size: 12px; color: var(--tenue); line-height: 1.5; }
.off-fila { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.off-resumen { margin: 5px 0 2px; font-size: 14.5px; font-weight: 600; color: var(--tinta); }
.off-antiguedad { margin: 0; font-size: 12px; color: var(--suave); line-height: 1.4; }
.off-antiguedad-vieja { color: var(--ambar); }
.off-info { min-width: 0; }
.off-botones { display: flex; gap: 10px; margin-top: 13px; flex-wrap: wrap; }
.off-boton-borrar { color: var(--rojo) !important; }
.off-sync-ok { margin: 11px 0 0; font-size: 12.5px; color: var(--verde); line-height: 1.45; font-weight: 500; }
.off-sync-error { margin: 11px 0 0; padding: 10px 12px; border-radius: var(--radio-sm); background: var(--ambar-suave); border: 1px solid var(--ambar-linea); color: var(--ambar); font-size: 12.5px; line-height: 1.45; }
.off-confirmar { margin-top: 13px; padding: 14px; border-radius: var(--radio-sm); background: var(--rojo-suave); border: 1px solid var(--rojo-linea); }
.off-confirmar-texto { margin: 0; font-size: 13px; color: var(--tinta); line-height: 1.5; }
`;
