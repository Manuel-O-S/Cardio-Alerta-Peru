import { EXAMENES_LABELS } from "./hospitales.js";

/**
 * Tarjeta visual de un hospital dentro del panel de derivación.
 * Muestra nombre, profesionales disponibles, exámenes (verde/rojo),
 * dirección, contacto y botón "Seleccionar para derivar".
 */
export default function TarjetaHospital({ hospital, seleccionado, onSeleccionar }) {
  const { nombre, profesionales, examenes, direccion, contacto } = hospital;
  const todosDisponibles = profesionales.disponibles === profesionales.total;

  return (
    <div className={`hosp-tarjeta ${seleccionado ? "hosp-tarjeta-seleccionada" : ""}`}>
      <style>{CSS_HOSP}</style>

      {/* Cabecera: icono + nombre */}
      <div className="hosp-cab">
        <span className={`hosp-icono ${seleccionado ? "hosp-icono-sel" : ""}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-4h6v4" /><path d="M10 10h1" /><path d="M14 10h-1" />
            <path d="M10 14h1" /><path d="M14 14h-1" />
          </svg>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
            <h4 className="hosp-nombre">{nombre}</h4>
            {hospital.nivel && (
              <span className="hosp-nivel-badge">
                {hospital.nivel}
              </span>
            )}
            {hospital.iafas && (
              <span className={`hosp-iafas-badge hosp-iafas-${hospital.iafas.toLowerCase().includes("essalud") ? "essalud" : hospital.iafas.toLowerCase().includes("privado") ? "privado" : "minsa"}`}>
                {hospital.iafas}
              </span>
            )}
          </div>
          {seleccionado && (
            <span className="hosp-chip-sel">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Hospital Seleccionado
            </span>
          )}
        </div>
      </div>

      {/* Profesionales */}
      <div className="hosp-fila-info">
        <span className="hosp-info-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Profesionales
        </span>
        <span className={`hosp-badge ${todosDisponibles ? "hosp-badge-ok" : "hosp-badge-parcial"}`}>
          {profesionales.disponibles}/{profesionales.total}
        </span>
      </div>

      {/* Exámenes y procedimientos disponibles */}
      <div className="hosp-examenes">
        <span className="hosp-examenes-titulo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          Exámenes y procedimientos disponibles
        </span>
        <ul className="hosp-examenes-lista">
          {Object.entries(EXAMENES_LABELS).map(([clave, label]) => (
            <li key={clave} className="hosp-examen-item">
              <span className={`hosp-examen-dot ${examenes[clave] ? "hosp-dot-ok" : "hosp-dot-no"}`}>
                {examenes[clave] ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </span>
              <span className={examenes[clave] ? "hosp-examen-ok" : "hosp-examen-no"}>
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Dirección y contacto */}
      <div className="hosp-pie">
        <div className="hosp-dato">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{direccion}</span>
        </div>
        <div className="hosp-dato">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>{contacto}</span>
        </div>
      </div>

      {/* Botón seleccionar */}
      {!seleccionado && onSeleccionar && (
        <button type="button" className="hosp-seleccionar" onClick={onSeleccionar}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Seleccionar para derivar
        </button>
      )}
    </div>
  );
}

const CSS_HOSP = `
/* ========== TARJETA HOSPITAL ========== */
.hosp-tarjeta {
  background: var(--carta-solida, #fff);
  border: 1.5px solid var(--linea);
  border-radius: var(--radio-sm, 10px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all var(--dur-fast, 0.15s) var(--ease-out, ease);
  animation: fadeInUp 0.3s var(--ease-out, ease) both;
}

.hosp-tarjeta:hover {
  border-color: var(--acento-linea);
  box-shadow: var(--sombra-md);
}

.hosp-tarjeta-seleccionada {
  border: 2px solid #16a34a !important;
  background: linear-gradient(to bottom, rgba(22, 163, 74, 0.03), var(--carta-solida, #fff)) !important;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.15) !important;
}

/* --- Cabecera --- */
.hosp-cab {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.hosp-icono {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--acento-suave), rgba(99, 102, 241, 0.1));
  border: 1px solid var(--acento-linea);
  color: var(--acento);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hosp-icono-sel {
  background: rgba(22, 163, 74, 0.12) !important;
  border-color: rgba(22, 163, 74, 0.3) !important;
  color: #16a34a !important;
}

.hosp-nombre {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--tinta);
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.hosp-chip-sel {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
  background: rgba(22, 163, 74, 0.1);
  padding: 2px 8px;
  border-radius: 20px;
}

.hosp-nivel-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  letter-spacing: 0.02em;
  font-family: 'JetBrains Mono', monospace;
  background: rgba(14, 165, 233, 0.1);
  color: #0284c7;
  border: 1px solid rgba(14, 165, 233, 0.25);
}

.hosp-iafas-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  font-family: 'JetBrains Mono', monospace;
}

.hosp-iafas-minsa {
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.25);
}

.hosp-iafas-essalud {
  background: rgba(99, 102, 241, 0.08);
  color: #4f46e5;
  border: 1px solid rgba(99, 102, 241, 0.25);
}

.hosp-iafas-privado {
  background: rgba(168, 85, 247, 0.08);
  color: #9333ea;
  border: 1px solid rgba(168, 85, 247, 0.25);
}

/* --- Profesionales --- */
.hosp-fila-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.hosp-info-label {
  font-size: 12px;
  color: var(--suave);
  display: flex;
  align-items: center;
  gap: 5px;
}

.hosp-badge {
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--radio-pill, 100px);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.hosp-badge-ok {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.hosp-badge-parcial {
  background: var(--ambar-suave, #fffbeb);
  color: var(--ambar, #d97706);
  border: 1px solid var(--ambar-linea, rgba(245, 158, 11, 0.25));
}

/* --- Exámenes --- */
.hosp-examenes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hosp-examenes-titulo {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--suave);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 5px;
}

.hosp-examenes-lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.hosp-examen-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
}

.hosp-examen-dot {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hosp-dot-ok {
  background: #16a34a;
  color: #fff;
}

.hosp-dot-no {
  background: #dc2626;
  color: #fff;
}

.hosp-examen-ok {
  color: var(--tinta);
  font-weight: 500;
}

.hosp-examen-no {
  color: var(--tenue);
  text-decoration: line-through;
  text-decoration-color: rgba(220, 38, 38, 0.4);
}

/* --- Pie: dirección y contacto --- */
.hosp-pie {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--linea);
}

.hosp-dato {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11.5px;
  color: var(--suave);
  line-height: 1.4;
}

.hosp-dato svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* --- Botón seleccionar --- */
.hosp-seleccionar {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: var(--radio-sm, 10px);
  background: linear-gradient(135deg, var(--acento, #3b82f6), #6366f1);
  color: #fff;
  font-family: 'Inter', inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all var(--dur-fast, 0.15s) ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.hosp-seleccionar:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.hosp-seleccionar:active {
  transform: translateY(0);
}
`;

