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
    // Cada segundo: el contador tiene que correr de verdad, si no parece
    // que la aplicacion se colgo.
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const quitar = (id) => {
    eliminarCaso(id);
    recargar();
    onCambio?.();
  };

  if (casos.length === 0) {
    return (
      <section className="tz-card pend-vacio">
        <style>{CSS_PEND}</style>
        <div className="pend-vacio-icono">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 className="pend-vacio-titulo">Sin casos pendientes</h2>
        <p className="pend-vacio-desc">
          No hay casos esperando repetición. Cuando un tamizaje quede en
          "repetir", guárdalo acá para que no se pierda en el cambio de turno.
        </p>
      </section>
    );
  }

  return (
    <section className="tz-card">
      <style>{CSS_PEND}</style>
      <div className="tz-seccion-cab">
        <span className="pend-paso">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </span>
        <div>
          <h2 className="tz-seccion">Casos pendientes</h2>
          <p className="tz-seccion-desc">Guardados en este dispositivo — no es registro clínico</p>
        </div>
      </div>

      <ul className="pend-lista">
        {casos.map((c, i) => {
          const t = tiempoRestante(c, ahora);
          return (
            <li
              key={c.id}
              className={`pend-item ${t.vencido ? "pend-vencido" : ""}`}
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div className="pend-fila">
                <div className="pend-info">
                  <span className="pend-hc tz-mono">{c.historiaClinica}</span>
                  <p className="pend-datos">
                    Ronda {c.ronda} completada · corresponde ronda {c.proximaRonda} de 3
                    {c.altitudMsnm != null && ` · ${c.altitudMsnm} msnm`}
                  </p>
                </div>
                <span className={`pend-tiempo ${t.vencido ? "pend-tiempo-on" : ""}`}>
                  {t.vencido && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  )}
                  {t.vencido ? (
                    t.texto
                  ) : (
                    <>
                      <span className="pend-reloj tz-mono">{t.reloj}</span>
                      <span className="pend-reloj-nota">para reevaluar</span>
                    </>
                  )}
                </span>
              </div>
              <button type="button" className="pend-quitar" onClick={() => quitar(c.id)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
/* --- Empty state --- */
.pend-vacio {
  text-align: center;
  padding: 40px 24px !important;
}

.pend-vacio-icono {
  color: var(--tenue);
  opacity: 0.4;
  margin-bottom: 16px;
  animation: fadeInUp 0.5s var(--ease-out) both;
}

.pend-vacio-titulo {
  font-size: 17px;
  font-weight: 700;
  color: var(--tinta);
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}

.pend-vacio-desc {
  font-size: 13.5px;
  color: var(--suave);
  margin: 0;
  max-width: 340px;
  margin-inline: auto;
  line-height: 1.6;
}

/* --- Step icon --- */
.pend-paso {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--ambar), #b45309);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
}

/* --- List --- */
.pend-lista {
  list-style: none;
  margin: 0;
  padding: 0;
}

.pend-item {
  border: 1.5px solid var(--linea);
  border-radius: var(--radio-sm);
  padding: 14px 16px;
  margin-bottom: 10px;
  background: var(--campo);
  animation: fadeInUp 0.35s var(--ease-out) both;
  transition: all var(--dur-fast) ease;
}

.pend-item:hover {
  border-color: var(--linea-fuerte);
  box-shadow: var(--sombra-sm);
}

.pend-vencido {
  border-color: var(--rojo-linea) !important;
  background: var(--rojo-suave);
  animation: fadeInUp 0.35s var(--ease-out) both, glowPulse 3s ease-in-out infinite;
}

.pend-fila {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.pend-info { min-width: 0; flex: 1; }

.pend-hc {
  font-size: 15px;
  font-weight: 600;
  color: var(--tinta);
  display: block;
  margin-bottom: 4px;
}

.pend-tiempo {
  font-size: 12px;
  color: var(--suave);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--radio-pill);
  background: var(--campo);
  border: 1px solid var(--linea);
  font-weight: 500;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.pend-reloj { font-size:16px; font-weight:600; letter-spacing:.02em;
             font-variant-numeric: tabular-nums; }
.pend-reloj-nota { font-size:11px; opacity:.75; }
.pend-tiempo-on {
  color: var(--rojo);
  font-weight: 700;
  background: var(--rojo-suave);
  border-color: var(--rojo-linea);
}

.pend-datos {
  margin: 0;
  font-size: 12.5px;
  color: var(--suave);
  line-height: 1.45;
}

.pend-quitar {
  background: none;
  border: none;
  padding: 0;
  font-family: 'Inter', inherit;
  font-size: 12.5px;
  color: var(--tenue);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: color var(--dur-fast) ease;
}

.pend-quitar:hover {
  color: var(--rojo);
}
`;
