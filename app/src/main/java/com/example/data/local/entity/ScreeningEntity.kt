package com.example.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.domain.model.DefaultFacilities
import com.example.domain.model.FacilityLocation
import com.example.domain.model.RiskLevel
import com.example.domain.model.ScreeningInput
import com.example.domain.model.ScreeningSymptoms

@Entity(tableName = "screenings")
data class ScreeningEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val hcNumber: String,
    val motherName: String,
    val preductalSpo2: Int,
    val postductalSpo2: Int,
    val postnatalAgeHours: Int,
    val isAsymptomatic: Boolean,
    val hasCentralCyanosis: Boolean,
    val hasRespiratoryDistress: Boolean,
    val hasBradycardia: Boolean,
    val hasHypotension: Boolean,
    val hasPoorPerfusion: Boolean,
    val hasHepatomegaly: Boolean,
    val hasHeartMurmur: Boolean,
    val hasTachycardia: Boolean,
    val hasSupplementalOxygen: Boolean,
    val hasPrenatalHeartDiagnosis: Boolean,
    val facilityName: String,
    val facilityDepartment: String,
    val facilityAltitude: Int,
    val facilityLat: Double,
    val facilityLng: Double,
    val riskLevel: String,
    val attemptNumber: Int,
    val evaluationTimestamp: Long
)

@Entity(tableName = "pending_screenings")
data class PendingScreeningEntity(
    @PrimaryKey(autoGenerate = true)
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

fun ScreeningInput.toEntity(riskLevel: RiskLevel): ScreeningEntity {
    return ScreeningEntity(
        id = this.id,
        hcNumber = this.hcNumber,
        motherName = this.motherName,
        preductalSpo2 = this.preductalSpo2,
        postductalSpo2 = this.postductalSpo2,
        postnatalAgeHours = this.postnatalAgeHours,
        isAsymptomatic = this.isAsymptomatic,
        hasCentralCyanosis = this.symptoms.hasCentralCyanosis,
        hasRespiratoryDistress = this.symptoms.hasRespiratoryDistress,
        hasBradycardia = this.symptoms.hasBradycardia,
        hasHypotension = this.symptoms.hasHypotension,
        hasPoorPerfusion = this.symptoms.hasPoorPerfusion,
        hasHepatomegaly = this.symptoms.hasHepatomegaly,
        hasHeartMurmur = this.symptoms.hasHeartMurmur,
        hasTachycardia = this.symptoms.hasTachycardia,
        hasSupplementalOxygen = this.symptoms.hasSupplementalOxygen,
        hasPrenatalHeartDiagnosis = this.symptoms.hasPrenatalHeartDiagnosis,
        facilityName = this.facility.name,
        facilityDepartment = this.facility.department,
        facilityAltitude = this.facility.altitudeMsnm,
        facilityLat = this.facility.latitude,
        facilityLng = this.facility.longitude,
        riskLevel = riskLevel.name,
        attemptNumber = this.attemptNumber,
        evaluationTimestamp = this.evaluationTimestamp
    )
}

fun ScreeningEntity.toDomainInput(): ScreeningInput {
    val facilityMatch = DefaultFacilities.find { it.name == this.facilityName }
        ?: FacilityLocation(
            name = this.facilityName,
            department = this.facilityDepartment,
            altitudeMsnm = this.facilityAltitude,
            latitude = this.facilityLat,
            longitude = this.facilityLng
        )

    return ScreeningInput(
        id = this.id,
        hcNumber = this.hcNumber,
        motherName = this.motherName,
        preductalSpo2 = this.preductalSpo2,
        postductalSpo2 = this.postductalSpo2,
        postnatalAgeHours = this.postnatalAgeHours,
        isAsymptomatic = this.isAsymptomatic,
        symptoms = ScreeningSymptoms(
            hasCentralCyanosis = this.hasCentralCyanosis,
            hasRespiratoryDistress = this.hasRespiratoryDistress,
            hasBradycardia = this.hasBradycardia,
            hasHypotension = this.hasHypotension,
            hasPoorPerfusion = this.hasPoorPerfusion,
            hasHepatomegaly = this.hasHepatomegaly,
            hasHeartMurmur = this.hasHeartMurmur,
            hasTachycardia = this.hasTachycardia,
            hasSupplementalOxygen = this.hasSupplementalOxygen,
            hasPrenatalHeartDiagnosis = this.hasPrenatalHeartDiagnosis
        ),
        facility = facilityMatch,
        attemptNumber = this.attemptNumber,
        evaluationTimestamp = this.evaluationTimestamp
    )
}
