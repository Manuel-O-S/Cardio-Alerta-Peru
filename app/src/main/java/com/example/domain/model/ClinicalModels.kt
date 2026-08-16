package com.example.domain.model

enum class AltitudeBand(
    val code: String,
    val bandName: String,
    val minAltitudeMsnm: Int,
    val maxAltitudeMsnm: Int,
    val criticalCutoff: Int,
    val passCutoff: Int,
    val description: String
) {
    B1("B1", "Costa y Selva Baja (<2000 m)", 0, 1999, 90, 95, "corte crítico <90% · pasa con ≥95%"),
    B2("B2", "Sierra Baja (2000 - 2999 m)", 2000, 2999, 88, 93, "corte crítico <88% · pasa con ≥93%"),
    B3("B3", "Sierra Alta (3000 - 3999 m)", 3000, 3999, 84, 90, "corte crítico <84% · pasa con ≥90%"),
    B4("B4", "Gran Altitud (≥4000 m)", 4000, 6000, 80, 88, "corte crítico <80% · pasa con ≥88%");

    companion object {
        fun fromAltitude(altitudeMsnm: Int): AltitudeBand {
            return when {
                altitudeMsnm < 2000 -> B1
                altitudeMsnm < 3000 -> B2
                altitudeMsnm < 4000 -> B3
                else -> B4
            }
        }
    }
}

data class FacilityLocation(
    val name: String,
    val department: String,
    val altitudeMsnm: Int,
    val latitude: Double,
    val longitude: Double
) {
    val band: AltitudeBand get() = AltitudeBand.fromAltitude(altitudeMsnm)
    val coordinatesFormatted: String get() = "%.4f, %.4f".format(latitude, longitude)
}

val DefaultFacilities = listOf(
    FacilityLocation("Lima (Hospital San Bartolomé / INSN)", "Lima", 150, -12.0464, -77.0428),
    FacilityLocation("Trujillo (Hospital Regional Docente)", "La Libertad", 34, -8.1091, -79.0215),
    FacilityLocation("Iquitos (Hospital Apoyo Iquitos)", "Loreto", 106, -3.7437, -73.2516),
    FacilityLocation("Piura (Hospital Cayetano Heredia)", "Piura", 29, -5.1945, -80.6328),
    FacilityLocation("Chiclayo (Hospital Las Mercedes)", "Lambayeque", 27, -6.7714, -79.8409),
    FacilityLocation("Arequipa (Hospital Honorio Delgado)", "Arequipa", 2328, -16.4090, -71.5375),
    FacilityLocation("Ayacucho (Hospital Regional de Ayacucho)", "Ayacucho", 2761, -13.1588, -74.2239),
    FacilityLocation("Huancayo (Hospital El Carmen)", "Junín", 3271, -12.0651, -75.2049),
    FacilityLocation("Huaraz (Hospital Víctor Ramos Guardia)", "Áncash", 3052, -9.5278, -77.5278),
    FacilityLocation("Cusco (Hospital Antonio Lorena / Regional)", "Cusco", 3399, -13.5319, -71.9675),
    FacilityLocation("Puno (Hospital Manuel Núñez Butrón)", "Puno", 3827, -15.8402, -70.0219),
    FacilityLocation("Juliaca (Hospital Carlos Monge Medrano)", "Puno", 3824, -15.4984, -70.1332),
    FacilityLocation("Cerro de Pasco (Hospital Daniel Alcides Carrión)", "Pasco", 4330, -10.6675, -76.2567),
    FacilityLocation("La Oroya (Hospital Alberto Hurtado Abadía)", "Junín", 3745, -11.5278, -75.8997)
)

enum class RiskLevel(val label: String, val colorHex: Long, val badgeText: String) {
    NORMAL_PASS("TAMIZAJE NEGATIVO (PASA)", 0xFF1B8755, "PASA / NORMAL"),
    REPEAT_1_HOUR("REPETIR EN 1 HORA (INDETERMINADO)", 0xFFD97706, "REPETIR EN 1 HORA"),
    CRITICAL_POSITIVE("TAMIZAJE POSITIVO CRÍTICO (CCHD)", 0xFFDC2626, "POSITIVO CRÍTICO"),
    EXCLUDED_SYMPTOMATIC("EXCLUIDO DE TAMIZAJE (SINTOMÁTICO)", 0xFFB91C1C, "EXCLUIDO POR SÍNTOMAS")
}

data class ScreeningSymptoms(
    val hasCentralCyanosis: Boolean = false,
    val hasRespiratoryDistress: Boolean = false,
    val hasBradycardia: Boolean = false,
    val hasHypotension: Boolean = false,
    val hasPoorPerfusion: Boolean = false,
    val hasHepatomegaly: Boolean = false,
    val hasHeartMurmur: Boolean = false,
    val hasTachycardia: Boolean = false,
    val hasSupplementalOxygen: Boolean = false,
    val hasPrenatalHeartDiagnosis: Boolean = false
) {
    val isAnySymptomPresent: Boolean
        get() = hasCentralCyanosis || hasRespiratoryDistress || hasBradycardia ||
                hasHypotension || hasPoorPerfusion || hasHepatomegaly ||
                hasHeartMurmur || hasTachycardia || hasSupplementalOxygen ||
                hasPrenatalHeartDiagnosis

    fun getPresentSymptomsList(): List<String> {
        val list = mutableListOf<String>()
        if (hasCentralCyanosis) list.add("Cianosis central")
        if (hasRespiratoryDistress) list.add("Dificultad respiratoria")
        if (hasBradycardia) list.add("Bradicardia")
        if (hasHypotension) list.add("Hipotensión")
        if (hasPoorPerfusion) list.add("Mala perfusión")
        if (hasHepatomegaly) list.add("Hepatomegalia")
        if (hasHeartMurmur) list.add("Soplo cardíaco")
        if (hasTachycardia) list.add("Taquicardia")
        if (hasSupplementalOxygen) list.add("Oxígeno suplementario")
        if (hasPrenatalHeartDiagnosis) list.add("Diagnóstico prenatal de cardiopatía")
        return list
    }
}

data class ScreeningInput(
    val id: Long = 0,
    val hcNumber: String = "RN-2024-0000",
    val motherName: String = "",
    val preductalSpo2: Int = 98,
    val postductalSpo2: Int = 97,
    val postnatalAgeHours: Int = 30,
    val isAsymptomatic: Boolean = true,
    val symptoms: ScreeningSymptoms = ScreeningSymptoms(),
    val facility: FacilityLocation = DefaultFacilities.first(),
    val attemptNumber: Int = 1,
    val evaluationTimestamp: Long = System.currentTimeMillis()
)

data class ScreeningResult(
    val riskLevel: RiskLevel,
    val summaryTitle: String,
    val primaryFindings: List<String>,
    val deltaSpo2: Int,
    val isDuctalGradientAbnormal: Boolean,
    val clinicalActionPlan: List<String>,
    val transferRecommended: Boolean,
    val requiresOxygenCaution: Boolean,
    val altitudeBandNote: String,
    val nextStepTimeMinutes: Int? = null,
    val attemptNumber: Int = 1
)

data class PendingScreening(
    val id: Long = 0,
    val hcNumber: String,
    val motherName: String,
    val attemptNumber: Int,
    val preductalSpo2: Int,
    val postductalSpo2: Int,
    val postnatalAgeHours: Int,
    val facilityName: String,
    val facilityAltitude: Int,
    val scheduledRepeatTimestamp: Long,
    val createdAtTimestamp: Long
)
