package com.example.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "hospitals")
data class HospitalEntity(
    @PrimaryKey val id: String,
    val name: String,
    val institution: String, // MINSA, EsSalud, INSN, Privado
    val department: String,  // Lima, Arequipa, Cusco, La Libertad, etc.
    val province: String,
    val address: String,
    val latitude: Double,
    val longitude: Double,
    val emergencyPhone: String,
    val referralHotline: String,
    val careLevel: String,   // Nivel III-2, Nivel III-1, Instituto Especializado
    val hasNeonatalCardiology: Boolean,
    val hasUcin: Boolean,
    val hasCardiacSurgery: Boolean,
    val hasTelemedicine: Boolean,
    val transportCapacity: String, // SAMU, Ambulancia Tipo III, Incubadora de Transporte
    val operationalHours: String = "24 horas / 365 días",
    val description: String = "",
    val lastUpdatedTimestamp: Long = System.currentTimeMillis()
)
