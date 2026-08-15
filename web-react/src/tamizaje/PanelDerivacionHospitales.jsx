import { hospitalesDeCiudad } from "./hospitales.js";
import TarjetaHospital from "./TarjetaHospital.jsx";

/**
 * Panel desplegable de hospitales para usar al momento de la derivaci\u00F3n
 * (resultado Amarillo o Rojo).
 * Muestra las tarjetas de hospitales correspondientes a la ciudad actual.
 */
export default function PanelDerivacionHospitales({ ubicacionId, onHospitalSeleccionado }) {
  if (!ubicacionId) return null;
  
  const hospitales = hospitalesDeCiudad(ubicacionId);

  return (
    <div className="deriv-panel">
      <style>{CSS_DERIVACION}</style>
      <h3 className="deriv-titulo">Hospitales disponibles para derivación</h3>
      {hospitales.length === 0 ? (
        <p className="deriv-sin-hospitales">
          No hay hospitales de derivación registrados para esta ciudad.
        </p>
      ) : (
        <div className="deriv-lista">
          {hospitales.map((h) => (
            <TarjetaHospital
              key={h.id}
              hospital={h}
              onSeleccionar={() => onHospitalSeleccionado?.(h)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const CSS_DERIVACION = `
.deriv-panel {
  margin-top: 24px;
  padding: 16px;
  background: var(--campo);
  border: 1px solid var(--linea);
  border-radius: 12px;
  animation: fadeInUp 0.4s ease-out both;
}

.deriv-titulo {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--tinta);
  display: flex;
  align-items: center;
  gap: 8px;
}

.deriv-titulo::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--rojo);
}

.deriv-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.deriv-sin-hospitales {
  margin: 0;
  padding: 14px;
  text-align: center;
  font-size: 13px;
  color: var(--tenue);
  background: white;
  border-radius: 8px;
  border: 1px dashed var(--linea);
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
`;
