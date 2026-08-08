import { useMemo, useState } from "react";
import {
  BANDAS,
  ETIQUETAS_SINTOMAS,
  SINTOMAS_ALARMA,
  SINTOMAS_CONTEXTO,
  Resultado,
  bandaPorAltitud,
  evaluarCaso,
} from "./motorTamizaje.js";

/**
 * Formulario de tamizaje neonatal.
 *
 * Reproduce el diseno de las pantallas del equipo y lo conecta al motor. Todo
 * el calculo pasa en el navegador: no hay llamada al backend, por lo que
 * funciona con el dispositivo sin conexion.
 *
 * Estilos en un <style> local, sin Tailwind ni librerias, para que se pueda
 * pegar en el proyecto Vite tal cual y sin configurar nada.
 */

// Altitudes de referencia. Lo correcto es que cada establecimiento configure la
// suya una sola vez: la altitud del GPS es poco confiable bajo techo y un error
// cerca del limite de banda cambia el umbral aplicado.
const ESTABLECIMIENTOS = [
  { nombre: "Lima / Callao", altitud: 150 },
  { nombre: "Trujillo", altitud: 34 },
  { nombre: "Iquitos", altitud: 106 },
  { nombre: "Arequipa", altitud: 2335 },
  { nombre: "Cajamarca", altitud: 2750 },
  { nombre: "Huancayo", altitud: 3249 },
  { nombre: "Cusco", altitud: 3399 },
  { nombre: "Huaraz", altitud: 3052 },
  { nombre: "Puno", altitud: 3827 },
  { nombre: "Juliaca", altitud: 3825 },
  { nombre: "Cerro de Pasco", altitud: 4330 },
  { nombre: "La Rinconada", altitud: 5100 },
];

const EDADES_GESTACIONALES = [
  { etiqueta: "23-27 sem", valor: 25 },
  { etiqueta: "28-32 sem", valor: 30 },
  { etiqueta: "33-36 sem", valor: 35 },
  { etiqueta: "37-40 sem", valor: 38 },
  { etiqueta: ">40 sem", valor: 41 },
];

const ESTADO_INICIAL = {
  historiaClinica: "",
  apellidoMaterno: "",
  horasDeVida: "",
  altitudMsnm: 150,
  edadGestacionalSem: 38,
  spo2Preductal: "",
  spo2Postductal: "",
  fcLpm: "",
  frRpm: "",
  pesoKg: "",
  sintomas: [],
  oxigenoSuplementario: false,
  diagnosticoPrenatalCC: false,
  ronda: 1,
};

const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

export default function FormularioTamizaje() {
  const [f, setF] = useState(ESTADO_INICIAL);
  const [enviado, setEnviado] = useState(false);

  const set = (campo) => (valor) => {
    setF((prev) => ({ ...prev, [campo]: valor }));
    setEnviado(false);
  };

  const alternarSintoma = (id) => {
    setF((prev) => ({
      ...prev,
      sintomas: prev.sintomas.includes(id)
        ? prev.sintomas.filter((s) => s !== id)
        : [...prev.sintomas, id],
    }));
    setEnviado(false);
  };

  const entrada = useMemo(
    () => ({
      altitudMsnm: num(f.altitudMsnm),
      spo2Preductal: num(f.spo2Preductal),
      spo2Postductal: num(f.spo2Postductal),
      horasDeVida: num(f.horasDeVida),
      edadGestacionalSem: num(f.edadGestacionalSem),
      fcLpm: num(f.fcLpm),
      frRpm: num(f.frRpm),
      pesoKg: num(f.pesoKg),
      sintomas: f.sintomas,
      oxigenoSuplementario: f.oxigenoSuplementario,
      diagnosticoPrenatalCC: f.diagnosticoPrenatalCC,
      ronda: f.ronda,
    }),
    [f]
  );

  const salida = useMemo(() => (enviado ? evaluarCaso(entrada) : null), [enviado, entrada]);
  const banda = bandaPorAltitud(num(f.altitudMsnm));
  const errores = salida && !salida.ok ? salida.errores : {};

  // Aviso en vivo, mientras el usuario escribe: le dice que el numero que acaba
  // de poner esta bajo el corte critico de SU banda, no de una banda generica.
  const avisoCritico =
    banda && num(f.spo2Preductal) !== null && num(f.spo2Preductal) < banda.spo2Critico;

  const reiniciar = () => {
    setF(ESTADO_INICIAL);
    setEnviado(false);
  };

  const siguienteRonda = () => {
    setF((prev) => ({ ...prev, ronda: prev.ronda + 1, spo2Preductal: "", spo2Postductal: "" }));
    setEnviado(false);
  };

  return (
    <div className="tz">
      <style>{CSS}</style>

      {/* ---------------- Establecimiento ---------------- */}
      <section className="tz-card">
        <h2 className="tz-seccion">Establecimiento</h2>
        <div className="tz-fila">
          <Campo etiqueta="Lugar">
            <select
              className="tz-input"
              value={f.altitudMsnm}
              onChange={(e) => set("altitudMsnm")(Number(e.target.value))}
            >
              {ESTABLECIMIENTOS.map((e) => (
                <option key={e.nombre} value={e.altitud}>
                  {e.nombre} — {e.altitud.toLocaleString("es-PE")} msnm
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Altitud (msnm)" error={errores.altitudMsnm}>
            <input
              className={`tz-input tz-mono ${errores.altitudMsnm ? "tz-error" : ""}`}
              type="number"
              value={f.altitudMsnm}
              onChange={(e) => set("altitudMsnm")(e.target.value)}
            />
          </Campo>
        </div>
        {banda && (
          <p className={`tz-banda ${banda.estado === "provisional" ? "tz-banda-prov" : ""}`}>
            Banda <strong>{banda.id}</strong> · {banda.nombre} · corte critico{" "}
            <strong>&lt;{banda.spo2Critico}%</strong> · pasa con{" "}
            <strong>&ge;{banda.spo2Pasa}%</strong>
            {banda.estado === "provisional" && " · umbrales provisionales"}
          </p>
        )}
      </section>

      {/* ---------------- Paciente ---------------- */}
      <section className="tz-card">
        <h2 className="tz-seccion">Identificacion del paciente</h2>
        <div className="tz-fila">
          <Campo etiqueta="N° Historia clinica">
            <input
              className="tz-input tz-mono"
              value={f.historiaClinica}
              onChange={(e) => set("historiaClinica")(e.target.value)}
              placeholder="RN-2024-0000"
            />
          </Campo>
          <Campo
            etiqueta="Horas de vida"
            error={errores.horasDeVida}
            ayuda="En horas, no en dias"
          >
            <input
              className={`tz-input tz-mono ${errores.horasDeVida ? "tz-error" : ""}`}
              type="number"
              value={f.horasDeVida}
              onChange={(e) => set("horasDeVida")(e.target.value)}
              placeholder="30"
            />
          </Campo>
        </div>
        <Campo etiqueta="Apellido materno (anonimizado)">
          <input
            className="tz-input"
            value={f.apellidoMaterno}
            onChange={(e) => set("apellidoMaterno")(e.target.value)}
          />
        </Campo>
      </section>

      {/* ---------------- Edad gestacional ---------------- */}
      <section className="tz-card">
        <h2 className="tz-seccion">Edad gestacional</h2>
        <div className="tz-chips">
          {EDADES_GESTACIONALES.map((eg) => (
            <button
              key={eg.etiqueta}
              type="button"
              className={`tz-chip ${f.edadGestacionalSem === eg.valor ? "tz-chip-on" : ""}`}
              onClick={() => set("edadGestacionalSem")(eg.valor)}
              aria-pressed={f.edadGestacionalSem === eg.valor}
            >
              {eg.etiqueta}
            </button>
          ))}
        </div>
      </section>

      {/* ---------------- Signos vitales ---------------- */}
      <section className="tz-card">
        <h2 className="tz-seccion">Signos vitales</h2>
        <div className="tz-fila">
          <Campo
            etiqueta="SpO₂ preductal (%)"
            ayuda="Mano derecha"
            error={errores.spo2Preductal}
          >
            <input
              className={`tz-input tz-mono ${errores.spo2Preductal || avisoCritico ? "tz-error" : ""}`}
              type="number"
              value={f.spo2Preductal}
              onChange={(e) => set("spo2Preductal")(e.target.value)}
              placeholder="98"
            />
          </Campo>
          <Campo
            etiqueta="SpO₂ postductal (%)"
            ayuda="Cualquier pie"
            error={errores.spo2Postductal}
          >
            <input
              className={`tz-input tz-mono ${errores.spo2Postductal ? "tz-error" : ""}`}
              type="number"
              value={f.spo2Postductal}
              onChange={(e) => set("spo2Postductal")(e.target.value)}
              placeholder="97"
            />
          </Campo>
        </div>
        <div className="tz-fila">
          <Campo etiqueta="FC (lpm)" error={errores.fcLpm}>
            <input
              className={`tz-input tz-mono ${errores.fcLpm ? "tz-error" : ""}`}
              type="number"
              value={f.fcLpm}
              onChange={(e) => set("fcLpm")(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="FR (rpm)" error={errores.frRpm}>
            <input
              className={`tz-input tz-mono ${errores.frRpm ? "tz-error" : ""}`}
              type="number"
              value={f.frRpm}
              onChange={(e) => set("frRpm")(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Peso (kg)" error={errores.pesoKg}>
            <input
              className={`tz-input tz-mono ${errores.pesoKg ? "tz-error" : ""}`}
              type="number"
              step="0.1"
              value={f.pesoKg}
              onChange={(e) => set("pesoKg")(e.target.value)}
            />
          </Campo>
        </div>

        {avisoCritico && (
          <p className="tz-alerta">
            SpO₂ por debajo del umbral critico de la banda {banda.id} (&lt;{banda.spo2Critico}%)
          </p>
        )}
        {f.spo2Preductal !== "" && f.spo2Postductal === "" && (
          <p className="tz-nota">
            Falta la medicion en el pie. Sin ella no se puede evaluar la diferencia
            preductal-postductal y el tamizaje queda incompleto.
          </p>
        )}
      </section>

      {/* ---------------- Sintomas ---------------- */}
      <section className="tz-card">
        <h2 className="tz-seccion">Sintomas presentes</h2>
        <p className="tz-explica">
          Cualquier sintoma marcado en rojo saca al recien nacido del tamizaje: un
          bebe sintomatico no se tamiza, se evalua.
        </p>
        <div className="tz-checks">
          {[...SINTOMAS_ALARMA, ...SINTOMAS_CONTEXTO].map((id) => {
            const marcado = f.sintomas.includes(id);
            const esAlarma = SINTOMAS_ALARMA.includes(id);
            return (
              <label
                key={id}
                className={`tz-check ${marcado ? (esAlarma ? "tz-check-alarma" : "tz-check-ctx") : ""}`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => alternarSintoma(id)}
                />
                <span>{ETIQUETAS_SINTOMAS[id]}</span>
              </label>
            );
          })}
        </div>
        <div className="tz-checks">
          <label className={`tz-check ${f.oxigenoSuplementario ? "tz-check-alarma" : ""}`}>
            <input
              type="checkbox"
              checked={f.oxigenoSuplementario}
              onChange={() => set("oxigenoSuplementario")(!f.oxigenoSuplementario)}
            />
            <span>Oxigeno suplementario</span>
          </label>
          <label className={`tz-check ${f.diagnosticoPrenatalCC ? "tz-check-alarma" : ""}`}>
            <input
              type="checkbox"
              checked={f.diagnosticoPrenatalCC}
              onChange={() => set("diagnosticoPrenatalCC")(!f.diagnosticoPrenatalCC)}
            />
            <span>Diagnostico prenatal de cardiopatia</span>
          </label>
        </div>
      </section>

      {/* ---------------- Acciones ---------------- */}
      <div className="tz-acciones">
        <button type="button" className="tz-boton" onClick={() => setEnviado(true)}>
          Evaluar tamizaje{f.ronda > 1 ? ` (ronda ${f.ronda})` : ""}
        </button>
        <button type="button" className="tz-boton tz-boton-sec" onClick={reiniciar}>
          Limpiar
        </button>
      </div>

      {/* ---------------- Resultado ---------------- */}
      {salida?.ok && (
        <PanelResultado salida={salida} onSiguienteRonda={siguienteRonda} />
      )}
      {salida && !salida.ok && (
        <section className="tz-card tz-res tz-res-error">
          <h2 className="tz-seccion">Revisa los datos</h2>
          <ul className="tz-lista">
            {Object.entries(salida.errores).map(([campo, mensaje]) => (
              <li key={campo}>
                <strong>{campo}</strong>: {mensaje}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Campo({ etiqueta, ayuda, error, children }) {
  return (
    <div className="tz-campo">
      <label className="tz-label">
        {etiqueta}
        {ayuda && <span className="tz-ayuda"> · {ayuda}</span>}
      </label>
      {children}
      {error && <span className="tz-mensaje-error">{error}</span>}
    </div>
  );
}

const TONO = {
  [Resultado.POSITIVO]: "tz-res-positivo",
  [Resultado.NEGATIVO]: "tz-res-negativo",
  [Resultado.REPETIR]: "tz-res-repetir",
  [Resultado.INCOMPLETO]: "tz-res-repetir",
  [Resultado.NO_ELEGIBLE]: "tz-res-noelegible",
};

const TITULO = {
  [Resultado.POSITIVO]: "Tamizaje no superado",
  [Resultado.NEGATIVO]: "Tamizaje superado",
  [Resultado.REPETIR]: "Repetir la medicion",
  [Resultado.INCOMPLETO]: "Medicion incompleta",
  [Resultado.NO_ELEGIBLE]: "No corresponde tamizaje",
};

function PanelResultado({ salida, onSiguienteRonda }) {
  return (
    <section className={`tz-card tz-res ${TONO[salida.resultado]}`}>
      <h2 className="tz-seccion">Resultado</h2>
      <p className="tz-res-titulo">{TITULO[salida.resultado]}</p>
      <p className="tz-res-conducta">{salida.conducta}</p>

      {salida.sintomasDeAlarma.length > 0 && (
        <p className="tz-res-dato">
          Sintomas de alarma: {salida.sintomasDeAlarma.join(", ")}
        </p>
      )}

      {salida.banda && (
        <p className="tz-res-dato">
          Banda {salida.banda.id} · {salida.banda.nombre} · umbrales{" "}
          {salida.banda.estado} · version {salida.versionUmbrales}
        </p>
      )}

      {salida.diferenciaSpo2 !== null && (
        <p className="tz-res-dato">
          Diferencia preductal − postductal: {salida.diferenciaSpo2} puntos
        </p>
      )}

      {salida.proximaRonda && (
        <button type="button" className="tz-boton" onClick={onSiguienteRonda}>
          Registrar ronda {salida.proximaRonda} (en {salida.minutosEspera} min)
        </button>
      )}

      {salida.avisos.length > 0 && (
        <ul className="tz-lista">
          {salida.avisos.map((a) => (
            <li key={a.codigo} className={`tz-aviso tz-aviso-${a.nivel}`}>
              {a.mensaje}
            </li>
          ))}
        </ul>
      )}

      <p className="tz-advertencia">{salida.advertencia}</p>
    </section>
  );
}

// ---------------------------------------------------------------------------

const CSS = `
.tz { --tinta:#243b53; --suave:#7b93a8; --linea:#e3e9ef; --fondo:#f6f8fa;
      --campo:#f8fafc; --rojo:#c0334a; --rojo-suave:#fdf2f4; --rojo-linea:#f0b8c2;
      --verde:#1f7a5a; --verde-suave:#f0f9f5; --ambar:#8a6116; --ambar-suave:#fdf8ec;
      --marino:#1d3557;
      max-width:760px; margin:0 auto; padding:16px; color:var(--tinta);
      font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }
.tz *, .tz *::before, .tz *::after { box-sizing:border-box; }
.tz-card { background:#fff; border:1px solid var(--linea); border-radius:14px;
           padding:18px; margin-bottom:14px; }
.tz-seccion { font-size:11px; font-weight:600; letter-spacing:.14em;
              text-transform:uppercase; color:var(--suave); margin:0 0 14px; }
.tz-fila { display:flex; gap:12px; flex-wrap:wrap; }
.tz-campo { flex:1 1 150px; margin-bottom:12px; display:flex; flex-direction:column; }
.tz-label { font-size:12.5px; color:var(--suave); margin-bottom:6px; }
.tz-ayuda { color:#a8bccc; }
.tz-input { width:100%; padding:11px 12px; border:1px solid var(--linea);
            border-radius:9px; background:var(--campo); font-size:15px;
            color:var(--tinta); font-family:inherit; }
.tz-input:focus-visible { outline:2px solid var(--marino); outline-offset:1px; }
.tz-mono { font-family:ui-monospace,"SF Mono",Menlo,monospace; letter-spacing:.04em; }
.tz-error { border-color:var(--rojo-linea); background:var(--rojo-suave); color:var(--rojo); }
.tz-mensaje-error { font-size:12px; color:var(--rojo); margin-top:5px; }
.tz-banda { font-size:12.5px; color:var(--suave); margin:4px 0 0;
            padding-top:12px; border-top:1px solid var(--linea); }
.tz-banda-prov { color:var(--ambar); }
.tz-alerta { display:block; margin:12px 0 0; padding:11px 13px; border-radius:9px;
             background:var(--rojo-suave); border:1px solid var(--rojo-linea);
             color:var(--rojo); font-size:13.5px; }
.tz-nota { margin:10px 0 0; padding:11px 13px; border-radius:9px;
           background:var(--ambar-suave); color:var(--ambar); font-size:13px; }
.tz-explica { font-size:12.5px; color:var(--suave); margin:-4px 0 12px; }
.tz-chips { display:flex; gap:8px; flex-wrap:wrap; }
.tz-chip { padding:9px 15px; border-radius:9px; border:1px solid var(--linea);
           background:var(--campo); color:var(--tinta); font-size:13.5px;
           cursor:pointer; font-family:inherit; }
.tz-chip-on { background:var(--marino); border-color:var(--marino); color:#fff; font-weight:500; }
.tz-checks { display:grid; grid-template-columns:repeat(2,1fr); gap:9px; margin-bottom:9px; }
.tz-check { display:flex; align-items:center; gap:9px; padding:11px 13px;
            border:1px solid var(--linea); border-radius:9px; background:var(--campo);
            font-size:13.5px; cursor:pointer; }
.tz-check input { accent-color:var(--marino); width:16px; height:16px; margin:0; }
.tz-check-alarma { background:var(--rojo-suave); border-color:var(--rojo-linea); color:var(--rojo); }
.tz-check-alarma input { accent-color:var(--rojo); }
.tz-check-ctx { background:var(--ambar-suave); border-color:#e8d9b0; color:var(--ambar); }
.tz-acciones { display:flex; gap:10px; margin-bottom:14px; }
.tz-boton { padding:12px 20px; border-radius:9px; border:none; background:var(--marino);
            color:#fff; font-size:14.5px; font-weight:500; cursor:pointer;
            font-family:inherit; margin-top:12px; }
.tz-acciones .tz-boton { margin-top:0; }
.tz-boton-sec { background:transparent; color:var(--suave); border:1px solid var(--linea); }
.tz-res-titulo { font-size:19px; font-weight:600; margin:0 0 6px; }
.tz-res-conducta { font-size:14.5px; margin:0 0 12px; line-height:1.5; }
.tz-res-dato { font-size:12.5px; color:var(--suave); margin:0 0 5px; }
.tz-res-positivo { border-color:var(--rojo-linea); background:var(--rojo-suave); }
.tz-res-positivo .tz-res-titulo { color:var(--rojo); }
.tz-res-negativo { border-color:#bfe3d3; background:var(--verde-suave); }
.tz-res-negativo .tz-res-titulo { color:var(--verde); }
.tz-res-repetir, .tz-res-noelegible { border-color:#e8d9b0; background:var(--ambar-suave); }
.tz-res-repetir .tz-res-titulo, .tz-res-noelegible .tz-res-titulo { color:var(--ambar); }
.tz-res-noelegible { border-color:var(--rojo-linea); background:var(--rojo-suave); }
.tz-res-noelegible .tz-res-titulo { color:var(--rojo); }
.tz-res-error { border-color:var(--rojo-linea); background:var(--rojo-suave); }
.tz-lista { margin:14px 0 0; padding-left:18px; }
.tz-lista li { font-size:13px; margin-bottom:7px; line-height:1.5; }
.tz-aviso-alto { color:var(--rojo); }
.tz-aviso-medio { color:var(--ambar); }
.tz-aviso-bajo { color:var(--suave); }
.tz-advertencia { margin:16px 0 0; padding-top:12px; border-top:1px solid var(--linea);
                  font-size:12px; color:var(--suave); }
@media (max-width:520px) { .tz-checks { grid-template-columns:1fr; } }
@media (prefers-reduced-motion:reduce) { .tz * { transition:none !important; } }
`;
