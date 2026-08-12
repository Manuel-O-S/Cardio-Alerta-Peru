/**
 * Casos pendientes de retamizaje.
 *
 * POR QUE EXISTE ESTO
 * El motor dice "repetir en 60 minutos, ronda 2 de 3", pero no guarda nada.
 * Si el caso vive solo en la memoria de la pantalla, se pierde cuando la
 * enfermera cierra la app, se apaga la tablet o cambia el turno — y ahi es
 * donde el tamizaje real fracasa mas seguido: no en el calculo, sino en el
 * seguimiento. Un "repetir" que nadie repite es un caso perdido.
 *
 * Se guarda en localStorage, no en el backend, por dos razones: funciona sin
 * conexion, y los datos del recien nacido no salen del dispositivo.
 *
 * IMPORTANTE PARA EL EQUIPO: esto NO es un registro clinico. Es una ayuda de
 * memoria del turno. La historia clinica sigue siendo la del establecimiento.
 */

const CLAVE = "cardio-alerta.casos-pendientes.v1";

/** Lee la lista completa. Nunca lanza: si el almacenamiento falla, devuelve []. */
export function leerCasos() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const datos = JSON.parse(crudo);
    return Array.isArray(datos) ? datos : [];
  } catch {
    // Modo privado del navegador, cuota llena o JSON corrupto. La app sigue.
    return [];
  }
}

function escribir(casos) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(casos));
    return true;
  } catch {
    return false;
  }
}

/**
 * Guarda o actualiza un caso pendiente.
 *
 * @param {object} caso
 * @param {string} caso.historiaClinica  identificador del establecimiento
 * @param {number} caso.ronda            ronda que se acaba de completar
 * @param {number} caso.proximaRonda
 * @param {number} caso.minutosEspera
 * @param {number} caso.altitudMsnm
 */
export function guardarCaso(caso) {
  const casos = leerCasos();
  const ahora = Date.now();

  const id = caso.historiaClinica?.trim() || `sin-hc-${ahora}`;
  const registro = {
    id,
    historiaClinica: caso.historiaClinica?.trim() || "(sin historia clinica)",
    ronda: caso.ronda,
    proximaRonda: caso.proximaRonda,
    altitudMsnm: caso.altitudMsnm,
    registradoEn: ahora,
    reevaluarDesde: ahora + (caso.minutosEspera ?? 60) * 60 * 1000,
  };

  const sinEsteCaso = casos.filter((c) => c.id !== id);
  escribir([...sinEsteCaso, registro]);
  return registro;
}

export function eliminarCaso(id) {
  escribir(leerCasos().filter((c) => c.id !== id));
}

export function limpiarTodo() {
  escribir([]);
}

/**
 * Casos ordenados por urgencia: primero los que ya toca reevaluar.
 * Descarta los de mas de 24 h, que ya no son accionables en el turno.
 */
export function casosVigentes() {
  const ahora = Date.now();
  const limite = 24 * 60 * 60 * 1000;
  return leerCasos()
    .filter((c) => ahora - c.registradoEn < limite)
    .sort((a, b) => a.reevaluarDesde - b.reevaluarDesde);
}

/** Texto listo para pantalla: "toca ahora" o "en 42 min". */
export function tiempoRestante(caso, ahora = Date.now()) {
  const faltanMs = caso.reevaluarDesde - ahora;
  if (faltanMs <= 0) return { vencido: true, texto: "Toca reevaluar" };
  const minutos = Math.ceil(faltanMs / 60000);
  return { vencido: false, texto: `En ${minutos} min` };
}
