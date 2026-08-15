import { useState, useMemo, useEffect } from "react";
import { hospitalesDeCiudad } from "./hospitales.js";
import {
  guardarBackupHospitales,
  leerBackupHospitales,
  guardarHospitalSeleccionadoOffline,
  leerHospitalSeleccionadoOffline,
} from "./backupHospitales.js";
import TarjetaHospital from "./TarjetaHospital.jsx";

/**
 * Panel de hospitales para derivación con Respaldo Offline Automático (cada 30 min).
 * Agrupa los hospitales por tipo de aseguradora (MINSA / SIS, EsSalud, Privado)
 * y almacena una copia de seguridad en memoria local para emergencias sin internet.
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
  const [filtroSeguro, setFiltroSeguro] = useState("todos");
  const [estaOffline, setEstaOffline] = useState(!navigator.onLine);
  const [ultimoBackup, setUltimoBackup] = useState(null);

  const ciudadId = ubicacion?.id || ubicacionId;
  const latitude = ubicacion?.lat ?? lat;
  const longitude = ubicacion?.lon ?? lon;

  // Escuchar estado de conexión de red
  useEffect(() => {
    const handleOnline = () => setEstaOffline(false);
    const handleOffline = () => setEstaOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Obtener hospitales con fallback de backup local
  const hospitales = useMemo(() => {
    const lista = hospitalesDeCiudad(ciudadId, latitude, longitude);
    if (lista && lista.length > 0) {
      return lista;
    }
    // Si no hay red o está vacío, consultar backup local
    const backup = leerBackupHospitales(ciudadId);
    if (backup && backup.hospitales?.length > 0) {
      return backup.hospitales;
    }
    return [];
  }, [ciudadId, latitude, longitude]);

  // Recuperar hospital previamente seleccionado si se refresca sin conexión
  useEffect(() => {
    if (!seleccionado) {
      const guardado = leerHospitalSeleccionadoOffline();
      if (guardado?.hospital) {
        setSeleccionado(guardado.hospital);
      }
    }
  }, []);

  // Guardado de Backup automático inicial y periódico cada 30 minutos
  useEffect(() => {
    if (hospitales && hospitales.length > 0) {
      guardarBackupHospitales(ciudadId, hospitales);
      setUltimoBackup(new Date());
    }

    // Intervalo de backup cada 30 minutos (1800000 ms)
    const intervaloBackup = setInterval(() => {
      if (hospitales && hospitales.length > 0) {
        guardarBackupHospitales(ciudadId, hospitales);
        setUltimoBackup(new Date());
        console.log("CardioAlerta: Copia de seguridad de hospitales actualizada (cada 30 min).");
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(intervaloBackup);
  }, [ciudadId, hospitales]);

  // Conteo por tipo de aseguradora
  const minsaHosp = useMemo(
    () => hospitales.filter((h) => (h.iafas || "").includes("MINSA") || (h.iafas || "").includes("SIS")),
    [hospitales]
  );
  const essaludHosp = useMemo(
    () => hospitales.filter((h) => (h.iafas || "").includes("EsSalud")),
    [hospitales]
  );
  const privadoHosp = useMemo(
    () => hospitales.filter((h) => (h.iafas || "").includes("Privado")),
    [hospitales]
  );

  const handleSeleccionar = (h) => {
    setSeleccionado(h);
    setDerivacionConfirmada(false);
    guardarHospitalSeleccionadoOffline(h);
    onHospitalSeleccionado?.(h);
  };

  const handleCambiar = () => {
    setSeleccionado(null);
    setDerivacionConfirmada(false);
    guardarHospitalSeleccionadoOffline(null);
    onHospitalSeleccionado?.(null);
  };

  const handleConfirmarDerivacion = () => {
    setDerivacionConfirmada(true);
    if (seleccionado) {
      guardarHospitalSeleccionadoOffline(seleccionado);
    }
  };

  const gruposParaMostrar = useMemo(() => {
    if (filtroSeguro === "minsa") {
      return [{ titulo: "Hospitales MINSA / SIS", lista: minsaHosp, clase: "minsa" }];
    }
    if (filtroSeguro === "essalud") {
      return [{ titulo: "Hospitales EsSalud", lista: essaludHosp, clase: "essalud" }];
    }
    if (filtroSeguro === "privado") {
      return [{ titulo: "Clínicas y Centros Privados", lista: privadoHosp, clase: "privado" }];
    }
    // Todos agrupados
    const res = [];
    if (minsaHosp.length > 0) {
      res.push({ titulo: "Hospitales MINSA / SIS", lista: minsaHosp, clase: "minsa" });
    }
    if (essaludHosp.length > 0) {
      res.push({ titulo: "Hospitales EsSalud", lista: essaludHosp, clase: "essalud" });
    }
    if (privadoHosp.length > 0) {
      res.push({ titulo: "Clínicas Privadas", lista: privadoHosp, clase: "privado" });
    }
    return res;
  }, [filtroSeguro, minsaHosp, essaludHosp, privadoHosp]);

  return (
    <div className="deriv-panel">
      <style>{CSS_DERIVACION}</style>
      
      <div className="deriv-cab-fila">
        <h3 className="deriv-titulo">
          {seleccionado ? "Hospital Seleccionado para Derivación" : "Hospitales disponibles para derivación"}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {estaOffline && (
            <span className="deriv-badge-offline" title="Copia de seguridad local activa">
              <span className="deriv-punto-offline"></span>
              Modo Offline (Backup)
            </span>
          )}
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
      </div>

      {estaOffline && (
        <div className="deriv-aviso-backup">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>
            <strong>Sin conexión a internet:</strong> Mostrando hospitales y teléfonos desde la copia de seguridad local (auto-guardada cada 30 min).
          </span>
        </div>
      )}

      {!seleccionado && hospitales.length > 0 && (
        <div className="deriv-filtros-iafas">
          <span className="deriv-filtro-etq">Aseguradora:</span>
          <div className="deriv-chips-wrap">
            <button
              type="button"
              className={`deriv-chip ${filtroSeguro === "todos" ? "deriv-chip-activo" : ""}`}
              onClick={() => setFiltroSeguro("todos")}
            >
              Todos ({hospitales.length})
            </button>
            {minsaHosp.length > 0 && (
              <button
                type="button"
                className={`deriv-chip ${filtroSeguro === "minsa" ? "deriv-chip-activo-minsa" : ""}`}
                onClick={() => setFiltroSeguro("minsa")}
              >
                MINSA / SIS ({minsaHosp.length})
              </button>
            )}
            {essaludHosp.length > 0 && (
              <button
                type="button"
                className={`deriv-chip ${filtroSeguro === "essalud" ? "deriv-chip-activo-essalud" : ""}`}
                onClick={() => setFiltroSeguro("essalud")}
              >
                EsSalud ({essaludHosp.length})
              </button>
            )}
            {privadoHosp.length > 0 && (
              <button
                type="button"
                className={`deriv-chip ${filtroSeguro === "privado" ? "deriv-chip-activo-privado" : ""}`}
                onClick={() => setFiltroSeguro("privado")}
              >
                Privado ({privadoHosp.length})
              </button>
            )}
          </div>
        </div>
      )}

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
        <div className="deriv-grupos-contenedor">
          {gruposParaMostrar.map((grupo) => (
            <div key={grupo.titulo} className="deriv-grupo-seccion">
              <div className={`deriv-grupo-cab deriv-grupo-cab-${grupo.clase}`}>
                <span className="deriv-grupo-icono">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" /><path d="M10 10h1" /><path d="M14 10h-1" />
                  </svg>
                </span>
                <span className="deriv-grupo-titulo">{grupo.titulo}</span>
                <span className="deriv-grupo-conteo">({grupo.lista.length})</span>
              </div>
              <div className="deriv-lista">
                {grupo.lista.map((h) => (
                  <TarjetaHospital
                    key={h.id}
                    hospital={h}
                    seleccionado={false}
                    onSeleccionar={() => handleSeleccionar(h)}
                  />
                ))}
              </div>
            </div>
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

.deriv-badge-offline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.deriv-punto-offline {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d97706;
  animation: pulsoOffline 2s infinite;
}

@keyframes pulsoOffline {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.2); }
}

.deriv-aviso-backup {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin-bottom: 14px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-size: 12.5px;
  line-height: 1.4;
  animation: fadeInUp 0.3s ease-out;
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

.deriv-filtros-iafas {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.deriv-filtro-etq {
  font-size: 12px;
  font-weight: 700;
  color: var(--suave);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.deriv-chips-wrap {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.deriv-chip {
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid var(--linea);
  background: var(--carta-solida, #fff);
  color: var(--suave);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.deriv-chip:hover {
  border-color: var(--acento-linea);
  color: var(--acento);
}

.deriv-chip-activo {
  background: var(--tinta, #0f172a) !important;
  color: #fff !important;
  border-color: var(--tinta, #0f172a) !important;
}

.deriv-chip-activo-minsa {
  background: #2563eb !important;
  color: #fff !important;
  border-color: #2563eb !important;
}

.deriv-chip-activo-essalud {
  background: #4f46e5 !important;
  color: #fff !important;
  border-color: #4f46e5 !important;
}

.deriv-chip-activo-privado {
  background: #9333ea !important;
  color: #fff !important;
  border-color: #9333ea !important;
}

.deriv-grupos-contenedor {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.deriv-grupo-seccion {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.deriv-grupo-cab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
}

.deriv-grupo-cab-minsa {
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  border-left: 3px solid #2563eb;
}

.deriv-grupo-cab-essalud {
  background: rgba(99, 102, 241, 0.08);
  color: #4338ca;
  border-left: 3px solid #4f46e5;
}

.deriv-grupo-cab-privado {
  background: rgba(168, 85, 247, 0.08);
  color: #7e22ce;
  border-left: 3px solid #9333ea;
}

.deriv-grupo-icono {
  font-size: 14px;
}

.deriv-grupo-titulo {
  flex: 1;
}

.deriv-grupo-conteo {
  font-size: 11.5px;
  opacity: 0.8;
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
