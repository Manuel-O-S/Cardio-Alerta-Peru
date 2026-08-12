import { useState } from "react";
import {
  ESTABLECIMIENTOS,
  guardarUbicacion,
  ubicacionDeEstablecimiento,
  ubicacionManual,
  validarCoordenadas,
} from "./ubicacion.js";

/**
 * Configura donde esta el establecimiento: altitud y coordenadas juntas.
 *
 * La altitud decide que umbral de saturacion se le aplica al recien nacido, y
 * las coordenadas deciden a que hospital se lo deriva. Que las dos salgan del
 * mismo lugar evita el error de tamizar con la banda de Juliaca y derivar
 * desde Lima.
 *
 * Se configura una vez por dispositivo, no por paciente.
 */
export default function PanelUbicacion({ ubicacion, onCambio }) {
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState(ubicacion.manual ? "manual" : "catalogo");
  const [borrador, setBorrador] = useState({
    nombre: ubicacion.manual ? ubicacion.nombre : "",
    altitudMsnm: String(ubicacion.altitudMsnm),
    lat: String(ubicacion.lat),
    lon: String(ubicacion.lon),
  });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");

  const aplicar = (nueva) => {
    guardarUbicacion(nueva);
    onCambio(nueva);
    setAbierto(false);
    setMensaje("");
  };

  const elegirDelCatalogo = (id) => {
    const u = ubicacionDeEstablecimiento(id);
    if (u) aplicar(u);
  };

  const guardarManual = () => {
    const errCoord = validarCoordenadas(borrador.lat, borrador.lon) || {};
    const alt = Number(borrador.altitudMsnm);
    if (!Number.isFinite(alt) || alt < 0 || alt > 5100) {
      errCoord.altitudMsnm = "Debe estar entre 0 y 5100 msnm.";
    }
    setErrores(errCoord);
    if (Object.keys(errCoord).length) return;
    aplicar(ubicacionManual(borrador));
  };

  const ubicarme = () => {
    if (!navigator.geolocation) {
      setMensaje("Este dispositivo no permite obtener la ubicacion.");
      return;
    }
    setMensaje("Obteniendo ubicacion…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBorrador((b) => ({
          ...b,
          lat: pos.coords.latitude.toFixed(4),
          lon: pos.coords.longitude.toFixed(4),
        }));
        setMensaje(
          "Coordenadas tomadas del GPS. La altitud escribila a mano: la del GPS " +
            "es poco confiable bajo techo, y define el umbral del tamizaje."
        );
      },
      () => setMensaje("No se pudo obtener la ubicacion. Escribi las coordenadas."),
      { timeout: 8000 }
    );
  };

  if (!abierto) {
    return (
      <section className="tz-card ubi-resumen">
        <style>{CSS_UBI}</style>
        <div className="ubi-fila">
          <div className="ubi-texto">
            <span className="ubi-etiqueta">Establecimiento</span>
            <p className="ubi-nombre">{ubicacion.nombre}</p>
            <p className="ubi-datos tz-mono">
              {ubicacion.altitudMsnm} msnm · {ubicacion.lat}, {ubicacion.lon}
            </p>
          </div>
          <button type="button" className="ubi-cambiar" onClick={() => setAbierto(true)}>
            Cambiar
          </button>
        </div>
        {ubicacion.manual && (
          <p className="ubi-aviso">
            Ubicacion configurada a mano. La altitud define el umbral de
            saturacion que se aplica: verificala antes de tamizar.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="tz-card">
      <style>{CSS_UBI}</style>
      <h2 className="tz-seccion">Ubicacion del establecimiento</h2>
      <p className="tz-explica">
        La altitud decide el umbral de saturacion que se aplica; las coordenadas,
        a que hospital se deriva. Se configura una vez por dispositivo.
      </p>

      <div className="tz-chips" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className={`tz-chip ${modo === "catalogo" ? "tz-chip-on" : ""}`}
          onClick={() => setModo("catalogo")}
          aria-pressed={modo === "catalogo"}
        >
          Elegir de la lista
        </button>
        <button
          type="button"
          className={`tz-chip ${modo === "manual" ? "tz-chip-on" : ""}`}
          onClick={() => setModo("manual")}
          aria-pressed={modo === "manual"}
        >
          Escribir coordenadas
        </button>
      </div>

      {modo === "catalogo" ? (
        <ul className="ubi-lista">
          {ESTABLECIMIENTOS.map((e) => (
            <li key={e.id}>
              <button type="button" className="ubi-opcion" onClick={() => elegirDelCatalogo(e.id)}>
                <span className="ubi-opcion-nombre">
                  {e.nombre}
                  <span className="ubi-opcion-depto"> · {e.departamento}</span>
                </span>
                <span className="ubi-opcion-alt tz-mono">{e.altitudMsnm} msnm</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className="tz-campo">
            <label className="tz-label">Nombre del establecimiento</label>
            <input
              className="tz-input"
              value={borrador.nombre}
              onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
              placeholder="Centro de Salud …"
            />
          </div>

          <div className="tz-fila">
            <div className="tz-campo">
              <label className="tz-label">Latitud</label>
              <input
                className={`tz-input tz-mono ${errores.lat ? "tz-error" : ""}`}
                value={borrador.lat}
                onChange={(e) => setBorrador({ ...borrador, lat: e.target.value })}
                placeholder="-15.4990"
                inputMode="decimal"
              />
              {errores.lat && <span className="tz-mensaje-error">{errores.lat}</span>}
            </div>
            <div className="tz-campo">
              <label className="tz-label">Longitud</label>
              <input
                className={`tz-input tz-mono ${errores.lon ? "tz-error" : ""}`}
                value={borrador.lon}
                onChange={(e) => setBorrador({ ...borrador, lon: e.target.value })}
                placeholder="-70.1338"
                inputMode="decimal"
              />
              {errores.lon && <span className="tz-mensaje-error">{errores.lon}</span>}
            </div>
          </div>

          <div className="tz-campo">
            <label className="tz-label">
              Altitud (msnm)
              <span className="tz-ayuda"> · define el umbral del tamizaje</span>
            </label>
            <input
              className={`tz-input tz-mono ${errores.altitudMsnm ? "tz-error" : ""}`}
              value={borrador.altitudMsnm}
              onChange={(e) => setBorrador({ ...borrador, altitudMsnm: e.target.value })}
              placeholder="3825"
              inputMode="numeric"
            />
            {errores.altitudMsnm && (
              <span className="tz-mensaje-error">{errores.altitudMsnm}</span>
            )}
          </div>

          {mensaje && <p className="tz-nota">{mensaje}</p>}

          <div className="tz-acciones">
            <button type="button" className="tz-boton" onClick={guardarManual}>
              Guardar ubicacion
            </button>
            <button type="button" className="tz-boton tz-boton-sec" onClick={ubicarme}>
              Usar GPS para las coordenadas
            </button>
          </div>
        </>
      )}

      <button type="button" className="ubi-cancelar" onClick={() => setAbierto(false)}>
        Cancelar
      </button>
    </section>
  );
}

const CSS_UBI = `
.ubi-resumen { padding:14px 16px; }
.ubi-fila { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.ubi-texto { min-width:0; }
.ubi-etiqueta { font-size:10.5px; font-weight:600; letter-spacing:.12em;
                text-transform:uppercase; color:var(--suave);
                font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.ubi-nombre { margin:4px 0 2px; font-size:15.5px; font-weight:600; color:var(--tinta); }
.ubi-datos { margin:0; font-size:12px; color:var(--suave); }
.ubi-cambiar { flex-shrink:0; background:none; border:1px solid var(--linea);
               border-radius:8px; padding:8px 14px; font-family:inherit;
               font-size:13px; color:var(--marino-alto); cursor:pointer; }
.ubi-aviso { margin:12px 0 0; padding:10px 12px; border-radius:9px;
             background:var(--ambar-suave); border:1px solid var(--ambar-linea);
             color:var(--ambar); font-size:12.5px; line-height:1.45; }
.ubi-lista { list-style:none; margin:0; padding:0; }
.ubi-opcion { width:100%; display:flex; align-items:baseline;
              justify-content:space-between; gap:12px; padding:12px 13px;
              border:1px solid var(--linea); border-radius:9px; margin-bottom:7px;
              background:var(--campo); font-family:inherit; font-size:14px;
              color:var(--tinta); cursor:pointer; text-align:left; }
.ubi-opcion:hover { border-color:var(--marino-tenue); }
.ubi-opcion-nombre { font-weight:500; }
.ubi-opcion-depto { font-weight:400; color:var(--suave); font-size:12.5px; }
.ubi-opcion-alt { flex-shrink:0; font-size:12.5px; color:var(--suave); }
.ubi-cancelar { display:block; margin:14px auto 0; background:none; border:none;
                font-family:inherit; font-size:13px; color:var(--suave);
                cursor:pointer; text-decoration:underline; }
`;
