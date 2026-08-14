import { useMemo, useState } from "react";
import {
  ADVERTENCIA_PGE1,
  AMPOLLA,
  DOSIS,
  EFECTOS_ADVERSOS,
  ESTABILIDAD,
  FUENTE_INSN,
  MONITOREO,
  PROTOCOLO,
  calcular,
  calcularINSN,
} from "./prostaglandina.js";

/**
 * Calculadora de velocidad de infusion de prostaglandina E1.
 *
 * Aparece solo cuando el tamizaje no se supera, junto a la derivacion: es el
 * momento en que puede hacer falta mantener el ductus abierto mientras se
 * traslada al recien nacido.
 *
 * NO recomienda dosis ni concentracion. Las dos se escriben a mano y no hay
 * valores precargados, a proposito: un valor por defecto que nadie mira es
 * exactamente como se administra la concentracion equivocada.
 */
export default function CalculadoraPGE1({ pesoInicial }) {
  const [abierta, setAbierta] = useState(false);
  const [verProtocolo, setVerProtocolo] = useState(false);
  const [verEfectos, setVerEfectos] = useState(false);
  // Por defecto la preparacion del INSN: es la del hospital de referencia y
  // evita tener que introducir la concentracion, que es donde mas se falla.
  const [modo, setModo] = useState("insn");
  const [f, setF] = useState({
    pesoKg: pesoInicial != null ? String(pesoInicial) : "",
    dosisUgKgMin: "",
    concentracionUgMl: "",
  });
  const [calculado, setCalculado] = useState(false);

  const set = (campo) => (e) => {
    setF((prev) => ({ ...prev, [campo]: e.target.value }));
    setCalculado(false);
  };

  const r = useMemo(
    () =>
      calculado
        ? modo === "insn"
          ? calcularINSN({ pesoKg: f.pesoKg, dosisUgKgMin: f.dosisUgKgMin })
          : calcular(f)
        : null,
    [calculado, f, modo]
  );
  const errores = r && !r.ok ? r.errores : {};

  if (!abierta) {
    return (
      <section className="tz-card pge-cerrada">
        <style>{CSS_PGE}</style>
        <div className="pge-fila">
          <div>
            <span className="pge-etiqueta">Prostaglandina E1</span>
            <p className="pge-cerrada-texto">
              Calculadora de velocidad de infusion y protocolo de preparacion
            </p>
          </div>
          <button type="button" className="pge-abrir" onClick={() => setAbierta(true)}>
            Abrir
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="tz-card pge">
      <style>{CSS_PGE}</style>

      <div className="pge-fila">
        <span className="pge-etiqueta">Prostaglandina E1 · alprostadil</span>
        <button type="button" className="pge-cerrar" onClick={() => setAbierta(false)}>
          Cerrar
        </button>
      </div>

      <p className="pge-advertencia">{ADVERTENCIA_PGE1}</p>

      <p className="pge-ampolla tz-mono">
        {`Ampolla: ${AMPOLLA.volumenMl} mL a ${AMPOLLA.concentracionUgMl} µg/mL`}
      </p>

      <div className="tz-chips" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={`tz-chip ${modo === "insn" ? "tz-chip-on" : ""}`}
          onClick={() => { setModo("insn"); setCalculado(false); }}
          aria-pressed={modo === "insn"}
        >
          {"Preparaci\u00F3n INSN"}
        </button>
        <button
          type="button"
          className={`tz-chip ${modo === "libre" ? "tz-chip-on" : ""}`}
          onClick={() => { setModo("libre"); setCalculado(false); }}
          aria-pressed={modo === "libre"}
        >
          {"Otra concentraci\u00F3n"}
        </button>
      </div>

      {/* --- Entradas --- */}
      <div className="tz-fila">
        <div className="tz-campo">
          <label className="tz-label">
            Peso del paciente (kg)
            {pesoInicial != null && <span className="tz-ayuda"> · del tamizaje</span>}
          </label>
          <input
            className={`tz-input tz-mono ${errores.pesoKg ? "tz-error" : ""}`}
            value={f.pesoKg}
            onChange={set("pesoKg")}
            placeholder="3.2"
            inputMode="decimal"
          />
          {errores.pesoKg && <span className="tz-mensaje-error">{errores.pesoKg}</span>}
        </div>

        <div className="tz-campo">
          <label className="tz-label">
            Dosis prescrita
            <span className="tz-ayuda"> · {DOSIS.unidad}</span>
          </label>
          <input
            className={`tz-input tz-mono ${errores.dosisUgKgMin ? "tz-error" : ""}`}
            value={f.dosisUgKgMin}
            onChange={set("dosisUgKgMin")}
            placeholder="0.05"
            inputMode="decimal"
          />
          {errores.dosisUgKgMin && (
            <span className="tz-mensaje-error">{errores.dosisUgKgMin}</span>
          )}
        </div>
      </div>

      {modo === "libre" && (
      <div className="tz-campo">
        <label className="tz-label">
          Concentracion de la solucion preparada
          <span className="tz-ayuda"> · µg/mL, de la etiqueta</span>
        </label>
        <input
          className={`tz-input tz-mono ${errores.concentracionUgMl ? "tz-error" : ""}`}
          value={f.concentracionUgMl}
          onChange={set("concentracionUgMl")}
          placeholder="10"
          inputMode="decimal"
        />
        {errores.concentracionUgMl && (
          <span className="tz-mensaje-error">{errores.concentracionUgMl}</span>
        )}
      </div>
      )}

      <p className="pge-rango">
        Rango habitual: {DOSIS.min}–{DOSIS.max} {DOSIS.unidad}. La dosis la
        prescribe el medico segun la condicion del paciente.
      </p>

      <div className="tz-acciones">
        <button type="button" className="tz-boton" onClick={() => setCalculado(true)}>
          Calcular velocidad
        </button>
      </div>

      {/* --- Resultado --- */}
      {r?.ok && (
        <div className="pge-resultado">
          <span className="pge-etiqueta">Velocidad de infusion</span>
          <p className="pge-cifra tz-mono">
            {r.velocidadMlH} <span className="pge-unidad">mL/h</span>
          </p>
          <p className="pge-secundaria tz-mono">
            {r.dosisUgMin} µg/min · {r.dosisUgH} µg/h
          </p>

          {r.preparacion && (
            <div className="pge-preparacion">
              <p className="pge-sub">{"C\u00F3mo preparar la infusi\u00F3n"}</p>
              <ol className="pge-prep-lista">
                {r.preparacion.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
              <p className="pge-prep-clave tz-mono">
                {`Concentraci\u00F3n final: ${r.concentracionFinalUgMl} µg/mL · cada 1 mL/h = 0,01 µg/kg/min`}
              </p>
            </div>
          )}

          {/* El desarrollo completo: el paso 7 pide doble comprobacion
              independiente, y no se puede comprobar un numero sin ver de
              donde salio. */}
          <div className="pge-pasos">
            <p className="pge-sub">Desarrollo del calculo</p>
            {r.pasos.map((p) => (
              <div key={p.titulo} className="pge-paso">
                <span className="pge-paso-titulo">{p.titulo}</span>
                <span className="pge-paso-formula tz-mono">{p.sustitucion}</span>
                <span className="pge-paso-resultado tz-mono">= {p.resultado}</span>
              </div>
            ))}
          </div>

          {r.avisos.length > 0 && (
            <ul className="pge-avisos">
              {r.avisos.map((a, i) => (
                <li key={i} className={`pge-aviso pge-aviso-${a.nivel}`}>
                  {a.texto}
                </li>
              ))}
            </ul>
          )}

          <p className="pge-doble">
            Antes de conectar: verificar de forma independiente paciente, peso,
            medicamento, concentracion, dosis, unidades, velocidad, via e
            identificacion de la jeringa.
          </p>
        </div>
      )}

      {/* --- Protocolo --- */}
      <button
        type="button"
        className="pge-ver-protocolo"
        onClick={() => setVerProtocolo(!verProtocolo)}
        aria-expanded={verProtocolo}
      >
        {verProtocolo ? "Ocultar protocolo" : "Ver protocolo de preparacion y administracion"}
      </button>

      {/* Efectos adversos: quien prepara la infusion es quien primero los ve. */}
      <button
        type="button"
        className="pge-ver-protocolo"
        onClick={() => setVerEfectos(!verEfectos)}
        aria-expanded={verEfectos}
      >
        {verEfectos ? "Ocultar efectos adversos" : "Ver efectos adversos y conducta"}
      </button>

      {verEfectos && (
        <div className="pge-efectos">
          <p className="pge-sub">{"Monitorizar durante la infusi\u00F3n"}</p>
          <ul className="pge-monitoreo">
            {MONITOREO.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>

          <p className="pge-sub" style={{ marginTop: 16 }}>Efectos adversos</p>
          {EFECTOS_ADVERSOS.map((e) => (
            <div key={e.efecto} className="pge-efecto">
              <div className="pge-efecto-cab">
                <span className="pge-efecto-nombre">{e.efecto}</span>
                <span className="pge-efecto-frec">{e.frecuencia}</span>
              </div>
              <ul className="pge-efecto-conducta">
                {e.conducta.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          ))}

          <p className="pge-sub" style={{ marginTop: 16 }}>Estabilidad</p>
          <ul className="pge-monitoreo">
            {ESTABILIDAD.map((e) => (
              <li key={e.que}>
                {e.que}: <strong>{e.duracion}</strong>
              </li>
            ))}
          </ul>

          <p className="pge-fuente">{FUENTE_INSN}</p>
        </div>
      )}

      {verProtocolo && (
        <ol className="pge-protocolo">
          {PROTOCOLO.map((paso) => (
            <li key={paso.n} className="pge-protocolo-paso">
              <span className="pge-protocolo-n tz-mono">{paso.n}</span>
              <div>
                <p className="pge-protocolo-titulo">{paso.titulo}</p>
                <ul className="pge-protocolo-puntos">
                  {paso.puntos.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const CSS_PGE = `
.pge-cerrada { padding:14px 16px; }
.pge-fila { display:flex; justify-content:space-between; align-items:center;
            gap:12px; margin-bottom:10px; }
.pge-cerrada .pge-fila { margin-bottom:0; }
.pge-etiqueta { font-size:10.5px; font-weight:600; letter-spacing:.12em;
                text-transform:uppercase; color:var(--suave);
                font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.pge-cerrada-texto { margin:5px 0 0; font-size:13.5px; color:var(--tinta); line-height:1.4; }
/* Celeste: es la accion principal de la tarjeta, y usa el mismo acento que
   los numeros de paso del formulario para que se lea como parte del sistema. */
.pge-abrir { flex-shrink:0; background:var(--acento); border:1px solid var(--acento);
             border-radius:8px; padding:9px 18px; font-family:inherit;
             font-size:13.5px; font-weight:600; color:#fff; cursor:pointer;
             transition:background .15s ease; }
.pge-abrir:hover { background:var(--acento-hover); }
.pge-abrir:focus-visible { outline:2px solid var(--acento); outline-offset:2px; }
/* Cerrar es secundario: no compite con el contenido ya abierto. */
.pge-cerrar { flex-shrink:0; background:none; border:1px solid var(--linea);
              border-radius:8px; padding:8px 14px; font-family:inherit;
              font-size:13px; color:var(--suave); cursor:pointer; }
.pge-advertencia { margin:0 0 16px; padding:12px 13px; border-radius:9px;
                   background:var(--ambar-suave); border:1px solid var(--ambar-linea);
                   color:var(--ambar); font-size:12.5px; line-height:1.5; }
.pge-rango { margin:2px 0 0; font-size:12.5px; color:var(--suave); line-height:1.45; }
.pge-resultado { margin-top:16px; padding:16px; border-radius:10px;
                 background:var(--campo); border:1px solid var(--linea); }
.pge-cifra { margin:6px 0 2px; font-size:30px; font-weight:600; color:var(--tinta);
             letter-spacing:-.02em; }
.pge-unidad { font-size:16px; font-weight:500; color:var(--suave); }
.pge-secundaria { margin:0 0 14px; font-size:13px; color:var(--suave); }
.pge-sub { margin:0 0 8px; font-size:10.5px; font-weight:600; letter-spacing:.1em;
           text-transform:uppercase; color:var(--suave);
           font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.pge-pasos { padding-top:13px; border-top:1px solid var(--linea); }
.pge-paso { display:flex; flex-wrap:wrap; align-items:baseline; gap:6px 10px;
            padding:7px 0; font-size:13px; }
.pge-paso-titulo { flex:0 0 100%; color:var(--suave); font-size:12px; }
.pge-paso-formula { color:var(--tinta); }
.pge-paso-resultado { color:var(--tinta); font-weight:600; }
.pge-avisos { margin:14px 0 0; padding-left:17px; }
.pge-aviso { font-size:12.5px; line-height:1.5; margin-bottom:6px; }
.pge-aviso-alto { color:var(--rojo); }
.pge-aviso-medio { color:var(--ambar); }
.pge-doble { margin:14px 0 0; padding-top:13px; border-top:1px solid var(--linea);
             font-size:12.5px; color:var(--suave); line-height:1.5; }
.pge-ver-protocolo { display:block; margin-top:16px; background:none; border:none;
                     padding:0; font-family:inherit; font-size:13px;
                     color:var(--marino-alto); cursor:pointer; text-decoration:underline; }
.pge-ampolla { margin:0 0 14px; font-size:12.5px; color:var(--suave);
               padding:9px 12px; border-radius:8px; background:var(--campo);
               border:1px solid var(--linea); display:inline-block; }
.pge-preparacion { margin-bottom:16px; padding-bottom:14px;
                   border-bottom:1px solid var(--linea); }
.pge-prep-lista { margin:0 0 10px; padding-left:18px; }
.pge-prep-lista li { font-size:13px; line-height:1.6; margin-bottom:6px; color:var(--tinta); }
.pge-prep-clave { margin:0; padding:10px 12px; border-radius:8px;
                  background:var(--verde-suave); border:1px solid var(--verde-linea);
                  color:var(--verde); font-size:12.5px; line-height:1.45; }
.pge-efectos { margin-top:14px; }
.pge-monitoreo { margin:0; padding-left:17px; }
.pge-monitoreo li { font-size:13px; line-height:1.6; color:var(--tinta); }
.pge-efecto { padding:11px 0; border-top:1px solid var(--linea); }
.pge-efecto-cab { display:flex; justify-content:space-between; align-items:baseline;
                  gap:10px; margin-bottom:5px; }
.pge-efecto-nombre { font-size:14px; font-weight:600; color:var(--tinta); }
.pge-efecto-frec { flex-shrink:0; font-size:11px; color:var(--suave);
                   font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.pge-efecto-conducta { margin:0; padding-left:17px; }
.pge-efecto-conducta li { font-size:12.5px; line-height:1.55; color:var(--suave);
                          margin-bottom:3px; }
.pge-fuente { margin:16px 0 0; padding-top:12px; border-top:1px solid var(--linea);
              font-size:11.5px; color:var(--tenue); line-height:1.5; font-style:italic; }
.pge-protocolo { list-style:none; margin:14px 0 0; padding:0; }
.pge-protocolo-paso { display:flex; gap:12px; padding:12px 0;
                      border-top:1px solid var(--linea); }
.pge-protocolo-n { flex-shrink:0; width:24px; height:24px; border-radius:50%;
                   background:var(--marino-alto); color:#fff; font-size:12px;
                   display:flex; align-items:center; justify-content:center; }
.pge-protocolo-titulo { margin:2px 0 6px; font-size:14px; font-weight:600; color:var(--tinta); }
.pge-protocolo-puntos { margin:0; padding-left:16px; }
.pge-protocolo-puntos li { font-size:13px; line-height:1.55; color:var(--tinta-media, var(--suave));
                           margin-bottom:4px; }
`;
