package pe.cardioalerta.tamizaje

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Suite de conformidad del motor de tamizaje (Kotlin).
 *
 * Va en `app/src/test/java/pe/cardioalerta/tamizaje/` — es una prueba unitaria
 * normal de JVM, no necesita emulador ni dispositivo. Corre con:
 *
 *     ./gradlew test
 *
 * Los casos vienen de VectoresConformidad.kt, generado desde el MISMO archivo
 * JSON que usan las suites de JavaScript y Python. Si un caso falla aca pero
 * pasa alla, la app y el backend estan clasificando distinto al mismo bebe.
 */
class MotorTamizajeTest {

    private fun salidaDe(entrada: MotorTamizaje.Entrada): MotorTamizaje.Salida {
        val evaluacion = MotorTamizaje.evaluarCaso(entrada)
        assertTrue(
            "La entrada no valido: $evaluacion",
            evaluacion is MotorTamizaje.Evaluacion.Valida,
        )
        return (evaluacion as MotorTamizaje.Evaluacion.Valida).salida
    }

    // --- 1. Vectores de conformidad compartidos ---------------------------

    @Test
    fun versionDeUmbralesCoincideConLosVectores() {
        assertEquals(VectoresConformidad.VERSION_UMBRALES, MotorTamizaje.VERSION_UMBRALES)
    }

    @Test
    fun todosLosVectoresDeConformidadPasan() {
        val fallos = mutableListOf<String>()

        for (caso in VectoresConformidad.CASOS) {
            val evaluacion = MotorTamizaje.evaluarCaso(caso.entrada)
            if (evaluacion !is MotorTamizaje.Evaluacion.Valida) {
                fallos += "${caso.id}: la entrada no valido"
                continue
            }
            val s = evaluacion.salida

            val resultado = s.resultado.name.lowercase()
            if (resultado != caso.resultado) {
                fallos += "${caso.id}: resultado $resultado, se esperaba ${caso.resultado}"
            }
            caso.banda?.let {
                if (s.banda?.id != it) fallos += "${caso.id}: banda ${s.banda?.id}, se esperaba $it"
            }
            caso.motivoNoElegible?.let {
                val motivo = s.motivoNoElegible?.name?.lowercase()
                if (motivo != it) fallos += "${caso.id}: motivo $motivo, se esperaba $it"
            }
            caso.proximaRonda?.let {
                if (s.proximaRonda != it) fallos += "${caso.id}: proximaRonda ${s.proximaRonda}, se esperaba $it"
            }
            caso.diferenciaSpo2?.let {
                if (s.diferenciaSpo2 != it) fallos += "${caso.id}: diferencia ${s.diferenciaSpo2}, se esperaba $it"
            }
            caso.avisoPresente?.let { codigo ->
                if (s.avisos.none { it.codigo == codigo }) fallos += "${caso.id}: falta el aviso $codigo"
            }
            caso.avisoAusente?.let { codigo ->
                if (s.avisos.any { it.codigo == codigo }) fallos += "${caso.id}: sobra el aviso $codigo"
            }
            if (s.advertencia.isBlank()) {
                fallos += "${caso.id}: falta la advertencia obligatoria"
            }
        }

        assertTrue(
            "Fallaron ${fallos.size} de ${VectoresConformidad.CASOS.size} vectores:\n" +
                fallos.joinToString("\n"),
            fallos.isEmpty(),
        )
    }

    // --- 2. Regresion del bug mas importante ------------------------------

    /**
     * Aplicar el umbral de nivel del mar en la sierra. Un recien nacido sano en
     * Juliaca (3825 msnm) satura alrededor de 88%: con el corte de banda 1 sale
     * positivo, con el de su banda no. Este es el caso que justifica el proyecto.
     */
    @Test
    fun altitudAltaNoMarcaPositivoAUnNeonatoSanoDeAltura() {
        val b1 = MotorTamizaje.bandaPorAltitud(150)!!
        val b3 = MotorTamizaje.bandaPorAltitud(3825)!!
        assertEquals(MotorTamizaje.Resultado.NEGATIVO, MotorTamizaje.evaluarRonda(b3, 88, 87))
        assertEquals(MotorTamizaje.Resultado.POSITIVO, MotorTamizaje.evaluarRonda(b1, 88, 87))
    }

    // --- 3. La puerta de elegibilidad -------------------------------------

    @Test
    fun recienNacidoSintomaticoNoSeTamiza() {
        val s = salidaDe(
            MotorTamizaje.Entrada(
                altitudMsnm = 150, spo2Preductal = 88, spo2Postductal = 86,
                horasDeVida = 24.0, sintomas = setOf("cianosis_central"),
            )
        )
        assertEquals(MotorTamizaje.Resultado.NO_ELEGIBLE, s.resultado)
        assertEquals(MotorTamizaje.MotivoNoElegible.SINTOMATICO, s.motivoNoElegible)
        assertTrue(s.sintomasDeAlarma.contains("Cianosis central"))
    }

    @Test
    fun elSintomaticoDominaSobreLasDemasCausas() {
        // Bebe de 10 h con mala perfusion: el motivo es sintomatico, no la edad.
        // Importa porque cambia la conducta de "espere" a "evalue ahora".
        assertEquals(
            MotorTamizaje.MotivoNoElegible.SINTOMATICO,
            MotorTamizaje.evaluarElegibilidad(10.0, setOf("mala_perfusion"), true, true),
        )
    }

    @Test
    fun elSoploNoExcluyeDelTamizajePeroSiAvisa() {
        val s = salidaDe(
            MotorTamizaje.Entrada(
                altitudMsnm = 150, spo2Preductal = 98, spo2Postductal = 97,
                horasDeVida = 30.0, sintomas = setOf("soplo_cardiaco"),
            )
        )
        assertEquals(MotorTamizaje.Resultado.NEGATIVO, s.resultado)
        assertTrue(s.avisos.any { it.codigo == "soplo_cardiaco" })
    }

    @Test
    fun elegibilidadNormal() {
        assertNull(MotorTamizaje.evaluarElegibilidad(30.0, emptySet(), false, false))
        assertEquals(
            MotorTamizaje.MotivoNoElegible.MENOR_24H,
            MotorTamizaje.evaluarElegibilidad(23.9, emptySet(), false, false),
        )
        assertNull(MotorTamizaje.evaluarElegibilidad(24.0, emptySet(), false, false))
    }

    // --- 4. Medicion incompleta -------------------------------------------

    @Test
    fun sinPostductalElTamizajeQuedaIncompletoNoNegativo() {
        val s = salidaDe(
            MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 98, horasDeVida = 30.0)
        )
        assertEquals(MotorTamizaje.Resultado.INCOMPLETO, s.resultado)
        assertTrue(s.avisos.any { it.codigo == "falta_postductal" })
    }

    @Test
    fun sinPostductalPeroConPreductalCriticoSiEsPositivo() {
        // No hace falta el pie para reprobar a un bebe que satura 85 a nivel del mar.
        val s = salidaDe(
            MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 85, horasDeVida = 30.0)
        )
        assertEquals(MotorTamizaje.Resultado.POSITIVO, s.resultado)
    }

    // --- 5. Retamizaje -----------------------------------------------------

    @Test
    fun elRetamizajeCierraEnLaTerceraRonda() {
        val entrada = MotorTamizaje.Entrada(
            altitudMsnm = 150, spo2Preductal = 92, spo2Postductal = 91, horasDeVida = 30.0,
        )
        assertEquals(MotorTamizaje.Resultado.REPETIR, salidaDe(entrada.copy(ronda = 1)).resultado)
        assertEquals(MotorTamizaje.Resultado.REPETIR, salidaDe(entrada.copy(ronda = 2)).resultado)
        assertEquals(MotorTamizaje.Resultado.POSITIVO, salidaDe(entrada.copy(ronda = 3)).resultado)
    }

    @Test
    fun elRepetirTraeLaProximaRondaYLaEspera() {
        val s = salidaDe(
            MotorTamizaje.Entrada(
                altitudMsnm = 150, spo2Preductal = 92, spo2Postductal = 91,
                horasDeVida = 30.0, ronda = 1,
            )
        )
        assertEquals(2, s.proximaRonda)
        assertEquals(60, s.minutosEspera)
    }

    // --- 6. Diferencial ----------------------------------------------------

    @Test
    fun laDiferenciaConservaElSignoParaElRegistro() {
        assertEquals(-5, MotorTamizaje.diferenciaConSigno(92, 97))
        assertEquals(6, MotorTamizaje.diferenciaConSigno(96, 90))
        assertNull(MotorTamizaje.diferenciaConSigno(96, null))
    }

    // --- 7. Umbrales provisionales marcados --------------------------------

    @Test
    fun losUmbralesProvisionalesEstanMarcadosYAvisan() {
        assertEquals(MotorTamizaje.EstadoUmbral.VERIFICADO, MotorTamizaje.bandaPorAltitud(150)!!.estado)
        assertEquals(MotorTamizaje.EstadoUmbral.PROVISIONAL, MotorTamizaje.bandaPorAltitud(3000)!!.estado)
        assertEquals(MotorTamizaje.EstadoUmbral.PROVISIONAL, MotorTamizaje.bandaPorAltitud(4000)!!.estado)

        val s = salidaDe(
            MotorTamizaje.Entrada(
                altitudMsnm = 3825, spo2Preductal = 90, spo2Postductal = 89, horasDeVida = 30.0,
            )
        )
        assertTrue(s.avisos.any { it.codigo == "umbral_provisional" })
    }

    // --- 8. Los signos vitales no alteran el resultado ----------------------

    @Test
    fun losSignosVitalesAvisanPeroNoCambianElResultado() {
        val base = MotorTamizaje.Entrada(
            altitudMsnm = 150, spo2Preductal = 98, spo2Postductal = 97, horasDeVida = 30.0,
        )
        val sinSignos = salidaDe(base)
        val conSignos = salidaDe(base.copy(fcLpm = 200, frRpm = 80, pesoKg = 2.0))

        assertEquals(sinSignos.resultado, conSignos.resultado)
        assertTrue(conSignos.avisos.any { it.codigo == "fc_alta" })
        assertTrue(conSignos.avisos.any { it.codigo == "fr_alta" })
        assertTrue(conSignos.avisos.any { it.codigo == "bajo_peso" })
    }

    // --- 9. Validacion de entrada ------------------------------------------

    @Test
    fun laEntradaInvalidaSeRechaza() {
        val evaluacion = MotorTamizaje.evaluarCaso(
            MotorTamizaje.Entrada(altitudMsnm = 150, spo2Preductal = 120)
        )
        assertTrue(evaluacion is MotorTamizaje.Evaluacion.Invalida)
        assertNotNull((evaluacion as MotorTamizaje.Evaluacion.Invalida).errores["spo2Preductal"])
    }

    @Test
    fun laAltitudFueraDeBandasSeRechaza() {
        val evaluacion = MotorTamizaje.evaluarCaso(
            MotorTamizaje.Entrada(altitudMsnm = 6000, spo2Preductal = 98)
        )
        assertTrue(evaluacion is MotorTamizaje.Evaluacion.Invalida)
    }

    // --- 10. La advertencia nunca falta ------------------------------------

    @Test
    fun laAdvertenciaSiempreAcompanaAlResultado() {
        for (caso in VectoresConformidad.CASOS) {
            val evaluacion = MotorTamizaje.evaluarCaso(caso.entrada)
            if (evaluacion is MotorTamizaje.Evaluacion.Valida) {
                assertTrue(
                    "Caso ${caso.id} salio sin advertencia",
                    evaluacion.salida.advertencia.isNotBlank(),
                )
            }
        }
    }
}
