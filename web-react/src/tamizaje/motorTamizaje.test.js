/**
 * Suite de conformidad del motor de tamizaje (JavaScript).
 *
 * No usa framework de pruebas a proposito: corre con `node motorTamizaje.test.js`
 * sin instalar nada. Si el equipo ya tiene vitest o jest, los mismos vectores se
 * pueden envolver en `it()` sin tocar el motor.
 *
 * Lee los casos de ../compartido/vectores_conformidad.json, el MISMO archivo que
 * usan las suites de Python y Kotlin.
 */

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, parse } from "node:path";

import {
  evaluarCaso,
  evaluarRonda,
  bandaPorAltitud,
  validarEntrada,
  BANDAS,
  VERSION_UMBRALES,
  Resultado,
} from "./motorTamizaje.js";

/**
 * Busca compartido/vectores_conformidad.json hacia la raiz del repo, para que la
 * prueba funcione igual si el archivo se mueve de carpeta.
 */
function rutaDeVectores() {
  let dir = dirname(fileURLToPath(import.meta.url));
  const raiz = parse(dir).root;
  while (true) {
    const candidata = join(dir, "compartido", "vectores_conformidad.json");
    if (existsSync(candidata)) return candidata;
    if (dir === raiz) break;
    dir = dirname(dir);
  }
  throw new Error(
    "No se encontro compartido/vectores_conformidad.json subiendo desde " +
      dirname(fileURLToPath(import.meta.url))
  );
}

const spec = JSON.parse(readFileSync(rutaDeVectores(), "utf-8"));

let pasaron = 0;
const fallos = [];

function comprobar(nombre, condicion, detalle) {
  if (condicion) pasaron++;
  else fallos.push(`${nombre}: ${detalle}`);
}

// --- 1. Vectores de conformidad compartidos -------------------------------

comprobar(
  "version de umbrales",
  spec.version_umbrales === VERSION_UMBRALES,
  `los vectores son de ${spec.version_umbrales} y el motor de ${VERSION_UMBRALES}`
);

for (const caso of spec.casos) {
  const r = evaluarCaso(caso.entrada);
  const e = caso.espera;

  comprobar(caso.id, r.ok === true, `la entrada no valido: ${JSON.stringify(r.errores)}`);
  if (!r.ok) continue;

  comprobar(caso.id, r.resultado === e.resultado, `resultado ${r.resultado}, se esperaba ${e.resultado}`);

  if (e.banda !== undefined) {
    comprobar(caso.id, r.banda?.id === e.banda, `banda ${r.banda?.id}, se esperaba ${e.banda}`);
  }
  if (e.motivoNoElegible !== undefined) {
    comprobar(caso.id, r.motivoNoElegible === e.motivoNoElegible, `motivo ${r.motivoNoElegible}, se esperaba ${e.motivoNoElegible}`);
  }
  if (e.proximaRonda !== undefined) {
    comprobar(caso.id, r.proximaRonda === e.proximaRonda, `proximaRonda ${r.proximaRonda}, se esperaba ${e.proximaRonda}`);
  }
  if (e.diferenciaSpo2 !== undefined) {
    comprobar(caso.id, r.diferenciaSpo2 === e.diferenciaSpo2, `diferencia ${r.diferenciaSpo2}, se esperaba ${e.diferenciaSpo2}`);
  }
  if (e.avisoPresente !== undefined) {
    const hay = r.avisos.some((a) => a.codigo === e.avisoPresente);
    comprobar(caso.id, hay, `falta el aviso ${e.avisoPresente}`);
  }
  if (e.avisoAusente !== undefined) {
    const hay = r.avisos.some((a) => a.codigo === e.avisoAusente);
    comprobar(caso.id, !hay, `sobra el aviso ${e.avisoAusente}`);
  }

  // Invariante que aplica a TODOS los casos: la advertencia nunca falta.
  comprobar(caso.id, typeof r.advertencia === "string" && r.advertencia.length > 0, "falta la advertencia obligatoria");
}

// --- 2. Regresion del bug mas importante ----------------------------------
// Aplicar el umbral de nivel del mar en la sierra. Un RN sano en Juliaca
// satura ~88%: con el corte de banda 1 sale positivo, con el correcto no.

comprobar(
  "regresion_altitud",
  evaluarRonda(BANDAS[2], 88, 87) === Resultado.NEGATIVO,
  "banda 3 deberia dar negativo con 88/87"
);
comprobar(
  "regresion_altitud",
  evaluarRonda(BANDAS[0], 88, 87) === Resultado.POSITIVO,
  "banda 1 deberia dar positivo con la MISMA medicion"
);

// --- 3. Umbrales provisionales marcados -----------------------------------

comprobar("estado_umbrales", bandaPorAltitud(150).estado === "verificado", "B1 deberia estar verificada");
comprobar("estado_umbrales", bandaPorAltitud(3000).estado === "provisional", "B2 deberia estar marcada provisional");
comprobar("estado_umbrales", bandaPorAltitud(4000).estado === "provisional", "B3 deberia estar marcada provisional");

// --- 4. Validacion de entrada ---------------------------------------------

comprobar("validacion", Object.keys(validarEntrada({ altitudMsnm: 150, spo2Preductal: 98 })).length === 0, "una entrada valida no deberia dar errores");
comprobar("validacion", "spo2Preductal" in validarEntrada({ altitudMsnm: 150, spo2Preductal: 120 }), "SpO2 de 120 deberia rechazarse");
comprobar("validacion", "spo2Preductal" in validarEntrada({ altitudMsnm: 150 }), "falta SpO2 preductal, deberia ser obligatoria");
comprobar("validacion", "altitudMsnm" in validarEntrada({ altitudMsnm: 6000, spo2Preductal: 98 }), "6000 msnm esta fuera de las bandas");
comprobar("validacion", evaluarCaso({ altitudMsnm: 150, spo2Preductal: 120 }).ok === false, "evaluarCaso deberia devolver ok:false con entrada invalida");

// --- Resumen ---------------------------------------------------------------

console.log(`\n  ${pasaron} comprobaciones pasaron, ${fallos.length} fallaron`);
if (fallos.length) {
  console.log("\n  FALLOS:");
  for (const f of fallos) console.log("   -", f);
  process.exit(1);
}
console.log("  Motor JS conforme.\n");
