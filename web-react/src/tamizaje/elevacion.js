/**
 * Altitud exacta a partir de coordenadas, usando un servicio de elevación
 * (datos satelitales), no el promedio de un punto de referencia.
 *
 * POR QUE ESTO NO REEMPLAZA A deducirDesdeCoordenadas (ubicacion.js)
 * ubicacion.js evita a propósito depender de un servicio externo: sin
 * internet, o si el servicio está caído, esa función igual funciona con los
 * 13 puntos de referencia — es el respaldo offline. Este módulo intenta
 * primero conseguir la altitud EXACTA vía internet; si falla por cualquier
 * motivo (sin conexión, timeout, servicio caído), quien lo llama debe caer
 * de vuelta a deducirDesdeCoordenadas. Nunca lanza, nunca deja a la interfaz
 * sin ninguna altitud que ofrecer.
 *
 * DOS PROVEEDORES, NO UNO
 * Open-Elevation es gratuito y sin API key, pero es un servidor público
 * compartido con ~10% de fallos medidos. Para una demo en vivo eso es
 * demasiado riesgo. Por eso se intenta primero, y si falla (timeout, caído,
 * error), se intenta Open-Meteo (también gratuito, sin key, respaldado por
 * Copernicus DEM) antes de rendirse y caer al método offline. Ambos
 * responden en formas distintas; cada función normaliza a lo mismo.
 */

const TIMEOUT_MS = 6000;

async function conTimeout(url) {
  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), TIMEOUT_MS);
  try {
    const respuesta = await fetch(url, { signal: controlador.signal });
    if (!respuesta.ok) return { ok: false, motivo: "servicio_no_disponible" };
    return { ok: true, datos: await respuesta.json() };
  } catch (error) {
    return {
      ok: false,
      motivo: error?.name === "AbortError" ? "tiempo_agotado" : "sin_conexion",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function intentarOpenElevation(lat, lon) {
  const r = await conTimeout(
    `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
  );
  if (!r.ok) return r;
  const elevacion = r.datos?.results?.[0]?.elevation;
  if (!Number.isFinite(elevacion)) return { ok: false, motivo: "respuesta_invalida" };
  return { ok: true, altitudMsnm: Math.round(elevacion), fuente: "open-elevation" };
}

async function intentarOpenMeteo(lat, lon) {
  const r = await conTimeout(
    `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`
  );
  if (!r.ok) return r;
  const elevacion = r.datos?.elevation?.[0];
  if (!Number.isFinite(elevacion)) return { ok: false, motivo: "respuesta_invalida" };
  return { ok: true, altitudMsnm: Math.round(elevacion), fuente: "open-meteo" };
}

/**
 * Pide la altitud exacta para un punto, probando dos proveedores en cadena.
 *
 * Siempre resuelve, nunca rechaza:
 *   { ok: true,  altitudMsnm, fuente: "open-elevation" | "open-meteo" }
 *   { ok: false, motivo }
 */
export async function obtenerAltitudExacta(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, motivo: "coordenadas_invalidas" };
  }

  const primero = await intentarOpenElevation(lat, lon);
  if (primero.ok) return primero;

  const segundo = await intentarOpenMeteo(lat, lon);
  if (segundo.ok) return segundo;

  // Ninguno respondió: quien llama debe caer a deducirDesdeCoordenadas.
  return segundo;
}
