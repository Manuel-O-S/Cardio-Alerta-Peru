#!/usr/bin/env python3
"""
Genera el bloque de vectores del test de Kotlin a partir de
vectores_conformidad.json.

Existe porque Kotlin no puede leer el JSON compartido en una prueba unitaria
sin arrastrar un parser, y copiar 24 casos a mano garantiza que tarde o
temprano alguien los desincronice.

Uso:
    python3 compartido/generar_vectores_kotlin.py > kotlin/VectoresConformidad.kt
"""

import json
from pathlib import Path

AQUI = Path(__file__).resolve().parent
SPEC = json.loads((AQUI / "vectores_conformidad.json").read_text(encoding="utf-8"))


def kt_valor(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return f'"{v}"'
    if isinstance(v, list):
        return "setOf(" + ", ".join(f'"{x}"' for x in v) + ")"
    return str(v)


def kt_entrada(e):
    partes = [f"altitudMsnm = {e['altitudMsnm']}", f"spo2Preductal = {e['spo2Preductal']}"]
    opcionales = [
        ("spo2Postductal", "spo2Postductal"),
        ("horasDeVida", "horasDeVida"),
        ("edadGestacionalSem", "edadGestacionalSem"),
        ("fcLpm", "fcLpm"),
        ("frRpm", "frRpm"),
        ("pesoKg", "pesoKg"),
        ("sintomas", "sintomas"),
        ("oxigenoSuplementario", "oxigenoSuplementario"),
        ("diagnosticoPrenatalCC", "diagnosticoPrenatalCC"),
        ("ronda", "ronda"),
    ]
    for clave, campo in opcionales:
        if clave in e:
            valor = e[clave]
            # horasDeVida y pesoKg son Double en Kotlin
            if clave in ("horasDeVida", "pesoKg"):
                valor = float(valor)
            partes.append(f"{campo} = {kt_valor(valor)}")
    return "MotorTamizaje.Entrada(" + ", ".join(partes) + ")"


lineas = [
    "package pe.cardioalerta.tamizaje",
    "",
    "/**",
    " * GENERADO AUTOMATICAMENTE — no editar a mano.",
    " *",
    " * Fuente: compartido/vectores_conformidad.json",
    " * Regenerar: python3 compartido/generar_vectores_kotlin.py > kotlin/VectoresConformidad.kt",
    " */",
    "object VectoresConformidad {",
    "",
    f'    const val VERSION_UMBRALES = "{SPEC["version_umbrales"]}"',
    "",
    "    data class Caso(",
    "        val id: String,",
    "        val entrada: MotorTamizaje.Entrada,",
    "        val resultado: String,",
    "        val banda: String? = null,",
    "        val motivoNoElegible: String? = null,",
    "        val proximaRonda: Int? = null,",
    "        val diferenciaSpo2: Int? = null,",
    "        val avisoPresente: String? = null,",
    "        val avisoAusente: String? = null,",
    "    )",
    "",
    "    val CASOS = listOf(",
]

for caso in SPEC["casos"]:
    e = caso["espera"]
    args = [f'id = "{caso["id"]}"', f"entrada = {kt_entrada(caso['entrada'])}",
            f'resultado = "{e["resultado"]}"']
    for clave in ("banda", "motivoNoElegible", "proximaRonda", "diferenciaSpo2",
                  "avisoPresente", "avisoAusente"):
        if clave in e:
            args.append(f"{clave} = {kt_valor(e[clave])}")
    lineas.append("        Caso(")
    for a in args:
        lineas.append(f"            {a},")
    lineas.append("        ),")

lineas += ["    )", "}", ""]

print("\n".join(lineas))
