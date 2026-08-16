/**
 * Volumen de liquidos de mantenimiento en el neonato.
 *
 * QUE DEVUELVE
 * Un volumen de PARTIDA segun peso, dia de vida y edad gestacional. No es una
 * indicacion: los protocolos varian entre unidades y el volumen real se ajusta
 * segun balance hidrico, diuresis, peso diario, sodio y estado clinico. La
 * herramienta hace la aritmetica; la decision es del equipo medico.
 *
 * DE DONDE SALEN LOS NUMEROS
 * Base ampliamente coincidente en la literatura: en recien nacidos a termino y
 * pretermino tardio se empieza en torno a 60 mL/kg/dia el primer dia y se sube
 * unos 20 mL/kg/dia hasta alcanzar unos 150 mL/kg/dia hacia el dia 5-7. En el
 * pretermino se empieza mas alto (60-100 mL/kg/dia el dia 1 segun peso al
 * nacer) porque las perdidas insensibles son mayores.
 *
 * OJO CON UNA INTUICION FRECUENTE: el pretermino necesita MAS liquido, no
 * menos. La superficie corporal relativa y la inmadurez de la piel aumentan
 * las perdidas.
 *
 * SOBRE LA RESTRICCION EN CARDIOPATIA
 * Es practica habitual restringir, pero la evidencia es limitada: en ductus
 * arterioso persistente se han descrito restricciones del 5 al 20% (o sea,
 * 80-95% del volumen estandar) y al menos un estudio comparativo no encontro
 * diferencias en cierre del ductus ni en complicaciones mayores frente al
 * aporte estandar. Por eso el factor es CONFIGURABLE y viene con aviso: 80%
 * es un valor de partida razonable, no una regla establecida.
 *
 * FUENTES
 * - Maintenance Fluids for Late Preterm and Term Infants. Pediatrics Open
 *   Science. 2025;1(2).
 * - Fluid Requirements in the Newborn Infant. Neonatology: Clinical Practice
 *   and Procedures. McGraw Hill.
 * - Neonatal and Infant Intravenous Fluid Management. Royal Children's
 *   Hospital Melbourne, guia de enfermeria.
 * - Standard versus restricted fluid administration in preterm infants with
 *   hsPDA. Pediatr Res. 2025.
 */

export const VERSION_TABLA = "2.0.0";

/**
 * mL/kg/dia por dia de vida. El dia 1 son las primeras 24 h.
 * `resto` aplica del ultimo dia listado en adelante.
 */
/**
 * Requerimientos por dia, en mL/kg/dia (cc/kg/dia).
 *
 * A TERMINO: del cuadro aportado por el equipo clinico. Trae dos columnas,
 * `promedio` (rango) y `maximo` (tope).
 *
 * OJO — INCONSISTENCIA DEL CUADRO ORIGINAL
 * Del dia 3 en adelante el `maximo` queda POR DEBAJO del tope del rango
 * `promedio` (dia 3: rango 80-110, maximo 90). La lectura mas plausible es que
 * `promedio` sea el rango general —incluyendo pretermino— y `maximo` el tope
 * del neonato a termino, que necesita menos. Los valores se reproducen tal
 * como vienen y la calculadora avisa cuando el resultado supera el maximo, en
 * vez de elegir una interpretacion por su cuenta.
 *
 * TAREA PENDIENTE PARA EL EQUIPO CLINICO: confirmar la lectura de las dos
 * columnas y, si corresponde, corregir la tabla.
 *
 * PRETERMINO: no lo cubre el cuadro. Se mantienen valores de literatura
 * (60-100 mL/kg/dia el dia 1 segun peso al nacer, subiendo unos 20 al dia
 * hasta 150). El pretermino necesita MAS liquido: mas perdidas insensibles.
 */
export const TABLA = {
  termino: {
    etiqueta: "A termino (≥37 semanas)",
    fuente: "Cuadro de requerimientos del equipo clinico",
    porDia: {
      1: { rango: [60, 80], maximo: 75 },
      2: { rango: [70, 90], maximo: 80 },
      3: { rango: [80, 110], maximo: 90 },
      4: { rango: [90, 130], maximo: 100 },
      5: { rango: [120, 150], maximo: 120 },
    },
    // Dia 6-7 en adelante
    resto: { rango: [120, 120], maximo: 150 },
  },
  pretermino: {
    etiqueta: "Pretermino (<37 semanas)",
    fuente: "Literatura neonatal; el cuadro del equipo cubre solo a termino",
    porDia: {
      1: { rango: [80, 100], maximo: 100 },
      2: { rango: [100, 120], maximo: 120 },
      3: { rango: [120, 140], maximo: 140 },
      4: { rango: [140, 150], maximo: 150 },
      5: { rango: [150, 150], maximo: 160 },
    },
    resto: { rango: [150, 150], maximo: 170 },
  },
};

/**
 * Que punto del rango usar. Por defecto el inferior: en un paciente con
 * sospecha de cardiopatia el riesgo relevante es la sobrecarga de volumen, no
 * la restriccion.
 */
export const PUNTOS_DEL_RANGO = {
  minimo: { etiqueta: "Minimo del rango", factor: 0 },
  medio: { etiqueta: "Punto medio", factor: 0.5 },
  maximo: { etiqueta: "Maximo del rango", factor: 1 },
};

export const FACTOR_CARDIACO_SUGERIDO = 0.8;
export const EDAD_GESTACIONAL_TERMINO = 37;

const LIMITES = {
  pesoKg: [0.3, 7.0],
  horasDeVida: [0, 720],
  edadGestacionalSem: [20, 45],
  factorRestriccion: [0.5, 1.0],
};

/** Dia de vida a partir de las horas. Las primeras 24 h son el dia 1. */
export function diaDeVida(horasDeVida) {
  return Math.floor(Number(horasDeVida) / 24) + 1;
}

export function validar({ pesoKg, horasDeVida, edadGestacionalSem, factorRestriccion }) {
  const errores = {};
  const num = (v) => (v === "" || v == null ? NaN : Number(v));

  const comprobar = (campo, valor, etiqueta) => {
    const v = num(valor);
    const [min, max] = LIMITES[campo];
    if (!Number.isFinite(v)) errores[campo] = `Falta ${etiqueta}.`;
    else if (v < min || v > max) errores[campo] = `Fuera de rango (${min} a ${max}).`;
  };

  comprobar("pesoKg", pesoKg, "el peso");
  comprobar("horasDeVida", horasDeVida, "las horas de vida");
  comprobar("edadGestacionalSem", edadGestacionalSem, "la edad gestacional");

  if (factorRestriccion != null && factorRestriccion !== "") {
    comprobar("factorRestriccion", factorRestriccion, "el factor de restriccion");
  }

  return errores;
}

/**
 * @param {object} entrada
 * @param {number} entrada.pesoKg
 * @param {number} entrada.horasDeVida
 * @param {number} entrada.edadGestacionalSem
 * @param {boolean} [entrada.restriccionCardiaca]  aplica el factor
 * @param {number}  [entrada.factorRestriccion]    por defecto 0.8
 */
export function calcular({
  pesoKg,
  horasDeVida,
  edadGestacionalSem,
  puntoDelRango = "minimo",
  restriccionCardiaca = false,
  factorRestriccion = FACTOR_CARDIACO_SUGERIDO,
}) {
  const errores = validar({ pesoKg, horasDeVida, edadGestacionalSem, factorRestriccion });
  if (Object.keys(errores).length) return { ok: false, errores };

  const peso = Number(pesoKg);
  const horas = Number(horasDeVida);
  const eg = Number(edadGestacionalSem);
  const factor = restriccionCardiaca ? Number(factorRestriccion) : 1;

  const esTermino = eg >= EDAD_GESTACIONAL_TERMINO;
  const grupo = esTermino ? TABLA.termino : TABLA.pretermino;

  const dia = diaDeVida(horas);
  const fila = grupo.porDia[dia] ?? grupo.resto;
  const [rangoMin, rangoMax] = fila.rango;

  const punto = PUNTOS_DEL_RANGO[puntoDelRango] ?? PUNTOS_DEL_RANGO.minimo;
  const mlKgDiaBase = rangoMin + (rangoMax - rangoMin) * punto.factor;
  const mlKgDia = mlKgDiaBase * factor;

  const volumenDia = mlKgDia * peso;
  const velocidadMlH = volumenDia / 24;

  const r2 = (n) => Math.round(n * 100) / 100;
  const r1 = (n) => Math.round(n * 10) / 10;

  const avisos = [];

  // Aviso central: el resultado supera el tope de la tabla.
  if (mlKgDia > fila.maximo) {
    avisos.push({
      nivel: "alto",
      texto:
        `El aporte calculado (${r1(mlKgDia)} mL/kg/dia) supera el maximo de la ` +
        `tabla para el dia ${dia} (${fila.maximo} mL/kg/dia). Revisar antes de aplicar.`,
    });
  }

  if (rangoMax > fila.maximo) {
    avisos.push({
      nivel: "medio",
      texto:
        `En la tabla original, el tope del rango del dia ${dia} (${rangoMax}) es mayor ` +
        `que el maximo indicado (${fila.maximo}). Pendiente de aclarar con el equipo ` +
        "clinico: probablemente el rango incluya pretermino y el maximo sea el del " +
        "neonato a termino.",
    });
  }

  if (restriccionCardiaca) {
    avisos.push({
      nivel: "alto",
      texto:
        `Restriccion al ${Math.round(factor * 100)}% aplicada. La evidencia sobre ` +
        "restringir liquidos en cardiopatia es limitada y los protocolos varian: " +
        "confirmar el porcentaje con el equipo medico.",
    });
  }

  if (!esTermino) {
    avisos.push({
      nivel: "medio",
      texto:
        `Pretermino de ${eg} semanas. El cuadro de referencia cubre solo neonatos a ` +
        "termino; estos valores vienen de literatura general y por debajo de 1000 g " +
        "de peso al nacer pueden necesitar ajuste adicional.",
    });
  }

  if (peso < 1.0) {
    avisos.push({
      nivel: "alto",
      texto:
        "Peso menor de 1000 g. El aporte hidrico en este grupo depende mucho del " +
        "protocolo de la unidad y de la humedad de la incubadora. Confirmar antes de aplicar.",
    });
  }

  if (dia === 1) {
    avisos.push({
      nivel: "bajo",
      texto:
        "Primer dia de vida. El aporte es deliberadamente bajo para permitir la " +
        "contraccion fisiologica de volumen.",
    });
  }

  return {
    ok: true,
    dia,
    esTermino,
    grupo: grupo.etiqueta,
    fuente: grupo.fuente,
    rango: fila.rango,
    maximoTabla: fila.maximo,
    superaMaximo: mlKgDia > fila.maximo,
    puntoDelRango: punto.etiqueta,
    mlKgDiaBase: r1(mlKgDiaBase),
    factorAplicado: factor,
    mlKgDia: r1(mlKgDia),
    volumenDia: r1(volumenDia),
    velocidadMlH: r2(velocidadMlH),
    pasos: [
      {
        titulo: `Rango del dia ${dia}`,
        formula: grupo.etiqueta,
        sustitucion: `${horas} h de vida → dia ${dia}`,
        resultado: `${rangoMin}–${rangoMax} mL/kg/dia (max ${fila.maximo})`,
      },
      {
        titulo: "Punto elegido del rango",
        formula: punto.etiqueta.toLowerCase(),
        sustitucion: `${rangoMin}–${rangoMax}`,
        resultado: `${r1(mlKgDiaBase)} mL/kg/dia`,
      },
      ...(restriccionCardiaca
        ? [
            {
              titulo: "Restriccion cardiaca",
              formula: "aporte × factor",
              sustitucion: `${r1(mlKgDiaBase)} mL/kg/dia × ${factor}`,
              resultado: `${r1(mlKgDia)} mL/kg/dia`,
            },
          ]
        : []),
      {
        titulo: "Volumen total del dia",
        formula: "aporte × peso",
        sustitucion: `${r1(mlKgDia)} mL/kg/dia × ${peso} kg`,
        resultado: `${r1(volumenDia)} mL/dia`,
      },
      {
        titulo: "Velocidad de infusion",
        formula: "volumen del dia ÷ 24",
        sustitucion: `${r1(volumenDia)} mL/dia ÷ 24 h`,
        resultado: `${r2(velocidadMlH)} mL/h`,
      },
    ],
    avisos,
    versionTabla: VERSION_TABLA,
  };
}

export const ADVERTENCIA_HIDRATACION =
  "Volumen de partida orientativo, no una indicacion. Los protocolos varian " +
  "entre unidades y el aporte real se ajusta segun balance hidrico, diuresis, " +
  "peso diario, sodio y estado clinico. No incluye perdidas extraordinarias " +
  "(fototerapia, drenajes, fiebre) ni el aporte enteral que ya reciba el " +
  "paciente. Confirmar siempre con el equipo medico.";
