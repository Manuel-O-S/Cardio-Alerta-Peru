import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";

import { createClient } from "@supabase/supabase-js";

const adminAuthClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

/**
 * Panel Administrativo.
 * Solo accesible para usuarios con rol "admin".
 */
export default function PanelAdmin() {
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [cargando, setCargando] = useState(false);
  const [registros, setRegistros] = useState([]);
  
  const cargarRegistros = async () => {
    const { data, error } = await supabase
      .from("registro_ingresos")
      .select("fecha_ingreso, doctor_id")
      .order("fecha_ingreso", { ascending: false })
      .limit(20);
      
    if (!error && data) {
      setRegistros(data);
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, []);

  const registrarDoctor = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: "", texto: "" });
    setCargando(true);

    if (dni.length !== 8) {
      setMensaje({ tipo: "error", texto: "El DNI debe tener 8 dígitos." });
      setCargando(false);
      return;
    }
    
    const email = `${dni}@cardioalerta.pe`;
    
    // Usamos adminAuthClient en vez de supabase para no sobreescribir la sesión del admin
    const { data, error } = await adminAuthClient.auth.signUp({
      email,
      password: contrasena,
      options: {
        data: {
          nombre: nombre,
          rol: "doctor"
        }
      }
    });

    if (error) {
      setCargando(false);
      setMensaje({ tipo: "error", texto: "Error al crear: " + error.message });
      return;
    }

    // Insertar en la tabla perfiles
    if (data.user) {
      const { error: perfilError } = await supabase.from("perfiles").insert({
        id: data.user.id,
        dni: dni,
        nombre: nombre,
        rol: "doctor"
      });

      if (perfilError) {
        console.error("Error al crear el perfil:", perfilError);
        // No mostramos error fuerte porque el login igual intentará funcionar, 
        // pero idealmente se maneja con un trigger en la BD.
      }
    }

    setCargando(false);
    setMensaje({ tipo: "exito", texto: "Doctor creado correctamente." });
    setDni("");
    setNombre("");
    setContrasena("");
  };

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ color: "var(--marino)" }}>Panel Administrativo</h2>
      <p style={{ color: "var(--suave)", marginBottom: "30px" }}>
        Crea accesos para los doctores y revisa el historial de ingresos.
      </p>

      <div style={{ display: "grid", gap: "30px", gridTemplateColumns: "1fr 1fr" }}>
        {/* Formulario de creación */}
        <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid var(--linea)" }}>
          <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Registrar Nuevo Doctor</h3>
          
          <form onSubmit={registrarDoctor} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: 500 }}>
              DNI del Doctor
              <input 
                type="text" 
                value={dni} 
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                maxLength={8}
                required
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--linea)", outline: "none" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: 500 }}>
              Nombre Completo
              <input 
                type="text" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)}
                required
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--linea)", outline: "none" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: 500 }}>
              Contraseña Temporal
              <input 
                type="text" 
                value={contrasena} 
                onChange={(e) => setContrasena(e.target.value)}
                required
                minLength={6}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--linea)", outline: "none" }}
              />
            </label>

            {mensaje.texto && (
              <div style={{ 
                padding: "10px", 
                borderRadius: "6px", 
                fontSize: "14px",
                backgroundColor: mensaje.tipo === "error" ? "var(--rojo-suave)" : "rgba(34, 197, 94, 0.1)",
                color: mensaje.tipo === "error" ? "var(--rojo)" : "#166534"
              }}>
                {mensaje.texto}
              </div>
            )}

            <button 
              type="submit" 
              disabled={cargando}
              style={{ 
                background: "var(--acento)", color: "white", padding: "12px", 
                borderRadius: "6px", border: "none", fontWeight: 600, cursor: "pointer", marginTop: "10px" 
              }}
            >
              {cargando ? "Registrando..." : "Registrar Doctor"}
            </button>
          </form>
        </div>

        {/* Log de ingresos */}
        <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid var(--linea)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0 }}>Últimos Ingresos</h3>
            <button 
              onClick={cargarRegistros}
              style={{ background: "none", border: "none", color: "var(--acento)", cursor: "pointer", fontSize: "14px" }}
            >
              Refrescar
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {registros.length === 0 ? (
              <p style={{ color: "var(--tenue)", fontSize: "14px" }}>No hay registros recientes.</p>
            ) : (
              registros.map((reg, idx) => (
                <div key={idx} style={{ padding: "12px", background: "var(--campo)", borderRadius: "6px", fontSize: "13px" }}>
                  <div style={{ fontWeight: 600, color: "var(--tinta)" }}>
                    ID: {reg.doctor_id?.slice(0, 8)}...
                  </div>
                  <div style={{ color: "var(--suave)" }}>
                    {new Date(reg.fecha_ingreso).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
