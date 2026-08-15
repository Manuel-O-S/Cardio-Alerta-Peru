/**
 * Autenticacion local con localStorage.
 *
 * Todo se almacena en el navegador del equipo. No hay servidor ni red.
 * Las contrasenas se hashean con SHA-256 (Web Crypto API) para no
 * guardar texto plano, aunque el modelo de amenaza real es minimo
 * dado que es una app de tamizaje en un equipo hospitalario.
 *
 * Claves en localStorage:
 * - "cap_usuarios": array de usuarios registrados
 * - "cap_sesion":   objeto con la sesion activa (dni + nombre)
 */

const CLAVE_USUARIOS = "cap_usuarios";
const CLAVE_SESION = "cap_sesion";

const PREGUNTAS_SEGURIDAD = [
  "¿Cuál es el nombre de su primera mascota?",
  "¿En qué ciudad nació?",
  "¿Cuál es el nombre de su madre?",
  "¿Cuál fue su primer colegio?",
  "¿Cuál es su comida favorita?",
];

export { PREGUNTAS_SEGURIDAD };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Hashea un string con SHA-256 usando la Web Crypto API. */
async function hashear(texto) {
  const datos = new TextEncoder().encode(texto);
  const buffer = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function leerUsuarios() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_USUARIOS)) || [];
  } catch {
    return [];
  }
}

function guardarUsuarios(usuarios) {
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
}

/** Valida que el DNI tenga exactamente 8 digitos numericos. */
export function validarDni(dni) {
  return /^\d{8}$/.test(dni);
}

// ---------------------------------------------------------------------------
// API publica
// ---------------------------------------------------------------------------

/**
 * Registra un nuevo usuario.
 * Retorna { ok: true } o { ok: false, error: "mensaje" }.
 */
export async function registrarUsuario({
  dni,
  nombre,
  contrasena,
  confirmarContrasena,
  preguntaSeguridad,
  respuestaSeguridad,
}) {
  if (!validarDni(dni)) {
    return { ok: false, error: "El DNI debe tener exactamente 8 dígitos numéricos." };
  }
  if (!nombre || nombre.trim().length < 2) {
    return { ok: false, error: "Ingrese un nombre válido." };
  }
  if (!contrasena || contrasena.length < 4) {
    return { ok: false, error: "La contraseña debe tener al menos 4 caracteres." };
  }
  if (contrasena !== confirmarContrasena) {
    return { ok: false, error: "Las contraseñas no coinciden." };
  }
  if (!preguntaSeguridad) {
    return { ok: false, error: "Seleccione una pregunta de seguridad." };
  }
  if (!respuestaSeguridad || respuestaSeguridad.trim().length < 2) {
    return { ok: false, error: "Ingrese una respuesta de seguridad válida." };
  }

  const usuarios = leerUsuarios();
  if (usuarios.find((u) => u.dni === dni)) {
    return { ok: false, error: "Ya existe un usuario registrado con este DNI." };
  }

  const hash = await hashear(contrasena);
  const hashRespuesta = await hashear(respuestaSeguridad.trim().toLowerCase());

  usuarios.push({
    dni,
    nombre: nombre.trim(),
    contrasenaHash: hash,
    preguntaSeguridad,
    respuestaSeguridadHash: hashRespuesta,
    creadoEn: new Date().toISOString(),
  });

  guardarUsuarios(usuarios);
  return { ok: true };
}

/**
 * Inicia sesion. Retorna { ok, error?, usuario? }.
 */
export async function iniciarSesion(dni, contrasena) {
  if (!dni || !contrasena) {
    return { ok: false, error: "Ingrese DNI y contraseña." };
  }

  const usuarios = leerUsuarios();
  const usuario = usuarios.find((u) => u.dni === dni);
  if (!usuario) {
    return { ok: false, error: "No se encontró un usuario con este DNI." };
  }

  const hash = await hashear(contrasena);
  if (hash !== usuario.contrasenaHash) {
    return { ok: false, error: "Contraseña incorrecta." };
  }

  const sesion = { dni: usuario.dni, nombre: usuario.nombre };
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  return { ok: true, usuario: sesion };
}

/** Cierra la sesion activa. */
export function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
}

/** Retorna la sesion activa o null. */
export function obtenerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION)) || null;
  } catch {
    return null;
  }
}

/** Busca un usuario por DNI. Retorna { ok, preguntaSeguridad?, error? }. */
export function buscarUsuarioPorDni(dni) {
  if (!validarDni(dni)) {
    return { ok: false, error: "DNI inválido." };
  }
  const usuarios = leerUsuarios();
  const usuario = usuarios.find((u) => u.dni === dni);
  if (!usuario) {
    return { ok: false, error: "No se encontró un usuario con este DNI." };
  }
  return { ok: true, preguntaSeguridad: usuario.preguntaSeguridad };
}

/** Verifica la respuesta de seguridad. */
export async function verificarRespuestaSeguridad(dni, respuesta) {
  const usuarios = leerUsuarios();
  const usuario = usuarios.find((u) => u.dni === dni);
  if (!usuario) return { ok: false, error: "Usuario no encontrado." };

  const hash = await hashear(respuesta.trim().toLowerCase());
  if (hash !== usuario.respuestaSeguridadHash) {
    return { ok: false, error: "Respuesta incorrecta." };
  }
  return { ok: true };
}

/** Cambia la contrasena de un usuario. */
export async function cambiarContrasena(dni, nuevaContrasena) {
  if (!nuevaContrasena || nuevaContrasena.length < 4) {
    return { ok: false, error: "La contraseña debe tener al menos 4 caracteres." };
  }
  const usuarios = leerUsuarios();
  const idx = usuarios.findIndex((u) => u.dni === dni);
  if (idx === -1) return { ok: false, error: "Usuario no encontrado." };

  usuarios[idx].contrasenaHash = await hashear(nuevaContrasena);
  guardarUsuarios(usuarios);
  return { ok: true };
}
