/**
 * Calculo de velocidad de infusion de prostaglandina E1 (alprostadil).
 *
 * QUE HACE Y QUE NO HACE
 * Hace aritmetica. NO decide la dosis: la dosis la prescribe el medico y se
 * introduce a mano, igual que la concentracion de la ampolla que se tiene
 * delante. No hay valores "por defecto" para ninguna de las dos, a proposito:
 * un valor precargado que nadie mira es exactamente como se administra la
 * concentracion equivocada.
 *
 * POR QUE DEVUELVE EL DESARROLLO Y NO SOLO EL RESULTADO
 * El paso 7 del protocolo pide doble comprobacion independiente. Un numero
 * suelto no se puede comprobar: hay que poder ver la formula, los valores que
 * se sustituyeron y los pasos intermedios. Por eso `pasos` viene en la salida.
 *
 * LA PGE1 PROVOCA APNEA E HIPOTENSION.
 * Solo debe administrarse donde haya monitorizacion neonatal y capacidad de
 * soporte respiratorio.
 */

/**
 * Rango habitual de dosis. Fuera de el se avisa, pero NO se bloquea: puede
 * haber indicaciones fuera de rango y no le corresponde a una calculadora
 * vetar una prescripcion medica.
 */
export const DOSIS = { min: 0.01, max: 0.1, unidad: "µg/kg/min" };

/** Limites de seguridad de la entrada, para atajar errores de tecleo. */
const LIMITES = {
  pesoKg: [0.3, 7.0],
  dosisUgKgMin: [0.001, 1.0],
  concentracionUgMl: [0.1, 500],
};

export function validar({ pesoKg, dosisUgKgMin, concentracionUgMl }) {
  const errores = {};
  const num = (v) => (v === "" || v == null ? NaN : Number(v));

  const p = num(pesoKg);
  const d = num(dosisUgKgMin);
  const c = num(concentracionUgMl);

  if (!Number.isFinite(p)) errores.pesoKg = "Falta el peso del paciente.";
  else if (p < LIMITES.pesoKg[0] || p > LIMITES.pesoKg[1])
    errores.pesoKg = `Fuera de rango (${LIMITES.pesoKg[0]} a ${LIMITES.pesoKg[1]} kg).`;

  if (!Number.isFinite(d)) errores.dosisUgKgMin = "Falta la dosis prescrita.";
  else if (d < LIMITES.dosisUgKgMin[0] || d > LIMITES.dosisUgKgMin[1])
    errores.dosisUgKgMin = `Fuera de rango (${LIMITES.dosisUgKgMin[0]} a ${LIMITES.dosisUgKgMin[1]}).`;

  if (!Number.isFinite(c)) errores.concentracionUgMl = "Falta la concentracion de la solucion preparada.";
  else if (c < LIMITES.concentracionUgMl[0] || c > LIMITES.concentracionUgMl[1])
    errores.concentracionUgMl = `Fuera de rango (${LIMITES.concentracionUgMl[0]} a ${LIMITES.concentracionUgMl[1]} µg/mL).`;

  return errores;
}

/**
 * Calcula la velocidad de infusion.
 *
 *   dosis (µg/min)      = dosis (µg/kg/min) × peso (kg)
 *   velocidad (mL/h)    = dosis (µg/min) × 60 ÷ concentracion (µg/mL)
 *
 * @returns { ok, errores } | { ok, dosisUgMin, velocidadMlH, pasos, avisos }
 */
export function calcular({ pesoKg, dosisUgKgMin, concentracionUgMl }) {
  const errores = validar({ pesoKg, dosisUgKgMin, concentracionUgMl });
  if (Object.keys(errores).length) return { ok: false, errores };

  const peso = Number(pesoKg);
  const dosis = Number(dosisUgKgMin);
  const conc = Number(concentracionUgMl);

  const dosisUgMin = dosis * peso;
  const dosisUgH = dosisUgMin * 60;
  const velocidadMlH = dosisUgH / conc;

  // Redondeo a 2 decimales: las bombas neonatales admiten centesimas de mL/h.
  const redondear = (n) => Math.round(n * 100) / 100;

  const avisos = [];

  if (dosis < DOSIS.min) {
    avisos.push({
      nivel: "alto",
      texto:
        `Dosis por debajo del rango habitual (${DOSIS.min}–${DOSIS.max} ${DOSIS.unidad}). ` +
        "Confirmar con el medico prescriptor antes de administrar.",
    });
  } else if (dosis > DOSIS.max) {
    avisos.push({
      nivel: "alto",
      texto:
        `Dosis por encima del rango habitual (${DOSIS.min}–${DOSIS.max} ${DOSIS.unidad}). ` +
        "El riesgo de apnea e hipotension aumenta con la dosis. Confirmar con el prescriptor.",
    });
  }

  if (velocidadMlH < 0.1) {
    avisos.push({
      nivel: "medio",
      texto:
        `Velocidad muy baja (${redondear(velocidadMlH)} mL/h). Muchas bombas no la ` +
        "entregan con precision. Considerar una dilucion menos concentrada.",
    });
  }

  if (velocidadMlH > 20) {
    avisos.push({
      nivel: "medio",
      texto:
        `Velocidad alta (${redondear(velocidadMlH)} mL/h) para un neonato. Revisar la ` +
        "concentracion de la solucion: puede estar demasiado diluida.",
    });
  }

  return {
    ok: true,
    dosisUgMin: redondear(dosisUgMin),
    dosisUgH: redondear(dosisUgH),
    velocidadMlH: redondear(velocidadMlH),
    // El desarrollo completo, para que una segunda persona pueda comprobarlo
    // sin rehacer el calculo de cabeza.
    pasos: [
      {
        titulo: "Dosis por minuto",
        formula: "dosis prescrita × peso",
        sustitucion: `${dosis} µg/kg/min × ${peso} kg`,
        resultado: `${redondear(dosisUgMin)} µg/min`,
      },
      {
        titulo: "Dosis por hora",
        formula: "dosis por minuto × 60",
        sustitucion: `${redondear(dosisUgMin)} µg/min × 60`,
        resultado: `${redondear(dosisUgH)} µg/h`,
      },
      {
        titulo: "Velocidad de infusion",
        formula: "dosis por hora ÷ concentracion",
        sustitucion: `${redondear(dosisUgH)} µg/h ÷ ${conc} µg/mL`,
        resultado: `${redondear(velocidadMlH)} mL/h`,
      },
    ],
    avisos,
  };
}

/**
 * Protocolo de preparacion y administracion, tal como lo definio el equipo
 * clinico. Vive aca y no dentro del componente para que se pueda revisar sin
 * leer codigo de interfaz.
 */
export const PROTOCOLO = [
  {
    n: 1,
    titulo: "Confirmar la indicacion",
    puntos: [
      "Confirmar la sospecha de cardiopatia congenita ductus-dependiente.",
      "Verificar la indicacion de prostaglandina E1 (alprostadil) con neonatologia o cardiologia.",
      "Registrar el peso actual del neonato en kg.",
    ],
  },
  {
    n: 2,
    titulo: "Revisar la ampolla",
    puntos: [
      "Concentracion de PGE1 indicada en la etiqueta, en µg/mL.",
      "Volumen disponible, en mL.",
      "Caducidad e integridad de la ampolla.",
    ],
  },
  {
    n: 3,
    titulo: "Confirmar la dosis prescrita",
    puntos: [
      "Registrar exactamente la dosis indicada, en µg/kg/min.",
      "No sustituir esa dosis por una dosis estandar sin confirmacion medica.",
    ],
  },
  {
    n: 4,
    titulo: "Preparar la solucion",
    puntos: [
      "Diluir segun el diluyente, la concentracion final y el volumen que establezca el protocolo de la UCIN.",
      "Registrar la cantidad total de PGE1 en µg, el volumen final en mL y la concentracion final en µg/mL.",
    ],
  },
  {
    n: 5,
    titulo: "Calcular la dosis del paciente",
    puntos: ["Dosis (µg/min) = dosis prescrita (µg/kg/min) × peso (kg)."],
  },
  {
    n: 6,
    titulo: "Calcular la velocidad de infusion",
    puntos: [
      "Velocidad (mL/h) = [dosis (µg/kg/min) × peso (kg) × 60] ÷ concentracion (µg/mL).",
    ],
  },
  {
    n: 7,
    titulo: "Doble comprobacion",
    puntos: [
      "Antes de conectar la infusion, verificar de forma independiente: paciente, peso, medicamento, concentracion, dosis, unidades, velocidad calculada, via de administracion e identificacion de la jeringa o solucion.",
    ],
  },
  {
    n: 8,
    titulo: "Iniciar la infusion",
    puntos: [
      "Administrar por infusion intravenosa continua con bomba de infusion, segun el protocolo de la unidad.",
    ],
  },
  {
    n: 9,
    titulo: "Monitorizacion",
    puntos: [
      "Mantener monitorizacion cardiorrespiratoria continua.",
      "Vigilar SpO₂, frecuencia cardiaca, presion arterial, perfusion, respiracion y temperatura.",
      "Vigilar la aparicion de apnea y otros efectos adversos.",
    ],
  },
  {
    n: 10,
    titulo: "Si aparece deterioro",
    puntos: [
      "Ante apnea, hipotension, caida de la saturacion o cualquier cambio clinico importante, actuar segun el protocolo de emergencia neonatal y avisar de inmediato al equipo medico.",
      "No modificar ni suspender la PGE1 por cuenta propia.",
    ],
  },
];

export const ADVERTENCIA_PGE1 =
  "La PGE1 puede provocar apnea e hipotension. Su administracion requiere un " +
  "entorno con monitorizacion neonatal y capacidad de soporte respiratorio y " +
  "cardiovascular. Esta herramienta calcula, no prescribe: la dosis y la " +
  "indicacion son del medico.";

// ---------------------------------------------------------------------------
// Protocolo del INSN San Borja
// ---------------------------------------------------------------------------

/**
 * Presentacion y preparacion segun la "Guia de uso de prostaglandinas en
 * cardiopatias congenitas ductus-dependiente", 2022, Instituto Nacional de
 * Salud del Niño de San Borja, Peru.
 *
 * LA GRACIA DE ESTA PREPARACION
 * Con la "regla del 3", la velocidad de infusion NO depende del peso:
 * 1 mL/h entrega siempre 0,01 µg/kg/min, sea cual sea el paciente. El peso
 * entra en la PREPARACION (cuantos mL de solucion base se toman), no en el
 * calculo de la velocidad. Eso elimina una division a mano en la cabecera del
 * paciente, que es donde se cometen los errores.
 */
export const AMPOLLA = {
  volumenMl: 1,
  concentracionUgMl: 500,
  contenidoUg: 500,
};

export const SOLUCION_BASE = {
  // 1 mL de ampolla + 49 mL de NaCl 0,9% = 50 mL
  diluyenteMl: 49,
  volumenFinalMl: 50,
  concentracionUgMl: 10,
  diluyente: "NaCl 0,9%",
};

export const INFUSION_INSN = {
  volumenFinalMl: 50,
  diluyentes: "NaCl 0,9% o dextrosa 5%",
  // Cada mL/h entrega esta dosis
  dosisPorMlH: 0.01,
  multiplicadorPeso: 3,
};

export const ESTABILIDAD = [
  { que: "Solucion base refrigerada (2-4 °C)", duracion: "6 dias" },
  { que: "Infusion a temperatura ambiente", duracion: "24 h" },
];

export const MONITOREO = [
  "Frecuencia y esfuerzos respiratorios",
  "Saturacion arterial",
  "Colocacion del paciente",
  "Presion arterial",
  "Diuresis",
];

/**
 * Calculo con la preparacion del INSN.
 *
 * Preparacion:
 *   1. Diluir 1 ampolla (1 mL, 500 µg/mL) en 49 mL de NaCl 0,9%
 *      -> 50 mL de solucion base a 10 µg/mL
 *   2. Tomar (peso × 3) mL de esa solucion base
 *   3. Completar hasta 50 mL con NaCl 0,9% o dextrosa 5%
 *   4. Cada 1 mL/h entrega 0,01 µg/kg/min
 *
 * Velocidad (mL/h) = dosis (µg/kg/min) ÷ 0,01
 */
export function calcularINSN({ pesoKg, dosisUgKgMin }) {
  const errores = {};
  const num = (v) => (v === "" || v == null ? NaN : Number(v));
  const peso = num(pesoKg);
  const dosis = num(dosisUgKgMin);

  if (!Number.isFinite(peso)) errores.pesoKg = "Falta el peso del paciente.";
  else if (peso < 0.3 || peso > 7) errores.pesoKg = "Fuera de rango (0.3 a 7.0 kg).";

  if (!Number.isFinite(dosis)) errores.dosisUgKgMin = "Falta la dosis prescrita.";
  else if (dosis < 0.001 || dosis > 1) errores.dosisUgKgMin = "Fuera de rango (0.001 a 1).";

  if (Object.keys(errores).length) return { ok: false, errores };

  const r2 = (n) => Math.round(n * 100) / 100;

  const volumenBaseMl = peso * INFUSION_INSN.multiplicadorPeso;
  const diluyenteMl = INFUSION_INSN.volumenFinalMl - volumenBaseMl;
  const contenidoUg = volumenBaseMl * SOLUCION_BASE.concentracionUgMl;
  const concentracionFinalUgMl = contenidoUg / INFUSION_INSN.volumenFinalMl;
  const velocidadMlH = dosis / INFUSION_INSN.dosisPorMlH;

  const avisos = [];

  if (dosis < DOSIS.min || dosis > DOSIS.max) {
    avisos.push({
      nivel: "alto",
      texto:
        `Dosis fuera del rango de la guia (${DOSIS.min}–${DOSIS.max} ${DOSIS.unidad}). ` +
        "Confirmar con el medico prescriptor antes de administrar.",
    });
  }

  if (volumenBaseMl > INFUSION_INSN.volumenFinalMl) {
    avisos.push({
      nivel: "alto",
      texto:
        `Con ${peso} kg harian falta ${r2(volumenBaseMl)} mL de solucion base, mas que ` +
        `los ${INFUSION_INSN.volumenFinalMl} mL del volumen final. Consultar al equipo ` +
        "medico: esta preparacion no aplica a este peso.",
    });
  }

  return {
    ok: true,
    volumenBaseMl: r2(volumenBaseMl),
    diluyenteMl: r2(diluyenteMl),
    contenidoUg: r2(contenidoUg),
    concentracionFinalUgMl: r2(concentracionFinalUgMl),
    velocidadMlH: r2(velocidadMlH),
    dosisUgMin: r2(dosis * peso),
    preparacion: [
      `Diluir 1 ampolla (${AMPOLLA.volumenMl} mL, ${AMPOLLA.concentracionUgMl} µg/mL) en ` +
        `${SOLUCION_BASE.diluyenteMl} mL de ${SOLUCION_BASE.diluyente} → ` +
        `${SOLUCION_BASE.volumenFinalMl} mL de solucion base a ${SOLUCION_BASE.concentracionUgMl} µg/mL.`,
      `Tomar ${r2(volumenBaseMl)} mL de la solucion base (peso × 3 = ${peso} × 3).`,
      `Completar con ${INFUSION_INSN.diluyentes} hasta ${INFUSION_INSN.volumenFinalMl} mL ` +
        `(añadir ${r2(diluyenteMl)} mL).`,
      `Administrar por bomba infusora a ${r2(velocidadMlH)} mL/h.`,
    ],
    pasos: [
      {
        titulo: "Solucion base a tomar",
        formula: "peso × 3",
        sustitucion: `${peso} kg × 3`,
        resultado: `${r2(volumenBaseMl)} mL`,
      },
      {
        titulo: "Contenido de PGE1 en la jeringa",
        formula: "volumen base × concentracion base",
        sustitucion: `${r2(volumenBaseMl)} mL × ${SOLUCION_BASE.concentracionUgMl} µg/mL`,
        resultado: `${r2(contenidoUg)} µg en ${INFUSION_INSN.volumenFinalMl} mL`,
      },
      {
        titulo: "Velocidad de infusion",
        formula: "dosis ÷ 0,01 (cada mL/h entrega 0,01 µg/kg/min)",
        sustitucion: `${dosis} µg/kg/min ÷ ${INFUSION_INSN.dosisPorMlH}`,
        resultado: `${r2(velocidadMlH)} mL/h`,
      },
    ],
    avisos,
  };
}

/**
 * Efectos adversos y conducta, segun la guia del INSN San Borja (2022).
 * Se muestran junto a la calculadora porque quien prepara la infusion es
 * quien primero va a ver el efecto.
 */
export const EFECTOS_ADVERSOS = [
  {
    efecto: "Apnea",
    frecuencia: "Frecuente",
    conducta: [
      "Estimulacion del paciente.",
      "Apoyo con bolsa de resucitacion.",
      "Considerar intubacion y ventilacion mecanica segun estado clinico.",
      "Disminucion de la dosis.",
      "Considerar aminofilina en pacientes de menos de 2 kg: inicio 6 mg/kg endovenoso, mantenimiento 2 mg/kg endovenoso cada 8 h.",
    ],
  },
  {
    efecto: "Miocionias, agitacion",
    frecuencia: "Frecuente",
    conducta: ["Disminucion de la dosis.", "Considerar sedacion."],
  },
  {
    efecto: "Hipotension",
    frecuencia: "Frecuente",
    conducta: [
      "Bolo de 10 mL/kg de NaCl 0,9% o haemaccel.",
      "Considerar dopamina a dosis presora.",
    ],
  },
  {
    efecto: "Hipertermia",
    frecuencia: "Frecuente",
    conducta: [
      "Disminucion de la dosis.",
      "Medios fisicos.",
      "No utilizar AINES.",
      "Excluir sepsis como causa.",
    ],
  },
  {
    efecto: "Vasodilatacion cutanea",
    frecuencia: "Frecuente con via arterial umbilical",
    conducta: ["Preferir via venosa central."],
  },
  {
    efecto: "Taquicardia",
    frecuencia: "Frecuente",
    conducta: ["Excluir otras patologias como causa."],
  },
  {
    efecto: "Diarrea",
    frecuencia: "Poco frecuente",
    conducta: ["Mantener buena hidratacion.", "Disminucion de la dosis."],
  },
  {
    efecto: "Hiperplasia antral",
    frecuencia: "Infrecuente",
    conducta: ["Ecografia diagnostica.", "Colocacion de sonda nasoyeyunal."],
  },
  {
    efecto: "Alteraciones electroliticas",
    frecuencia: "Infrecuente",
    conducta: [
      "Mantener buen aporte hidroelectrolitico.",
      "Disminuir dosis de diureticos si se administran de forma concomitante.",
    ],
  },
  {
    efecto: "Hiperostosis cortical",
    frecuencia: "Poco frecuente",
    conducta: [
      "Monitorear fosfatasa alcalina.",
      "Radiografia de huesos largos para descarte.",
      "Descartar osteomielitis, cubrir con antibioticos.",
      "Analgesicos.",
      "Puede mantenerse varios meses tras suspender el farmaco.",
    ],
  },
];

export const FUENTE_INSN =
  "Guia de uso de prostaglandinas en cardiopatias congenitas ductus-dependiente. " +
  "2022. Instituto Nacional de Salud del Niño de San Borja, Peru.";
