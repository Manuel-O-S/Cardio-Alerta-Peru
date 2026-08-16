/**
 * Obtener la ubicacion del dispositivo.
 *
 * POR QUE UN MODULO Y NO UNA LLAMADA SUELTA
 * `navigator.geolocation` falla de cuatro formas distintas y todas devuelven
 * lo mismo si no se miran los codigos: "no se pudo obtener la ubicacion". Eso
 * deja a la persona sin saber si tiene que dar permiso, salir al patio o
 * escribir las coordenadas a mano. Cada causa necesita su instruccion.
 *
 * SOBRE EL PERMISO
 * El navegador pide permiso solo cuando se llama a esta funcion, nunca al
 * cargar la pagina. Por eso la interfaz explica para que se necesita ANTES de
 * llamarla: un cuadro de permiso que aparece sin contexto se rechaza casi
 * siempre, y despues cuesta revertirlo.
 *
 * SOBRE LA ALTITUD
 * El GPS informa altitud, pero NO se usa. Bajo techo es poco confiable y en la
 * app la altitud decide que umbral de saturacion se le aplica al recien
 * nacido. Ese numero se configura por establecimiento, a mano.
 */

/** Limites del territorio peruano, con margen. */
const PERU = { latMin: -18.5, latMax: 0.5, lonMin: -81.5, lonMax: -68.5 };

export const MotivoFallo = {
  NO_SOPORTADO: "no_soportado",
  SIN_PERMISO: "sin_permiso",
  NO_DISPONIBLE: "no_disponible",
  TIEMPO_AGOTADO: "tiempo_agotado",
  FUERA_DEL_PERU: "fuera_del_peru",
  DESCONOCIDO: "desconocido",
};

const MENSAJES = {
  [MotivoFallo.NO_SOPORTADO]:
    "Este navegador no permite obtener la ubicacion. Escribi las coordenadas a mano.",
  [MotivoFallo.SIN_PERMISO]:
    "Permiso denegado. Para activarlo, tocá el candado en la barra de direcciones " +
    "y permití el acceso a la ubicacion. Mientras tanto, podés escribir las coordenadas.",
  [MotivoFallo.NO_DISPONIBLE]:
    "No se pudo determinar la ubicacion. Bajo techo o con paredes gruesas el GPS " +
    "suele fallar: probá cerca de una ventana o escribí las coordenadas.",
  [MotivoFallo.TIEMPO_AGOTADO]:
    "La ubicacion tardo demasiado. Volvé a intentar o escribí las coordenadas.",
  [MotivoFallo.FUERA_DEL_PERU]:
    "La ubicacion obtenida esta fuera del Peru. Puede ser un error del GPS o una " +
    "conexion por VPN. Revisá las coordenadas antes de usarlas.",
  [MotivoFallo.DESCONOCIDO]:
    "No se pudo obtener la ubicacion. Escribi las coordenadas a mano.",
};

/**
 * Pide la ubicacion al navegador.
 *
 * Siempre resuelve, nunca rechaza: devuelve
 *   { ok: true,  lat, lon, precisionM, fueraDelPeru }
 *   { ok: false, motivo, mensaje }
 *
 * `fueraDelPeru` viene en true cuando las coordenadas son validas pero caen
 * fuera del territorio: se devuelven igual, con el aviso, para que la persona
 * decida. Suele pasar con VPN activa.
 */
export function obtenerUbicacion({ timeoutMs = 12000, altaPrecision = true } = {}) {
  return new Promise((resolver) => {
    if (!navigator.geolocation) {
      resolver({
        ok: false,
        motivo: MotivoFallo.NO_SOPORTADO,
        mensaje: MENSAJES[MotivoFallo.NO_SOPORTADO],
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const fueraDelPeru =
          lat < PERU.latMin || lat > PERU.latMax || lon < PERU.lonMin || lon > PERU.lonMax;

        resolver({
          ok: true,
          lat: Number(lat.toFixed(4)),
          lon: Number(lon.toFixed(4)),
          // Radio de incertidumbre en metros. Bajo techo suele pasar de 100 m;
          // se muestra para que se pueda juzgar si el dato sirve.
          precisionM: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null,
          fueraDelPeru,
          mensajeAviso: fueraDelPeru ? MENSAJES[MotivoFallo.FUERA_DEL_PERU] : null,
        });
      },
      (error) => {
        // Los codigos son los del estandar: 1 permiso, 2 no disponible, 3 timeout.
        const motivo =
          error.code === 1
            ? MotivoFallo.SIN_PERMISO
            : error.code === 2
              ? MotivoFallo.NO_DISPONIBLE
              : error.code === 3
                ? MotivoFallo.TIEMPO_AGOTADO
                : MotivoFallo.DESCONOCIDO;
        resolver({ ok: false, motivo, mensaje: MENSAJES[motivo] });
      },
      {
        enableHighAccuracy: altaPrecision,
        timeout: timeoutMs,
        // No aceptar una posicion cacheada de mas de un minuto: si alguien se
        // movio de establecimiento, la vieja lo derivaria desde el lugar
        // equivocado.
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Consulta si ya hay permiso concedido, sin disparar el cuadro del navegador.
 * Devuelve 'granted', 'denied', 'prompt' o null si el navegador no lo soporta.
 *
 * Sirve para decidir el texto del boton: si el permiso ya esta dado, no hace
 * falta explicar nada; si nunca se pidio, conviene explicarlo antes.
 */
export async function estadoDelPermiso() {
  try {
    if (!navigator.permissions?.query) return null;
    const r = await navigator.permissions.query({ name: "geolocation" });
    return r.state;
  } catch {
    return null;
  }
}

/** Texto para pantalla con la precision obtenida. */
export function describirPrecision(precisionM) {
  if (precisionM == null) return "";
  if (precisionM <= 30) return `precision ${precisionM} m`;
  if (precisionM <= 150) return `precision ${precisionM} m, aceptable`;
  return `precision ${precisionM} m, baja — verificá antes de usarla`;
}
