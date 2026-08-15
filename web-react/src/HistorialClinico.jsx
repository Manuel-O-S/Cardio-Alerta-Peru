import { useState, useEffect } from "react";
import { leerHistorial, marcarComoSincronizados } from "./tamizaje/historialClinico.js";
import { supabase } from "./supabaseClient.js";
import { obtenerSesionAsync } from "./auth/authLocal.js";

export default function HistorialClinico() {
  const [historial, setHistorial] = useState([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  
  useEffect(() => {
    setHistorial(leerHistorial());
  }, []);

  const subirHistorial = async () => {
    setSincronizando(true);
    setMensaje({ tipo: "", texto: "" });
    
    try {
      const sesion = await obtenerSesionAsync();
      if (!sesion) throw new Error("Debes iniciar sesi\u00F3n para subir el historial.");

      const pendientes = historial.filter(h => !h.sincronizado);
      if (pendientes.length === 0) {
        setMensaje({ tipo: "exito", texto: "El historial ya est\u00E1 sincronizado." });
        setSincronizando(false);
        return;
      }

      const filas = pendientes.map(p => ({
        doctor_id: sesion.id,
        paciente_nombre: p.paciente,
        resultado_color: p.resultado,
        fecha_tamizaje: p.fecha
      }));

      const { error } = await supabase.from("tamizajes").insert(filas);
      
      if (error) throw error;
      
      marcarComoSincronizados(pendientes.map(p => p.idLocal));
      setHistorial(leerHistorial());
      setMensaje({ tipo: "exito", texto: `Se sincronizaron ${pendientes.length} registros exitosamente.` });
    } catch (err) {
      setMensaje({ tipo: "error", texto: "Error al sincronizar: " + err.message });
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h2 style={{ color: "var(--marino)", margin: 0 }}>Historial Clínico</h2>
          <p style={{ color: "var(--suave)", margin: "4px 0 0 0" }}>Registro local de tamizajes realizados.</p>
        </div>
        <button 
          onClick={subirHistorial}
          disabled={sincronizando}
          style={{ 
            background: "var(--acento)", color: "white", padding: "10px 16px", 
            borderRadius: "8px", border: "none", fontWeight: 600, cursor: "pointer",
            display: "flex", gap: "8px", alignItems: "center"
          }}
        >
          {sincronizando ? "Subiendo..." : "Subir historial a Supabase"}
          {!sincronizando && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          )}
        </button>
      </div>

      {mensaje.texto && (
        <div style={{ 
          padding: "12px", marginBottom: "20px", borderRadius: "8px", fontSize: "14px",
          backgroundColor: mensaje.tipo === "error" ? "var(--rojo-suave)" : "rgba(34, 197, 94, 0.1)",
          color: mensaje.tipo === "error" ? "var(--rojo)" : "#166534"
        }}>
          {mensaje.texto}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {historial.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "var(--campo)", borderRadius: "12px", color: "var(--suave)" }}>
            Aún no hay tamizajes registrados en este dispositivo.
          </div>
        ) : (
          [...historial].reverse().map((h) => (
            <div key={h.idLocal} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "white", borderRadius: "12px", border: "1px solid var(--linea)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ 
                  width: "16px", height: "16px", borderRadius: "50%",
                  background: h.resultado === "rojo" ? "var(--rojo)" : h.resultado === "amarillo" ? "#eab308" : "#22c55e"
                }} />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--tinta)" }}>{h.paciente}</div>
                  <div style={{ fontSize: "12px", color: "var(--suave)" }}>{new Date(h.fecha).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: h.sincronizado ? "rgba(34, 197, 94, 0.1)" : "var(--campo)", color: h.sincronizado ? "#166534" : "var(--suave)" }}>
                {h.sincronizado ? "✓ Sincronizado" : "⏳ Pendiente"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
