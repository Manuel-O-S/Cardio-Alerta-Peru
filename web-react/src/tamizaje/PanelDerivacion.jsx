import { useEffect, useState } from "react";
import { buscarLocal } from "./datosOffline.js";
import { describirPrecision, obtenerUbicacion } from "./geolocalizacion.js";

/**
 * Derivacion: donde llevar al recien nacido cuando el tamizaje no se supera.
 *
 * Consulta GET /centros-cercanos del backend y guarda la ultima respuesta en
 * localStorage. Si no hay internet, muestra esa copia y lo dice — es la parte
 * del sistema que mas falta hace justo donde peor esta la conexion.
 *
 * Los centros cambian una o dos veces al ano, asi que no hay sincronizacion
 * periodica: se refresca cuando se usa y con eso basta.
 */

const API = import.meta.env.VITE_API_URL || "https://cardio-alerta-peru.onrender.com";
const CLAVE_CACHE = "cardio-alerta.centros-cache.v1";

const SEGUROS = [
  { id: "", etiqueta: "Todos" },
  { id: "MINSA", etiqueta: "MINSA / SIS" },
  { id: "EsSalud", etiqueta: "EsSalud" },
];

function leerCache() {
  try {
    const crudo = localStorage.getItem(CLAVE_CACHE);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

function guardarCache(datos) {
  try {
    localStorage.setItem(CLAVE_CACHE, JSON.stringify({ ...datos, guardadoEn: Date.now() }));
  } catch {
    // Sin cache la app sigue funcionando, solo pierde el modo offline.
  }
}

export default function PanelDerivacion({ latInicial, lonInicial }) {
  const [lat, setLat] = useState(latInicial ?? "");
  const [lon, setLon] = useState(lonInicial ?? "");
  const [seguro, setSeguro] = useState("");
  const [centros, setCentros] = useState([]);
  const [meta, setMeta] = useState({ hayDisponibles: null, origen: null });
  const [verOcupados, setVerOcupados] = useState(false);
  const [estado, setEstado] = useState("inicial"); // inicial | cargando | ok | cache | error
  const [mensaje, setMensaje] = useState("");
  const [ubicando, setUbicando] = useState(false);

  // Al abrir el panel se muestra de inmediato la ultima consulta guardada, para
  // que nunca haya una pantalla vacia mientras responde la red.
  useEffect(() => {
    if (latInicial != null && lonInicial != null) {
      buscar({ latForzada: latInicial, lonForzada: lonInicial });
      return;
    }
    const cache = leerCache();
    if (cache?.centros?.length) {
      setCentros(cache.centros);
      setMeta({ hayDisponibles: cache.hay_disponibles ?? null, origen: cache.origen_datos ?? null });
      setEstado("cache");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ubicarme = async () => {
    setUbicando(true);
    setMensaje("Pidiendo permiso de ubicación…");

    const r = await obtenerUbicacion();
    setUbicando(false);

    if (!r.ok) {
      setMensaje(r.mensaje);
      return;
    }

    setLat(String(r.lat));
    setLon(String(r.lon));

    const precision = describirPrecision(r.precisionM);
    setMensaje(
      r.fueraDelPeru
        ? r.mensajeAviso
        : `Ubicación obtenida${precision ? ` · ${precision}` : ""}.`
    );

    buscar({ latForzada: r.lat, lonForzada: r.lon, conservarMensaje: true });
  };

  const buscar = async ({ latForzada, lonForzada, conservarMensaje = false } = {}) => {
    const laLat = latForzada ?? lat;
    const laLon = lonForzada ?? lon;
    if (laLat === "" || laLon === "" || laLat == null || laLon == null) {
      setMensaje("Faltan las coordenadas del establecimiento.");
      return;
    }
    setEstado("cargando");
    if (!conservarMensaje) setMensaje("");

    // Busqueda local si hay datos offline descargados en el dispositivo
    const local = buscarLocal({
      lat: Number(laLat),
      lon: Number(laLon),
      limite: 5,
      tipoSeguro: seguro,
      soloDisponibles: !verOcupados,
    });
    if (local) {
      setCentros(local.centros);
      setMeta({ hayDisponibles: local.hay_disponibles, origen: "dispositivo" });
      setEstado("ok");
      return;
    }

    const params = new URLSearchParams({
      lat: String(laLat),
      lon: String(laLon),
      limite: "5",
      solo_disponibles: verOcupados ? "false" : "true",
    });
    if (seguro) params.set("tipo_seguro", seguro);

    try {
      const r = await fetch(`${API}/centros-cercanos/?${params}`);
      if (!r.ok) throw new Error(`El servidor respondió ${r.status}`);
      const datos = await r.json();
      setCentros(datos.centros || []);
      setMeta({
        hayDisponibles: datos.hay_disponibles ?? null,
        origen: datos.origen_datos ?? null,
      });
      setEstado("ok");
      guardarCache(datos);
    } catch {
      const cache = leerCache();
      if (cache?.centros?.length) {
        setCentros(cache.centros);
        setMeta({ hayDisponibles: cache.hay_disponibles ?? null, origen: cache.origen_datos ?? null });
        setEstado("cache");
        setMensaje("Sin conexión. Se muestra la última consulta guardada.");
      } else {
        setEstado("error");
        setMensaje("Sin conexión y sin datos guardados. Consulta la lista impresa del establecimiento.");
      }
    }
  };

  return (
    <section className="tz-card tz-deriv">
      <style>{CSS_DERIV}</style>
      <div className="tz-seccion-cab">
        <span className="deriv-paso">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </span>
        <div>
          <h2 className="tz-seccion">Derivación</h2>
          <p className="tz-seccion-desc">Centros con capacidad cardiológica neonatal</p>
        </div>
      </div>

      <div className="tz-fila">
        <div className="tz-campo">
          <label className="tz-label">
            Latitud<span className="tz-ayuda"> · del establecimiento</span>
          </label>
          <input
            className="tz-input tz-mono"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="-15.49"
            inputMode="decimal"
          />
        </div>
        <div className="tz-campo">
          <label className="tz-label">Longitud</label>
          <input
            className="tz-input tz-mono"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            placeholder="-70.13"
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="tz-campo">
        <label className="tz-label">Seguro del paciente</label>
        <div className="tz-chips">
          {SEGUROS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`tz-chip ${seguro === s.id ? "tz-chip-on" : ""}`}
              onClick={() => setSeguro(s.id)}
              aria-pressed={seguro === s.id}
            >
              {s.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="tz-acciones">
        <button type="button" className="tz-boton tz-boton-pri" onClick={() => buscar()} disabled={estado === "cargando"}>
          {estado === "cargando" ? (
            <>
              <span className="deriv-spinner"></span>
              Buscando…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Buscar centros
            </>
          )}
        </button>
        <button type="button" className="tz-boton tz-boton-sec" onClick={ubicarme} disabled={ubicando}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          {ubicando ? "Ubicando…" : "Usar mi ubicación"}
        </button>
      </div>

      {mensaje && <p className="tz-nota">{mensaje}</p>}

      {estado === "cache" && centros.length > 0 && (
        <p className="tz-nota">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Datos guardados de la última consulta con conexión.
        </p>
      )}

      {meta.hayDisponibles === false && (
        <p className="tz-alerta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Ninguno de los hospitales que cumple los filtros figura como disponible. Se muestran de todas formas: confirmar por teléfono antes de trasladar.
        </p>
      )}

      {meta.origen === "dispositivo" && centros.length > 0 && (
        <p className="tz-nota">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Búsqueda hecha con los hospitales guardados en este dispositivo. Confirmar la disponibilidad por teléfono antes de trasladar.
        </p>
      )}

      {meta.origen === "archivo_json" && centros.length > 0 && (
        <p className="tz-nota">
          Sin dato de disponibilidad: la lista viene del respaldo local. Confirmar antes de trasladar.
        </p>
      )}

      {centros.length > 0 && (
        <>
          <CentroDestacado centro={centros[0]} />

          {centros.length > 1 && (
            <>
              <p className="tz-alternativas">Otras opciones</p>
              <ul className="tz-centros">
                {centros.slice(1).map((c, i) => (
                  <li key={`${c.nombre}-${i}`} className="tz-centro" style={{ animationDelay: `${0.05 * (i + 1)}s` }}>
                    <div className="tz-centro-cab">
                      <span className="tz-centro-nombre">{c.nombre}</span>
                      <span className="tz-centro-dist tz-mono">
                        {Math.round(c.distancia_km)} km
                      </span>
                    </div>
                    <p className="tz-centro-datos">
                      {c.direccion} · Nivel {c.nivel} · {c.iafas}
                      {c.status ? ` · ${c.status}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* Filtro de ocupados */}
      <label className="tz-ver-ocupados">
        <input
          type="checkbox"
          checked={verOcupados}
          onChange={() => setVerOcupados(!verOcupados)}
        />
        <span>Incluir hospitales ocupados</span>
      </label>

    </section>
  );
}

/**
 * El hospital al que se deriva.
 */
function urlRuta(c) {
  const destino = [c.nombre, c.direccion, "Peru"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`;
}

/** Enlace de respaldo por coordenadas, si Google no encuentra el nombre. */
function urlRutaCoordenadas(c) {
  return `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lon}`;
}

function CentroDestacado({ centro: c }) {
  const disponible = c.status?.toLowerCase() === "disponible";
  const ocupado = c.status?.toLowerCase() === "ocupado";

  return (
    <div className={`dest ${ocupado ? "dest-ocupado" : ""}`}>
      <div className="dest-cab">
        <span className="dest-etiqueta">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Centro de referencia más cercano
        </span>
        {c.status && (
          <span className={`dest-estado ${disponible ? "dest-estado-ok" : "dest-estado-no"}`}>
            <span className={`dest-estado-dot ${disponible ? "dest-dot-ok" : "dest-dot-no"}`}></span>
            {c.status}
          </span>
        )}
      </div>

      <h3 className="dest-nombre">{c.nombre}</h3>
      <p className="dest-dist tz-mono">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        {c.distancia_km} km en línea recta
      </p>

      <dl className="dest-datos">
        <div><dt>Dirección</dt><dd>{c.direccion}</dd></div>
        <div><dt>Departamento</dt><dd>{c.departamento}</dd></div>
        <div><dt>Nivel</dt><dd>{c.nivel}</dd></div>
        <div><dt>Red</dt><dd>{c.iafas}</dd></div>
        <div className="dest-ancho"><dt>Capacidad</dt><dd>{c.especialidad}</dd></div>
        <div className="dest-ancho">
          <dt>Coordenadas aprox.</dt>
          <dd className="tz-mono">{c.lat}, {c.lon}</dd>
        </div>
      </dl>

      <div className="dest-mapa-fila">
        <a className="dest-mapa" href={urlRuta(c)} target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          Abrir ruta en el mapa
        </a>
        <a
          className="dest-mapa-alt"
          href={urlRutaCoordenadas(c)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Buscar por coordenadas
        </a>
      </div>
      <p className="dest-mapa-nota">
        La ruta busca el establecimiento por su nombre. Las coordenadas guardadas son aproximadas — sirven para ordenar por cercanía, no para llegar a la puerta.
      </p>
    </div>
  );
}

const CSS_DERIV = `
.deriv-paso {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--rojo), var(--rojo-hover));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

.deriv-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dest {
  border: 1px solid var(--verde-linea);
  background: var(--verde-suave);
  border-radius: var(--radio);
  padding: 18px;
  margin: 16px 0 6px;
  animation: scaleIn 0.4s var(--ease-spring) both;
  position: relative;
  overflow: hidden;
}

.dest::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--verde), #34d399, var(--verde));
}

.dest-ocupado {
  border-color: var(--ambar-linea);
  background: var(--ambar-suave);
}

.dest-ocupado::before {
  background: linear-gradient(90deg, var(--ambar), #fbbf24, var(--ambar));
}

.dest-cab {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.dest-etiqueta {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--suave);
  font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dest-estado {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: var(--radio-pill);
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dest-estado-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dest-estado-ok {
  background: rgba(255,255,255,0.8);
  color: var(--verde);
  border: 1px solid var(--verde-linea);
}

.dest-dot-ok {
  background: var(--verde);
  box-shadow: 0 0 4px rgba(5, 150, 105, 0.5);
  animation: dotPulse 2s ease-in-out infinite;
}

.dest-estado-no {
  background: rgba(255,255,255,0.8);
  color: var(--ambar);
  border: 1px solid var(--ambar-linea);
}

.dest-dot-no {
  background: var(--ambar);
  animation: dotPulse 1.5s ease-in-out infinite;
}

.dest-nombre {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.015em;
  color: var(--tinta);
}

.dest-dist {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--suave);
  display: flex;
  align-items: center;
  gap: 6px;
}

.dest-datos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  margin: 0 0 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(0,0,0,0.06);
}

.dest-datos > div { min-width: 0; }
.dest-ancho { grid-column: 1 / -1; }

.dest-datos dt {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--suave);
  margin-bottom: 3px;
  font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
}

.dest-datos dd {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.4;
  color: var(--tinta);
  overflow-wrap: anywhere;
}

.dest-mapa-fila {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
}

.dest-mapa-alt {
  font-size: 12.5px;
  color: var(--suave);
  text-decoration: underline;
}

.dest-mapa-nota {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--tenue);
  line-height: 1.45;
}

.dest-mapa {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: var(--radio-sm);
  background: linear-gradient(135deg, var(--marino-alto), var(--marino-claro));
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all var(--dur) var(--ease-out);
  box-shadow: 0 2px 8px rgba(30, 41, 59, 0.2);
}

.dest-mapa:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(30, 41, 59, 0.3);
}

.tz-alternativas {
  margin: 20px 0 4px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--suave);
  font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
}

.tz-centro {
  animation: fadeInUp 0.35s var(--ease-out) both;
}

.tz-ver-ocupados {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--linea);
  font-size: 13px;
  color: var(--suave);
  cursor: pointer;
  transition: color var(--dur-fast) ease;
}

.tz-ver-ocupados:hover {
  color: var(--tinta-media);
}

.tz-ver-ocupados input {
  accent-color: var(--acento);
  width: 17px;
  height: 17px;
  margin: 0;
  cursor: pointer;
}

@media (max-width: 520px) {
  .dest-datos { grid-template-columns: 1fr; }
}
`;
