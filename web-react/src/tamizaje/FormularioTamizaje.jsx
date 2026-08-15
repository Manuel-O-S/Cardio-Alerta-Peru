import { useEffect, useMemo, useState } from "react";
import PanelUbicacion from "./PanelUbicacion.jsx";
import AyudaSensores from "./AyudaSensores.jsx";
import AyudaSintoma from "./AyudaSintoma.jsx";
import CalculadoraPGE1 from "./CalculadoraPGE1.jsx";
import CalculadoraHidratacion from "./CalculadoraHidratacion.jsx";
import PanelDerivacionHospitales from "./PanelDerivacionHospitales.jsx";
import { registrarEnHistorial } from "./historialClinico.js";
import { INFO_SINTOMAS } from "./infoSintomas.js";
import { datosParaRetomar, eliminarCaso, guardarCaso } from "./casosPendientes.js";
import { leerUbicacion } from "./ubicacion.js";
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

/**
 * Deja pasar solo letras, espacios, tildes, ñ y ü. No permite puntos, guiones ni números.
 */
const soloLetras = (v) =>
  v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, "").replace(/\s{2,}/g, " ");

const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

export default function FormularioTamizaje({ onCasoGuardado, casoARetomar, onCasoRetomado }) {
  // La ubicacion es del establecimiento, no del paciente: se lee una vez y se
  // conserva entre tamizajes.
  const [ubicacion, setUbicacion] = useState(leerUbicacion);
  const [f, setF] = useState(ESTADO_INICIAL);
  const [enviado, setEnviado] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState("sec-paciente");

  const irASeccion = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setSeccionActiva(id);
    }
  };

  useEffect(() => {
    const secciones = [
      "sec-ubicacion",
      "sec-paciente",
      "sec-vitales",
      "sec-sintomas",
      "sec-contexto",
      "sec-resultado",
      "sec-calculadoras",
      "sec-derivacion",
    ];

    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
      for (let i = secciones.length - 1; i >= 0; i--) {
        const el = document.getElementById(secciones[i]);
        if (el && el.offsetTop <= scrollPos) {
          setSeccionActiva(secciones[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const set = (campo) => (valor) => {
    setF((prev) => ({ ...prev, [campo]: valor }));
    setEnviado(false);
  };

  const marcarAsintomatico = () => {
    const nuevo = !asintomatico;
    setAsintomatico(nuevo);
    if (nuevo) {
      // Excluyente: si no hay sintomas, no puede haber ninguno marcado.
      setF((prev) => ({
        ...prev,
        sintomas: [],
        oxigenoSuplementario: false,
      }));
    }
    setEnviado(false);
  };

  const alternarSintoma = (id) => {
    setAsintomatico(false);
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
      altitudMsnm: ubicacion.altitudMsnm,
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
    [f, ubicacion]
  );

  const salida = useMemo(() => (enviado ? evaluarCaso(entrada) : null), [enviado, entrada]);
  const banda = bandaPorAltitud(ubicacion.altitudMsnm);
  const errores = salida && !salida.ok ? salida.errores : {};

  // Aviso en vivo, mientras el usuario escribe: le dice que el numero que acaba
  // de poner esta bajo el corte critico de SU banda, no de una banda generica.
  const avisoCritico =
    banda && num(f.spo2Preductal) !== null && num(f.spo2Preductal) < banda.spo2Critico;

  const reiniciar = () => {
    setF(ESTADO_INICIAL);
    setEnviado(false);
    setGuardado(false);
    setAsintomatico(false);
  };

  // Función para guardar automáticamente en el historial local al haber un resultado nuevo
  useEffect(() => {
    if (salida && salida.ok) {
      let color = "verde";
      if (salida.resultado === Resultado.REPETIR) color = "amarillo";
      if (salida.resultado === Resultado.POSITIVO || salida.resultado === Resultado.NO_ELEGIBLE) color = "rojo";

      const identificador = f.apellidoMaterno
        ? `RN de ${f.apellidoMaterno}${f.historiaClinica ? ` · HC: ${f.historiaClinica}` : ""}`
        : (f.historiaClinica ? `RN · HC: ${f.historiaClinica}` : `Recién nacido · ${f.horasDeVida || 24}h de vida`);

      registrarEnHistorial(identificador, color);
    }
  }, [salida]);

  const [guardado, setGuardado] = useState(false);
  const [retomado, setRetomado] = useState(null);
  // "Asintomatico" no es un sintoma: es la confirmacion de que se reviso y no
  // hay ninguno. No entra en la lista que recibe el motor, que ya interpreta
  // la lista vacia como ausencia. Sirve para distinguir "revise y no hay nada"
  // de "no llegue a revisar", que en una pantalla desmarcada se ven igual.
  const [asintomatico, setAsintomatico] = useState(false);

  /**
   * Retomar un caso vencido. Copia lo que no cambia entre rondas y deja en
   * blanco lo que hay que volver a medir: SpO2, FC, FR y sintomas. Precargar
   * las mediciones anteriores invitaria a confirmarlas sin tomarlas, y los
   * sintomas pueden aparecer en la hora transcurrida.
   */
  useEffect(() => {
    if (!casoARetomar) return;
    const datos = datosParaRetomar(casoARetomar);
    setF((prev) => ({ ...prev, ...datos }));
    setEnviado(false);
    setGuardado(false);
    setAsintomatico(false);
    setRetomado({ id: casoARetomar.id, ronda: datos.ronda });
    // El caso se quita de pendientes: ya se esta atendiendo.
    eliminarCaso(casoARetomar.id);
    onCasoGuardado?.();
    onCasoRetomado?.();
  }, [casoARetomar]);

  // Guarda el caso para que la ronda siguiente no se pierda en el cambio de
  // turno. Es el punto donde el tamizaje real falla mas seguido.
  const guardarPendiente = () => {
    if (!salida?.ok) return;
    guardarCaso({
      historiaClinica: f.historiaClinica,
      ronda: salida.ronda,
      proximaRonda: salida.proximaRonda,
      minutosEspera: salida.minutosEspera,
      altitudMsnm: ubicacion.altitudMsnm,
    });
    setGuardado(true);
    onCasoGuardado?.();
  };

  const siguienteRonda = () => {
    setF((prev) => ({ ...prev, ronda: prev.ronda + 1, spo2Preductal: "", spo2Postductal: "" }));
    setEnviado(false);
    setGuardado(false);
  };

  const mostrarCalculadoras = salida?.ok && (salida.resultado === Resultado.POSITIVO || salida.resultado === Resultado.NO_ELEGIBLE);
  const mostrarDerivacion = salida?.ok && (salida.resultado === Resultado.POSITIVO || salida.resultado === Resultado.REPETIR || salida.resultado === Resultado.NO_ELEGIBLE);

  return (
    <div className="tz">
      <style>{CSS}</style>

      {retomado && (
        <div className="tz-retomado">
          <p className="tz-retomado-titulo">
            {`Continuando el caso \u00B7 ronda ${retomado.ronda} de 3`}
          </p>
          <p className="tz-retomado-texto">
            {"Se copiaron los datos que no cambian. Vuelve a medir la SpO\u2082 y a revisar los s\u00EDntomas: pueden haber aparecido en la \u00FAltima hora."}
          </p>
        </div>
      )}

      <div className="tz-layout-grid">
        {/* === SUBMENÚ LATERAL DE NAVEGACIÓN RÁPIDA (IZQUIERDA) === */}
        <aside className="tz-sidebar-nav">
          <div className="tz-sidebar-sticky">
            <div className="tz-sidebar-cabecera">
              <span className="tz-sidebar-titulo">SECCIONES</span>
              <span className="tz-sidebar-sub">Navegación rápida</span>
            </div>

            <div className="tz-sidebar-menu">
              <button
                type="button"
                className={`tz-sidebar-btn ${seccionActiva === "sec-ubicacion" ? "tz-sidebar-btn-activo" : ""}`}
                onClick={() => irASeccion("sec-ubicacion")}
              >
                <span className="tz-sidebar-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                </span>
                <div className="tz-sidebar-info">
                  <span className="tz-sidebar-nombre">Ubicación</span>
                  <span className="tz-sidebar-detalle">{ubicacion?.nombre ? ubicacion.nombre.slice(0, 15) + "…" : "Establecimiento"}</span>
                </div>
              </button>

              <button
                type="button"
                className={`tz-sidebar-btn ${seccionActiva === "sec-paciente" ? "tz-sidebar-btn-activo" : ""}`}
                onClick={() => irASeccion("sec-paciente")}
              >
                <span className="tz-sidebar-num">1</span>
                <div className="tz-sidebar-info">
                  <span className="tz-sidebar-nombre">Identificación</span>
                  <span className="tz-sidebar-detalle">{f.apellidoMaterno ? "Ingresado" : "N° HC y Madre"}</span>
                </div>
                {f.apellidoMaterno && <span className="tz-sidebar-check">✓</span>}
              </button>

              <button
                type="button"
                className={`tz-sidebar-btn ${seccionActiva === "sec-vitales" ? "tz-sidebar-btn-activo" : ""}`}
                onClick={() => irASeccion("sec-vitales")}
              >
                <span className="tz-sidebar-num">2</span>
                <div className="tz-sidebar-info">
                  <span className="tz-sidebar-nombre">Signos Vitales</span>
                  <span className="tz-sidebar-detalle">SpO₂ pre/post</span>
                </div>
                {f.spo2Preductal && f.spo2Postductal && <span className="tz-sidebar-check">✓</span>}
              </button>

              <button
                type="button"
                className={`tz-sidebar-btn ${seccionActiva === "sec-sintomas" ? "tz-sidebar-btn-activo" : ""}`}
                onClick={() => irASeccion("sec-sintomas")}
              >
                <span className="tz-sidebar-num">3</span>
                <div className="tz-sidebar-info">
                  <span className="tz-sidebar-nombre">Síntomas</span>
                  <span className="tz-sidebar-detalle">{asintomatico ? "Asintomático" : f.sintomas.length ? `${f.sintomas.length} seleccionados` : "Revisión"}</span>
                </div>
                {(asintomatico || f.sintomas.length > 0) && <span className="tz-sidebar-check">✓</span>}
              </button>

              <button
                type="button"
                className={`tz-sidebar-btn ${seccionActiva === "sec-contexto" ? "tz-sidebar-btn-activo" : ""}`}
                onClick={() => irASeccion("sec-contexto")}
              >
                <span className="tz-sidebar-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                </span>
                <div className="tz-sidebar-info">
                  <span className="tz-sidebar-nombre">Contexto</span>
                  <span className="tz-sidebar-detalle">O₂ y diagnóstico</span>
                </div>
              </button>

              <button
                type="button"
                className={`tz-sidebar-btn tz-sidebar-btn-eval ${seccionActiva === "sec-resultado" ? "tz-sidebar-btn-activo" : ""}`}
                onClick={() => {
                  if (!salida?.ok) setEnviado(true);
                  irASeccion("sec-resultado");
                }}
              >
                <span className="tz-sidebar-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </span>
                <div className="tz-sidebar-info">
                  <span className="tz-sidebar-nombre">Resultado</span>
                  <span className="tz-sidebar-detalle">{salida?.ok ? salida.resultado.toUpperCase() : "Evaluar caso"}</span>
                </div>
                {salida?.ok && (
                  <span
                    className="tz-sidebar-dot"
                    style={{ background: salida.resultado === "verde" ? "#22c55e" : salida.resultado === "amarillo" ? "#eab308" : "#ef4444" }}
                  />
                )}
              </button>

              {mostrarCalculadoras && (
                <button
                  type="button"
                  className={`tz-sidebar-btn ${seccionActiva === "sec-calculadoras" ? "tz-sidebar-btn-activo" : ""}`}
                  onClick={() => irASeccion("sec-calculadoras")}
                >
                  <span className="tz-sidebar-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="16" y1="14" x2="16" y2="18" /><path d="M8 10h.01" /><path d="M12 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /></svg>
                  </span>
                  <div className="tz-sidebar-info">
                    <span className="tz-sidebar-nombre">Calculadoras</span>
                    <span className="tz-sidebar-detalle">PGE1 / Hidratación</span>
                  </div>
                </button>
              )}

              {mostrarDerivacion && (
                <button
                  type="button"
                  className={`tz-sidebar-btn ${seccionActiva === "sec-derivacion" ? "tz-sidebar-btn-activo" : ""}`}
                  onClick={() => irASeccion("sec-derivacion")}
                >
                  <span className="tz-sidebar-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" /><path d="M10 10h1" /><path d="M14 10h-1" /></svg>
                  </span>
                  <div className="tz-sidebar-info">
                    <span className="tz-sidebar-nombre">Derivación</span>
                    <span className="tz-sidebar-detalle">Hospitales Nivel II+</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* === COLUMNA PRINCIPAL DE FORMULARIO === */}
        <div className="tz-main-col">
          <div id="sec-ubicacion">
            <PanelUbicacion ubicacion={ubicacion} onCambio={setUbicacion} />
          </div>

          {banda && (
            <div className="tz-banda-suelta">
              <span className="tz-banda-icono">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
              </span>
              {"Banda "}<strong>{banda.id}</strong>{" \u00B7 corte cr\u00EDtico "}
              <strong>&lt;{banda.spo2Critico}%</strong>{" \u00B7 pasa con "}
              <strong>&ge;{banda.spo2Pasa}%</strong>
              {banda.estado === "provisional" && " \u00B7 umbrales provisionales"}
            </div>
          )}

          {/* ---------------- 1. Identificacion ---------------- */}
          <section id="sec-paciente" className="tz-card tz-card-1">
            <div className="tz-seccion-cab">
              <span className="tz-paso">1</span>
              <div>
                <h2 className="tz-seccion">{"Identificaci\u00F3n del paciente"}</h2>
                <p className="tz-seccion-desc">{"Solo lo necesario para identificar el caso"}</p>
              </div>
            </div>

            <div className="tz-fila">
              <Campo etiqueta={"N° Historia clínica"}>
                <input
                  className="tz-input tz-mono"
                  value={f.historiaClinica}
                  onChange={(e) => set("historiaClinica")(e.target.value.replace(/[^a-zA-Z0-9\-_/]/g, "").toUpperCase())}
                  placeholder="RN-2024-0000"
                />
              </Campo>
              <Campo etiqueta={"Apellido y nombre de la madre"} error={errores.apellidoMaterno}>
                <input
                  className={`tz-input ${errores.apellidoMaterno ? "tz-error" : ""}`}
                  value={f.apellidoMaterno}
                  onChange={(e) => set("apellidoMaterno")(soloLetras(e.target.value))}
                  placeholder={"García Mendoza, Ana"}
                  autoComplete="off"
                />
              </Campo>
            </div>
          </section>

          {/* ---------------- 2. Signos vitales ---------------- */}
          <section id="sec-vitales" className="tz-card tz-card-2">
            <div className="tz-seccion-cab">
              <span className="tz-paso">2</span>
              <div>
                <h2 className="tz-seccion">Signos vitales</h2>
                <p className="tz-seccion-desc">{"La saturación determina el resultado"}</p>
              </div>
              <AyudaSensores />
            </div>

            <div className="tz-fila">
              <Campo
                etiqueta={`SpO₂ preductal (%)`}
                error={errores.spo2Preductal}
              >
                <input
                  className={`tz-input tz-mono ${errores.spo2Preductal || avisoCritico ? "tz-error" : ""}`}
                  type="text"
                  inputMode="numeric"
                  value={f.spo2Preductal}
                  onChange={(e) => set("spo2Preductal")(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="98"
                />
              </Campo>
              <Campo
                etiqueta={`SpO₂ postductal (%)`}
                error={errores.spo2Postductal}
              >
                <input
                  className={`tz-input tz-mono ${errores.spo2Postductal ? "tz-error" : ""}`}
                  type="text"
                  inputMode="numeric"
                  value={f.spo2Postductal}
                  onChange={(e) => set("spo2Postductal")(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="97"
                />
              </Campo>
            </div>

            {avisoCritico && (
              <p className="tz-alerta tz-alerta-glow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                {`SpO₂ por debajo del umbral crítico de la banda ${banda.id} (<${banda.spo2Critico}%)`}
              </p>
            )}

            <Campo
              etiqueta="Horas de vida"
              error={errores.horasDeVida}
              ayuda={"En horas, no en días"}
            >
              <input
                className={`tz-input tz-mono ${errores.horasDeVida ? "tz-error" : ""}`}
                type="text"
                inputMode="numeric"
                value={f.horasDeVida}
                onChange={(e) => set("horasDeVida")(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="30"
              />
            </Campo>

            {f.spo2Preductal !== "" && f.spo2Postductal === "" && (
              <p className="tz-nota">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {"Falta la medicion en el pie. Sin ella no se puede evaluar la diferencia preductal-postductal y el tamizaje queda incompleto."}
              </p>
            )}
          </section>

          {/* ---------------- 3. Sintomas ---------------- */}
          <section id="sec-sintomas" className="tz-card tz-card-3">
            <div className="tz-seccion-cab">
              <span className="tz-paso">3</span>
              <div>
                <h2 className="tz-seccion">{"S\u00EDntomas presentes"}</h2>
                <p className="tz-seccion-desc">{"Cualquier s\u00EDntoma en rojo excluye del tamizaje"}</p>
              </div>
            </div>
            <label className={`tz-asintomatico ${asintomatico ? "tz-asintomatico-on" : ""}`}>
              <input type="checkbox" checked={asintomatico} onChange={marcarAsintomatico} />
              <span>
                <span className="tz-asintomatico-titulo">{"Asintom\u00E1tico"}</span>
                <span className="tz-asintomatico-desc">
                  {"Se revis\u00F3 y no presenta ninguno de los signos de abajo"}
                </span>
              </span>
            </label>

            {errorSintomas && (
              <p className="tz-nota tz-nota-aviso">
                {"Marca los s\u00EDntomas presentes o confirma que est\u00E1 asintom\u00E1tico."}
              </p>
            )}

            <div className="tz-checks">
              {SINTOMAS_ALARMA.map((id) => {
                const info = INFO_SINTOMAS[id];
                return (
                  <label key={id} className={`tz-check ${f.sintomas.includes(id) ? "tz-check-alarma" : ""}`}>
                    <input
                      type="checkbox"
                      checked={f.sintomas.includes(id)}
                      onChange={() => alternarSintoma(id)}
                    />
                    <span>{ETIQUETAS_SINTOMAS[id]}</span>
                    {info && (
                      <AyudaSintoma
                        titulo={info.titulo}
                        imagen={info.imagen}
                        alt={info.alt}
                        descripcion={info.descripcion}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </section>

          {/* ---------------- 4. Contexto Clinico ---------------- */}
          <section id="sec-contexto" className="tz-card tz-card-4">
            <div className="tz-seccion-cab">
              <span className="tz-paso">4</span>
              <div>
                <h2 className="tz-seccion">Contexto clínico</h2>
                <p className="tz-seccion-desc">Factores que modifican la conducta y cálculo</p>
              </div>
            </div>

            <div className="tz-checks">
              <label className={`tz-check ${f.oxigenoSuplementario ? "tz-check-alarma" : ""}`}>
                <input
                  type="checkbox"
                  checked={f.oxigenoSuplementario}
                  onChange={() => {
                    setAsintomatico(false);
                    set("oxigenoSuplementario")(!f.oxigenoSuplementario);
                  }}
                />
                <span>{"Ox\u00EDgeno suplementario"}</span>
                <AyudaSintoma
                  titulo={INFO_SINTOMAS.oxigeno_suplementario.titulo}
                  imagen={INFO_SINTOMAS.oxigeno_suplementario.imagen}
                  alt={INFO_SINTOMAS.oxigeno_suplementario.alt}
                  descripcion={INFO_SINTOMAS.oxigeno_suplementario.descripcion}
                />
              </label>
              <label className={`tz-check ${f.diagnosticoPrenatalCC ? "tz-check-alarma" : ""}`}>
                <input
                  type="checkbox"
                  checked={f.diagnosticoPrenatalCC}
                  onChange={() => set("diagnosticoPrenatalCC")(!f.diagnosticoPrenatalCC)}
                />
                <span>{"Diagn\u00F3stico prenatal de cardiopat\u00EDa"}</span>
                <AyudaSintoma
                  titulo={INFO_SINTOMAS.diagnostico_prenatal.titulo}
                  imagen={INFO_SINTOMAS.diagnostico_prenatal.imagen}
                  alt={INFO_SINTOMAS.diagnostico_prenatal.alt}
                  descripcion={INFO_SINTOMAS.diagnostico_prenatal.descripcion}
                />
              </label>
            </div>
          </section>

          {/* ---------------- Acciones ---------------- */}
          <div id="sec-acciones" className="tz-acciones">
            <button type="button" className="tz-boton tz-boton-pri" onClick={() => setEnviado(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              {`Evaluar tamizaje${f.ronda > 1 ? ` (ronda ${f.ronda})` : ""}`}
            </button>
            <button type="button" className="tz-boton tz-boton-sec" onClick={reiniciar}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
              Limpiar
            </button>
          </div>

          {/* ---------------- Resultado ---------------- */}
          <div id="sec-resultado">
            {salida?.ok && (
              <PanelResultado
                salida={salida}
                onSiguienteRonda={siguienteRonda}
                onGuardarPendiente={guardarPendiente}
                guardado={guardado}
              />
            )}
          </div>

          {/* Con tamizaje no superado o recien nacido sintomatico: calculadoras */}
          <div id="sec-calculadoras">
            {mostrarCalculadoras && (
              <>
                <CalculadoraPGE1 pesoInicial={num(f.pesoKg)} />
                <CalculadoraHidratacion
                  pesoInicial={num(f.pesoKg)}
                  horasInicial={num(f.horasDeVida)}
                  edadGestacionalInicial={ubicacion ? f.edadGestacionalSem : null}
                />
              </>
            )}
          </div>

          {/* Hospitales de derivación locales para Amarillos y Rojos */}
          <div id="sec-derivacion">
            {mostrarDerivacion && (
              <PanelDerivacionHospitales
                ubicacion={ubicacion}
                onHospitalSeleccionado={(h) => {
                  console.log("Hospital seleccionado:", h?.nombre);
                }}
              />
            )}
          </div>

          {salida && !salida.ok && (
            <section className="tz-card tz-res tz-res-error tz-animate-shake">
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
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Campo({ etiqueta, ayuda, error, children }) {
  return (
    <div className="tz-campo">
      <label className="tz-label">
        {etiqueta}
        {ayuda && <span className="tz-ayuda">{` \u00B7 ${ayuda}`}</span>}
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

const ICONO_RES = {
  [Resultado.NEGATIVO]: (
    <svg className="tz-res-icono tz-res-icono-ok" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="20" opacity="0.15" fill="currentColor" stroke="none" />
      <circle cx="24" cy="24" r="20" />
      <polyline points="16 24 22 30 34 18" />
    </svg>
  ),
  [Resultado.POSITIVO]: (
    <svg className="tz-res-icono tz-res-icono-no" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="20" opacity="0.15" fill="currentColor" stroke="none" />
      <circle cx="24" cy="24" r="20" />
      <line x1="16" y1="16" x2="32" y2="32" /><line x1="32" y1="16" x2="16" y2="32" />
    </svg>
  ),
  [Resultado.REPETIR]: (
    <svg className="tz-res-icono tz-res-icono-rep" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="20" opacity="0.15" fill="currentColor" stroke="none" />
      <circle cx="24" cy="24" r="20" />
      <polyline points="24 14 24 24 30 28" />
    </svg>
  ),
  [Resultado.INCOMPLETO]: (
    <svg className="tz-res-icono tz-res-icono-rep" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="20" opacity="0.15" fill="currentColor" stroke="none" />
      <circle cx="24" cy="24" r="20" />
      <line x1="24" y1="16" x2="24" y2="26" /><line x1="24" y1="32" x2="24.01" y2="32" />
    </svg>
  ),
  [Resultado.NO_ELEGIBLE]: (
    <svg className="tz-res-icono tz-res-icono-no" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="20" opacity="0.15" fill="currentColor" stroke="none" />
      <circle cx="24" cy="24" r="20" />
      <line x1="16" y1="16" x2="32" y2="32" /><line x1="32" y1="16" x2="16" y2="32" />
    </svg>
  ),
};

function PanelResultado({ salida, onSiguienteRonda, onGuardarPendiente, guardado }) {
  return (
    <section className={`tz-card tz-res ${TONO[salida.resultado]} tz-res-animar`}>
      <div className="tz-res-cabecera">
        {ICONO_RES[salida.resultado] || null}
        <div>
          <h2 className="tz-seccion">Resultado</h2>
          <p className="tz-res-titulo">{TITULO[salida.resultado]}</p>
        </div>
      </div>
      <p className="tz-res-conducta">{salida.conducta}</p>

      {salida.sintomasDeAlarma.length > 0 && (
        <p className="tz-res-dato">
          {"S\u00EDntomas de alarma: "}{salida.sintomasDeAlarma.join(", ")}
        </p>
      )}

      {salida.banda && (
        <p className="tz-res-dato">
          {"Banda "}{salida.banda.id}{" \u00B7 "}{salida.banda.nombre}{" \u00B7 umbrales "}
          {salida.banda.estado}{" \u00B7 version "}{salida.versionUmbrales}
        </p>
      )}

      {salida.diferenciaSpo2 !== null && (
        <p className="tz-res-dato">
          {"Diferencia preductal \u2212 postductal: "}{salida.diferenciaSpo2}{" puntos"}
        </p>
      )}

      {/* El recordatorio va destacado a proposito: un "repetir" que nadie
          repite es un caso perdido, y el cambio de turno es donde se pierden.
          Con el aviso discreto, la enfermera cerraba la pantalla y el caso
          desaparecia. */}
      {salida.proximaRonda && (
        <div className="tz-recordatorio">
          <div className="tz-recordatorio-cab">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <span className="tz-recordatorio-tiempo tz-mono">{salida.minutosEspera} min</span>
          </div>
          <p className="tz-recordatorio-texto">
            {"Repetir la medici\u00F3n en "}
            <strong>{salida.minutosEspera} minutos</strong>
            {" (ronda "}{salida.proximaRonda}{" de 3). Gu\u00E1rdalo en pendientes: "}
            {"as\u00ED el caso sobrevive al cambio de turno y la app avisa cuando toque."}
          </p>
        </div>
      )}

      {salida.proximaRonda && (
        <div className="tz-acciones">
          <button type="button" className="tz-boton tz-boton-pri" onClick={onSiguienteRonda}>
            {"Registrar ronda "}{salida.proximaRonda}{" ahora"}
          </button>
          <button
            type="button"
            className="tz-boton tz-boton-sec"
            onClick={onGuardarPendiente}
            disabled={guardado}
          >
            {guardado ? "Guardado en pendientes" : `Recordar en ${salida.minutosEspera} min`}
          </button>
        </div>
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
/* ========== FORMULARIO TAMIZAJE Y SUBMENÚ LATERAL ========== */
.tz {
  max-width: 1060px;
  margin: 0 auto;
  padding: 0 16px;
  color: var(--tinta);
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Layout Grid con Navegación Lateral */
.tz-layout-grid {
  display: flex;
  gap: 22px;
  align-items: flex-start;
  width: 100%;
}

.tz-sidebar-nav {
  width: 210px;
  flex-shrink: 0;
  position: sticky;
  top: 76px;
  z-index: 20;
}

.tz-sidebar-sticky {
  background: var(--carta, rgba(255, 255, 255, 0.9));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--linea, #e2e8f0);
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.tz-sidebar-cabecera {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--linea, #e2e8f0);
}

.tz-sidebar-titulo {
  display: block;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--acento, #4338ca);
  text-transform: uppercase;
}

.tz-sidebar-sub {
  font-size: 11.5px;
  color: var(--suave, #64748b);
  font-weight: 500;
}

.tz-sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.tz-sidebar-btn {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 9px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.16s ease;
  color: var(--tinta, #0f172a);
}

.tz-sidebar-btn:hover {
  background: var(--campo, rgba(0, 0, 0, 0.03));
  border-color: var(--linea, #e2e8f0);
  transform: translateX(2px);
}

.tz-sidebar-btn-activo {
  background: var(--acento-suave, #eef2ff) !important;
  border-color: var(--acento-linea, #c7d2fe) !important;
  color: var(--acento, #4338ca) !important;
  box-shadow: 0 2px 8px rgba(67, 56, 202, 0.1);
  transform: translateX(3px);
}

.tz-sidebar-num {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--acento-suave, #eef2ff);
  color: var(--acento, #4338ca);
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tz-sidebar-btn-activo .tz-sidebar-num {
  background: var(--acento, #4338ca);
  color: #fff;
}

.tz-sidebar-icon {
  font-size: 14px;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tz-sidebar-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.tz-sidebar-nombre {
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tz-sidebar-detalle {
  font-size: 10px;
  color: var(--suave, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tz-sidebar-check {
  font-size: 10px;
  font-weight: 900;
  color: #16a34a;
  background: rgba(22, 163, 74, 0.12);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tz-sidebar-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tz-main-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Responsivo para móviles */
@media (max-width: 880px) {
  .tz-layout-grid {
    flex-direction: column;
    gap: 14px;
  }

  .tz-sidebar-nav {
    width: 100%;
    position: sticky;
    top: 64px;
    z-index: 30;
  }

  .tz-sidebar-sticky {
    padding: 7px 10px;
    border-radius: 10px;
  }

  .tz-sidebar-cabecera {
    display: none;
  }

  .tz-sidebar-menu {
    flex-direction: row;
    overflow-x: auto;
    gap: 6px;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  .tz-sidebar-menu::-webkit-scrollbar {
    display: none;
  }

  .tz-sidebar-btn {
    width: auto;
    flex-shrink: 0;
    padding: 5px 10px;
  }

  .tz-sidebar-detalle {
    display: none;
  }
}

.tz *, .tz *::before, .tz *::after { box-sizing: border-box; }

/* --- Cards con glassmorphism --- */
.tz-card {
  background: var(--carta);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--linea);
  border-radius: var(--radio);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--sombra-sm);
  transition: transform var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out);
  animation: fadeInUp 0.45s var(--ease-out) both;
}

.tz-card:hover {
  box-shadow: var(--sombra);
}

.tz-card-1 { animation-delay: 0.05s; }
.tz-card-2 { animation-delay: 0.10s; }
.tz-card-3 { animation-delay: 0.15s; }
.tz-card-4 { animation-delay: 0.20s; }

/* --- Section headers with step numbers --- */
.tz-seccion-cab {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

  /* El icono de ayuda se va al extremo derecho con margen automatico, no con
     justify-content en el contenedor: eso ultimo separaba tambien el titulo
     del numero de paso. */
  .tz-seccion-cab > .ayu {
    margin-left: auto;
  }

.tz-paso {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--acento), var(--acento-hover));
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.tz-seccion {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--suave);
  margin: 0;
  font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
}

.tz-seccion-desc {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--tenue);
  font-weight: 400;
}

/* --- Form fields --- */
.tz-fila { display: flex; gap: 12px; flex-wrap: wrap; }

.tz-campo {
  flex: 1 1 150px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
}

.tz-label {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--suave);
  margin-bottom: 6px;
  transition: color var(--dur-fast) ease;
}

.tz-ayuda { color: var(--tenue); font-weight: 400; }

.tz-input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--linea);
  border-radius: var(--radio-sm);
  background: var(--campo);
  font-size: 15px;
  color: var(--tinta);
  font-family: inherit;
  transition: border-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out),
              background var(--dur-fast) ease;
}

.tz-input:hover {
  border-color: var(--linea-fuerte);
}

.tz-input:focus-visible {
  outline: none;
  border-color: var(--acento);
  box-shadow: 0 0 0 3px var(--acento-suave), var(--sombra-glow);
  background: #fff;
}

.tz-mono {
  font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  letter-spacing: 0.04em;
}

.tz-error {
  border-color: var(--rojo) !important;
  background: var(--rojo-suave) !important;
  color: var(--rojo);
  animation: shakeError 0.4s ease;
}

.tz-mensaje-error {
  font-size: 12px;
  color: var(--rojo);
  margin-top: 5px;
  font-weight: 500;
}

/* --- Banda info --- */
.tz-banda-suelta {
  margin: -4px 0 16px;
  padding: 10px 14px;
  font-size: 12.5px;
  color: var(--suave);
  line-height: 1.5;
  background: var(--carta);
  border: 1px solid var(--linea);
  border-radius: var(--radio-sm);
  display: flex;
  align-items: center;
  gap: 8px;
  animation: fadeInUp 0.4s var(--ease-out) both;
}

.tz-banda-icono {
  color: var(--acento);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* --- Alerts --- */
.tz-alerta {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 14px 0 0;
  padding: 12px 14px;
  border-radius: var(--radio-sm);
  background: var(--rojo-suave);
  border: 1px solid var(--rojo-linea);
  color: var(--rojo);
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.45;
}

.tz-alerta svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.tz-alerta-glow {
  animation: glowPulse 2s ease-in-out infinite;
}

.tz-nota {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 12px 0 0;
  padding: 12px 14px;
  border-radius: var(--radio-sm);
  background: var(--ambar-suave);
  border: 1px solid var(--ambar-linea);
  color: var(--ambar);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
}

.tz-nota svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.tz-explica {
  font-size: 12.5px;
  color: var(--tenue);
  margin: -4px 0 14px;
}

/* --- Chips --- */
.tz-chips { display: flex; gap: 8px; flex-wrap: wrap; }

.tz-chip {
  padding: 10px 16px;
  border-radius: var(--radio-sm);
  border: 1.5px solid var(--linea);
  background: var(--campo);
  color: var(--tinta-media);
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all var(--dur-fast) var(--ease-spring);
}

.tz-chip:hover {
  border-color: var(--acento-linea);
  background: var(--acento-suave);
  transform: translateY(-1px);
}

.tz-chip-on {
  background: linear-gradient(135deg, var(--marino-alto), var(--marino-claro));
  border-color: var(--marino-alto);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(30, 41, 59, 0.25);
  transform: scale(1.03);
}

.tz-chip-on:hover {
  background: linear-gradient(135deg, var(--marino-alto), var(--marino-claro));
  border-color: var(--marino-alto);
}

/* --- Checkboxes --- */
.tz-checks {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 9px;
  margin-bottom: 10px;
}

.tz-check {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1.5px solid var(--linea);
  border-radius: var(--radio-sm);
  background: var(--campo);
  font-size: 13.5px;
  cursor: pointer;
  transition: all var(--dur-fast) ease;
  font-weight: 450;
}

.tz-check:hover {
  border-color: var(--linea-fuerte);
  background: #fff;
}

.tz-check input {
  accent-color: var(--acento);
  width: 17px;
  height: 17px;
  margin: 0;
  cursor: pointer;
}

.tz-check-alarma {
  background: var(--rojo-suave);
  border-color: var(--rojo-linea);
  color: var(--rojo);
  font-weight: 500;
}

.tz-check-alarma input { accent-color: var(--rojo); }

.tz-check-ctx {
  background: var(--ambar-suave);
  border-color: var(--ambar-linea);
  color: var(--ambar);
  font-weight: 500;
}

/* --- Actions --- */
.tz-acciones {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tz-boton {
  padding: 13px 22px;
  border-radius: var(--radio-sm);
  border: none;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', inherit;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all var(--dur) var(--ease-out);
  position: relative;
  overflow: hidden;
}

.tz-boton-pri {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: #fff;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
}

.tz-boton-pri:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
}

.tz-boton-pri:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

.tz-boton-sec {
  background: var(--carta-solida);
  color: var(--suave);
  border: 1.5px solid var(--linea);
  font-weight: 500;
}

.tz-boton-sec:hover {
  border-color: var(--linea-fuerte);
  color: var(--tinta-media);
  background: #fff;
  transform: translateY(-1px);
  box-shadow: var(--sombra-sm);
}

.tz-boton:disabled {
  opacity: 0.55;
  cursor: default;
  transform: none !important;
  box-shadow: none !important;
}

/* --- Result panel --- */
.tz-res-animar {
  animation: scaleIn 0.4s var(--ease-spring) both;
}

.tz-res-cabecera {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.tz-res-icono {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.tz-res-icono-ok { color: var(--verde); }
.tz-res-icono-no { color: var(--rojo); }
.tz-res-icono-rep { color: var(--ambar); }

.tz-res-titulo {
  font-size: 20px;
  font-weight: 700;
  margin: 4px 0 0;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.tz-res-conducta {
  font-size: 14.5px;
  margin: 0 0 14px;
  line-height: 1.6;
  color: var(--tinta-media);
}

.tz-res-dato {
  font-size: 12.5px;
  color: var(--suave);
  margin: 0 0 5px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.tz-res-positivo {
  border-color: var(--rojo-linea);
  background: var(--rojo-suave);
  border-left: 4px solid var(--rojo);
}
.tz-res-positivo .tz-res-titulo { color: var(--rojo); }

.tz-res-negativo {
  border-color: var(--verde-linea);
  background: var(--verde-suave);
  border-left: 4px solid var(--verde);
}
.tz-res-negativo .tz-res-titulo { color: var(--verde); }

.tz-res-repetir, .tz-res-noelegible {
  border-color: var(--ambar-linea);
  background: var(--ambar-suave);
  border-left: 4px solid var(--ambar);
}
.tz-res-repetir .tz-res-titulo, .tz-res-noelegible .tz-res-titulo { color: var(--ambar); }

.tz-res-noelegible {
  border-color: var(--rojo-linea);
  background: var(--rojo-suave);
  border-left-color: var(--rojo);
}
.tz-res-noelegible .tz-res-titulo { color: var(--rojo); }

.tz-res-error {
  border-color: var(--rojo-linea);
  background: var(--rojo-suave);
  border-left: 4px solid var(--rojo);
}

.tz-animate-shake {
  animation: shakeError 0.5s ease, fadeInUp 0.3s var(--ease-out);
}

.tz-lista {
  margin: 14px 0 0;
  padding-left: 18px;
}
.tz-lista li {
  font-size: 13px;
  margin-bottom: 7px;
  line-height: 1.5;
}

.tz-aviso-alto { color: var(--rojo); font-weight: 500; }
.tz-aviso-medio { color: var(--ambar); }
.tz-aviso-bajo { color: var(--suave); }

.tz-advertencia {
  margin: 16px 0 0;
  padding-top: 12px;
  border-top: 1px solid var(--linea);
  font-size: 12px;
  color: var(--tenue);
  line-height: 1.5;
}

/* --- Derivation panel shared styles --- */
.tz-banda-prov { color: var(--ambar); }
.tz-opcionales { margin-top:16px; padding-top:14px; border-top:1px dashed var(--linea); }
.tz-opcionales-titulo { margin:0 0 10px; font-size:11px; font-weight:600;
                        letter-spacing:.08em; text-transform:uppercase;
                        color:var(--tenue);
                        font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.tz-asintomatico { display:flex; align-items:flex-start; gap:11px; padding:14px 15px;
                   border:1px solid var(--linea); border-radius:10px;
                   background:var(--campo); cursor:pointer; margin-bottom:12px;
                   transition:background .15s ease, border-color .15s ease; }
.tz-asintomatico-on { background:var(--verde-suave); border-color:var(--verde-linea); }
.tz-asintomatico input { accent-color:var(--verde); width:18px; height:18px;
                         margin:1px 0 0; flex-shrink:0; }
.tz-asintomatico-titulo { display:block; font-size:14.5px; font-weight:600;
                          color:var(--tinta); }
.tz-asintomatico-on .tz-asintomatico-titulo { color:var(--verde); }
.tz-asintomatico-desc { display:block; font-size:12.5px; color:var(--suave);
                        margin-top:3px; line-height:1.4; }
.tz-retomado { margin-bottom:14px; padding:14px 16px; border-radius:12px;
               background:var(--verde-suave); border:1px solid var(--verde-linea);
               border-left:4px solid var(--verde); }
.tz-retomado-titulo { margin:0 0 5px; font-size:14.5px; font-weight:600; color:var(--verde); }
.tz-retomado-texto { margin:0; font-size:13px; line-height:1.55; color:var(--tinta); }
.tz-recordatorio { margin:16px 0 4px; padding:15px 16px; border-radius:12px;
                   background:var(--ambar-suave); border:1px solid var(--ambar-linea);
                   border-left:4px solid var(--ambar); }
.tz-recordatorio-cab { display:flex; align-items:center; gap:9px; color:var(--ambar);
                       margin-bottom:8px; }
.tz-recordatorio-tiempo { font-size:22px; font-weight:700; letter-spacing:-.01em;
                          font-variant-numeric:tabular-nums; }
.tz-recordatorio-texto { margin:0; font-size:13.5px; line-height:1.55; color:var(--tinta); }
.tz-deriv { border-color: var(--linea); }

.tz-centros { list-style: none; margin: 14px 0 0; padding: 0; }

.tz-centro {
  border-top: 1px solid var(--linea);
  padding: 14px 0;
  transition: background var(--dur-fast) ease;
}
.tz-centro:first-child { border-top: none; }

.tz-centro-cab {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 4px;
}

.tz-centro-nombre { font-size: 14.5px; font-weight: 600; line-height: 1.35; }
.tz-centro-dist { font-size: 13px; color: var(--suave); flex-shrink: 0; }
.tz-centro-datos { margin: 0; font-size: 12.5px; color: var(--suave); line-height: 1.45; }
.tz-centro-nota {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--tenue);
  line-height: 1.45;
  font-style: italic;
}

/* --- Responsive --- */
@media (max-width: 520px) {
  .tz-checks { grid-template-columns: 1fr; }
  .tz-acciones { flex-direction: column; }
  .tz-boton { width: 100%; justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  .tz * { transition: none !important; }
}
`;
