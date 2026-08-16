import { useState } from "react";
import { iniciarSesion } from "./authLocal.js";

/**
 * Pantalla de inicio de sesion.
 *
 * Props:
 * - onLogin(usuario): callback cuando inicia sesion con exito
 */
export default function PantallaLogin({ onLogin }) {
  const [dni, setDni] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    const res = await iniciarSesion(dni, contrasena);
    setCargando(false);
    if (res.ok) {
      onLogin(res.usuario);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="auth-fondo">
      <style>{CSS_AUTH}</style>
      <div className="auth-caja">
        {/* Logo */}
        <div className="auth-logo-wrap">
          <svg viewBox="0 0 40 40" className="auth-logo-svg" aria-hidden="true">
            <defs>
              <linearGradient id="hg-login" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b6b" />
                <stop offset="100%" stopColor="#ee5a24" />
              </linearGradient>
            </defs>
            <path
              d="M20 35 C10 25, 2 18, 2 12 C2 6, 7 2, 12 2 C15.5 2, 18.5 4, 20 7 C21.5 4, 24.5 2, 28 2 C33 2, 38 6, 38 12 C38 18, 30 25, 20 35Z"
              fill="url(#hg-login)"
            />
            <path
              className="auth-ecg"
              d="M6 20 L13 20 L15 14 L17 26 L19 16 L21 24 L23 20 L34 20"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="auth-titulo">Cardio Alerta Perú</h1>
        <p className="auth-sub">Tamizaje neonatal por oximetría de pulso</p>

        <form className="auth-form" onSubmit={enviar}>
          <label className="auth-label">
            DNI
            <input
              className={`auth-input ${error ? "auth-input-err" : ""}`}
              type="text"
              inputMode="numeric"
              pattern="\d{8}"
              maxLength={8}
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
              placeholder="12345678"
              autoComplete="username"
              required
            />
          </label>

          <label className="auth-label">
            Contraseña
            <div className="auth-pass-wrap">
              <input
                className={`auth-input ${error ? "auth-input-err" : ""}`}
                type={verContrasena ? "text" : "password"}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-toggle-pass"
                onClick={() => setVerContrasena(!verContrasena)}
                aria-label={verContrasena ? "Ocultar contraseña" : "Ver contraseña"}
                tabIndex={-1}
              >
                {verContrasena ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </label>

          {error && (
            <p className="auth-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-btn-pri"
            disabled={cargando}
          >
            {cargando ? "Verificando..." : "Iniciar sesión"}
          </button>
        </form>


      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Estilos compartidos por todas las pantallas de auth
// ---------------------------------------------------------------------------
export const CSS_AUTH = `
/* ========== GLOBAL RESET PARA AUTH ========== */
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
}

/* ========== AUTH — FONDO ========== */
.auth-fondo {
  min-height:100vh; display:flex; align-items:center; justify-content:center;
  background:linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  padding:24px;
  position:relative; overflow:hidden;
}
.auth-fondo::before {
  content:''; position:absolute; top:-40%; left:-20%; width:70%; height:120%;
  background:radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
  pointer-events:none;
}
.auth-fondo::after {
  content:''; position:absolute; bottom:-30%; right:-15%; width:60%; height:100%;
  background:radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%);
  pointer-events:none;
}

/* ========== AUTH — CAJA ========== */
.auth-caja {
  position:relative; z-index:1;
  width:100%; max-width:420px;
  background:rgba(255,255,255,0.95);
  backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
  border-radius:24px; padding:40px 36px;
  box-shadow:0 25px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1);
  animation:authEntrar .4s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes authEntrar {
  from { opacity:0; transform:translateY(20px) scale(0.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}

/* ========== AUTH — LOGO ========== */
.auth-logo-wrap {
  width:56px; height:56px; margin:0 auto 16px;
  background:linear-gradient(135deg,#ff6b6b,#ee5a24);
  border-radius:16px; display:flex; align-items:center; justify-content:center;
  box-shadow:0 8px 24px rgba(238,90,36,0.3);
}
.auth-logo-svg { width:36px; height:36px; }
.auth-ecg { stroke-dasharray:80; stroke-dashoffset:80; animation:authEcg 1.5s ease-out .3s forwards; }
@keyframes authEcg { to { stroke-dashoffset:0; } }

/* ========== AUTH — TEXTOS ========== */
.auth-titulo {
  text-align:center; font-size:22px; font-weight:700; color:#0f172a;
  margin:0 0 4px; letter-spacing:-0.02em;
}
.auth-sub {
  text-align:center; font-size:13px; color:#64748b; margin:0 0 28px;
}
.auth-subtitulo {
  text-align:center; font-size:15px; font-weight:600; color:#334155;
  margin:0 0 20px;
}

/* ========== AUTH — FORM ========== */
.auth-form { display:flex; flex-direction:column; gap:16px; }
.auth-label {
  display:flex; flex-direction:column; gap:5px;
  font-size:12.5px; font-weight:600; color:#334155;
  letter-spacing:.03em; text-transform:uppercase;
  font-family:ui-monospace,"SF Mono",Menlo,monospace;
}
.auth-input {
  width:100%; padding:12px 14px; border:1.5px solid rgba(148,163,184,0.3);
  border-radius:12px; font-size:15px; color:#0f172a;
  background:#f8fafc; transition:border-color .15s ease, box-shadow .15s ease;
  font-family:inherit; outline:none;
}
.auth-input:focus {
  border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.12);
  background:#fff;
}
.auth-input-err { border-color:#dc2626; }
.auth-input-err:focus { box-shadow:0 0 0 3px rgba(220,38,38,0.12); }

.auth-input::placeholder { color:#94a3b8; }

.auth-select {
  width:100%; padding:12px 14px; border:1.5px solid rgba(148,163,184,0.3);
  border-radius:12px; font-size:14px; color:#0f172a;
  background:#f8fafc; cursor:pointer; outline:none;
  font-family:inherit;
}
.auth-select:focus {
  border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.12);
}

/* ========== AUTH — PASS TOGGLE ========== */
.auth-pass-wrap { position:relative; }
.auth-pass-wrap .auth-input { padding-right:44px; }
.auth-toggle-pass {
  position:absolute; right:10px; top:50%; transform:translateY(-50%);
  background:none; border:none; cursor:pointer; color:#94a3b8;
  padding:4px; display:flex; border-radius:6px;
}
.auth-toggle-pass:hover { color:#64748b; background:rgba(148,163,184,0.1); }

/* ========== AUTH — ERROR ========== */
.auth-error {
  display:flex; align-items:center; gap:6px;
  font-size:13px; color:#dc2626; margin:0;
  padding:10px 14px; background:#fef2f2; border-radius:10px;
  border:1px solid rgba(239,68,68,0.2);
}

/* ========== AUTH — EXITO ========== */
.auth-exito {
  display:flex; align-items:center; gap:6px;
  font-size:13px; color:#059669; margin:0;
  padding:10px 14px; background:#ecfdf5; border-radius:10px;
  border:1px solid rgba(16,185,129,0.2);
}

/* ========== AUTH — BOTONES ========== */
.auth-btn-pri {
  width:100%; padding:13px; border:none; border-radius:12px;
  font-size:15px; font-weight:600; color:#fff; cursor:pointer;
  background:linear-gradient(135deg,#3b82f6,#2563eb);
  box-shadow:0 4px 14px rgba(59,130,246,0.35);
  transition:transform .15s ease, box-shadow .15s ease;
  margin-top:4px;
}
.auth-btn-pri:hover:not(:disabled) {
  transform:translateY(-1px); box-shadow:0 6px 20px rgba(59,130,246,0.4);
}
.auth-btn-pri:active:not(:disabled) { transform:translateY(0); }
.auth-btn-pri:disabled { opacity:0.6; cursor:not-allowed; }

.auth-btn-sec {
  width:100%; padding:12px; border:1.5px solid rgba(148,163,184,0.3);
  border-radius:12px; font-size:14px; font-weight:500; color:#334155;
  cursor:pointer; background:#fff;
  transition:border-color .15s ease, background .15s ease;
}
.auth-btn-sec:hover { border-color:#3b82f6; background:rgba(59,130,246,0.04); }

/* ========== AUTH — LINKS ========== */
.auth-links { margin-top:24px; text-align:center; }
.auth-link {
  background:none; border:none; color:#3b82f6; cursor:pointer;
  font-size:13.5px; padding:0; font-family:inherit;
  transition:color .15s ease;
}
.auth-link:hover { color:#2563eb; text-decoration:underline; }
.auth-link-bold { font-weight:600; }
.auth-link-text { font-size:13.5px; color:#64748b; margin:0; }
.auth-sep { height:1px; background:rgba(148,163,184,0.15); margin:14px 0; }

/* ========== AUTH — PASOS (recuperar) ========== */
.auth-paso {
  display:flex; align-items:center; gap:10px;
  margin-bottom:18px; padding-bottom:14px;
  border-bottom:1px solid rgba(148,163,184,0.15);
}
.auth-paso-num {
  width:28px; height:28px; border-radius:50%;
  background:linear-gradient(135deg,#3b82f6,#2563eb);
  color:#fff; font-size:13px; font-weight:700;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.auth-paso-texto { font-size:13px; color:#64748b; }

/* ========== RESPONSIVE ========== */
@media (max-width: 480px) {
  .auth-caja { padding:32px 24px; border-radius:20px; }
  .auth-titulo { font-size:20px; }
}
`;
