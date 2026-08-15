import { useEffect, useState } from "react";
import FormularioTamizaje from "./tamizaje/FormularioTamizaje.jsx";
import PanelPendientes from "./tamizaje/PanelPendientes.jsx";
import { casosVigentes } from "./tamizaje/casosPendientes.js";
import { VERSION_UMBRALES } from "./tamizaje/motorTamizaje.js";
import { obtenerSesionAsync, cerrarSesion, onAuthStateChange } from "./auth/authLocal.js";
import PantallaLogin from "./auth/PantallaLogin.jsx";
import PanelAdmin from "./admin/PanelAdmin.jsx";
import HistorialClinico from "./HistorialClinico.jsx";

/**
 * Cascaron de la aplicacion.
 *
 * Incluye autenticacion local hospitalaria:
 * - Si no hay sesion: muestra Login / Registro / Recuperar contrasena
 * - Si hay sesion: muestra la aplicacion (Tamizaje / Pendientes) y boton de cerrar sesion
 */
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  const [vista, setVista] = useState("tamizaje");
  const [pendientes, setPendientes] = useState(0);
  // Caso que se retoma desde la pestaña de pendientes. Cambia de vista y
  // precarga el formulario con lo que no varia entre rondas.
  const [casoARetomar, setCasoARetomar] = useState(null);
  const [enLinea, setEnLinea] = useState(navigator.onLine);

  const refrescarPendientes = () => setPendientes(casosVigentes().length);

  useEffect(() => {
    let suscripcion;

    // Obtener sesión inicial
    obtenerSesionAsync().then((user) => {
      setUsuario(user);
      setCargandoAuth(false);
    });

    // Escuchar cambios de sesión (login, logout)
    suscripcion = onAuthStateChange((user) => {
      setUsuario(user);
      setCargandoAuth(false);
    });

    const alCambiarConexion = () => setEnLinea(navigator.onLine);
    window.addEventListener("online", alCambiarConexion);
    window.addEventListener("offline", alCambiarConexion);

    return () => {
      if (suscripcion) suscripcion.unsubscribe();
      window.removeEventListener("online", alCambiarConexion);
      window.removeEventListener("offline", alCambiarConexion);
    };
  }, []);

  useEffect(() => {
    if (usuario) {
      refrescarPendientes();
    }
  }, [usuario]);

  if (cargandoAuth) {
    return <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>Cargando...</div>;
  }

  // Si no ha iniciado sesion, renderizar pantalla de login
  if (!usuario) {
    return <PantallaLogin onLogin={(u) => setUsuario(u)} />;
  }

  const alCerrarSesion = async () => {
    await cerrarSesion();
    setUsuario(null);
  };

  // === RENDERIZADO EXCLUSIVO PARA ADMINISTRADORES ===
  if (usuario.rol === "admin") {
    return <PanelAdmin usuario={usuario} onCerrarSesion={alCerrarSesion} />;
  }

  // === RENDERIZADO PARA DOCTORES ===
  return (
    <div className="app">
      <style>{CSS_APP}</style>

      <header className="app-cab">
        <div className="app-cab-fondo"></div>
        <div className="app-cab-contenido">
          <div className="app-cab-fila">
            <div className="app-marca">
              <div className="app-logo">
                <svg viewBox="0 0 40 40" className="app-logo-svg" aria-hidden="true">
                  <defs>
                    <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff6b6b" />
                      <stop offset="100%" stopColor="#ee5a24" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M20 35 C10 25, 2 18, 2 12 C2 6, 7 2, 12 2 C15.5 2, 18.5 4, 20 7 C21.5 4, 24.5 2, 28 2 C33 2, 38 6, 38 12 C38 18, 30 25, 20 35Z"
                    fill="url(#hg)"
                  />
                  <path
                    className="app-ecg"
                    d="M6 20 L13 20 L15 14 L17 26 L19 16 L21 24 L23 20 L34 20"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h1 className="app-titulo">Cardio Alerta Perú</h1>
                <p className="app-sub">Tamizaje neonatal por oximetría de pulso</p>
              </div>
            </div>

            <div className="app-cab-derecha">
              <div className="app-usuario-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="app-usuario-nombre" title={`DNI: ${usuario.dni}`}>
                  {usuario.nombre}
                </span>
                <button
                  type="button"
                  className="app-btn-logout"
                  onClick={alCerrarSesion}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Salir</span>
                </button>
              </div>

              <div className="app-estado">
                {enLinea ? (
                  <span className="app-online">
                    <span className="app-dot app-dot-ok"></span>
                    En línea
                  </span>
                ) : (
                  <span className="app-offline">
                    <span className="app-dot app-dot-no"></span>
                    Sin conexión
                  </span>
                )}
              </div>
            </div>
          </div>

          <nav className="app-tabs" aria-label="Secciones">
            <button
              type="button"
              className={`app-tab ${vista === "tamizaje" ? "app-tab-on" : ""}`}
              onClick={() => setVista("tamizaje")}
              aria-current={vista === "tamizaje"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1 2-2h11" />
              </svg>
              Tamizaje
            </button>

            <button
              type="button"
              className={`app-tab ${vista === "pendientes" ? "app-tab-on" : ""}`}
              onClick={() => {
                refrescarPendientes();
                setVista("pendientes");
              }}
              aria-current={vista === "pendientes"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Pendientes
              {pendientes > 0 && <span className="app-badge">{pendientes}</span>}
            </button>

            <button
              type="button"
              className={`app-tab ${vista === "historial" ? "app-tab-on" : ""}`}
              onClick={() => setVista("historial")}
              aria-current={vista === "historial"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
              </svg>
              Historial
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {vista === "historial" ? (
          <HistorialClinico />
        ) : vista === "tamizaje" ? (
          <FormularioTamizaje
            onCasoGuardado={refrescarPendientes}
            casoARetomar={casoARetomar}
            onCasoRetomado={() => setCasoARetomar(null)}
          />
        ) : (
          <PanelPendientes
            onCambio={refrescarPendientes}
            onRetomar={(caso) => {
              setCasoARetomar(caso);
              setVista("tamizaje");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}
      </main>

      <footer className="app-pie">
        <div className="app-pie-linea"></div>
        <p>
          Herramienta de apoyo al tamizaje. No sustituye el diagnóstico ni el
          criterio del médico especialista.
        </p>
        <p className="app-pie-tec">
          <span className="app-pie-dot"></span>
          Umbrales versión {VERSION_UMBRALES}
        </p>
      </footer>
    </div>
  );
}

const CSS_APP = `
/* ========== RESET & DESIGN TOKENS ========== */
:root {
  color-scheme: light;

  /* --- Surfaces --- */
  --fondo:       #f0f4f8;
  --fondo-sutil: #e8edf3;
  --carta:       rgba(255, 255, 255, 0.82);
  --carta-solida: #ffffff;
  --campo:       #f4f7fa;
  --linea:       rgba(148, 163, 184, 0.2);
  --linea-fuerte:rgba(148, 163, 184, 0.35);

  /* --- Text --- */
  --tinta:       #0f172a;
  --tinta-media: #334155;
  --suave:       #64748b;
  --tenue:       #94a3b8;

  /* --- Brand: deep navy → warm accent --- */
  --marino:      #0f172a;
  --marino-alto: #1e293b;
  --marino-claro:#334155;
  --acento:      #3b82f6;
  --acento-hover:#2563eb;
  --acento-suave:rgba(59, 130, 246, 0.08);
  --acento-linea:rgba(59, 130, 246, 0.25);

  /* --- Rojo: accion principal y critico --- */
  --rojo:        #dc2626;
  --rojo-hover:  #b91c1c;
  --rojo-suave:  #fef2f2;
  --rojo-linea:  rgba(239, 68, 68, 0.25);
  --rojo-glow:   rgba(239, 68, 68, 0.15);

  /* --- Verde: superado, exito --- */
  --verde:       #059669;
  --verde-suave: #ecfdf5;
  --verde-linea: rgba(16, 185, 129, 0.25);

  /* --- Ambar: repetir, advertencia --- */
  --ambar:       #d97706;
  --ambar-suave: #fffbeb;
  --ambar-linea: rgba(245, 158, 11, 0.25);

  /* --- Azul info --- */
  --azul:        #2563eb;
  --azul-suave:  #eff6ff;

  /* --- Shape --- */
  --radio:       16px;
  --radio-sm:    10px;
  --radio-pill:  100px;
  --sombra-sm:   0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.06);
  --sombra:      0 4px 6px -1px rgba(15,23,42,0.05), 0 2px 4px -2px rgba(15,23,42,0.05);
  --sombra-md:   0 10px 15px -3px rgba(15,23,42,0.06), 0 4px 6px -4px rgba(15,23,42,0.04);
  --sombra-lg:   0 20px 25px -5px rgba(15,23,42,0.08), 0 8px 10px -6px rgba(15,23,42,0.04);
  --sombra-glow: 0 0 20px rgba(59, 130, 246, 0.15);

  /* --- Transitions --- */
  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --dur:         0.3s;
  --dur-fast:    0.15s;
}

/* ========== GLOBAL RESET ========== */
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--fondo);
  color: var(--tinta);
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
}

/* ========== APP SHELL ========== */
.app {
  max-width: 780px;
  margin: 0 auto;
  padding: 0 0 48px;
  min-height: 100vh;
}

.app-main {
  animation: fadeInUp 0.5s var(--ease-out) both;
}

/* ========== HEADER ========== */
.app-cab {
  position: relative;
  overflow: hidden;
  border-radius: 0 0 24px 24px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.12);
}

.app-cab-fondo {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #1e3a5f 70%, #0f172a 100%);
  background-size: 300% 300%;
  animation: gradientShift 12s ease infinite;
}

.app-cab-fondo::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.12) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(239,68,68,0.08) 0%, transparent 50%);
}

.app-cab-contenido {
  position: relative;
  z-index: 1;
  padding: 24px 20px 0;
}

.app-cab-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.app-marca {
  display: flex;
  align-items: center;
  gap: 14px;
}

.app-logo {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: heartbeat 2s ease-in-out infinite;
}

.app-logo-svg {
  width: 28px;
  height: 28px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.app-ecg {
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  animation: ecgDraw 2s ease-in-out infinite;
}

.app-titulo {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.app-sub {
  margin: 3px 0 0;
  font-size: 11.5px;
  color: rgba(148, 163, 184, 0.9);
  font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  letter-spacing: 0.03em;
  font-weight: 400;
}

/* --- Header right container & User Badge --- */
.app-cab-derecha {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.app-usuario-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 12px;
  border-radius: var(--radio-pill);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #f1f5f9;
  font-size: 12px;
  font-weight: 500;
}

.app-usuario-nombre {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-btn-logout {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--radio-pill);
  background: rgba(239, 68, 68, 0.18);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.app-btn-logout:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #ffffff;
  border-color: rgba(239, 68, 68, 0.5);
}

/* --- Connection status --- */
.app-estado { flex-shrink: 0; }

.app-online, .app-offline {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: var(--radio-pill);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.app-online {
  background: rgba(5, 150, 105, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.app-offline {
  background: rgba(217, 119, 6, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fcd34d;
}

.app-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.app-dot-ok {
  background: #34d399;
  box-shadow: 0 0 6px rgba(52, 211, 153, 0.6);
  animation: dotPulse 2s ease-in-out infinite;
}

.app-dot-no {
  background: #fbbf24;
  animation: dotPulse 1.5s ease-in-out infinite;
}

/* --- Tabs --- */
.app-tabs {
  display: flex;
  gap: 4px;
  margin-top: 20px;
  position: relative;
}

.app-tab {
  flex: 1;
  padding: 13px 12px;
  border: none;
  background: transparent;
  color: rgba(148, 163, 184, 0.7);
  font-size: 14px;
  font-family: 'Inter', inherit;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2.5px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: color var(--dur-fast) ease, border-color var(--dur) var(--ease-out);
  position: relative;
}

.app-tab:hover {
  color: rgba(203, 213, 225, 0.9);
}

.app-tab-on {
  color: #ffffff;
  font-weight: 600;
  border-bottom-color: #3b82f6;
}

.app-tab-on::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 20%;
  right: 20%;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent);
  border-radius: 2px;
  filter: blur(4px);
}

.app-tab:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  border-radius: 8px 8px 0 0;
}

.app-badge {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  animation: badgePop 0.3s var(--ease-spring) both;
}

/* ========== FOOTER ========== */
.app-pie {
  padding: 0 20px;
  margin-top: 12px;
}

.app-pie-linea {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--linea-fuerte), transparent);
  margin-bottom: 18px;
}

.app-pie p {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--tenue);
  line-height: 1.6;
}

.app-pie-tec {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 11px !important;
  color: var(--tenue) !important;
}

.app-pie-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--tenue);
  opacity: 0.5;
}

/* ========== ANIMATIONS ========== */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  15%      { transform: scale(1.1); }
  30%      { transform: scale(1); }
  45%      { transform: scale(1.05); }
  60%      { transform: scale(1); }
}

@keyframes ecgDraw {
  0%   { stroke-dashoffset: 60; opacity: 0.4; }
  40%  { stroke-dashoffset: 0;  opacity: 1; }
  70%  { stroke-dashoffset: 0;  opacity: 1; }
  100% { stroke-dashoffset: -60; opacity: 0.4; }
}

@keyframes dotPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.5; transform: scale(0.85); }
}

@keyframes badgePop {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}

@keyframes shakeError {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-4px); }
  40%      { transform: translateX(4px); }
  60%      { transform: translateX(-3px); }
  80%      { transform: translateX(3px); }
}

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--rojo-glow); }
  50%      { box-shadow: 0 0 16px 4px var(--rojo-glow); }
}

/* Solo opacidad y desplazamiento. Antes tambien animaba max-height, y con
   fill-mode "both" el valor final (600px) se quedaba fijo en el elemento: el
   panel de ubicacion quedaba recortado a 600px y su contenido se desbordaba
   por debajo, pisando lo que venia despues. */
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}

@keyframes confettiFade {
  0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
  100% { opacity: 0; transform: translateY(-20px) rotate(180deg); }
}

/* ========== REDUCED MOTION ========== */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

