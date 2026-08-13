import { useEffect, useState } from "react";
import AvisoDatosOffline from "./AvisoDatosOffline.jsx";
import { buscarLocal, hayDatos } from "./datosOffline.js";
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

  // Al abrir el panel se muestra de inmediato la ultima consulta guardada, para
  // que nunca haya una pantalla vacia mientras responde la red.
  // Si el formulario ya paso las coordenadas del establecimiento, se busca
  // solo: llegado un resultado positivo, la pregunta "a donde lo mando" no
  // deberia requerir pulsar otro boton.
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

  const [ubicando, setUbicando] = useState(false);

  /**
   * Pide la ubicacion al navegador y, si la obtiene, busca de inmediato: quien
   * pulsa este boton quiere ver hospitales, no rellenar dos campos.
   */
  const ubicarme = async () => {
    setUbicando(true);
    setMensaje("Pidiendo permiso de ubicacion…");

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
        : `Ubicacion obtenida${precision ? ` · ${precision}` : ""}.`
    );

    // Se buscan los hospitales con las coordenadas recien obtenidas, sin
    // esperar a que React actualice el estado.
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
    // Al venir de "usar mi ubicacion" ya hay un mensaje util en pantalla (la
    // precision obtenida); limpiarlo aca lo haria desaparecer al instante.
    if (!conservarMensaje) setMensaje("");

    // Si la persona autorizo guardar los hospitales, se busca en el
    // dispositivo: es instantaneo y funciona sin conexion. El servidor solo
    // hace falta cuando no hay datos guardados.
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
      if (!r.ok) throw new Error(`El servidor respondio ${r.status}`);
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
        setMensaje("Sin conexion. Se muestra la ultima consulta guardada.");
      } else {
        setEstado("error");
        setMensaje("Sin conexion y sin datos guardados. Consulta la lista impresa del establecimiento.");
      }
    }
  };

  return (
    <section className="tz-card tz-deriv">
      <h2 className="tz-seccion">Derivacion</h2>
      <p className="tz-explica">
        Centros con capacidad de evaluacion cardiologica neonatal, ordenados por
        distancia en linea recta. La distancia real por carretera es mayor.
      </p>

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
        <button type="button" className="tz-boton" onClick={() => buscar()} disabled={estado === "cargando"}>
          {estado === "cargando" ? "Buscando…" : "Buscar centros"}
        </button>
        <button
          type="button"
          className="tz-boton tz-boton-sec"
          onClick={ubicarme}
          disabled={ubicando}
        >
          {ubicando ? "Ubicando…" : "Usar mi ubicacion"}
        </button>
      </div>

      {mensaje && <p className="tz-nota">{mensaje}</p>}

      {estado === "cache" && centros.length > 0 && (
        <p className="tz-nota">Datos guardados de la ultima consulta con conexion.</p>
      )}

      {/* Cuando todos los hospitales que cumplen los filtros estan ocupados, se
          muestran igual: una pantalla vacia seria peor que una opcion ocupada,
          porque el equipo puede llamar y confirmar. */}
      {meta.hayDisponibles === false && (
        <p className="tz-alerta">
          Ninguno de los hospitales que cumple los filtros figura como
          disponible. Se muestran de todas formas: confirmar por telefono antes
          de trasladar.
        </p>
      )}

      {meta.origen === "dispositivo" && centros.length > 0 && (
        <p className="tz-nota">
          Busqueda hecha con los hospitales guardados en este dispositivo.
          Confirmar la disponibilidad por telefono antes de trasladar.
        </p>
      )}

      {meta.origen === "archivo_json" && centros.length > 0 && (
        <p className="tz-nota">
          Sin dato de disponibilidad: la lista viene del respaldo local.
          Confirmar antes de trasladar.
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
                  <li key={`${c.nombre}-${i}`} className="tz-centro">
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

      <AvisoDatosOffline onCambio={() => buscar()} />

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
 * El hospital al que se deriva. Es la respuesta a la pregunta que tiene la
 * enfermera en ese momento — "a donde lo mando" — asi que va destacado y con
 * todos los datos, no como una fila mas de una lista.
 */
function CentroDestacado({ centro: c }) {
  const disponible = c.status?.toLowerCase() === "disponible";
  const ocupado = c.status?.toLowerCase() === "ocupado";

  return (
    <div className={`dest ${ocupado ? "dest-ocupado" : ""}`}>
      <style>{CSS_DEST}</style>

      <div className="dest-cab">
        <span className="dest-etiqueta">Centro de referencia mas cercano</span>
        {c.status && (
          <span className={`dest-estado ${disponible ? "dest-estado-ok" : "dest-estado-no"}`}>
            {c.status}
          </span>
        )}
      </div>

      <h3 className="dest-nombre">{c.nombre}</h3>
      <p className="dest-dist tz-mono">{c.distancia_km} km en linea recta</p>

      <dl className="dest-datos">
        <div><dt>Direccion</dt><dd>{c.direccion}</dd></div>
        <div><dt>Departamento</dt><dd>{c.departamento}</dd></div>
        <div><dt>Nivel</dt><dd>{c.nivel}</dd></div>
        <div><dt>Red</dt><dd>{c.iafas}</dd></div>
        <div className="dest-ancho"><dt>Capacidad</dt><dd>{c.especialidad}</dd></div>
        <div className="dest-ancho">
          <dt>Coordenadas</dt>
          <dd className="tz-mono">{c.lat}, {c.lon}</dd>
        </div>
      </dl>

      <a
        className="dest-mapa"
        href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lon}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Abrir ruta en el mapa
      </a>
    </div>
  );
}

const CSS_DEST = `
.dest { border:1px solid var(--verde-linea); background:var(--verde-suave);
        border-radius:var(--radio); padding:16px; margin:14px 0 4px; }
.dest-ocupado { border-color:var(--ambar-linea); background:var(--ambar-suave); }
.dest-cab { display:flex; justify-content:space-between; align-items:center;
            gap:10px; margin-bottom:9px; }
.dest-etiqueta { font-size:10.5px; font-weight:600; letter-spacing:.12em;
                 text-transform:uppercase; color:var(--suave);
                 font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.dest-estado { flex-shrink:0; font-size:11px; font-weight:600; padding:4px 10px;
               border-radius:20px; letter-spacing:.03em; }
.dest-estado-ok { background:#fff; color:var(--verde); border:1px solid var(--verde-linea); }
.dest-estado-no { background:#fff; color:var(--ambar); border:1px solid var(--ambar-linea); }
.dest-nombre { margin:0 0 3px; font-size:17px; font-weight:600; line-height:1.3;
               letter-spacing:-.01em; color:var(--tinta); }
.dest-dist { margin:0 0 14px; font-size:13px; color:var(--suave); }
.dest-datos { display:grid; grid-template-columns:1fr 1fr; gap:11px 14px;
              margin:0 0 14px; padding-top:13px; border-top:1px solid rgba(0,0,0,.07); }
.dest-datos > div { min-width:0; }
.dest-ancho { grid-column:1 / -1; }
.dest-datos dt { font-size:10.5px; font-weight:600; letter-spacing:.1em;
                 text-transform:uppercase; color:var(--suave); margin-bottom:3px;
                 font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.dest-datos dd { margin:0; font-size:13.5px; line-height:1.4; color:var(--tinta);
                 overflow-wrap:anywhere; }
.dest-mapa { display:inline-block; padding:11px 18px; border-radius:10px;
             background:var(--marino-alto); color:#fff; font-size:14px;
             font-weight:500; text-decoration:none; }
.dest-mapa:focus-visible { outline:2px solid var(--marino-alto); outline-offset:2px; }
.tz-alternativas { margin:18px 0 2px; font-size:10.5px; font-weight:600;
                   letter-spacing:.12em; text-transform:uppercase;
                   color:var(--suave);
                   font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.tz-ver-ocupados { display:flex; align-items:center; gap:9px; margin-top:16px;
                   padding-top:14px; border-top:1px solid var(--linea);
                   font-size:13px; color:var(--suave); cursor:pointer; }
.tz-ver-ocupados input { accent-color:var(--marino-alto); width:16px; height:16px; margin:0; }
@media (max-width:520px) { .dest-datos { grid-template-columns:1fr; } }
`;
