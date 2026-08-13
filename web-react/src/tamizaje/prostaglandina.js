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
