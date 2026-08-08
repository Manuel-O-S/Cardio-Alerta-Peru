package pe.cardioalerta.tamizaje

/**
 * GENERADO AUTOMATICAMENTE — no editar a mano.
 *
 * Fuente: compartido/vectores_conformidad.json
 * Regenerar: python3 compartido/generar_vectores_kotlin.py > kotlin/VectoresConformidad.kt
 */
object VectoresConformidad {

    const val VERSION_UMBRALES = "1.0.0"

    data class Caso(
        val id: String,
        val entrada: MotorTamizaje.Entrada,
        val resultado: String,
        val banda: String? = null,
        val motivoNoElegible: String? = null,
        val proximaRonda: Int? = null,
        val diferenciaSpo2: Int? = null,
        val avisoPresente: String? = null,
        val avisoAusente: String? = null,
    )

    val CASOS = listOf(
        Caso(
            id = "demo_lima_vs_juliaca_a",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 88, spo2Postductal = 86, horasDeVida = 30.0),
            resultado = "positivo",
            banda = "B1",
        ),
        Caso(
            id = "demo_lima_vs_juliaca_b",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 3825, spo2Preductal = 88, spo2Postductal = 86, horasDeVida = 30.0),
            resultado = "negativo",
            banda = "B3",
        ),
        Caso(
            id = "captura_del_equipo_sintomatico",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 88, spo2Postductal = 86, horasDeVida = 24.0, edadGestacionalSem = 38, fcLpm = 168, frRpm = 62, pesoKg = 3.2, sintomas = setOf("cianosis_central", "soplo_cardiaco")),
            resultado = "no_elegible",
            motivoNoElegible = "sintomatico",
        ),
        Caso(
            id = "sano_nivel_del_mar",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 98, spo2Postductal = 97, horasDeVida = 30.0),
            resultado = "negativo",
            banda = "B1",
        ),
        Caso(
            id = "falta_postductal",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 98, horasDeVida = 30.0),
            resultado = "incompleto",
            banda = "B1",
        ),
        Caso(
            id = "critico_solo_en_pie",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 96, spo2Postductal = 85, horasDeVida = 30.0),
            resultado = "positivo",
            banda = "B1",
        ),
        Caso(
            id = "diferencial_mayor_a_3",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 96, spo2Postductal = 90, horasDeVida = 30.0),
            resultado = "repetir",
            banda = "B1",
            proximaRonda = 2,
        ),
        Caso(
            id = "diferencial_invertido",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 92, spo2Postductal = 97, horasDeVida = 30.0),
            resultado = "repetir",
            banda = "B1",
            diferenciaSpo2 = -5,
        ),
        Caso(
            id = "zona_gris_repetir",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 92, spo2Postductal = 91, horasDeVida = 30.0),
            resultado = "repetir",
            banda = "B1",
            proximaRonda = 2,
        ),
        Caso(
            id = "cierre_tercera_ronda",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 92, spo2Postductal = 91, horasDeVida = 32.0, ronda = 3),
            resultado = "positivo",
            banda = "B1",
        ),
        Caso(
            id = "menor_de_24_horas",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 92, spo2Postductal = 91, horasDeVida = 18.0),
            resultado = "no_elegible",
            motivoNoElegible = "menor_24h",
        ),
        Caso(
            id = "sintomatico_domina_sobre_edad",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 92, spo2Postductal = 91, horasDeVida = 10.0, sintomas = setOf("mala_perfusion")),
            resultado = "no_elegible",
            motivoNoElegible = "sintomatico",
        ),
        Caso(
            id = "oxigeno_suplementario",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 97, spo2Postductal = 96, horasDeVida = 30.0, oxigenoSuplementario = true),
            resultado = "no_elegible",
            motivoNoElegible = "oxigeno_suplementario",
        ),
        Caso(
            id = "soplo_no_excluye_pero_avisa",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 98, spo2Postductal = 97, horasDeVida = 30.0, sintomas = setOf("soplo_cardiaco")),
            resultado = "negativo",
            banda = "B1",
            avisoPresente = "soplo_cardiaco",
        ),
        Caso(
            id = "banda2_cusco",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 3400, spo2Preductal = 92, spo2Postductal = 91, horasDeVida = 30.0),
            resultado = "negativo",
            banda = "B2",
        ),
        Caso(
            id = "banda2_positivo",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 3000, spo2Preductal = 84, spo2Postductal = 83, horasDeVida = 30.0),
            resultado = "positivo",
            banda = "B2",
        ),
        Caso(
            id = "limite_altitud_2499",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 2499, spo2Preductal = 96, spo2Postductal = 95, horasDeVida = 30.0),
            resultado = "negativo",
            banda = "B1",
        ),
        Caso(
            id = "limite_altitud_2500",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 2500, spo2Preductal = 96, spo2Postductal = 95, horasDeVida = 30.0),
            resultado = "negativo",
            banda = "B2",
        ),
        Caso(
            id = "limite_altitud_3500",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 3500, spo2Preductal = 89, spo2Postductal = 88, horasDeVida = 30.0),
            resultado = "negativo",
            banda = "B3",
        ),
        Caso(
            id = "limite_spo2_exacto_90_banda1",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 90, spo2Postductal = 90, horasDeVida = 30.0),
            resultado = "repetir",
            banda = "B1",
        ),
        Caso(
            id = "limite_spo2_exacto_95_banda1",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 95, spo2Postductal = 93, horasDeVida = 30.0),
            resultado = "negativo",
            banda = "B1",
        ),
        Caso(
            id = "limite_diferencia_exacta_3",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 98, spo2Postductal = 95, horasDeVida = 30.0),
            resultado = "negativo",
            banda = "B1",
        ),
        Caso(
            id = "prematuro_avisa_no_cambia_resultado",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 98, spo2Postductal = 97, horasDeVida = 30.0, edadGestacionalSem = 34),
            resultado = "negativo",
            banda = "B1",
            avisoPresente = "prematuro",
        ),
        Caso(
            id = "signos_vitales_no_alteran_resultado",
            entrada = MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 98, spo2Postductal = 97, horasDeVida = 30.0, fcLpm = 168, frRpm = 62),
            resultado = "negativo",
            banda = "B1",
            avisoPresente = "fr_alta",
            avisoAusente = "fc_alta",
        ),
    )
}

