import { useState } from "react";
import { registrarUsuario, PREGUNTAS_SEGURIDAD } from "./authLocal.js";
import { CSS_AUTH } from "./PantallaLogin.jsx";

/**
 * Pantalla de registro de nuevo usuario.
 *
 * Props:
 * - onRegistrado(): callback cuando el registro es exitoso (vuelve al login)
 * - onVolver():     navega de vuelta al login
 */
export default function PantallaRegistro({ onRegistrado, onVolver }) {
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    const res = await registrarUsuario({
      dni,
      nombre,
      contrasena,
      confirmarContrasena: confirmar,
      preguntaSeguridad: pregunta,
      respuestaSeguridad: respuesta,
    });
    setCargando(false);
    if (res.ok) {
      setExito(true);
      setTimeout(() => onRegistrado(), 1500);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="auth-fondo">
      <style>{CSS_AUTH}</style>
      <div className="auth-caja">
        <div className="auth-logo-wrap">
          <svg viewBox="0 0 40 40" className="auth-logo-svg" aria-hidden="true">
            <defs>
              <linearGradient id="hg-reg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b6b" />
                <stop offset="100%" stopColor="#ee5a24" />
              </linearGradient>
            </defs>
            <path
              d="M20 35 C10 25, 2 18, 2 12 C2 6, 7 2, 12 2 C15.5 2, 18.5 4, 20 7 C21.5 4, 24.5 2, 28 2 C33 2, 38 6, 38 12 C38 18, 30 25, 20 35Z"
              fill="url(#hg-reg)"
            />
            <path
              className="auth-ecg"
              d="M6 20 L13 20 L15 14 L17 26 L19 16 L21 24 L23 20 L34 20"
              fill="none" stroke="white" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="auth-titulo">Crear cuenta</h1>
        <p className="auth-sub">Registro para personal de salud</p>

        {exito ? (
          <div className="auth-exito">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {"Cuenta creada exitosamente. Redirigiendo al login..."}
          </div>
        ) : (
          <form className="auth-form" onSubmit={enviar}>
            <label className="auth-label">
              DNI (8 dígitos)
              <input
                className={`auth-input ${error ? "auth-input-err" : ""}`}
                type="text"
                inputMode="numeric"
                pattern="\d{8}"
                maxLength={8}
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                placeholder="12345678"
                required
              />
            </label>

            <label className="auth-label">
              Nombre completo
              <input
                className="auth-input"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Dr. Juan Pérez"
                required
              />
            </label>

            <label className="auth-label">
              Contraseña
              <div className="auth-pass-wrap">
                <input
                  className="auth-input"
                  type={verContrasena ? "text" : "password"}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pass"
                  onClick={() => setVerContrasena(!verContrasena)}
                  aria-label={verContrasena ? "Ocultar" : "Ver"}
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

            <label className="auth-label">
              Confirmar contraseña
              <input
                className="auth-input"
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repita la contraseña"
                required
              />
            </label>

            <label className="auth-label">
              Pregunta de seguridad
              <select
                className="auth-select"
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                required
              >
                <option value="">Seleccione una pregunta...</option>
                {PREGUNTAS_SEGURIDAD.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>

            <label className="auth-label">
              Respuesta de seguridad
              <input
                className="auth-input"
                type="text"
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Su respuesta"
                required
              />
            </label>

            {error && (
              <p className="auth-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </p>
            )}

            <button type="submit" className="auth-btn-pri" disabled={cargando}>
              {cargando ? "Registrando..." : "Crear cuenta"}
            </button>

            <button type="button" className="auth-btn-sec" onClick={onVolver}>
              ← Volver al login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
