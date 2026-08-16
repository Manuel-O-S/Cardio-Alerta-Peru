package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.domain.engine.NeonatalRiskEngine
import com.example.domain.model.ClinicalSignsSelection
import com.example.domain.model.NeonatalScreeningInput
import com.example.domain.model.PeruRegion
import com.example.domain.model.RiskLevel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

    @Test
    fun `read string from context`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val appName = context.getString(R.string.app_name)
        assertEquals("CardioAlerta Perú", appName)
    }

    @Test
    fun `neonatal risk engine detects critical risk on low SpO2 at sea level`() {
        val input = NeonatalScreeningInput(
            patientCode = "RN-001",
            bedNumber = "Cuna 1",
            gestationalAgeWeeks = 39,
            postnatalAgeHours = 36,
            birthWeightGrams = 3200,
            preductalSpO2 = 88, // < 90% is critical at sea level
            postductalSpO2 = 86,
            heartRateBpm = 140,
            respiratoryRateRpm = 45,
            altitudeMsnm = 50,
            region = PeruRegion.COSTA_LIMA,
            clinicalSigns = ClinicalSignsSelection()
        )

        val result = NeonatalRiskEngine.evaluateScreening(input)
        assertEquals(RiskLevel.CRITICO, result.riskLevel)
        assertTrue(result.requiresImmediateTransfer)
    }

    @Test
    fun `neonatal risk engine adjusts normal range for high altitude in Cusco`() {
        val input = NeonatalScreeningInput(
            patientCode = "RN-CUSCO",
            bedNumber = "Cuna 2",
            gestationalAgeWeeks = 40,
            postnatalAgeHours = 48,
            birthWeightGrams = 3100,
            preductalSpO2 = 91, // Normal physiological SpO2 at 3400m
            postductalSpO2 = 90,
            heartRateBpm = 138,
            respiratoryRateRpm = 42,
            altitudeMsnm = 3399,
            region = PeruRegion.SIERRA_ALTA,
            clinicalSigns = ClinicalSignsSelection()
        )

        val result = NeonatalRiskEngine.evaluateScreening(input)
        assertEquals(RiskLevel.BAJO_RIESGO, result.riskLevel)
    }

    @Test
    fun `neonatal risk engine detects weak femoral pulses as critical ductus dependent lesion`() {
        val input = NeonatalScreeningInput(
            patientCode = "RN-DUCTUS",
            bedNumber = "Cuna 3",
            gestationalAgeWeeks = 38,
            postnatalAgeHours = 30,
            birthWeightGrams = 2900,
            preductalSpO2 = 96,
            postductalSpO2 = 91,
            heartRateBpm = 155,
            respiratoryRateRpm = 52,
            altitudeMsnm = 50,
            region = PeruRegion.COSTA_LIMA,
            clinicalSigns = ClinicalSignsSelection(
                weakFemoralPulses = true,
                pulseAsymmetry = true
            )
        )

        val result = NeonatalRiskEngine.evaluateScreening(input)
        assertEquals(RiskLevel.CRITICO, result.riskLevel)
        assertTrue(result.immediateWarnings.any { it.contains("ALERTA CRÍTICA") })
    }
}
