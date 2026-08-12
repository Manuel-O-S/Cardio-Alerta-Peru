/**
 * Ubicacion del establecimiento: altitud y coordenadas.
 *
 * POR QUE ESTAN JUNTAS
 * Antes la altitud se elegia en el formulario y las coordenadas se escribian
 * aparte en el panel de derivacion. Eso permitia quedar con la altitud de
 * Juliaca y las coordenadas de Lima, y derivar al recien nacido desde el lugar
 * equivocado. Un establecimiento define ambas o no define ninguna.
 *
 * SE CONFIGURA UNA VEZ POR DISPOSITIVO
 * No es un dato del paciente: es del establecimiento. Por eso se guarda y no
 * hay que volver a elegirlo en cada tamizaje.
 *
 * Espejo de compartido/establecimientos.json.
 */

const CLAVE = "cardio-alerta.ubicacion.v1";

/**
 * Coordenadas del centro de la ciudad, no del establecimiento exacto. Sirven
 * para ordenar hospitales por cercania, que es su unico uso. Cuando el equipo
 * tenga las coordenadas reales de cada establecimiento, se reemplazan aca y en
 * compartido/establecimientos.json.
 */
export const ESTABLECIMIENTOS = [
  { id: "lima",      nombre: "Lima",           departamento: "Lima",        altitudMsnm: 150,  lat: -12.0464, lon: -77.0428 },
  { id: "callao",    nombre: "Callao",         departamento: "Callao",      altitudMsnm: 150,  lat: -12.0508, lon: -77.1268 },
  { id: "trujillo",  nombre: "Trujillo",       departamento: "La Libertad", altitudMsnm: 34,   lat: -8.1116,  lon: -79.0288 },
  { id: "iquitos",   nombre: "Iquitos",        departamento: "Loreto",      altitudMsnm: 106,  lat: -3.7437,  lon: -73.2516 },
  { id: "arequipa",  nombre: "Arequipa",       departamento: "Arequipa",    altitudMsnm: 2335, lat: -16.4090, lon: -71.5375 },
  { id: "cajamarca", nombre: "Cajamarca",      departamento: "Cajamarca",   altitudMsnm: 2750, lat: -7.1617,  lon: -78.5127 },
  { id: "huaraz",    nombre: "Huaraz",         departamento: "Ancash",      altitudMsnm: 3052, lat: -9.5278,  lon: -77.5278 },
  { id: "huancayo",  nombre: "Huancayo",       departamento: "Junin",       altitudMsnm: 3249, lat: -12.0653, lon: -75.2049 },
  { id: "cusco",     nombre: "Cusco",          departamento: "Cusco",       altitudMsnm: 3399, lat: -13.5320, lon: -71.9675 },
  { id: "juliaca",   nombre: "Juliaca",        departamento: "Puno",        altitudMsnm: 3825, lat: -15.4990, lon: -70.1338 },
  { id: "puno",      nombre: "Puno",           departamento: "Puno",        altitudMsnm: 3827, lat: -15.8402, lon: -70.0219 },
  { id: "pasco",     nombre: "Cerro de Pasco", departamento: "Pasco",       altitudMsnm: 4330, lat: -10.6828, lon: -76.2561 },
  { id: "rinconada", nombre: "La Rinconada",   departamento: "Puno",        altitudMsnm: 5100, lat: -14.6280, lon: -69.4450 },
];

export const UBICACION_POR_DEFECTO = {
  id: "lima",
  nombre: "Lima",
  altitudMsnm: 150,
  lat: -12.0464,
  lon: -77.0428,
  manual: false,
};

/**
 * Limites del territorio peruano, con margen. No es una validacion geografica
 * estricta: solo evita el error de tipeo que pone el signo al reves, que es el
 * mas comun cuando se escriben coordenadas a mano.
 */
const LIMITES = {
  lat: [-18.5, 0.5],
  lon: [-81.5, -68.5],
};

/** Devuelve { lat, lon } con mensajes de error, o null si todo esta bien. */
export function validarCoordenadas(lat, lon) {
  const errores = {};
  const n = (v) => (v === "" || v === null || v === undefined ? NaN : Number(v));

  const la = n(lat);
  const lo = n(lon);

  if (!Number.isFinite(la)) errores.lat = "Falta la latitud.";
  else if (la < LIMITES.lat[0] || la > LIMITES.lat[1])
    errores.lat = `Fuera del Peru (${LIMITES.lat[0]} a ${LIMITES.lat[1]}). En el Peru la latitud es negativa.`;

  if (!Number.isFinite(lo)) errores.lon = "Falta la longitud.";
  else if (lo < LIMITES.lon[0] || lo > LIMITES.lon[1])
    errores.lon = `Fuera del Peru (${LIMITES.lon[0]} a ${LIMITES.lon[1]}). En el Peru la longitud es negativa.`;

  return Object.keys(errores).length ? errores : null;
}

/** Lee la ubicacion guardada, o la de por defecto. Nunca lanza. */
export function leerUbicacion() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return { ...UBICACION_POR_DEFECTO };
    const u = JSON.parse(crudo);
    if (!Number.isFinite(u?.lat) || !Number.isFinite(u?.lon) || !Number.isFinite(u?.altitudMsnm)) {
      return { ...UBICACION_POR_DEFECTO };
    }
    return u;
  } catch {
    return { ...UBICACION_POR_DEFECTO };
  }
}

export function guardarUbicacion(ubicacion) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(ubicacion));
    return true;
  } catch {
    return false;
  }
}

/** Construye una ubicacion a partir de un id del catalogo. */
export function ubicacionDeEstablecimiento(id) {
  const e = ESTABLECIMIENTOS.find((x) => x.id === id);
  if (!e) return null;
  return {
    id: e.id,
    nombre: e.nombre,
    altitudMsnm: e.altitudMsnm,
    lat: e.lat,
    lon: e.lon,
    manual: false,
  };
}

/**
 * Ubicacion escrita a mano. Se marca `manual: true` porque la interfaz debe
 * poder advertir que la altitud tambien la puso una persona: es el dato que
 * decide que umbral se aplica.
 */
export function ubicacionManual({ nombre, altitudMsnm, lat, lon }) {
  return {
    id: "manual",
    nombre: nombre?.trim() || "Ubicacion manual",
    altitudMsnm: Number(altitudMsnm),
    lat: Number(lat),
    lon: Number(lon),
    manual: true,
  };
}
