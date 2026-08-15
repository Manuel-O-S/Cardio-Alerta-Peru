import { useState } from "react";
import { hospitalesDeCiudad } from "./hospitales.js";
import TarjetaHospital from "./TarjetaHospital.jsx";

/**
 * Panel de hospitales para derivación.
 * Muestra las tarjetas disponibles y, al seleccionar uno, se muestra únicamente
 * el hospital elegido con las acciones de traslado y confirmación.
 */
export default function PanelDerivacionHospitales({ 
  ubicacionId, 
  lat, 
  lon, 
  ubicacion, 
  hospitalSeleccionado: hospitalProp,
  onHospitalSeleccionado 
}) {
  const [seleccionado, setSeleccionado] = useState(hospitalProp || null);
  const [derivacionConfirmada, setDerivacionConfirmada] = useState(false);

  const ciudadId = ubicacion?.id || ubicacionId;
  const latitude = ubicacion?.lat ?? lat;
  const longitude = ubicacion?.lon ?? lon;

  const hospitales = hospitalesDeCiudad(ciudadId, latitude, longitude);

  const handleSeleccionar = (h) => {
    setSeleccionado(h);
    setDerivacionConfirmada(false);
    onHospitalSeleccionado?.(h);
  };

  const handleCambiar = () => {
    setSeleccionado(null);
    setDerivacionConfirmada(false);
    onHospitalSeleccionado?.(null);
  };

  const handleConfirmarDerivacion = () => {
    setDerivacionConfirmada(true);
  };

  return (
    <div className="deriv-panel">
      <style>{CSS_DERIVACION}</style>
      
      <div className="deriv-cab-fila">
        <h3 className="deriv-titulo">
          {seleccionado ? "Hospital Seleccionado para Derivación" : "Hospitales disponibles para derivación"}
        </h3>
        {seleccionado && (
          <button type="button" className="deriv-btn-cambiar" onClick={handleCambiar}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Cambiar hospital
          </button>
        )}
      </div>

      {hospitales.length === 0 ? (
        <p className="deriv-sin-hospitales">
          No hay hospitales de derivación registrados para esta ciudad.
        </p>
      ) : seleccionado ? (
        <div className="deriv-seleccionado-contenedor">
          <TarjetaHospital
            hospital={seleccionado}
            seleccionado={true}
          />
          
          <div className="deriv-acciones-panel">
            <div className="deriv-botones-fila">
              <a
                className="deriv-btn-mapa"
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  seleccionado.nombre + ", " + seleccionado.direccion + ", Peru"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
                Abrir ruta de traslado en Mapa
              </a>

              {seleccionado.contacto && seleccionado.contacto !== "Central de Emergencias" && (
                <a
                  className="deriv-btn-telefono"
                  href={`tel:${seleccionado.contacto.replace(/[^\d+]/g, "")}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Llamar ({seleccionado.contacto})
                </a>
              )}
            </div>

            {!derivacionConfirmada ? (
              <button
                type="button"
                className="deriv-btn-confirmar"
                onClick={handleConfirmarDerivacion}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Confirmar y Derivar a este Centro
              </button>
            ) : (
              <div className="deriv-confirmado-aviso">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Derivación guardada y registrada para el caso</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="deriv-lista">
          {hospitales.map((h) => (
            <TarjetaHospital
              key={h.id}
              hospital={h}
              seleccionado={false}
              onSeleccionar={() => handleSeleccionar(h)}
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
  padding: 18px;
  background: var(--campo);
  border: 1px solid var(--linea);
  border-radius: 12px;
  animation: fadeInUp 0.4s ease-out both;
}

.deriv-cab-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.deriv-titulo {
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
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

.deriv-btn-cambiar {
  background: var(--carta-solida, #fff);
  border: 1.5px solid var(--linea);
  border-radius: 8px;
  padding: 6px 12px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--acento);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.deriv-btn-cambiar:hover {
  background: var(--acento-suave);
  border-color: var(--acento-linea);
  transform: translateY(-1px);
}

.deriv-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.deriv-seleccionado-contenedor {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.deriv-acciones-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.deriv-botones-fila {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.deriv-btn-mapa,
.deriv-btn-telefono {
  flex: 1;
  min-width: 180px;
  padding: 10px 14px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.deriv-btn-mapa {
  background: var(--carta-solida, #fff);
  border: 1.5px solid var(--acento-linea);
  color: var(--acento);
}

.deriv-btn-mapa:hover {
  background: var(--acento-suave);
  transform: translateY(-1px);
}

.deriv-btn-telefono {
  background: var(--carta-solida, #fff);
  border: 1.5px solid rgba(34, 197, 94, 0.3);
  color: #16a34a;
}

.deriv-btn-telefono:hover {
  background: rgba(34, 197, 94, 0.08);
  transform: translateY(-1px);
}

.deriv-btn-confirmar {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 10px rgba(22, 163, 74, 0.35);
  transition: all 0.2s ease;
}

.deriv-btn-confirmar:hover {
  background: linear-gradient(135deg, #15803d, #166534);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.45);
}

.deriv-confirmado-aviso {
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(22, 163, 74, 0.1);
  border: 1.5px solid rgba(22, 163, 74, 0.3);
  color: #15803d;
  font-size: 13.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: fadeInUp 0.3s ease;
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
