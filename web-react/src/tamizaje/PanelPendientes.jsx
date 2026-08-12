import { useEffect, useState } from "react";
import { casosVigentes, eliminarCaso, tiempoRestante } from "./casosPendientes.js";

/**
 * Casos que quedaron en "repetir" y todavia no se repitieron.
 *
 * Se refresca cada 30 s para que el contador de tiempo no quede congelado
 * mientras la pantalla esta abierta.
 */
export default function PanelPendientes({ onCambio }) {
  const [casos, setCasos] = useState([]);
  const [ahora, setAhora] = useState(Date.now());

  const recargar = () => setCasos(casosVigentes());

  useEffect(() => {
    recargar();
    const t = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const quitar = (id) => {
    eliminarCaso(id);
    recargar();
    onCambio?.();
  };

  if (casos.length === 0) {
    return (
      <section className="tz-card">
        <h2 className="tz-seccion">Casos pendientes</h2>
        <p className="tz-explica" style={{ margin: 0 }}>
          No hay casos esperando repeticion. Cuando un tamizaje quede en
          "repetir", guardalo aca para que no se pierda en el cambio de turno.
        </p>
      </section>
    );
  }

  return (
    <section className="tz-card">
      <style>{CSS_PEND}</style>
      <h2 className="tz-seccion">Casos pendientes</h2>
      <p className="tz-explica">
        Guardados en este dispositivo. No es un registro clinico: la historia
        del paciente sigue siendo la del establecimiento.
      </p>

      <ul className="pend-lista">
        {casos.map((c) => {
          const t = tiempoRestante(c, ahora);
          return (
            <li key={c.id} className={`pend-item ${t.vencido ? "pend-vencido" : ""}`}>
              <div className="pend-fila">
                <span className="pend-hc tz-mono">{c.historiaClinica}</span>
                <span className={`pend-tiempo ${t.vencido ? "pend-tiempo-on" : ""}`}>
                  {t.texto}
                </span>
              </div>
              <p className="pend-datos">
                Ronda {c.ronda} completada · corresponde ronda {c.proximaRonda} de 3
                {c.altitudMsnm != null && ` · ${c.altitudMsnm} msnm`}
              </p>
              <button type="button" className="pend-quitar" onClick={() => quitar(c.id)}>
                Quitar de la lista
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const CSS_PEND = `
.pend-lista { list-style:none; margin:0; padding:0; }
.pend-item { border:1px solid var(--linea); border-radius:10px; padding:13px;
             margin-bottom:10px; background:var(--campo); }
.pend-vencido { border-color:var(--rojo-linea); background:var(--rojo-suave); }
.pend-fila { display:flex; justify-content:space-between; align-items:center;
             gap:10px; margin-bottom:5px; }
.pend-hc { font-size:14.5px; font-weight:500; }
.pend-tiempo { font-size:12.5px; color:var(--suave); flex-shrink:0; }
.pend-tiempo-on { color:var(--rojo); font-weight:600; }
.pend-datos { margin:0 0 9px; font-size:12.5px; color:var(--suave); line-height:1.45; }
.pend-quitar { background:none; border:none; padding:0; font-family:inherit;
               font-size:12.5px; color:var(--suave); cursor:pointer;
               text-decoration:underline; }
`;
