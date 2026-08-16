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

export default function PanelAdmin({ usuario, onCerrarSesion }) {
  const [vistaActiva, setVistaActiva] = useState("doctores");

  // Estados para Doctores
  const [doctores, setDoctores] = useState([]);
  const [cargandoDoctores, setCargandoDoctores] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Estados para Log
  const [registros, setRegistros] = useState([]);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);

  // Estados Modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [cargandoForm, setCargandoForm] = useState(false);

  const cargarDoctores = async () => {
    setCargandoDoctores(true);
    const { data, error } = await supabase
      .from("perfiles")
      .select("*")
      .eq("rol", "doctor")
      .order("nombre", { ascending: true });

    if (!error && data) setDoctores(data);
    setCargandoDoctores(false);
  };

  const cargarRegistros = async () => {
    setCargandoRegistros(true);
    const { data, error } = await supabase
      .from("registro_ingresos")
      .select(`
        fecha_ingreso,
        doctor_id,
        perfiles!doctor_id (
          nombre,
          dni
        )
      `)
      .order("fecha_ingreso", { ascending: false })
      .limit(50);

    if (!error && data) {
      setRegistros(data);
    }
    setCargandoRegistros(false);
  };

  useEffect(() => {
    if (vistaActiva === "doctores") cargarDoctores();
    if (vistaActiva === "log") cargarRegistros();
  }, [vistaActiva]);

  const registrarDoctor = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: "", texto: "" });
    setCargandoForm(true);

    if (dni.length !== 8 || !/^\d{8}$/.test(dni)) {
      setMensaje({ tipo: "error", texto: "El DNI debe tener exactamente 8 dígitos numéricos." });
      setCargandoForm(false);
      return;
    }

    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length < 3 || !/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]{3,60}$/.test(nombreLimpio)) {
      setMensaje({ tipo: "error", texto: "El nombre solo debe contener letras y espacios (mínimo 3 caracteres, sin puntos ni guiones)." });
      setCargandoForm(false);
      return;
    }

    const email = `${dni}@cardioalerta.pe`;

    const { data, error } = await adminAuthClient.auth.signUp({
      email,
      password: contrasena,
      options: {
        data: {
          nombre: nombreLimpio,
          rol: "doctor"
        }
      }
    });

    if (error) {
      setCargandoForm(false);
      setMensaje({ tipo: "error", texto: "Error al crear: " + error.message });
      return;
    }

    if (data.user) {
      const { error: perfilError } = await supabase.from("perfiles").insert({
        id: data.user.id,
        dni: dni,
        nombre: nombreLimpio,
        rol: "doctor"
      });

      if (perfilError) {
        console.error("Error perfil:", perfilError);
      }
    }

    setCargandoForm(false);
    setMostrarModal(false);
    setDni("");
    setNombre("");
    setContrasena("");
    cargarDoctores();
  };

  const eliminarDoctor = async (id, nombreDoc) => {
    if (!window.confirm(`¿Estás seguro de que deseas revocar permanentemente el acceso del doctor ${nombreDoc}?`)) return;

    // Al eliminar el perfil, se bloquea el acceso gracias a la validación en authLocal.js
    const { error } = await supabase.from("perfiles").delete().eq("id", id);
    if (!error) {
      cargarDoctores();
    } else {
      alert("Error al eliminar doctor: " + error.message);
    }
  };

  const doctoresFiltrados = doctores.filter(d =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.dni.includes(busqueda)
  );

  return (
    <div className="admin-dashboard">
      <style>{CSS_ADMIN}</style>

      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Panel de Control</h2>
        </div>
        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${vistaActiva === "doctores" ? "active" : ""}`}
            onClick={() => setVistaActiva("doctores")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Personal Médico
          </button>

          <button
            className={`admin-nav-item ${vistaActiva === "log" ? "active" : ""}`}
            onClick={() => setVistaActiva("log")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Log de Accesos
          </button>
        </nav>

        {/* Footer del Sidebar con Info de Usuario y Botón Salir */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">A</div>
            <div className="admin-user-details">
              <span className="admin-user-name">{usuario?.nombre || "Administrador"}</span>
              <span className="admin-user-role">DNI: {usuario?.dni || "---"}</span>
            </div>
          </div>
          <button className="admin-btn-logout" onClick={onCerrarSesion}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="admin-content">
        {vistaActiva === "doctores" && (
          <div className="admin-panel fade-in">
            <div className="admin-toolbar">
              <button className="admin-btn-primary" onClick={() => setMostrarModal(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Añadir Nuevo
              </button>

              <div className="admin-search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  type="text"
                  placeholder="Buscar por DNI o Nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>DNI</th>
                    <th>Nombre Completo</th>
                    <th>Rol</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoDoctores ? (
                    <tr><td colSpan="4" style={{ textAlign: "center", padding: "30px" }}>Cargando doctores...</td></tr>
                  ) : doctoresFiltrados.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>No se encontraron registros.</td></tr>
                  ) : (
                    doctoresFiltrados.map((doc) => (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: "500" }}>{doc.dni}</td>
                        <td>{doc.nombre}</td>
                        <td>
                          <span className="admin-badge-rol">Doctor</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="admin-btn-action admin-btn-delete"
                            onClick={() => eliminarDoctor(doc.id, doc.nombre)}
                            title="Eliminar acceso"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="admin-table-footer">
                Resultados: {doctoresFiltrados.length} doctores
              </div>
            </div>
          </div>
        )}

        {vistaActiva === "log" && (
          <div className="admin-panel fade-in">
            <div className="admin-toolbar" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b" }}>Historial de Accesos</h2>
              <button className="admin-btn-secondary" onClick={cargarRegistros}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                Actualizar
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Doctor</th>
                    <th>DNI</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoRegistros ? (
                    <tr><td colSpan="3" style={{ textAlign: "center", padding: "30px" }}>Cargando registros...</td></tr>
                  ) : registros.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>No hay registros recientes.</td></tr>
                  ) : (
                    registros.map((reg, idx) => (
                      <tr key={idx}>
                        <td style={{ whiteSpace: "nowrap" }}>{new Date(reg.fecha_ingreso).toLocaleString('es-PE')}</td>
                        <td style={{ fontWeight: "500" }}>{reg.perfiles?.nombre || "Usuario Eliminado"}</td>
                        <td style={{ color: "#64748b" }}>{reg.perfiles?.dni || "---"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CREACION */}
      {mostrarModal && (
        <div className="admin-modal-overlay fade-in">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Registrar Nuevo Doctor</h3>
              <button className="admin-modal-close" onClick={() => { setMostrarModal(false); setMensaje({ tipo: "", texto: "" }); }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <form onSubmit={registrarDoctor} className="admin-form">
              <div className="admin-form-group">
                <label>DNI del Doctor</label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                  maxLength={8}
                  placeholder="Ej: 12345678"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, ""))}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Contraseña Temporal</label>
                <input
                  type="text"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>

              {mensaje.texto && (
                <div className={`admin-alert ${mensaje.tipo === "error" ? "error" : "success"}`}>
                  {mensaje.texto}
                </div>
              )}

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setMostrarModal(false)}>Cancelar</button>
                <button type="submit" className="admin-btn-primary" disabled={cargandoForm}>
                  {cargandoForm ? "Creando..." : "Crear Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS_ADMIN = `
  .admin-dashboard {
    display: flex;
    min-height: 100vh;
    width: 100%;
    background: #f8fafc;
    margin: 0;
    padding: 0;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .admin-sidebar {
    width: 260px;
    background: #0f172a;
    color: white;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .admin-sidebar-header {
    padding: 24px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }

  .admin-sidebar-header h2 {
    margin: 0;
    font-size: 1.1rem;
    color: #f8fafc;
    letter-spacing: 0.02em;
  }

  .admin-nav {
    padding: 20px 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .admin-nav-item {
    background: transparent;
    border: none;
    color: #94a3b8;
    padding: 12px 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .admin-nav-item:hover {
    background: rgba(255,255,255,0.05);
    color: white;
  }

  .admin-nav-item.active {
    background: #3b82f6;
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .admin-sidebar-footer {
    margin-top: auto;
    padding: 20px;
    border-top: 1px solid rgba(255,255,255,0.1);
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .admin-user-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .admin-avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.1rem;
    color: white;
  }

  .admin-user-details {
    display: flex;
    flex-direction: column;
  }

  .admin-user-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  .admin-user-role {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .admin-btn-logout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 10px;
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .admin-btn-logout:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
  }

  .admin-content {
    flex: 1;
    overflow-y: auto;
    padding: 30px;
    background: #f1f5f9;
  }

  .admin-panel {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
    overflow: hidden;
  }

  .admin-toolbar {
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .admin-search {
    position: relative;
    display: flex;
    align-items: center;
  }

  .admin-search svg {
    position: absolute;
    left: 12px;
    color: #94a3b8;
  }

  .admin-search input {
    padding: 10px 10px 10px 38px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    outline: none;
    width: 280px;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .admin-search input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  }

  .admin-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #3b82f6;
    color: white;
    border: none;
    padding: 10px 18px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.2s;
    box-shadow: 0 2px 4px rgba(59,130,246,0.2);
  }

  .admin-btn-primary:hover {
    background: #2563eb;
  }

  .admin-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: white;
    color: #334155;
    border: 1px solid #cbd5e1;
    padding: 9px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .admin-btn-secondary:hover {
    background: #f8fafc;
    border-color: #94a3b8;
  }

  .admin-table-container {
    width: 100%;
    overflow-x: auto;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .admin-table th {
    background: white;
    padding: 14px 24px;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    border-bottom: 1px solid #e2e8f0;
    font-weight: 600;
  }

  .admin-table td {
    padding: 16px 24px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    font-size: 0.95rem;
  }

  .admin-table tbody tr {
    transition: background 0.15s;
  }

  .admin-table tbody tr:hover {
    background: #f8fafc;
  }

  .admin-badge-rol {
    background: #dbeafe;
    color: #1e40af;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .admin-btn-action {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.2s;
    color: #94a3b8;
  }

  .admin-btn-delete:hover {
    background: #fef2f2;
    color: #ef4444;
  }

  .admin-table-footer {
    padding: 16px 24px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    color: #64748b;
    font-size: 0.85rem;
  }

  /* Modal */
  .admin-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .admin-modal {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 450px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .admin-modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .admin-modal-header h3 {
    margin: 0;
    font-size: 1.15rem;
    color: #0f172a;
  }

  .admin-modal-close {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
  }

  .admin-modal-close:hover {
    background: #f1f5f9;
    color: #334155;
  }

  .admin-form {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .admin-form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .admin-form-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
  }

  .admin-form-group input {
    padding: 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    outline: none;
    font-size: 0.95rem;
    transition: all 0.2s;
  }

  .admin-form-group input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  }

  .admin-alert {
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .admin-alert.error {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .admin-alert.success {
    background: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }

  .admin-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 10px;
  }

  .fade-in {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ========== MEDIA QUERIES RESPONSIVE (MOBILE & TABLET) ========== */
  @media (max-width: 850px) {
    .admin-dashboard {
      flex-direction: column;
      min-height: 100vh;
      width: 100%;
      overflow-x: hidden;
    }

    .admin-sidebar {
      width: 100%;
      flex-direction: column;
    }

    .admin-sidebar-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .admin-nav {
      flex-direction: row;
      padding: 8px 16px;
      overflow-x: auto;
      gap: 8px;
      -webkit-overflow-scrolling: touch;
    }

    .admin-nav-item {
      padding: 10px 14px;
      font-size: 0.88rem;
      white-space: nowrap;
      flex: 1;
      justify-content: center;
    }

    .admin-sidebar-footer {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
      gap: 10px;
    }

    .admin-btn-logout {
      width: auto;
      padding: 8px 14px;
      font-size: 0.82rem;
    }

    .admin-content {
      padding: 16px 12px;
      width: 100%;
      overflow-x: hidden;
    }

    .admin-toolbar {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
      padding: 16px;
    }

    .admin-search {
      width: 100%;
    }

    .admin-search input {
      width: 100%;
    }

    .admin-btn-primary {
      width: 100%;
      justify-content: center;
    }

    .admin-table th, .admin-table td {
      padding: 12px 14px;
      font-size: 0.85rem;
      white-space: nowrap;
    }

    .admin-modal {
      width: 92%;
      max-width: 420px;
      margin: 16px;
    }
  }
`;
