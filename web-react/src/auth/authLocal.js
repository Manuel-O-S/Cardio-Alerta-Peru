import { supabase } from "../supabaseClient.js";

/**
 * Autenticacion con Supabase.
 * Para mantener el uso de DNI en lugar de email en la interfaz,
 * concatenamos el DNI con un dominio ficticio (@cardioalerta.pe) internamente.
 */

const DOMAIN = "@cardioalerta.pe";

/** Valida que el DNI tenga exactamente 8 digitos numericos. */
export function validarDni(dni) {
  return /^\d{8}$/.test(dni);
}

/**
 * Inicia sesion usando Supabase.
 * Retorna { ok, error?, usuario? }.
 */
export async function iniciarSesion(dni, contrasena) {
  if (!dni || !contrasena) {
    return { ok: false, error: "Ingrese DNI y contrase\u00F1a." };
  }
  if (!validarDni(dni)) {
    return { ok: false, error: "El DNI debe tener exactamente 8 d\u00EDgitos num\u00E9ricos." };
  }

  const email = `${dni}${DOMAIN}`;
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: contrasena,
  });

  if (error) {
    return { ok: false, error: "Credenciales incorrectas o usuario no autorizado." };
  }

  // Registrar el ingreso en la base de datos
  if (data.user) {
    await supabase.from("registro_ingresos").insert({ doctor_id: data.user.id });
  }

  // Consultamos la tabla "perfiles" para obtener el rol exacto (admin o doctor)
  const { data: perfilData, error: perfilError } = await supabase
    .from("perfiles")
    .select("rol, nombre")
    .eq("id", data.user.id)
    .single();

  if (perfilError || !perfilData) {
    // Si no está en la tabla perfiles, le denegamos el acceso (fue eliminado o no registrado correctamente)
    await supabase.auth.signOut();
    return { ok: false, error: "Acceso denegado. Perfil eliminado o no encontrado." };
  }

  const rol = perfilData.rol;
  const nombre = perfilData.nombre;
  const sessionUser = { dni, nombre, rol, id: data.user.id };

  return { ok: true, usuario: sessionUser };
}

/** Cierra la sesion activa. */
export async function cerrarSesion() {
  await supabase.auth.signOut();
}

/** Retorna la sesion activa o null (usado asíncronamente). */
export async function obtenerSesionAsync() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  
  const user = session.user;
  const dni = user.email ? user.email.replace(DOMAIN, "") : "";
  
  const { data: perfilData, error } = await supabase
    .from("perfiles")
    .select("rol, nombre")
    .eq("id", user.id)
    .single();

  if (error || !perfilData) {
    await supabase.auth.signOut();
    return null;
  }

  const rol = perfilData.rol;
  const nombre = perfilData.nombre;

  return { dni, nombre, rol, id: user.id };
}

/** Escucha cambios en la sesión. Útil para reaccionar cuando expira o se loguea. */
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      const user = session.user;
      const dni = user.email ? user.email.replace(DOMAIN, "") : "";
      
      const { data: perfilData, error } = await supabase
        .from("perfiles")
        .select("rol, nombre")
        .eq("id", user.id)
        .single();
        
      if (error || !perfilData) {
        await supabase.auth.signOut();
        callback(null);
      } else {
        const rol = perfilData.rol;
        const nombre = perfilData.nombre;
        callback({ dni, nombre, rol, id: user.id });
      }
    } else {
      callback(null);
    }
  });
  return data.subscription;
}
