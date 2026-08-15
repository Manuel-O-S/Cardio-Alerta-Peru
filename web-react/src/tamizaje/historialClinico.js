const CLAVE_HISTORIAL = "cap_historial";

export function leerHistorial() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL)) || [];
  } catch {
    return [];
  }
}

function guardarHistorial(historial) {
  localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
}

export function registrarEnHistorial(datosPaciente, resultadoColor) {
  const historial = leerHistorial();
  historial.push({
    idLocal: crypto.randomUUID(),
    paciente: datosPaciente || "Paciente Anónimo",
    resultado: resultadoColor, // "verde", "amarillo", "rojo"
    fecha: new Date().toISOString(),
    sincronizado: false
  });
  guardarHistorial(historial);
}

export function marcarComoSincronizados(ids) {
  const historial = leerHistorial();
  for (const h of historial) {
    if (ids.includes(h.idLocal)) {
      h.sincronizado = true;
    }
  }
  guardarHistorial(historial);
}

export function limpiarHistorial() {
  localStorage.removeItem(CLAVE_HISTORIAL);
}
