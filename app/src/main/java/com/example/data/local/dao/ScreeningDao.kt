package com.example.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.data.local.entity.PendingScreeningEntity
import com.example.data.local.entity.ScreeningEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ScreeningDao {
    // Screenings History
    @Query("SELECT * FROM screenings ORDER BY evaluationTimestamp DESC")
    fun getAllScreenings(): Flow<List<ScreeningEntity>>

    @Query("SELECT * FROM screenings WHERE id = :id")
    suspend fun getScreeningById(id: Long): ScreeningEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScreening(screening: ScreeningEntity): Long

    @Query("DELETE FROM screenings WHERE id = :id")
    suspend fun deleteScreeningById(id: Long)

    @Query("DELETE FROM screenings")
    suspend fun clearAllScreenings()

    // Pending Screenings
    @Query("SELECT * FROM pending_screenings ORDER BY scheduledRepeatTimestamp ASC")
    fun getAllPendingScreenings(): Flow<List<PendingScreeningEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPendingScreening(pending: PendingScreeningEntity): Long

    @Query("DELETE FROM pending_screenings WHERE id = :id")
    suspend fun deletePendingScreeningById(id: Long)

    @Query("DELETE FROM pending_screenings WHERE hcNumber = :hcNumber")
    suspend fun deletePendingByHcNumber(hcNumber: String)
}
