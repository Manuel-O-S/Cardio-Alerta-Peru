package com.example.data.repository

import com.example.data.local.dao.ScreeningDao
import com.example.data.local.entity.PendingScreeningEntity
import com.example.data.local.entity.toDomainInput
import com.example.data.local.entity.toEntity
import com.example.domain.engine.NeonatalRiskEngine
import com.example.domain.model.PendingScreening
import com.example.domain.model.ScreeningInput
import com.example.domain.model.ScreeningResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class ScreeningRepository(private val screeningDao: ScreeningDao) {

    val allScreenings: Flow<List<Pair<ScreeningInput, ScreeningResult>>> =
        screeningDao.getAllScreenings().map { entities ->
            entities.map { entity ->
                val input = entity.toDomainInput()
                val result = NeonatalRiskEngine.evaluate(input)
                Pair(input, result)
            }
        }

    val allPendingScreenings: Flow<List<PendingScreening>> =
        screeningDao.getAllPendingScreenings().map { entities ->
            entities.map { entity ->
                PendingScreening(
                    id = entity.id,
                    hcNumber = entity.hcNumber,
                    motherName = entity.motherName,
                    attemptNumber = entity.attemptNumber,
                    preductalSpo2 = entity.preductalSpo2,
                    postductalSpo2 = entity.postductalSpo2,
                    postnatalAgeHours = entity.postnatalAgeHours,
                    facilityName = entity.facilityName,
                    facilityAltitude = entity.facilityAltitude,
                    scheduledRepeatTimestamp = entity.scheduledRepeatTimestamp,
                    createdAtTimestamp = entity.createdAtTimestamp
                )
            }
        }

    suspend fun saveScreening(input: ScreeningInput, result: ScreeningResult): Long {
        val entity = input.toEntity(result.riskLevel)
        return screeningDao.insertScreening(entity)
    }

    suspend fun deleteScreening(id: Long) {
        screeningDao.deleteScreeningById(id)
    }

    suspend fun savePendingScreening(pending: PendingScreening): Long {
        val entity = PendingScreeningEntity(
            id = pending.id,
            hcNumber = pending.hcNumber,
            motherName = pending.motherName,
            attemptNumber = pending.attemptNumber,
            preductalSpo2 = pending.preductalSpo2,
            postductalSpo2 = pending.postductalSpo2,
            postnatalAgeHours = pending.postnatalAgeHours,
            facilityName = pending.facilityName,
            facilityAltitude = pending.facilityAltitude,
            scheduledRepeatTimestamp = pending.scheduledRepeatTimestamp,
            createdAtTimestamp = pending.createdAtTimestamp
        )
        return screeningDao.insertPendingScreening(entity)
    }

    suspend fun deletePendingScreening(id: Long) {
        screeningDao.deletePendingScreeningById(id)
    }

    suspend fun deletePendingByHcNumber(hcNumber: String) {
        screeningDao.deletePendingByHcNumber(hcNumber)
    }
}
