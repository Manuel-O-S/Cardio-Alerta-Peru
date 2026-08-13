/**
 * Datos guardados en el dispositivo para poder derivar sin conexion.
 *
 * NADA DE ESTO SE DESCARGA SOLO.
 * La descarga la inicia la persona, despues de ver exactamente que se va a
 * guardar. Sin estos datos la aplicacion funciona igual: la derivacion
 * consulta el servidor en cada busqueda y deja de funcionar sin conexion.
 *
 * QUE SE GUARDA
 * Solo establecimientos de salud, que son informacion publica: nombre,
 * direccion, departamento, nivel, red, capacidad, coordenadas y
 * disponibilidad. El backend tiene una suite de pruebas que verifica que el
 * paquete no contenga campos de paciente.
 *
 * QUE NO SE GUARDA ACA
 * Ningun dato del recien nacido. Los casos pendientes de retamizaje se
 * guardan aparte (casosPendientes.js) y nunca se envian a ningun servidor.
 */

const CLAVE = "cardio-alerta.datos-offline.v1";
const API = import.meta.env.VITE_API_URL || "https://cardio-alerta-peru.onrender.com";

/**
 * Lo que se le muestra a la persona antes de pedirle permiso. Se mantiene
 * junto al codigo que descarga para que no se desincronicen: si alguien
 * agrega un campo al paquete, la prueba del backend falla y obliga a
 * actualizar tambien este texto.
 */
export const QUE_SE_GUARDA = [
  "Nombre, direccion y departamento de cada hospital",
  "Nivel de complejidad y red de aseguramiento",
  "Capacidad de atencion cardiologica neonatal",
  "Coordenadas, para calcular distancias sin conexion",
  "Disponibilidad reportada al momento de la descarga",
];

export const QUE_NO_SE_GUARDA = [
  "Ningun dato del recien nacido",
  "Ningun dato de quien usa la aplicacion",
  "Nada se envia a servidores externos",
];

/** Devuelve los datos guardados, o null si no hay. Nunca lanza. */
export function leerDatos() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const d = JSON.parse(crudo);
    return Array.isArray(d?.hospitales) && d.hospitales.length ? d : null;
  } catch {
    return null;
  }
}

export function hayDatos() {
  return leerDatos() !== null;
}

/** Resumen para pantalla: cuantos hospitales y de cuando son. */
export function resumenDatos() {
  const d = leerDatos();
  if (!d) return null;
  return {
    total: d.hospitales.length,
    version: d.version,
    descargadoEn: d.descargadoEn,
    antiguedadHoras: Math.floor((Date.now() - d.descargadoEn) / 3600000),
  };
}

/**
 * Descarga el paquete. Solo se llama despues de que la persona acepta.
 * Devuelve { ok, total, error }.
 */
export async function descargarDatos() {
  try {
    const r = await fetch(`${API}/centros-cercanos/paquete-offline`);
    if (!r.ok) throw new Error(`El servidor respondio ${r.status}`);
    const paquete = await r.json();

    if (!Array.isArray(paquete.hospitales) || paquete.hospitales.length === 0) {
      throw new Error("El paquete llego vacio");
    }

    localStorage.setItem(
      CLAVE,
      JSON.stringify({
        version: paquete.version,
        generado: paquete.generado,
        origenDatos: paquete.origen_datos,
        hospitales: paquete.hospitales,
        descargadoEn: Date.now(),
      })
    );

    // Pedirle al navegador que marque el almacenamiento como protegido. En
    // iOS los datos pueden borrarse tras dias sin usar la aplicacion; esto
    // ayuda, aunque Apple no garantiza que gane a esa limpieza.
    if (navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {});
    }

    return { ok: true, total: paquete.hospitales.length };
  } catch (e) {
    return { ok: false, error: e.message || "No se pudo descargar" };
  }
}

/** Borra los datos guardados. La persona puede hacerlo cuando quiera. */
export function borrarDatos() {
  try {
    localStorage.removeItem(CLAVE);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Busqueda local
// ---------------------------------------------------------------------------

/** Distancia en linea recta entre dos puntos (haversine). Misma que el backend. */
export function distanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const rad = (g) => (g * Math.PI) / 180;
  const dPhi = rad(lat2 - lat1);
  const dLambda = rad(lon2 - lon1);
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Busca los hospitales mas cercanos usando los datos del dispositivo.
 *
 * Replica la logica del backend a proposito, para que el resultado sea el
 * mismo con y sin conexion. Si cambia una, tiene que cambiar la otra.
 *
 * Devuelve null si no hay datos guardados.
 */
export function buscarLocal({ lat, lon, limite = 5, tipoSeguro = "", soloDisponibles = true }) {
  const datos = leerDatos();
  if (!datos) return null;

  let hospitales = datos.hospitales;

  if (tipoSeguro) {
    hospitales = hospitales.filter(
      (h) => h.iafas?.toLowerCase() === tipoSeguro.toLowerCase()
    );
  }

  const disponibles = hospitales.filter(
    (h) => typeof h.status === "string" && h.status.trim().toLowerCase() === "disponible"
  );
  const hayDisponibles = hospitales.some((h) => typeof h.status === "string")
    ? disponibles.length > 0
    : null;

  // Si se pidieron solo disponibles y no hay ninguno, se devuelven todos: una
  // pantalla vacia seria peor que una opcion ocupada, porque el equipo puede
  // llamar y confirmar.
  if (soloDisponibles && disponibles.length) hospitales = disponibles;

  const centros = hospitales
    .map((h) => ({ ...h, distancia_km: Math.round(distanciaKm(lat, lon, h.lat, h.lon) * 10) / 10 }))
    .sort((a, b) => a.distancia_km - b.distancia_km)
    .slice(0, limite);

  return {
    centros,
    origen_datos: "dispositivo",
    hay_disponibles: hayDisponibles,
    descargadoEn: datos.descargadoEn,
  };
}
