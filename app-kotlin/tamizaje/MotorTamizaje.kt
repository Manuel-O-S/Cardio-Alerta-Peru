package pe.cardioalerta.tamizaje

/**
 * Motor de tamizaje neonatal por oximetria de pulso.
 *
 * Kotlin puro: cero dependencias de Android, cero librerias externas. Por eso
 * corre en pruebas unitarias normales (test/, no androidTest/), sin emulador y
 * sin Robolectric, y por eso el tamizaje funciona con el celular en modo avion.
 *
 * ESTO NO ES UN MODELO DE IA, Y ESO ES A PROPOSITO.
 * Es un algoritmo determinista publicado. Un cardiologo o un regulador tiene que
 * poder leer la regla completa y verificarla. Un clasificador opaco decidiendo
 * sobre neonatos es peor producto, no mejor.
 *
 * Los umbrales estan replicados desde compartido/umbrales.json. Si cambias un
 * numero aca, cambialo tambien en motorTamizaje.js y motor_reglas.py, y corre
 * las tres suites de conformidad.
 */
object MotorTamizaje {

    const val VERSION_UMBRALES = "1.0.0"

    const val ADVERTENCIA_FIJA =
        "Resultado de un tamizaje, no de un diagnostico. No reemplaza el " +
        "criterio clinico del especialista."

    // -----------------------------------------------------------------------
    // Tipos
    // -----------------------------------------------------------------------

    enum class Resultado { NO_ELEGIBLE, POSITIVO, NEGATIVO, REPETIR, INCOMPLETO }

    enum class MotivoNoElegible {
        SINTOMATICO, OXIGENO_SUPLEMENTARIO, DIAGNOSTICO_PRENATAL, MENOR_24H
    }

    enum class EstadoUmbral { VERIFICADO, PROVISIONAL }

    enum class NivelAviso { ALTO, MEDIO, BAJO }

    data class Banda(
        val id: String,
        val nombre: String,
        val altitudMin: Int,
        val altitudMax: Int,
        val spo2Critico: Int,
        val spo2Pasa: Int,
        val diferenciaMax: Int,
        val estado: EstadoUmbral,
    )

    data class Aviso(val codigo: String, val nivel: NivelAviso, val mensaje: String)

    /**
     * Entrada del motor. Solo [altitudMsnm] y [spo2Preductal] son obligatorios;
     * el resto es opcional para que la app pueda evaluar con lo que tenga y el
     * motor avise de lo que falta.
     */
    data class Entrada(
        val altitudMsnm: Int,
        val spo2Preductal: Int,
        val spo2Postductal: Int? = null,
        val horasDeVida: Double? = null,
        val edadGestacionalSem: Int? = null,
        val fcLpm: Int? = null,
        val frRpm: Int? = null,
        val pesoKg: Double? = null,
        val sintomas: Set<String> = emptySet(),
        val oxigenoSuplementario: Boolean = false,
        val diagnosticoPrenatalCC: Boolean = false,
        val ronda: Int = 1,
    )

    data class Salida(
        val resultado: Resultado,
        val motivoNoElegible: MotivoNoElegible?,
        val sintomasDeAlarma: List<String>,
        val banda: Banda?,
        val conducta: String,
        val ronda: Int,
        val proximaRonda: Int?,
        val minutosEspera: Int?,
        val diferenciaSpo2: Int?,
        val avisos: List<Aviso>,
        val versionUmbrales: String = VERSION_UMBRALES,
        val advertencia: String = ADVERTENCIA_FIJA,
    )

    /** Resultado de evaluar: o hay errores de entrada, o hay una salida clinica. */
    sealed class Evaluacion {
        data class Invalida(val errores: Map<String, String>) : Evaluacion()
        data class Valida(val salida: Salida) : Evaluacion()
    }

    // -----------------------------------------------------------------------
    // Tabla de umbrales — espejo de compartido/umbrales.json
    // -----------------------------------------------------------------------

    val BANDAS = listOf(
        Banda("B1", "Nivel del mar hasta 2500 msnm", 0, 2499, 90, 95, 3, EstadoUmbral.VERIFICADO),
        Banda("B2", "2500 a 3500 msnm", 2500, 3499, 86, 91, 3, EstadoUmbral.PROVISIONAL),
        Banda("B3", "Mayor a 3500 msnm", 3500, 5100, 83, 88, 3, EstadoUmbral.PROVISIONAL),
    )

    const val HORAS_MINIMAS = 24.0
    const val HORAS_IDEALES_MAX = 48.0
    const val RONDAS_MAXIMAS = 3
    const val MINUTOS_ESPERA = 60

    const val FC_MIN = 100
    const val FC_MAX = 180
    const val FR_MIN = 30
    const val FR_MAX = 60
    const val PESO_MIN = 2.5
    const val EDAD_GESTACIONAL_TERMINO = 37

    val SINTOMAS_ALARMA = setOf(
        "cianosis_central", "dificultad_respiratoria", "bradicardia",
        "hipotension", "mala_perfusion", "hepatomegalia",
    )

    val SINTOMAS_CONTEXTO = setOf("soplo_cardiaco", "taquicardia")

    val ETIQUETAS_SINTOMAS = mapOf(
        "cianosis_central" to "Cianosis central",
        "soplo_cardiaco" to "Soplo cardiaco",
        "dificultad_respiratoria" to "Dificultad respiratoria",
        "taquicardia" to "Taquicardia",
        "bradicardia" to "Bradicardia",
        "hipotension" to "Hipotension",
        "mala_perfusion" to "Mala perfusion",
        "hepatomegalia" to "Hepatomegalia",
    )

    // -----------------------------------------------------------------------
    // Piezas del algoritmo
    // -----------------------------------------------------------------------

    /** Banda de altitud correspondiente, o null si esta fuera de rango. */
    fun bandaPorAltitud(altitudMsnm: Int): Banda? =
        BANDAS.firstOrNull { altitudMsnm >= it.altitudMin && altitudMsnm <= it.altitudMax }

    /**
     * Puerta de elegibilidad. Se corre ANTES del algoritmo.
     *
     * La razon de que exista: el tamizaje esta disenado para recien nacidos
     * ASINTOMATICOS. Un bebe con cianosis central no necesita que una app le
     * diga si "paso" — necesita evaluacion inmediata. Correrle el algoritmo y
     * devolver NEGATIVO seria el peor error posible de este producto.
     *
     * @return el motivo de no elegibilidad, o null si si es elegible.
     */
    fun evaluarElegibilidad(
        horasDeVida: Double?,
        sintomas: Set<String>,
        oxigenoSuplementario: Boolean,
        diagnosticoPrenatalCC: Boolean,
    ): MotivoNoElegible? {
        // El sintomatico domina sobre todo lo demas: es el caso mas urgente.
        if (sintomas.any { it in SINTOMAS_ALARMA }) return MotivoNoElegible.SINTOMATICO
        if (diagnosticoPrenatalCC) return MotivoNoElegible.DIAGNOSTICO_PRENATAL
        if (oxigenoSuplementario) return MotivoNoElegible.OXIGENO_SUPLEMENTARIO
        if (horasDeVida != null && horasDeVida < HORAS_MINIMAS) return MotivoNoElegible.MENOR_24H
        return null
    }

    /** Diferencia con signo, para guardar en el registro. */
    fun diferenciaConSigno(preductal: Int, postductal: Int?): Int? =
        if (postductal == null) null else preductal - postductal

    /**
     * El algoritmo, en una sola ronda de medicion.
     *
     * Si falta la medicion del pie devuelve INCOMPLETO en vez de NEGATIVO: sin
     * el diferencial no se detectan las lesiones que cursan con saturacion
     * preductal normal (coartacion, interrupcion de arco). Un "negativo" ahi
     * seria una falsa tranquilidad.
     */
    fun evaluarRonda(banda: Banda, spo2Preductal: Int, spo2Postductal: Int?): Resultado {
        if (spo2Preductal < banda.spo2Critico) return Resultado.POSITIVO
        if (spo2Postductal != null && spo2Postductal < banda.spo2Critico) return Resultado.POSITIVO

        if (spo2Postductal == null) return Resultado.INCOMPLETO

        val algunaPasa = spo2Preductal >= banda.spo2Pasa || spo2Postductal >= banda.spo2Pasa
        val diferenciaOk =
            kotlin.math.abs(spo2Preductal - spo2Postductal) <= banda.diferenciaMax

        return if (algunaPasa && diferenciaOk) Resultado.NEGATIVO else Resultado.REPETIR
    }

    /**
     * A la tercera ronda sin pasar, el resultado es positivo. Sin esta regla el
     * caso queda en "repetir" para siempre.
     */
    fun aplicarCierreDeRondas(resultado: Resultado, ronda: Int): Resultado =
        if (resultado == Resultado.REPETIR && ronda >= RONDAS_MAXIMAS) Resultado.POSITIVO
        else resultado

    // -----------------------------------------------------------------------
    // Avisos — informacion clinica que NO altera el resultado
    // -----------------------------------------------------------------------

    /**
     * Deliberadamente NO se combinan signos en un puntaje compuesto. Inventar un
     * score que mezcle oximetria + soplo + taquicardia seria fabricar una regla
     * clinica que nadie valido. El resultado sale solo del algoritmo publicado;
     * esto es contexto para el especialista.
     */
    fun construirAvisos(entrada: Entrada, banda: Banda, resultado: Resultado): List<Aviso> {
        val avisos = mutableListOf<Aviso>()

        if (banda.estado == EstadoUmbral.PROVISIONAL) {
            avisos += Aviso(
                "umbral_provisional", NivelAviso.ALTO,
                "Los umbrales de la banda ${banda.id} son provisionales y estan " +
                    "pendientes de verificacion contra la fuente peruana. Uso de " +
                    "prototipo unicamente.",
            )
        }

        if ("soplo_cardiaco" in entrada.sintomas) {
            avisos += Aviso(
                "soplo_cardiaco", NivelAviso.ALTO,
                "Soplo cardiaco registrado. Requiere evaluacion clinica sea cual sea " +
                    "el resultado del tamizaje: el algoritmo de oximetria no lo toma " +
                    "en cuenta.",
            )
        }

        if (entrada.spo2Postductal == null) {
            avisos += Aviso(
                "falta_postductal", NivelAviso.ALTO,
                "Falta la SpO2 postductal (pie). Sin ella no se puede evaluar la " +
                    "diferencia preductal-postductal y el tamizaje queda incompleto.",
            )
        }

        if (entrada.spo2Preductal < 70) {
            avisos += Aviso(
                "senal_dudosa", NivelAviso.MEDIO,
                "Saturacion muy baja. Confirmar colocacion y senal del sensor antes de actuar.",
            )
        }

        entrada.edadGestacionalSem?.let {
            if (it < EDAD_GESTACIONAL_TERMINO) {
                avisos += Aviso(
                    "prematuro", NivelAviso.MEDIO,
                    "Recien nacido pretermino ($it sem). El algoritmo se valido " +
                        "principalmente en recien nacidos a termino; interpretar con cautela.",
                )
            }
        }

        entrada.horasDeVida?.let {
            if (it > HORAS_IDEALES_MAX) {
                avisos += Aviso(
                    "fuera_de_ventana", NivelAviso.BAJO,
                    "Tamizaje a las $it h de vida, fuera de la ventana ideal de " +
                        "${HORAS_MINIMAS.toInt()} a ${HORAS_IDEALES_MAX.toInt()} h.",
                )
            }
        }

        entrada.fcLpm?.let {
            when {
                it > FC_MAX -> avisos += Aviso("fc_alta", NivelAviso.MEDIO,
                    "FC $it lpm por encima del rango de referencia ($FC_MIN-$FC_MAX).")
                it < FC_MIN -> avisos += Aviso("fc_baja", NivelAviso.MEDIO,
                    "FC $it lpm por debajo del rango de referencia ($FC_MIN-$FC_MAX).")
            }
        }

        entrada.frRpm?.let {
            when {
                it > FR_MAX -> avisos += Aviso("fr_alta", NivelAviso.MEDIO,
                    "FR $it rpm por encima del rango de referencia ($FR_MIN-$FR_MAX). Taquipnea.")
                it < FR_MIN -> avisos += Aviso("fr_baja", NivelAviso.MEDIO,
                    "FR $it rpm por debajo del rango de referencia ($FR_MIN-$FR_MAX).")
            }
        }

        entrada.pesoKg?.let {
            if (it < PESO_MIN) {
                avisos += Aviso("bajo_peso", NivelAviso.BAJO,
                    "Peso $it kg por debajo de $PESO_MIN kg.")
            }
        }

        when (resultado) {
            Resultado.POSITIVO -> avisos += Aviso(
                "positivo_no_es_diagnostico", NivelAviso.ALTO,
                "Tamizaje no superado. Por cada cardiopatia critica detectada hay " +
                    "varios casos de causa infecciosa o respiratoria: requiere " +
                    "evaluacion medica, no equivale a diagnostico de cardiopatia.",
            )
            Resultado.NEGATIVO -> avisos += Aviso(
                "negativo_no_descarta", NivelAviso.MEDIO,
                "Tamizaje superado. No descarta cardiopatia congenita: algunas no " +
                    "cursan con hipoxemia en el periodo neonatal.",
            )
            else -> {}
        }

        return avisos
    }

    // -----------------------------------------------------------------------
    // Validacion de entrada
    // -----------------------------------------------------------------------

    fun validarEntrada(entrada: Entrada): Map<String, String> {
        val errores = mutableMapOf<String, String>()

        fun rango(campo: String, valor: Int?, min: Int, max: Int) {
            if (valor != null && (valor < min || valor > max)) {
                errores[campo] = "Fuera de rango ($min a $max)."
            }
        }

        rango("altitudMsnm", entrada.altitudMsnm, 0, 5100)
        rango("spo2Preductal", entrada.spo2Preductal, 0, 100)
        rango("spo2Postductal", entrada.spo2Postductal, 0, 100)
        rango("fcLpm", entrada.fcLpm, 30, 300)
        rango("frRpm", entrada.frRpm, 5, 150)
        rango("edadGestacionalSem", entrada.edadGestacionalSem, 20, 45)
        rango("ronda", entrada.ronda, 1, RONDAS_MAXIMAS)

        entrada.horasDeVida?.let {
            if (it < 0 || it > 720) errores["horasDeVida"] = "Fuera de rango (0 a 720)."
        }
        entrada.pesoKg?.let {
            if (it < 0.3 || it > 7.0) errores["pesoKg"] = "Fuera de rango (0.3 a 7.0)."
        }

        if (!errores.containsKey("altitudMsnm") && bandaPorAltitud(entrada.altitudMsnm) == null) {
            errores["altitudMsnm"] = "Altitud fuera de las bandas definidas (0 a 5100 msnm)."
        }

        return errores
    }

    // -----------------------------------------------------------------------
    // Entrada unica al motor
    // -----------------------------------------------------------------------

    private fun conductaNoElegible(motivo: MotivoNoElegible): String = when (motivo) {
        MotivoNoElegible.SINTOMATICO ->
            "No corresponde tamizaje. Recien nacido sintomatico: evaluacion clinica inmediata."
        MotivoNoElegible.DIAGNOSTICO_PRENATAL ->
            "No corresponde tamizaje. Ya hay diagnostico prenatal de cardiopatia: seguir el plan establecido."
        MotivoNoElegible.OXIGENO_SUPLEMENTARIO ->
            "No corresponde tamizaje mientras reciba oxigeno suplementario. La saturacion no es interpretable."
        MotivoNoElegible.MENOR_24H ->
            "Aun no corresponde tamizaje. Repetir a partir de las ${HORAS_MINIMAS.toInt()} h de vida."
    }

    /** Evalua un caso completo. Es la unica funcion que la app necesita llamar. */
    fun evaluarCaso(entrada: Entrada): Evaluacion {
        val errores = validarEntrada(entrada)
        if (errores.isNotEmpty()) return Evaluacion.Invalida(errores)

        val banda = bandaPorAltitud(entrada.altitudMsnm)!!

        val motivo = evaluarElegibilidad(
            entrada.horasDeVida, entrada.sintomas,
            entrada.oxigenoSuplementario, entrada.diagnosticoPrenatalCC,
        )

        if (motivo != null) {
            return Evaluacion.Valida(
                Salida(
                    resultado = Resultado.NO_ELEGIBLE,
                    motivoNoElegible = motivo,
                    sintomasDeAlarma = entrada.sintomas
                        .filter { it in SINTOMAS_ALARMA }
                        .map { ETIQUETAS_SINTOMAS[it] ?: it },
                    banda = banda,
                    conducta = conductaNoElegible(motivo),
                    ronda = entrada.ronda,
                    proximaRonda = null,
                    minutosEspera = null,
                    diferenciaSpo2 = null,
                    avisos = emptyList(),
                )
            )
        }

        var resultado = evaluarRonda(banda, entrada.spo2Preductal, entrada.spo2Postductal)
        resultado = aplicarCierreDeRondas(resultado, entrada.ronda)
        val esRepetir = resultado == Resultado.REPETIR

        val conducta = when (resultado) {
            Resultado.POSITIVO ->
                "Tamizaje no superado. Requiere evaluacion medica y, segun disponibilidad, " +
                    "ecocardiografia. Considerar derivacion al centro de referencia mas cercano."
            Resultado.NEGATIVO -> "Tamizaje superado. Continuar con los cuidados habituales."
            Resultado.REPETIR ->
                "Repetir la medicion en $MINUTOS_ESPERA minutos " +
                    "(ronda ${entrada.ronda + 1} de $RONDAS_MAXIMAS)."
            Resultado.INCOMPLETO ->
                "Falta la medicion en el pie (postductal). Completar antes de emitir un resultado."
            Resultado.NO_ELEGIBLE -> ""
        }

        return Evaluacion.Valida(
            Salida(
                resultado = resultado,
                motivoNoElegible = null,
                sintomasDeAlarma = emptyList(),
                banda = banda,
                conducta = conducta,
                ronda = entrada.ronda,
                proximaRonda = if (esRepetir) entrada.ronda + 1 else null,
                minutosEspera = if (esRepetir) MINUTOS_ESPERA else null,
                diferenciaSpo2 = diferenciaConSigno(entrada.spo2Preductal, entrada.spo2Postductal),
                avisos = construirAvisos(entrada, banda, resultado),
            )
        )
    }
}
