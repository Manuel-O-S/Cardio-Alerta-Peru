import { useState } from "react";
import {
  buscarUsuarioPorDni,
  verificarRespuestaSeguridad,
  cambiarContrasena,
} from "./authLocal.js";
import { CSS_AUTH } from "./PantallaLogin.jsx";

/**
 * Pantalla de recuperacion de contrasena.
 *
 * Flujo en 3 pasos:
 * 1. Ingresa DNI → se muestra la pregunta de seguridad
 * 2. Responde la pregunta
 * 3. Ingresa nueva contrasena
 *
 * Props:
 * - onVolver(): navega de vuelta al login
 */
export default function PantallaRecuperarContrasena({ onVolver }) {
  const [paso, setPaso] = useState(1);
  const [dni, setDni] = useState("");
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  const buscarDni = (e) => {
    e.preventDefault();
    setError("");
    const res = buscarUsuarioPorDni(dni);
    if (res.ok) {
      setPregunta(res.preguntaSeguridad);
      setPaso(2);
    } else {
      setError(res.error);
    }
  };

  const verificarRespuesta = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    const res = await verificarRespuestaSeguridad(dni, respuesta);
    setCargando(false);
    if (res.ok) {
      setPaso(3);
    } else {
      setError(res.error);
    }
  };

  const cambiar = async (e) => {
    e.preventDefault();
    setError("");
    if (nuevaContrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setCargando(true);
    const res = await cambiarContrasena(dni, nuevaContrasena);
    setCargando(false);
    if (res.ok) {
      setExito(true);
      setTimeout(() => onVolver(), 2000);
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
              <linearGradient id="hg-rec" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b6b" />
                <stop offset="100%" stopColor="#ee5a24" />
              </linearGradient>
            </defs>
            <path
              d="M20 35 C10 25, 2 18, 2 12 C2 6, 7 2, 12 2 C15.5 2, 18.5 4, 20 7 C21.5 4, 24.5 2, 28 2 C33 2, 38 6, 38 12 C38 18, 30 25, 20 35Z"
              fill="url(#hg-rec)"
            />
            <path
              className="auth-ecg"
              d="M6 20 L13 20 L15 14 L17 26 L19 16 L21 24 L23 20 L34 20"
              fill="none" stroke="white" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="auth-titulo">Recuperar contraseña</h1>
        <p className="auth-sub">Verifique su identidad para restablecer su contraseña</p>

        {exito ? (
          <div className="auth-exito">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {"Contraseña actualizada. Redirigiendo al login..."}
          </div>
        ) : (
          <>
            {/* Paso 1: DNI */}
            {paso === 1 && (
              <form className="auth-form" onSubmit={buscarDni}>
                <div className="auth-paso">
                  <span className="auth-paso-num">1</span>
                  <span className="auth-paso-texto">Ingrese su DNI para buscar su cuenta</span>
                </div>
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
                    autoFocus
                    required
                  />
                </label>

                {error && (
                  <p className="auth-error">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {error}
                  </p>
                )}

                <button type="submit" className="auth-btn-pri">Buscar cuenta</button>
                <button type="button" className="auth-btn-sec" onClick={onVolver}>
                  ← Volver al login
                </button>
              </form>
            )}

            {/* Paso 2: Pregunta de seguridad */}
            {paso === 2 && (
              <form className="auth-form" onSubmit={verificarRespuesta}>
                <div className="auth-paso">
                  <span className="auth-paso-num">2</span>
                  <span className="auth-paso-texto">Responda su pregunta de seguridad</span>
                </div>
                <label className="auth-label">
                  {pregunta}
                  <input
                    className={`auth-input ${error ? "auth-input-err" : ""}`}
                    type="text"
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Su respuesta"
                    autoFocus
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
                  {cargando ? "Verificando..." : "Verificar respuesta"}
                </button>
                <button type="button" className="auth-btn-sec" onClick={() => { setPaso(1); setError(""); }}>
                  ← Volver
                </button>
              </form>
            )}

            {/* Paso 3: Nueva contrasena */}
            {paso === 3 && (
              <form className="auth-form" onSubmit={cambiar}>
                <div className="auth-paso">
                  <span className="auth-paso-num">3</span>
                  <span className="auth-paso-texto">Establezca su nueva contraseña</span>
                </div>
                <label className="auth-label">
                  Nueva contraseña
                  <input
                    className="auth-input"
                    type="password"
                    value={nuevaContrasena}
                    onChange={(e) => setNuevaContrasena(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    autoFocus
                    required
                  />
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

                {error && (
                  <p className="auth-error">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {error}
                  </p>
                )}

                <button type="submit" className="auth-btn-pri" disabled={cargando}>
                  {cargando ? "Guardando..." : "Cambiar contraseña"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
