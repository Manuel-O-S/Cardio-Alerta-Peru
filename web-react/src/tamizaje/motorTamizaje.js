/**
 * Motor de tamizaje neonatal por oximetria de pulso.
 *
 * JavaScript puro, sin dependencias. Corre en el navegador (por eso el
 * tamizaje funciona sin internet dentro de un PWA), en Node para las pruebas,
 * y se puede importar desde cualquier componente React sin configuracion.
 *
 * ESTO NO ES UN MODELO DE IA, Y ESO ES A PROPOSITO.
 * Es un algoritmo determinista publicado. Un cardiologo o un regulador tiene
 * que poder leer la regla completa y verificarla. Un clasificador opaco
 * decidiendo sobre neonatos es peor producto, no mejor.
 *
 * Los umbrales estan replicados desde compartido/umbrales.json. Si cambias un
 * numero aca, cambialo tambien en MotorTamizaje.kt y motor_reglas.py, y corre
 * las tres suites de conformidad.
 */

// ---------------------------------------------------------------------------
// Tabla de umbrales — espejo de compartido/umbrales.json
// ---------------------------------------------------------------------------

export const VERSION_UMBRALES = "1.0.0";

export const BANDAS = [
  {
    id: "B1",
    nombre: "Nivel del mar hasta 2500 msnm",
    altitudMin: 0,
    altitudMax: 2499,
    spo2Critico: 90,
    spo2Pasa: 95,
    diferenciaMax: 3,
    estado: "verificado",
  },
  {
    id: "B2",
    nombre: "2500 a 3500 msnm",
    altitudMin: 2500,
    altitudMax: 3499,
    spo2Critico: 86,
    spo2Pasa: 91,
    diferenciaMax: 3,
    estado: "provisional",
  },
  {
    id: "B3",
    nombre: "Mayor a 3500 msnm",
    altitudMin: 3500,
    altitudMax: 5100,
    spo2Critico: 83,
    spo2Pasa: 88,
    diferenciaMax: 3,
    estado: "provisional",
  },
];

export const VENTANA = { horasMinimas: 24, horasIdealesMax: 48 };
export const RETAMIZAJE = { rondasMaximas: 3, minutosEspera: 60 };

export const REFERENCIA = {
  fc: { min: 100, max: 180 },
  fr: { min: 30, max: 60 },
  peso: { min: 2.5, max: 4.5 },
  edadGestacionalTermino: 37,
};

export const SINTOMAS_ALARMA = [
  "cianosis_central",
  "dificultad_respiratoria",
  "bradicardia",
  "hipotension",
  "mala_perfusion",
  "hepatomegalia",
];

export const SINTOMAS_CONTEXTO = ["soplo_cardiaco", "taquicardia"];

export const ETIQUETAS_SINTOMAS = {
  cianosis_central: "Cianosis central",
  soplo_cardiaco: "Soplo cardiaco",
  dificultad_respiratoria: "Dificultad respiratoria",
  taquicardia: "Taquicardia",
  bradicardia: "Bradicardia",
  hipotension: "Hipotension",
  mala_perfusion: "Mala perfusion",
  hepatomegalia: "Hepatomegalia",
};

export const ADVERTENCIA_FIJA =
  "Resultado de un tamizaje, no de un diagnostico. No reemplaza el criterio " +
  "clinico del especialista.";

// Resultados posibles
export const Resultado = {
  NO_ELEGIBLE: "no_elegible",
  POSITIVO: "positivo",
  NEGATIVO: "negativo",
  REPETIR: "repetir",
  INCOMPLETO: "incompleto",
};

export const MotivoNoElegible = {
  SINTOMATICO: "sintomatico",
  OXIGENO_SUPLEMENTARIO: "oxigeno_suplementario",
  DIAGNOSTICO_PRENATAL: "diagnostico_prenatal",
  MENOR_24H: "menor_24h",
};

// ---------------------------------------------------------------------------
// Piezas del algoritmo — cada una es una funcion pura y verificable
// ---------------------------------------------------------------------------

/** Devuelve la banda de altitud que corresponde. Fuera de rango: null. */
export function bandaPorAltitud(altitudMsnm) {
  if (!Number.isFinite(altitudMsnm)) return null;
  return (
    BANDAS.find((b) => altitudMsnm >= b.altitudMin && altitudMsnm <= b.altitudMax) ||
    null
  );
}

/**
 * Puerta de elegibilidad. Se corre ANTES del algoritmo.
 *
 * La razon de que exista: el tamizaje esta disenado para recien nacidos
 * ASINTOMATICOS. Un bebe con cianosis central no necesita que una app le diga
 * si "paso" — necesita evaluacion inmediata. Correrle el algoritmo y devolver
 * "negativo" seria el peor error posible de este producto.
 *
 * Devuelve el motivo de no elegibilidad, o null si si es elegible.
 */
export function evaluarElegibilidad({
  horasDeVida,
  sintomas = [],
  oxigenoSuplementario = false,
  diagnosticoPrenatalCC = false,
}) {
  const conAlarma = sintomas.filter((s) => SINTOMAS_ALARMA.includes(s));
  // El sintomatico domina sobre todo lo demas: es el caso mas urgente.
  if (conAlarma.length > 0) {
    return { motivo: MotivoNoElegible.SINTOMATICO, sintomas: conAlarma };
  }
  if (diagnosticoPrenatalCC) {
    return { motivo: MotivoNoElegible.DIAGNOSTICO_PRENATAL, sintomas: [] };
  }
  if (oxigenoSuplementario) {
    return { motivo: MotivoNoElegible.OXIGENO_SUPLEMENTARIO, sintomas: [] };
  }
  if (Number.isFinite(horasDeVida) && horasDeVida < VENTANA.horasMinimas) {
    return { motivo: MotivoNoElegible.MENOR_24H, sintomas: [] };
  }
  return null;
}

/** Diferencia con signo entre preductal y postductal (se guarda para el registro). */
export function diferenciaConSigno(preductal, postductal) {
  if (!Number.isFinite(postductal)) return null;
  return preductal - postductal;
}

/**
 * El algoritmo, en una sola ronda de medicion.
 *
 *   critico  → cualquier medicion por debajo del corte de la banda
 *   pasa     → preductal O postductal por encima del corte, Y diferencia
 *              dentro del maximo
 *   repetir  → todo lo demas
 *
 * Si falta la medicion del pie, devuelve INCOMPLETO en vez de NEGATIVO: sin
 * el diferencial no se pueden detectar las lesiones que cursan con saturacion
 * preductal normal (coartacion, interrupcion de arco). Un "negativo" ahi seria
 * una falsa tranquilidad.
 */
export function evaluarRonda(banda, spo2Preductal, spo2Postductal) {
  const post = Number.isFinite(spo2Postductal) ? spo2Postductal : null;

  if (spo2Preductal < banda.spo2Critico) return Resultado.POSITIVO;
  if (post !== null && post < banda.spo2Critico) return Resultado.POSITIVO;

  if (post === null) return Resultado.INCOMPLETO;

  const algunaPasa = spo2Preductal >= banda.spo2Pasa || post >= banda.spo2Pasa;
  const diferenciaOk = Math.abs(spo2Preductal - post) <= banda.diferenciaMax;

  if (algunaPasa && diferenciaOk) return Resultado.NEGATIVO;
  return Resultado.REPETIR;
}

/**
 * Cierre del retamizaje: a la tercera ronda sin pasar, el resultado es
 * positivo. Sin esta regla el bebe queda en "repetir" para siempre.
 */
export function aplicarCierreDeRondas(resultado, ronda) {
  if (resultado === Resultado.REPETIR && ronda >= RETAMIZAJE.rondasMaximas) {
    return Resultado.POSITIVO;
  }
  return resultado;
}

// ---------------------------------------------------------------------------
// Avisos — informacion clinica que NO altera el resultado
// ---------------------------------------------------------------------------

/**
 * Deliberadamente NO se combinan signos en un puntaje compuesto. Inventar un
 * score que mezcle oximetria + soplo + taquicardia seria fabricar una regla
 * clinica que nadie valido, y ante un jurado de cardiologos eso se detecta al
 * instante. El resultado sale solo del algoritmo publicado; esto es contexto.
 */
export function construirAvisos(entrada, banda, resultado) {
  const avisos = [];
  const push = (codigo, nivel, mensaje) => avisos.push({ codigo, nivel, mensaje });

  if (banda && banda.estado === "provisional") {
    push(
      "umbral_provisional",
      "alto",
      `Los umbrales de la banda ${banda.id} son provisionales y estan pendientes ` +
        `de verificacion contra la fuente peruana. Uso de prototipo unicamente.`
    );
  }

  if (entrada.sintomas?.includes("soplo_cardiaco")) {
    push(
      "soplo_cardiaco",
      "alto",
      "Soplo cardiaco registrado. Requiere evaluacion clinica sea cual sea el " +
        "resultado del tamizaje: el algoritmo de oximetria no lo toma en cuenta."
    );
  }

  if (!Number.isFinite(entrada.spo2Postductal)) {
    push(
      "falta_postductal",
      "alto",
      "Falta la SpO2 postductal (pie). Sin ella no se puede evaluar la " +
        "diferencia preductal-postductal y el tamizaje queda incompleto."
    );
  }

  if (Number.isFinite(entrada.spo2Preductal) && entrada.spo2Preductal < 70) {
    push(
      "senal_dudosa",
      "medio",
      "Saturacion muy baja. Confirmar colocacion y senal del sensor antes de actuar."
    );
  }

  if (
    Number.isFinite(entrada.edadGestacionalSem) &&
    entrada.edadGestacionalSem < REFERENCIA.edadGestacionalTermino
  ) {
    push(
      "prematuro",
      "medio",
      `Recien nacido pretermino (${entrada.edadGestacionalSem} sem). El algoritmo ` +
        "se valido principalmente en recien nacidos a termino; interpretar con cautela."
    );
  }

  if (
    Number.isFinite(entrada.horasDeVida) &&
    entrada.horasDeVida > VENTANA.horasIdealesMax
  ) {
    push(
      "fuera_de_ventana",
      "bajo",
      `Tamizaje a las ${entrada.horasDeVida} h de vida, fuera de la ventana ideal ` +
        `de ${VENTANA.horasMinimas} a ${VENTANA.horasIdealesMax} h.`
    );
  }

  if (Number.isFinite(entrada.fcLpm)) {
    if (entrada.fcLpm > REFERENCIA.fc.max) {
      push("fc_alta", "medio", `FC ${entrada.fcLpm} lpm por encima del rango de referencia (${REFERENCIA.fc.min}-${REFERENCIA.fc.max}).`);
    } else if (entrada.fcLpm < REFERENCIA.fc.min) {
      push("fc_baja", "medio", `FC ${entrada.fcLpm} lpm por debajo del rango de referencia (${REFERENCIA.fc.min}-${REFERENCIA.fc.max}).`);
    }
  }

  if (Number.isFinite(entrada.frRpm)) {
    if (entrada.frRpm > REFERENCIA.fr.max) {
      push("fr_alta", "medio", `FR ${entrada.frRpm} rpm por encima del rango de referencia (${REFERENCIA.fr.min}-${REFERENCIA.fr.max}). Taquipnea.`);
    } else if (entrada.frRpm < REFERENCIA.fr.min) {
      push("fr_baja", "medio", `FR ${entrada.frRpm} rpm por debajo del rango de referencia (${REFERENCIA.fr.min}-${REFERENCIA.fr.max}).`);
    }
  }

  if (Number.isFinite(entrada.pesoKg) && entrada.pesoKg < REFERENCIA.peso.min) {
    push("bajo_peso", "bajo", `Peso ${entrada.pesoKg} kg por debajo de ${REFERENCIA.peso.min} kg.`);
  }

  if (resultado === Resultado.POSITIVO) {
    push(
      "positivo_no_es_diagnostico",
      "alto",
      "Tamizaje no superado. Por cada cardiopatia critica detectada hay varios " +
        "casos de causa infecciosa o respiratoria: requiere evaluacion medica, no " +
        "equivale a diagnostico de cardiopatia."
    );
  }

  if (resultado === Resultado.NEGATIVO) {
    push(
      "negativo_no_descarta",
      "medio",
      "Tamizaje superado. No descarta cardiopatia congenita: algunas no cursan " +
        "con hipoxemia en el periodo neonatal."
    );
  }

  return avisos;
}

// ---------------------------------------------------------------------------
// Validacion de entrada
// ---------------------------------------------------------------------------

const RANGOS = {
  altitudMsnm: [0, 5100],
  horasDeVida: [0, 720],
  spo2Preductal: [0, 100],
  spo2Postductal: [0, 100],
  fcLpm: [30, 300],
  frRpm: [5, 150],
  pesoKg: [0.3, 7.0],
  edadGestacionalSem: [20, 45],
  ronda: [1, 3],
};

const OBLIGATORIOS = ["altitudMsnm", "spo2Preductal"];

/** Devuelve un objeto { campo: mensaje }. Vacio si todo esta bien. */
export function validarEntrada(entrada) {
  const errores = {};

  for (const campo of OBLIGATORIOS) {
    if (!Number.isFinite(entrada[campo])) {
      errores[campo] = "Campo obligatorio.";
    }
  }

  for (const [campo, [min, max]] of Object.entries(RANGOS)) {
    const v = entrada[campo];
    if (v === null || v === undefined || v === "") continue;
    if (!Number.isFinite(v)) {
      errores[campo] = "Debe ser un numero.";
    } else if (v < min || v > max) {
      errores[campo] = `Fuera de rango (${min} a ${max}).`;
    }
  }

  if (Number.isFinite(entrada.altitudMsnm) && !bandaPorAltitud(entrada.altitudMsnm)) {
    errores.altitudMsnm = "Altitud fuera de las bandas definidas (0 a 5100 msnm).";
  }

  return errores;
}

// ---------------------------------------------------------------------------
// Entrada unica al motor
// ---------------------------------------------------------------------------

const CONDUCTAS = {
  [MotivoNoElegible.SINTOMATICO]:
    "No corresponde tamizaje. Recien nacido sintomatico: evaluacion clinica inmediata.",
  [MotivoNoElegible.DIAGNOSTICO_PRENATAL]:
    "No corresponde tamizaje. Ya hay diagnostico prenatal de cardiopatia: seguir el plan establecido.",
  [MotivoNoElegible.OXIGENO_SUPLEMENTARIO]:
    "No corresponde tamizaje mientras reciba oxigeno suplementario. La saturacion no es interpretable.",
  [MotivoNoElegible.MENOR_24H]:
    `Aun no corresponde tamizaje. Repetir a partir de las ${VENTANA.horasMinimas} h de vida.`,
};

/**
 * Evalua un caso completo.
 *
 * @param {object} entrada
 * @param {number} entrada.altitudMsnm        obligatorio
 * @param {number} entrada.spo2Preductal      obligatorio (mano derecha)
 * @param {number} [entrada.spo2Postductal]   pie — sin esto el tamizaje queda incompleto
 * @param {number} [entrada.horasDeVida]
 * @param {number} [entrada.edadGestacionalSem]
 * @param {number} [entrada.fcLpm]
 * @param {number} [entrada.frRpm]
 * @param {number} [entrada.pesoKg]
 * @param {string[]} [entrada.sintomas]
 * @param {boolean} [entrada.oxigenoSuplementario]
 * @param {boolean} [entrada.diagnosticoPrenatalCC]
 * @param {number} [entrada.ronda] 1 a 3
 */
export function evaluarCaso(entrada) {
  const errores = validarEntrada(entrada);
  if (Object.keys(errores).length > 0) {
    return { ok: false, errores };
  }

  const ronda = Number.isFinite(entrada.ronda) ? entrada.ronda : 1;
  const banda = bandaPorAltitud(entrada.altitudMsnm);

  const noElegible = evaluarElegibilidad({
    horasDeVida: entrada.horasDeVida,
    sintomas: entrada.sintomas || [],
    oxigenoSuplementario: entrada.oxigenoSuplementario || false,
    diagnosticoPrenatalCC: entrada.diagnosticoPrenatalCC || false,
  });

  if (noElegible) {
    return {
      ok: true,
      resultado: Resultado.NO_ELEGIBLE,
      motivoNoElegible: noElegible.motivo,
      sintomasDeAlarma: noElegible.sintomas.map((s) => ETIQUETAS_SINTOMAS[s] || s),
      banda: banda ? { ...banda } : null,
      conducta: CONDUCTAS[noElegible.motivo],
      ronda,
      proximaRonda: null,
      minutosEspera: null,
      diferenciaSpo2: null,
      avisos: [],
      versionUmbrales: VERSION_UMBRALES,
      advertencia: ADVERTENCIA_FIJA,
    };
  }

  let resultado = evaluarRonda(banda, entrada.spo2Preductal, entrada.spo2Postductal);
  resultado = aplicarCierreDeRondas(resultado, ronda);

  const esRepetir = resultado === Resultado.REPETIR;

  const conducta = {
    [Resultado.POSITIVO]:
      "Tamizaje no superado. Requiere evaluacion medica y, segun disponibilidad, " +
      "ecocardiografia. Considerar derivacion al centro de referencia mas cercano.",
    [Resultado.NEGATIVO]: "Tamizaje superado. Continuar con los cuidados habituales.",
    [Resultado.REPETIR]: `Repetir la medicion en ${RETAMIZAJE.minutosEspera} minutos (ronda ${ronda + 1} de ${RETAMIZAJE.rondasMaximas}).`,
    [Resultado.INCOMPLETO]:
      "Falta la medicion en el pie (postductal). Completar antes de emitir un resultado.",
  }[resultado];

  return {
    ok: true,
    resultado,
    motivoNoElegible: null,
    sintomasDeAlarma: [],
    banda: { ...banda },
    conducta,
    ronda,
    proximaRonda: esRepetir ? ronda + 1 : null,
    minutosEspera: esRepetir ? RETAMIZAJE.minutosEspera : null,
    diferenciaSpo2: diferenciaConSigno(entrada.spo2Preductal, entrada.spo2Postductal),
    avisos: construirAvisos(entrada, banda, resultado),
    versionUmbrales: VERSION_UMBRALES,
    advertencia: ADVERTENCIA_FIJA,
  };
}
