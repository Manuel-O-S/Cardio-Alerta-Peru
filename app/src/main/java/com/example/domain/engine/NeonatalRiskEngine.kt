package com.example.domain.engine

import com.example.domain.model.AltitudeBand
import com.example.domain.model.RiskLevel
import com.example.domain.model.ScreeningInput
import com.example.domain.model.ScreeningResult
import kotlin.math.abs

object NeonatalRiskEngine {

    fun evaluate(input: ScreeningInput): ScreeningResult {
        val findings = mutableListOf<String>()
        val actionPlan = mutableListOf<String>()
        val deltaSpo2 = abs(input.preductalSpo2 - input.postductalSpo2)
        val band = input.facility.band

        val criticalCutoff = band.criticalCutoff
        val passCutoff = band.passCutoff

        val bandNote = "Banda ${band.code} (${band.bandName}): ${band.description}"

        // CHECK 1: Clinical Symptoms (Exclusion criteria from routine screening)
        val presentSymptoms = input.symptoms.getPresentSymptomsList()
        val hasExclusionSymptoms = !input.isAsymptomatic || presentSymptoms.isNotEmpty()

        if (hasExclusionSymptoms) {
            val symptomsJoined = if (presentSymptoms.isNotEmpty()) presentSymptoms.joinToString(", ") else "Sintomatología clínica presente"
            findings.add("EXCLUSIÓN DE TAMIZAJE RUTINARIO: El neonato presenta signos clínicos de alarma ($symptomsJoined).")
            findings.add("El tamizaje por oximetría es exclusivo para recién nacidos asintomáticos.")
            if (input.preductalSpo2 < passCutoff || input.postductalSpo2 < passCutoff) {
                findings.add("Saturación alterada: Preductal ${input.preductalSpo2}%, Postductal ${input.postductalSpo2}%.")
            }
            if (deltaSpo2 > 3) {
                findings.add("Gradiente ductal patológico (ΔSpO₂ = $deltaSpo2%).")
            }

            actionPlan.add("1. ATENCIÓN MÉDICA INMEDIATA por Médico Pediatra / Neonatólogo.")
            actionPlan.add("2. NO demorar la atención ni esperar tiempos de tamizaje rutinario.")
            actionPlan.add("3. Monitoreo continuo de funciones vitales y evaluación hemodinámica integral.")
            actionPlan.add("4. Solicitar Ecocardiograma Doppler urgente y evaluación de transporte asistido.")
            actionPlan.add("5. Precaución con oxígeno al 100% si hay sospecha de cardiopatía ductus-dependiente.")

            return ScreeningResult(
                riskLevel = RiskLevel.EXCLUDED_SYMPTOMATIC,
                summaryTitle = "EXCLUIDO DE TAMIZAJE (SINTOMÁTICO)",
                primaryFindings = findings,
                deltaSpo2 = deltaSpo2,
                isDuctalGradientAbnormal = deltaSpo2 > 3,
                clinicalActionPlan = actionPlan,
                transferRecommended = true,
                requiresOxygenCaution = input.symptoms.hasSupplementalOxygen || input.symptoms.hasCentralCyanosis || input.symptoms.hasPrenatalHeartDiagnosis,
                altitudeBandNote = bandNote,
                nextStepTimeMinutes = null,
                attemptNumber = input.attemptNumber
            )
        }

        // Timing warning note if done before 24h
        if (input.postnatalAgeHours < 24) {
            findings.add("Nota de edad postnatal (${input.postnatalAgeHours} horas): Realizado antes de las 24 horas. Puede existir persistencia de circulación fetal transicional.")
        }

        // Ductal gradient check
        val isGradientAbnormal = deltaSpo2 > 3
        if (isGradientAbnormal) {
            findings.add("Gradiente pre/postductal patológico: Diferencia de ${deltaSpo2}% (> 3%) entre mano derecha (${input.preductalSpo2}%) y pie (${input.postductalSpo2}%).")
        }

        // Saturation levels check
        val isPreductalCritical = input.preductalSpo2 < criticalCutoff
        val isPostductalCritical = input.postductalSpo2 < criticalCutoff
        val isPreductalPass = input.preductalSpo2 >= passCutoff
        val isPostductalPass = input.postductalSpo2 >= passCutoff

        // 1. CRITICAL POSITIVE
        if (isPreductalCritical || isPostductalCritical || (input.attemptNumber >= 3 && (!isPreductalPass || !isPostductalPass || isGradientAbnormal))) {
            val isDueToAttempts = input.attemptNumber >= 3 && !isPreductalCritical && !isPostductalCritical
            if (isPreductalCritical) findings.add("SpO₂ preductal (${input.preductalSpo2}%) < valor crítico (<${criticalCutoff}%).")
            if (isPostductalCritical) findings.add("SpO₂ postductal (${input.postductalSpo2}%) < valor crítico (<${criticalCutoff}%).")
            if (isDueToAttempts) findings.add("Tercer intento consecutivo en zona indeterminada: Se clasifica como POSITIVO.")

            actionPlan.add("1. ALERTA ROJA: Notificación inmediata al Pediatra de guardia y coordinación de referencia a Nivel III con Cardiología Pediátrica.")
            actionPlan.add("2. NO administrar oxígeno al 100% de forma indiscriminada (la hiperoxia puede acelerar el cierre ductal en cardiopatías ductus-dependientes).")
            actionPlan.add("3. Solicitar Ecocardiograma Doppler de urgencia y Radiografía de tórax.")
            actionPlan.add("4. Asegurar acceso venoso, monitorización estricta de PA en 4 extremidades y temperatura.")
            actionPlan.add("5. Considerar infusión de Prostaglandina E1 (Alprostadil) si hay sospecha de ductus-dependencia y deterioro hemodinámico.")

            return ScreeningResult(
                riskLevel = RiskLevel.CRITICAL_POSITIVE,
                summaryTitle = "TAMIZAJE POSITIVO CRÍTICO (ALTA SOSPECHA CCHD)",
                primaryFindings = findings,
                deltaSpo2 = deltaSpo2,
                isDuctalGradientAbnormal = isGradientAbnormal,
                clinicalActionPlan = actionPlan,
                transferRecommended = true,
                requiresOxygenCaution = true,
                altitudeBandNote = bandNote,
                nextStepTimeMinutes = null,
                attemptNumber = input.attemptNumber
            )
        }

        // 2. NORMAL PASS
        if (isPreductalPass && isPostductalPass && !isGradientAbnormal) {
            findings.add("Saturaciones adecuadas para la altitud (${band.bandName}): Preductal ${input.preductalSpo2}% y Postductal ${input.postductalSpo2}%.")
            findings.add("Gradiente ductal normal (ΔSpO₂ = $deltaSpo2% ≤ 3%).")

            actionPlan.add("1. Tamizaje NEGATIVO (Pasa). Continuar con alojamiento conjunto y cuidados habituales del recién nacido.")
            actionPlan.add("2. Promover y asegurar lactancia materna exclusiva.")
            actionPlan.add("3. Educar a la madre y familia en signos de alarma neonatal (dificultad al mamar, coloración azulada, taquipnea).")
            actionPlan.add("4. Alta según criterio pediátrico habitual y control en CRED a las 48-72 horas.")

            return ScreeningResult(
                riskLevel = RiskLevel.NORMAL_PASS,
                summaryTitle = "TAMIZAJE NEGATIVO (PASA)",
                primaryFindings = findings,
                deltaSpo2 = deltaSpo2,
                isDuctalGradientAbnormal = false,
                clinicalActionPlan = actionPlan,
                transferRecommended = false,
                requiresOxygenCaution = false,
                altitudeBandNote = bandNote,
                nextStepTimeMinutes = null,
                attemptNumber = input.attemptNumber
            )
        }

        // 3. REPEAT IN 1 HOUR (INDETERMINATE / GRAY ZONE)
        findings.add("Resultado en Zona Intermedia / Indeterminado (Intento ${input.attemptNumber} de 3).")
        if (!isPreductalPass) findings.add("SpO₂ Preductal (${input.preductalSpo2}%) por debajo del corte de pase (≥${passCutoff}%).")
        if (!isPostductalPass) findings.add("SpO₂ Postductal (${input.postductalSpo2}%) por debajo del corte de pase (≥${passCutoff}%).")
        if (isGradientAbnormal) findings.add("Diferencia pre/postductal ΔSpO₂ = ${deltaSpo2}% (> 3%).")

        actionPlan.add("1. Mantener al recién nacido tranquilo, abrigado y en ambiente térmico neutro.")
        actionPlan.add("2. Verificar correcta colocación y calibración del sensor de oximetría.")
        actionPlan.add("3. REPETIR la prueba en exactamente 60 MINUTOS (1 hora).")
        actionPlan.add("4. Guardar caso en 'Pendientes' para control en el cambio de turno.")

        return ScreeningResult(
            riskLevel = RiskLevel.REPEAT_1_HOUR,
            summaryTitle = "REPETIR EN 1 HORA (ZONA INDETERMINADA)",
            primaryFindings = findings,
            deltaSpo2 = deltaSpo2,
            isDuctalGradientAbnormal = isGradientAbnormal,
            clinicalActionPlan = actionPlan,
            transferRecommended = false,
            requiresOxygenCaution = false,
            altitudeBandNote = bandNote,
            nextStepTimeMinutes = 60,
            attemptNumber = input.attemptNumber
        )
    }
}
