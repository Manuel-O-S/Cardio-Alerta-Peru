import { useMemo, useState, useEffect } from "react";
import {
  ADVERTENCIA_HIDRATACION,
  FACTOR_CARDIACO_SUGERIDO,
  PUNTOS_DEL_RANGO,
  calcular,
} from "./hidratacion.js";

const OPCIONES_EDAD_GESTACIONAL = [
  { valor: "26", etiqueta: "<28 sem (Extremo)" },
  { valor: "30", etiqueta: "28-32 sem (Muy prematuro)" },
  { valor: "35", etiqueta: "33-36 sem (Prematuro tardío)" },
  { valor: "38", etiqueta: "37-40 sem (A término)" },
  { valor: "41", etiqueta: ">40 sem (Postérmino)" },
];

/**
 * Calculadora de líquidos de mantenimiento.
 *
 * Horas de vida se toma automáticamente del tamizaje anterior.
 * La edad gestacional es manipulable para ajustar el cálculo hídrico.
 */
export default function CalculadoraHidratacion({
  pesoInicial,
  horasInicial,
  edadGestacionalInicial,
}) {
  const [abierta, setAbierta] = useState(false);
  const [f, setF] = useState({
    pesoKg: pesoInicial != null ? String(pesoInicial) : "",
    horasDeVida: horasInicial != null ? String(horasInicial) : "24",
    edadGestacionalSem: edadGestacionalInicial != null ? String(edadGestacionalInicial) : "38",
    puntoDelRango: "minimo",
    restriccionCardiaca: false,
    factorRestriccion: String(FACTOR_CARDIACO_SUGERIDO),
  });
  const [calculado, setCalculado] = useState(false);

  useEffect(() => {
    if (horasInicial != null) {
      setF((prev) => ({ ...prev, horasDeVida: String(horasInicial) }));
    }
  }, [horasInicial]);

  useEffect(() => {
    if (pesoInicial != null) {
      setF((prev) => ({ ...prev, pesoKg: String(pesoInicial) }));
    }
  }, [pesoInicial]);

  useEffect(() => {
    if (edadGestacionalInicial != null) {
      setF((prev) => ({ ...prev, edadGestacionalSem: String(edadGestacionalInicial) }));
    }
  }, [edadGestacionalInicial]);

  const set = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setF((prev) => ({ ...prev, [campo]: valor }));
    setCalculado(false);
  };

  const r = useMemo(() => (calculado ? calcular(f) : null), [calculado, f]);
  const errores = r && !r.ok ? r.errores : {};

  if (!abierta) {
    return (
      <section className="tz-card hid-cerrada">
        <style>{CSS_HID}</style>
        <div className="hid-fila">
          <div>
            <span className="hid-etiqueta">Hidratación</span>
            <p className="hid-cerrada-texto">
              Volumen de mantenimiento según peso, día de vida y edad gestacional
            </p>
          </div>
          <button type="button" className="hid-abrir" onClick={() => setAbierta(true)}>
            Abrir
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="tz-card hid">
      <style>{CSS_HID}</style>

      <div className="hid-fila">
        <span className="hid-etiqueta">Líquidos de mantenimiento</span>
        <button type="button" className="hid-cerrar" onClick={() => setAbierta(false)}>
          Cerrar
        </button>
      </div>

      {/* Datos del paciente: Horas de vida se hereda directamente del tamizaje,
          mientras que la edad gestacional se puede ajustar directamente aquí */}
      <div className="hid-heredado">
        <div className="hid-dato">
          <span className="hid-dato-etq">Peso</span>
          {pesoInicial != null ? (
            <span className="hid-dato-val tz-mono">{f.pesoKg} kg</span>
          ) : (
            <input
              className={`tz-input tz-mono ${errores.pesoKg ? "tz-error" : ""}`}
              value={f.pesoKg}
              onChange={set("pesoKg")}
              placeholder="3.2"
              inputMode="decimal"
              style={{ maxWidth: 90, padding: "6px 8px" }}
            />
          )}
        </div>

        <div className="hid-dato">
          <span className="hid-dato-etq">Horas de vida (Tamizaje)</span>
          <span className="hid-dato-val tz-mono" style={{ color: "var(--acento)", fontWeight: 600 }}>
            {horasInicial != null ? `${horasInicial} h` : `${f.horasDeVida || 24} h`}
          </span>
        </div>

        <div className="hid-dato" style={{ flex: 1.2 }}>
          <span className="hid-dato-etq">Edad gestacional (Ajustable)</span>
          <select
            className="tz-input tz-mono"
            value={f.edadGestacionalSem}
            onChange={set("edadGestacionalSem")}
            style={{ padding: "6px 8px", fontSize: "12.5px" }}
          >
            {OPCIONES_EDAD_GESTACIONAL.map((op) => (
              <option key={op.valor} value={op.valor}>
                {op.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>
      {(errores.pesoKg || errores.horasDeVida || errores.edadGestacionalSem) && (
        <p className="tz-nota">
          {"Faltan datos del tamizaje. Compl\u00E9talos arriba y vuelve a evaluar."}
        </p>
      )}

      {/* La tabla da un rango, no un numero. Por defecto se toma el minimo:
          en sospecha de cardiopatia el riesgo relevante es la sobrecarga de
          volumen, no quedarse corto. */}
      <div className="tz-campo">
        <label className="tz-label">
          Punto del rango
          <span className="tz-ayuda"> · la tabla da un rango, no un valor unico</span>
        </label>
        <div className="tz-chips">
          {Object.entries(PUNTOS_DEL_RANGO).map(([clave, p]) => (
            <button
              key={clave}
              type="button"
              className={`tz-chip ${f.puntoDelRango === clave ? "tz-chip-on" : ""}`}
              onClick={() => {
                setF((prev) => ({ ...prev, puntoDelRango: clave }));
                setCalculado(false);
              }}
              aria-pressed={f.puntoDelRango === clave}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <label className="hid-check">
        <input
          type="checkbox"
          checked={f.restriccionCardiaca}
          onChange={set("restriccionCardiaca")}
        />
        <span>Restriccion por cardiopatia</span>
      </label>

      {f.restriccionCardiaca && (
        <div className="tz-campo hid-factor">
          <label className="tz-label">
            Factor de restriccion
            <span className="tz-ayuda"> · 0.8 = 80% del aporte estandar</span>
          </label>
          <input
            className={`tz-input tz-mono ${errores.factorRestriccion ? "tz-error" : ""}`}
            value={f.factorRestriccion}
            onChange={set("factorRestriccion")}
            inputMode="decimal"
          />
          {errores.factorRestriccion && (
            <span className="tz-mensaje-error">{errores.factorRestriccion}</span>
          )}
          <p className="hid-nota-factor">
            El 80% es un punto de partida habitual, no una regla establecida: la
            evidencia sobre restringir liquidos en cardiopatia es limitada y los
            protocolos varian. Confirmar con el equipo medico.
          </p>
        </div>
      )}

      <div className="tz-acciones">
        <button type="button" className="tz-boton" onClick={() => setCalculado(true)}>
          Calcular volumen
        </button>
      </div>

      {r?.ok && (
        <div className="hid-resultado">
          <div className="hid-cifras">
            <div>
              <span className="hid-etiqueta">Volumen total</span>
              <p className="hid-cifra tz-mono">
                {r.volumenDia} <span className="hid-unidad">mL/dia</span>
              </p>
            </div>
            <div>
              <span className="hid-etiqueta">Velocidad</span>
              <p className="hid-cifra tz-mono">
                {r.velocidadMlH} <span className="hid-unidad">mL/h</span>
              </p>
            </div>
          </div>

          <p className="hid-contexto">
            {r.grupo} · dia {r.dia} de vida · {r.mlKgDia} mL/kg/dia
          </p>
          <p className={`hid-rango ${r.superaMaximo ? "hid-rango-alerta" : ""}`}>
            {`Rango de la tabla: ${r.rango[0]}\u2013${r.rango[1]} cc/kg/dia`}
            {r.superaMaximo && " · el valor elegido lo supera"}
          </p>

          <div className="hid-pasos">
            <p className="hid-sub">Desarrollo del calculo</p>
            {r.pasos.map((p) => (
              <div key={p.titulo} className="hid-paso">
                <span className="hid-paso-titulo">{p.titulo}</span>
                <span className="hid-paso-formula tz-mono">{p.sustitucion}</span>
                <span className="hid-paso-resultado tz-mono">= {p.resultado}</span>
              </div>
            ))}
          </div>

          {r.avisos.length > 0 && (
            <ul className="hid-avisos">
              {r.avisos.map((a, i) => (
                <li key={i} className={`hid-aviso hid-aviso-${a.nivel}`}>
                  {a.texto}
                </li>
              ))}
            </ul>
          )}

          <p className="hid-advertencia">{ADVERTENCIA_HIDRATACION}</p>
        </div>
      )}
    </section>
  );
}

const CSS_HID = `
.hid-cerrada { padding:14px 16px; }
.hid-fila { display:flex; justify-content:space-between; align-items:center;
            gap:12px; margin-bottom:14px; }
.hid-cerrada .hid-fila { margin-bottom:0; }
.hid-etiqueta { font-size:10.5px; font-weight:600; letter-spacing:.12em;
                text-transform:uppercase; color:var(--suave);
                font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.hid-cerrada-texto { margin:5px 0 0; font-size:13.5px; color:var(--tinta); line-height:1.4; }
.hid-abrir { flex-shrink:0; background:var(--acento); border:1px solid var(--acento);
             border-radius:8px; padding:9px 18px; font-family:inherit;
             font-size:13.5px; font-weight:600; color:#fff; cursor:pointer;
             transition:background .15s ease; }
.hid-abrir:hover { background:var(--acento-hover); }
.hid-abrir:focus-visible { outline:2px solid var(--acento); outline-offset:2px; }
.hid-cerrar { flex-shrink:0; background:none; border:1px solid var(--linea);
              border-radius:8px; padding:8px 14px; font-family:inherit;
              font-size:13px; color:var(--suave); cursor:pointer; }
.hid-heredado { display:flex; gap:22px; flex-wrap:wrap; padding:12px 14px;
                border-radius:9px; background:var(--campo);
                border:1px solid var(--linea); margin-bottom:14px; }
.hid-dato { display:flex; flex-direction:column; gap:3px; min-width:0; }
.hid-dato-etq { font-size:10.5px; font-weight:600; letter-spacing:.1em;
                text-transform:uppercase; color:var(--suave);
                font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.hid-dato-val { font-size:15px; font-weight:600; color:var(--tinta); }
.hid-check { display:flex; align-items:center; gap:9px; padding:11px 13px;
             border:1px solid var(--linea); border-radius:9px; background:var(--campo);
             font-size:13.5px; cursor:pointer; margin-bottom:4px; }
.hid-check input { accent-color:var(--marino-alto); width:16px; height:16px; margin:0; }
.hid-factor { margin-top:12px; }
.hid-nota-factor { margin:8px 0 0; font-size:12.5px; color:var(--ambar); line-height:1.5; }
.hid-resultado { margin-top:16px; padding:16px; border-radius:10px;
                 background:var(--campo); border:1px solid var(--linea); }
.hid-cifras { display:flex; gap:28px; flex-wrap:wrap; }
.hid-cifra { margin:6px 0 0; font-size:26px; font-weight:600; color:var(--tinta);
             letter-spacing:-.02em; }
.hid-unidad { font-size:14px; font-weight:500; color:var(--suave); }
.hid-rango { margin:5px 0 0; font-size:12.5px; color:var(--suave);
             font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.hid-rango-alerta { color:var(--rojo); font-weight:600; }
.hid-contexto { margin:12px 0 0; font-size:13px; color:var(--suave); }
.hid-sub { margin:0 0 8px; font-size:10.5px; font-weight:600; letter-spacing:.1em;
           text-transform:uppercase; color:var(--suave);
           font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.hid-pasos { margin-top:14px; padding-top:13px; border-top:1px solid var(--linea); }
.hid-paso { display:flex; flex-wrap:wrap; align-items:baseline; gap:6px 10px;
            padding:7px 0; font-size:13px; }
.hid-paso-titulo { flex:0 0 100%; color:var(--suave); font-size:12px; }
.hid-paso-formula { color:var(--tinta); }
.hid-paso-resultado { color:var(--tinta); font-weight:600; }
.hid-avisos { margin:14px 0 0; padding-left:17px; }
.hid-aviso { font-size:12.5px; line-height:1.5; margin-bottom:6px; }
.hid-aviso-alto { color:var(--rojo); }
.hid-aviso-medio { color:var(--ambar); }
.hid-aviso-bajo { color:var(--suave); }
.hid-advertencia { margin:14px 0 0; padding-top:13px; border-top:1px solid var(--linea);
                   font-size:12px; color:var(--suave); line-height:1.5; }
@media (max-width:520px) { .hid-cifras { gap:18px; } }
`;