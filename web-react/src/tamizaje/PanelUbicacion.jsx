import { useState } from "react";
import { describirPrecision, obtenerUbicacion } from "./geolocalizacion.js";
import { obtenerAltitudExacta } from "./elevacion.js";
import {
  ESTABLECIMIENTOS,
  guardarUbicacion,
  ubicacionDeEstablecimiento,
  deducirDesdeCoordenadas,
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
  const [ubicando, setUbicando] = useState(false);
  const [sugerencia, setSugerencia] = useState(null);

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

  const ubicarme = async () => {
    setUbicando(true);
    setMensaje("Pidiendo permiso de ubicación…");
    setSugerencia(null);

    const r = await obtenerUbicacion();

    if (!r.ok) {
      setUbicando(false);
      setMensaje(r.mensaje);
      return;
    }

    setBorrador((b) => ({ ...b, lat: String(r.lat), lon: String(r.lon) }));
    setErrores((e) => ({ ...e, lat: undefined, lon: undefined }));

    if (r.fueraDelPeru) {
      setUbicando(false);
      setMensaje(r.mensajeAviso);
      return;
    }

    const precision = describirPrecision(r.precisionM);

    // 1) Intento la altitud EXACTA por servicio (SRTM). Requiere internet.
    setMensaje(
      `Coordenadas tomadas del GPS${precision ? ` · ${precision}` : ""}. ` +
        "Buscando la altitud exacta…"
    );
    const exacta = await obtenerAltitudExacta(r.lat, r.lon);
    setUbicando(false);

    if (exacta.ok) {
      setBorrador((b) => ({ ...b, altitudMsnm: String(exacta.altitudMsnm) }));
      setSugerencia(null);
      setMensaje(
        `Coordenadas tomadas del GPS${precision ? ` · ${precision}` : ""}. ` +
          `Altitud exacta obtenida por servicio de elevación: ${exacta.altitudMsnm} msnm. ` +
          "Verifícala antes de guardar: define el umbral del tamizaje."
      );
      return;
    }

    // 2) Sin internet o el servicio falló: caigo al respaldo offline (punto
    // de referencia más cercano de los 13 conocidos), como antes.
    const sug = deducirDesdeCoordenadas(r.lat, r.lon);
    setSugerencia(sug);

    const razon =
      exacta.motivo === "sin_conexion" || exacta.motivo === "tiempo_agotado"
        ? "no hay conexión para pedir la altitud exacta"
        : "el servicio de altitud exacta no respondió";

    setMensaje(
      `Coordenadas tomadas del GPS${precision ? ` · ${precision}` : ""}. ` +
        `${razon.charAt(0).toUpperCase()}${razon.slice(1)}, así que ` +
        (sug
          ? "te dejo una altitud aproximada abajo: revísala antes de guardar."
          : "escribí la altitud a mano.")
    );
  };

  if (!abierto) {
    return (
      <section className="tz-card ubi-resumen">
        <style>{CSS_UBI}</style>
        <div className="ubi-fila">
          <div className="ubi-texto">
            <span className="ubi-etiqueta">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Establecimiento
            </span>
            <p className="ubi-nombre">{ubicacion.nombre}</p>
            <p className="ubi-datos tz-mono">
              <span className="ubi-dato-chip">{ubicacion.altitudMsnm} msnm</span>
              <span className="ubi-dato-sep">{"·"}</span>
              {ubicacion.lat}, {ubicacion.lon}
            </p>
          </div>
          <button type="button" className="ubi-cambiar" onClick={() => setAbierto(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Cambiar
          </button>
        </div>
        {ubicacion.manual && (
          <p className="ubi-aviso">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {"Ubicación configurada a mano. La altitud define el umbral de saturación que se aplica: verifícala antes de tamizar."}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="tz-card ubi-panel-abierto">
      <style>{CSS_UBI}</style>
      <div className="tz-seccion-cab">
        <span className="ubi-paso">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </span>
        <div>
          <h2 className="tz-seccion">Ubicación del establecimiento</h2>
          <p className="tz-seccion-desc">La altitud define el umbral; las coordenadas, la derivación</p>
        </div>
      </div>

      <div className="tz-chips" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={`tz-chip ${modo === "catalogo" ? "tz-chip-on" : ""}`}
          onClick={() => setModo("catalogo")}
          aria-pressed={modo === "catalogo"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Elegir de la lista
        </button>
        <button
          type="button"
          className={`tz-chip ${modo === "manual" ? "tz-chip-on" : ""}`}
          onClick={() => setModo("manual")}
          aria-pressed={modo === "manual"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Escribir coordenadas
        </button>
      </div>

      {modo === "catalogo" ? (
        <div className="ubi-lista-marco">
        <ul className="ubi-lista">
          {ESTABLECIMIENTOS.map((e, i) => (
            <li key={e.id} style={{ animationDelay: `${0.03 * i}s` }}>
              <button type="button" className="ubi-opcion" onClick={() => elegirDelCatalogo(e.id)}>
                <div className="ubi-opcion-info">
                  <span className="ubi-opcion-nombre">{e.nombre}</span>
                  <span className="ubi-opcion-depto">{e.departamento}</span>
                </div>
                <span className="ubi-opcion-alt tz-mono">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
                  {e.altitudMsnm} msnm
                </span>
              </button>
            </li>
          ))}
        </ul>
        </div>
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
              <span className="tz-ayuda"> {"· define el umbral del tamizaje"}</span>
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

          {sugerencia && (
            <div className={`ubi-sugerencia ${sugerencia.fiable ? "" : "ubi-sugerencia-dudosa"}`}>
              <p className="ubi-sug-titulo">
                {sugerencia.fiable
                  ? `Departamento: ${sugerencia.departamento}`
                  : `Departamento aproximado: ${sugerencia.departamento}`}
              </p>
              <p className="ubi-sug-texto">
                {`Punto de referencia mas cercano: ${sugerencia.referencia}, a ${sugerencia.distanciaKm} km.`}
                {!sugerencia.fiable &&
                  " Esta lejos, asi que el departamento puede no ser el correcto."}
              </p>
              <button
                type="button"
                className="ubi-sug-boton"
                onClick={() =>
                  setBorrador((b) => ({ ...b, altitudMsnm: String(sugerencia.altitudSugerida) }))
                }
              >
                {`Usar ${sugerencia.altitudSugerida} msnm como altitud`}
              </button>
              <p className="ubi-sug-aviso">
                Es la altitud de {sugerencia.referencia}, no la de este establecimiento.
                Como decide el umbral del tamizaje, verificala antes de guardar.
              </p>
            </div>
          )}

          <div className="tz-acciones">
            <button type="button" className="tz-boton tz-boton-pri" onClick={guardarManual}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Guardar ubicación
            </button>
            <button type="button" className="tz-boton tz-boton-sec" onClick={ubicarme} disabled={ubicando}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              {ubicando ? "Ubicando…" : "Usar GPS para las coordenadas"}
            </button>
          </div>
        </>
      )}

      <button type="button" className="ubi-cancelar" onClick={() => setAbierto(false)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        Cancelar
      </button>
    </section>
  );
}

const CSS_UBI = `
.ubi-resumen {
  padding: 16px 18px !important;
  position: relative;
  overflow: hidden;
}

.ubi-resumen::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--acento), #818cf8, var(--acento));
}

.ubi-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.ubi-texto { min-width: 0; }

.ubi-etiqueta {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--suave);
  font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  display: flex;
  align-items: center;
  gap: 5px;
}

.ubi-nombre {
  margin: 5px 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: var(--tinta);
  letter-spacing: -0.01em;
}

.ubi-datos {
  margin: 0;
  font-size: 12px;
  color: var(--suave);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ubi-dato-chip {
  background: var(--acento-suave);
  border: 1px solid var(--acento-linea);
  color: var(--acento);
  padding: 2px 8px;
  border-radius: var(--radio-pill);
  font-size: 11px;
  font-weight: 600;
}

.ubi-dato-sep { color: var(--tenue); }

.ubi-cambiar {
  flex-shrink: 0;
  background: var(--carta-solida);
  border: 1.5px solid var(--linea);
  border-radius: var(--radio-sm);
  padding: 9px 16px;
  font-family: 'Inter', inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--acento);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all var(--dur) var(--ease-out);
}

.ubi-cambiar:hover {
  border-color: var(--acento-linea);
  background: var(--acento-suave);
  transform: translateY(-1px);
  box-shadow: var(--sombra-sm);
}

.ubi-aviso {
  margin: 14px 0 0;
  padding: 11px 14px;
  border-radius: var(--radio-sm);
  background: var(--ambar-suave);
  border: 1px solid var(--ambar-linea);
  color: var(--ambar);
  font-size: 12.5px;
  line-height: 1.45;
  font-weight: 500;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.ubi-aviso svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.ubi-panel-abierto {
  animation: slideDown 0.35s var(--ease-out) both;
  /* Ninguna altura maxima: el panel crece con su contenido. Quien limita la
     altura es la lista de establecimientos, que hace scroll por su cuenta. */
  max-height: none;
}

.ubi-paso {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--acento), #818cf8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

/* La lista tiene 13 establecimientos y crecera: sin limite de altura se
   desborda de la tarjeta y las ultimas opciones quedan tapadas por lo que
   viene debajo. Con scroll propio, la tarjeta mantiene su tamano y se recorre
   con la rueda del raton.

   'overscroll-behavior: contain' evita que al llegar al final de la lista el
   scroll siga arrastrando la pagina entera, que es molesto en movil. */
.ubi-lista {
  list-style: none;
  margin: 0;
  padding: 0 6px 0 0;
  /* Unos 4 elementos visibles. El resto se ve con la rueda del raton o
     deslizando: la lista tiene 13 y mostrarla entera empujaba el resto del
     formulario fuera de la pantalla. */
  max-height: 296px;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.45) var(--campo);
}

/* Barra de scroll visible pero discreta: si no se ve, nadie sabe que hay mas
   opciones abajo. */
.ubi-lista::-webkit-scrollbar {
  width: 8px;
}
.ubi-lista::-webkit-scrollbar-track {
  background: var(--campo);
  border-radius: 4px;
}
.ubi-lista::-webkit-scrollbar-thumb {
  background: var(--linea-fuerte, rgba(148, 163, 184, 0.45));
  border-radius: 4px;
}
.ubi-lista::-webkit-scrollbar-thumb:hover {
  background: var(--suave);
}
/* Degradado al pie: indica que la lista continua. */
.ubi-lista-marco {
  position: relative;
  /* Contiene la lista: sin esto, si algun ancestro anima max-height, el
     contenido se escapa de la tarjeta. */
  overflow: hidden;
  border-radius: 8px;
}
.ubi-lista-marco::after {
  content: "";
  position: absolute;
  left: 0;
  right: 8px;
  bottom: 0;
  height: 28px;
  background: linear-gradient(to top, var(--carta-solida, #fff), transparent);
  pointer-events: none;
  border-radius: 0 0 8px 8px;
}

.ubi-lista li {
  animation: fadeInUp 0.3s var(--ease-out) both;
}

.ubi-opcion {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 15px;
  border: 1.5px solid var(--linea);
  border-radius: var(--radio-sm);
  margin-bottom: 8px;
  background: var(--campo);
  font-family: 'Inter', inherit;
  font-size: 14px;
  color: var(--tinta);
  cursor: pointer;
  text-align: left;
  transition: all var(--dur-fast) var(--ease-out);
}

.ubi-opcion:hover {
  border-color: var(--acento-linea);
  background: var(--acento-suave);
  transform: translateX(4px);
  box-shadow: var(--sombra-sm);
}

.ubi-opcion-info { min-width: 0; }

.ubi-opcion-nombre {
  font-weight: 600;
  display: block;
  margin-bottom: 2px;
}

.ubi-opcion-depto {
  font-weight: 400;
  color: var(--suave);
  font-size: 12px;
}

.ubi-opcion-alt {
  flex-shrink: 0;
  font-size: 11.5px;
  color: var(--suave);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radio-pill);
  background: var(--carta-solida);
  border: 1px solid var(--linea);
  font-weight: 500;
}

.ubi-sugerencia { margin:12px 0 0; padding:13px; border-radius:10px;
                  background:var(--campo); border:1px solid var(--linea); }
.ubi-sugerencia-dudosa { background:var(--ambar-suave); border-color:var(--ambar-linea); }
.ubi-sug-titulo { margin:0 0 4px; font-size:14px; font-weight:600; color:var(--tinta); }
.ubi-sug-texto { margin:0 0 10px; font-size:12.5px; color:var(--suave); line-height:1.45; }
.ubi-sug-boton { background:#fff; border:1px solid var(--linea); border-radius:8px;
                 padding:8px 13px; font-family:inherit; font-size:13px;
                 color:var(--marino-alto); cursor:pointer; }
.ubi-sug-aviso { margin:9px 0 0; font-size:12px; color:var(--ambar); line-height:1.45; }
.ubi-cancelar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 16px auto 0;
  background: none;
  border: none;
  font-family: 'Inter', inherit;
  font-size: 13px;
  color: var(--tenue);
  cursor: pointer;
  padding: 8px 16px;
  border-radius: var(--radio-sm);
  transition: all var(--dur-fast) ease;
}

.ubi-cancelar:hover {
  color: var(--rojo);
  background: var(--rojo-suave);
}
`;
