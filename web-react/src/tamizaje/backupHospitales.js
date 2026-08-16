/**
 * Sistema de Backup y Caché Offline de Hospitales de Derivación.
 * 
 * Guarda automáticamente una copia local de los hospitales disponibles
 * y del hospital seleccionado para derivación. Se refresca periódicamente
 * (cada 30 min) y permite acceder a direcciones, teléfonos y exámenes
 * incluso si se interrumpe la conexión a internet.
 */

const CLAVE_BACKUP_HOSPITALES = "cap_backup_hospitales";
const CLAVE_HOSPITAL_SELECCIONADO = "cap_hospital_derivado_actual";

/**
 * Guarda una copia de seguridad de los hospitales para la ciudad actual.
 */
export function guardarBackupHospitales(ciudadId, hospitales) {
  try {
    if (!hospitales || hospitales.length === 0) return;
    const backup = {
      ciudadId: ciudadId || "general",
      hospitales,
      fecha: new Date().toISOString(),
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CLAVE_BACKUP_HOSPITALES}_${ciudadId}`, JSON.stringify(backup));
    localStorage.setItem(CLAVE_BACKUP_HOSPITALES, JSON.stringify(backup));
  } catch (e) {
    console.warn("No se pudo guardar el backup de hospitales:", e);
  }
}

/**
 * Lee el backup de hospitales guardado en almacenamiento local.
 */
export function leerBackupHospitales(ciudadId) {
  try {
    const item =
      localStorage.getItem(`${CLAVE_BACKUP_HOSPITALES}_${ciudadId}`) ||
      localStorage.getItem(CLAVE_BACKUP_HOSPITALES);
    if (!item) return null;
    return JSON.parse(item);
  } catch {
    return null;
  }
}

/**
 * Guarda el hospital seleccionado actualmente en caso de corte de red.
 */
export function guardarHospitalSeleccionadoOffline(hospital) {
  try {
    if (!hospital) {
      localStorage.removeItem(CLAVE_HOSPITAL_SELECCIONADO);
      return;
    }
    const data = {
      hospital,
      fecha: new Date().toISOString(),
      timestamp: Date.now(),
    };
    localStorage.setItem(CLAVE_HOSPITAL_SELECCIONADO, JSON.stringify(data));
  } catch (e) {
    console.warn("No se pudo guardar el hospital seleccionado offline:", e);
  }
}

/**
 * Recupera el hospital seleccionado guardado en el backup local.
 */
export function leerHospitalSeleccionadoOffline() {
  try {
    const item = localStorage.getItem(CLAVE_HOSPITAL_SELECCIONADO);
    if (!item) return null;
    return JSON.parse(item);
  } catch {
    return null;
  }
}
