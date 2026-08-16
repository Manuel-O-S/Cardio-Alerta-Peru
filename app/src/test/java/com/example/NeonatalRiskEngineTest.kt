package com.example

import com.example.domain.engine.NeonatalRiskEngine
import com.example.domain.model.DefaultFacilities
import com.example.domain.model.RiskLevel
import com.example.domain.model.ScreeningInput
import com.example.domain.model.ScreeningSymptoms
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class NeonatalRiskEngineTest {

    @Test
    fun testNormalScreeningAtSeaLevel() {
        val lima = DefaultFacilities.first() // Lima B1 (<2000m)
        val input = ScreeningInput(
            hcNumber = "RN-2024-0001",
            motherName = "García Mendoza, Ana",
            preductalSpo2 = 98,
            postductalSpo2 = 97,
            postnatalAgeHours = 30,
            isAsymptomatic = true,
            symptoms = ScreeningSymptoms(),
            facility = lima
        )

        val result = NeonatalRiskEngine.evaluate(input)
        assertEquals(RiskLevel.NORMAL_PASS, result.riskLevel)
        assertEquals(1, result.deltaSpo2)
        assertEquals(false, result.transferRecommended)
    }

    @Test
    fun testRepeatScreeningInIndeterminateZone() {
        val lima = DefaultFacilities.first() // Lima B1 (corte crítico <90%, pasa ≥95%)
        val input = ScreeningInput(
            hcNumber = "RN-2024-0002",
            motherName = "Flores, Carmen",
            preductalSpo2 = 94,
            postductalSpo2 = 93,
            postnatalAgeHours = 30,
            isAsymptomatic = true,
            symptoms = ScreeningSymptoms(),
            facility = lima,
            attemptNumber = 1
        )

        val result = NeonatalRiskEngine.evaluate(input)
        assertEquals(RiskLevel.REPEAT_1_HOUR, result.riskLevel)
        assertEquals(60, result.nextStepTimeMinutes)
    }

    @Test
    fun testCriticalPositiveScreening() {
        val lima = DefaultFacilities.first()
        val input = ScreeningInput(
            hcNumber = "RN-2024-0003",
            motherName = "Mamani, Rosa",
            preductalSpo2 = 88,
            postductalSpo2 = 84,
            postnatalAgeHours = 28,
            isAsymptomatic = true,
            symptoms = ScreeningSymptoms(),
            facility = lima
        )

        val result = NeonatalRiskEngine.evaluate(input)
        assertEquals(RiskLevel.CRITICAL_POSITIVE, result.riskLevel)
        assertTrue(result.transferRecommended)
        assertTrue(result.requiresOxygenCaution)
    }

    @Test
    fun testExcludedSymptomaticScreening() {
        val lima = DefaultFacilities.first()
        val input = ScreeningInput(
            hcNumber = "RN-2024-0004",
            motherName = "Dávila, Lucía",
            preductalSpo2 = 92,
            postductalSpo2 = 90,
            postnatalAgeHours = 18,
            isAsymptomatic = false,
            symptoms = ScreeningSymptoms(
                hasCentralCyanosis = true,
                hasRespiratoryDistress = true
            ),
            facility = lima
        )

        val result = NeonatalRiskEngine.evaluate(input)
        assertEquals(RiskLevel.EXCLUDED_SYMPTOMATIC, result.riskLevel)
        assertTrue(result.transferRecommended)
    }

    @Test
    fun testHighAltitudeAdaptationCusco() {
        // Cusco (3399 msnm, Banda B3: corte crítico <84%, pasa con ≥90%)
        val cusco = DefaultFacilities.find { it.name.contains("Cusco") } ?: DefaultFacilities[9]
        val inputCusco = ScreeningInput(
            hcNumber = "RN-2024-0005",
            motherName = "Condori, Elena",
            preductalSpo2 = 91,
            postductalSpo2 = 90,
            postnatalAgeHours = 32,
            isAsymptomatic = true,
            symptoms = ScreeningSymptoms(),
            facility = cusco
        )

        val result = NeonatalRiskEngine.evaluate(inputCusco)
        assertEquals(RiskLevel.NORMAL_PASS, result.riskLevel)
    }
}
