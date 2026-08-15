import { useState, useEffect } from "react";
import { leerHistorial, marcarComoSincronizados, limpiarHistorial } from "./tamizaje/historialClinico.js";
import { supabase } from "./supabaseClient.js";
import { obtenerSesionAsync } from "./auth/authLocal.js";

export default function HistorialClinico() {
  const [historial, setHistorial] = useState([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  
  useEffect(() => {
    setHistorial(leerHistorial());
  }, []);

  const total = historial.length;
  const verdes = historial.filter(h => h.resultado === "verde").length;
  const amarillos = historial.filter(h => h.resultado === "amarillo").length;
  const rojos = historial.filter(h => h.resultado === "rojo").length;
  const pendientesCount = historial.filter(h => !h.sincronizado).length;

  const subirHistorial = async () => {
    setSincronizando(true);
    setMensaje({ tipo: "", texto: "" });
    
    try {
      const sesion = await obtenerSesionAsync();
      if (!sesion) throw new Error("Debes iniciar sesión para subir el historial.");

      const pendientes = historial.filter(h => !h.sincronizado);
      if (pendientes.length === 0) {
        setMensaje({ tipo: "exito", texto: "Todos los tamizajes ya se encuentran sincronizados en la nube." });
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
      setMensaje({ tipo: "exito", texto: `Se sincronizaron ${pendientes.length} registros exitosamente con Supabase.` });
    } catch (err) {
      setMensaje({ tipo: "error", texto: "Error al sincronizar: " + err.message });
    } finally {
      setSincronizando(false);
    }
  };

  const handleLimpiar = () => {
    if (!window.confirm("¿Estás seguro de que deseas vaciar el historial de este dispositivo?")) return;
    limpiarHistorial();
    setHistorial([]);
    setMensaje({ tipo: "exito", texto: "Historial local vaciado correctamente." });
  };

  return (
    <div style={{ padding: "24px 16px", maxWidth: "850px", margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
      {/* CABECERA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ color: "var(--marino, #0f172a)", margin: 0, fontSize: "22px", fontWeight: 700 }}>Historial Clínico de Tamizajes</h2>
          <p style={{ color: "var(--suave, #64748b)", margin: "4px 0 0 0", fontSize: "13.5px" }}>
            Registro y seguimiento de tamizajes neonatales realizados.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {total > 0 && (
            <button
              onClick={handleLimpiar}
              style={{
                background: "var(--campo, #f8fafc)", color: "var(--suave, #64748b)", padding: "9px 14px",
                borderRadius: "8px", border: "1px solid var(--linea, #e2e8f0)", fontWeight: 600, cursor: "pointer",
                fontSize: "13px"
              }}
            >
              Limpiar local
            </button>
          )}
          <button 
            onClick={subirHistorial}
            disabled={sincronizando || total === 0}
            style={{ 
              background: "linear-gradient(135deg, var(--acento, #3b82f6), #6366f1)", color: "white", padding: "9px 16px", 
              borderRadius: "8px", border: "none", fontWeight: 600, cursor: "pointer",
              display: "flex", gap: "8px", alignItems: "center", fontSize: "13px",
              boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)", opacity: (total === 0 || sincronizando) ? 0.6 : 1
            }}
          >
            {sincronizando ? "Subiendo..." : pendientesCount > 0 ? `Subir (${pendientesCount}) a Supabase` : "Sincronizado con Nube"}
            {!sincronizando && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* METRICAS / RESUMEN */}
      {total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "20px" }}>
          <div style={{ padding: "12px 14px", borderRadius: "10px", background: "white", border: "1px solid var(--linea, #e2e8f0)" }}>
            <div style={{ fontSize: "11.5px", color: "var(--suave, #64748b)", fontWeight: 600 }}>TOTAL EVALUADOS</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--tinta, #0f172a)", marginTop: "2px" }}>{total}</div>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(34, 197, 94, 0.06)", border: "1px solid rgba(34, 197, 94, 0.25)" }}>
            <div style={{ fontSize: "11.5px", color: "#15803d", fontWeight: 600 }}>🟢 SUPERADOS</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#16a34a", marginTop: "2px" }}>{verdes}</div>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(234, 179, 8, 0.06)", border: "1px solid rgba(234, 179, 8, 0.25)" }}>
            <div style={{ fontSize: "11.5px", color: "#a16207", fontWeight: 600 }}>🟡 POR REPETIR</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#d97706", marginTop: "2px" }}>{amarillos}</div>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
            <div style={{ fontSize: "11.5px", color: "#b91c1c", fontWeight: 600 }}>🔴 NO SUPERADOS</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#dc2626", marginTop: "2px" }}>{rojos}</div>
          </div>
        </div>
      )}

      {/* AVISOS Y MENSAJES */}
      {mensaje.texto && (
        <div style={{ 
          padding: "12px 16px", marginBottom: "16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
          backgroundColor: mensaje.tipo === "error" ? "var(--rojo-suave, #fef2f2)" : "rgba(34, 197, 94, 0.1)",
          border: mensaje.tipo === "error" ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(34, 197, 94, 0.3)",
          color: mensaje.tipo === "error" ? "var(--rojo, #dc2626)" : "#166534"
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* LISTA DE REGISTROS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {historial.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", background: "var(--campo, #f8fafc)", borderRadius: "12px", border: "1px dashed var(--linea, #e2e8f0)", color: "var(--suave, #64748b)" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px", opacity: 0.5 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            <p style={{ margin: 0, fontWeight: 500 }}>Aún no hay tamizajes registrados en este dispositivo.</p>
            <p style={{ margin: "4px 0 0", fontSize: "12.5px" }}>Al evaluar un recién nacido en la pestaña Tamizaje, se guardará aquí automáticamente.</p>
          </div>
        ) : (
          [...historial].reverse().map((h) => {
            const esVerde = h.resultado === "verde";
            const esAmarillo = h.resultado === "amarillo";
            const esRojo = h.resultado === "rojo";

            const etiquetaResultado = esVerde 
              ? "Tamizaje Superado" 
              : esAmarillo 
                ? "Repetir en 1 hora" 
                : "No Superado / Positivo";

            const colorBg = esVerde ? "#22c55e" : esAmarillo ? "#eab308" : "#dc2626";

            return (
              <div key={h.idLocal} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "white", borderRadius: "10px", border: "1.5px solid var(--linea, #e2e8f0)", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                  <div style={{ 
                    width: "12px", height: "12px", borderRadius: "50%",
                    background: colorBg, flexShrink: 0,
                    boxShadow: `0 0 8px ${colorBg}88`
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "var(--tinta, #0f172a)", fontSize: "14px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {h.paciente}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--suave, #64748b)", display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                      <span>{new Date(h.fecha).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}</span>
                      <span>·</span>
                      <strong style={{ color: esVerde ? "#16a34a" : esAmarillo ? "#d97706" : "#dc2626" }}>
                        {etiquetaResultado}
                      </strong>
                    </div>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ 
                    fontSize: "11.5px", fontWeight: 600, padding: "3px 9px", borderRadius: "20px", 
                    background: h.sincronizado ? "rgba(34, 197, 94, 0.1)" : "var(--campo, #f1f5f9)", 
                    color: h.sincronizado ? "#166534" : "var(--suave, #64748b)",
                    border: h.sincronizado ? "1px solid rgba(34, 197, 94, 0.25)" : "1px solid var(--linea, #e2e8f0)"
                  }}>
                    {h.sincronizado ? "✓ Sincronizado" : "⏳ Pendiente"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
