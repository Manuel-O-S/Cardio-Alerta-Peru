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
  const { data: perfilData } = await supabase
    .from("perfiles")
    .select("rol, nombre")
    .eq("id", data.user.id)
    .single();

  const rol = perfilData?.rol || "doctor";
  const nombre = perfilData?.nombre || "Doctor";
  const sessionUser = { dni, nombre, rol, id: data.user?.id };

  return { ok: true, usuario: sessionUser };
}

/** Cierra la sesion activa. */
export async function cerrarSesion() {
  await supabase.auth.signOut();
}

/** Retorna la sesion activa o null (usado as\u00EDncronamente). */
export async function obtenerSesionAsync() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  
  const user = session.user;
  const dni = user.email ? user.email.replace(DOMAIN, "") : "";
  
  const { data: perfilData } = await supabase
    .from("perfiles")
    .select("rol, nombre")
    .eq("id", user.id)
    .single();

  const rol = perfilData?.rol || "doctor";
  const nombre = perfilData?.nombre || "Doctor";

  return { dni, nombre, rol, id: user.id };
}

/** Escucha cambios en la sesi\u00F3n. Útil para reaccionar cuando expira o se loguea. */
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      const user = session.user;
      const dni = user.email ? user.email.replace(DOMAIN, "") : "";
      
      const { data: perfilData } = await supabase
        .from("perfiles")
        .select("rol, nombre")
        .eq("id", user.id)
        .single();
        
      const rol = perfilData?.rol || "doctor";
      const nombre = perfilData?.nombre || "Doctor";
      callback({ dni, nombre, rol, id: user.id });
    } else {
      callback(null);
    }
  });
  return data.subscription;
}
