package com.example.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.data.local.entity.HospitalEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface HospitalDao {

    @Query("SELECT * FROM hospitals ORDER BY department ASC, name ASC")
    fun getAllHospitals(): Flow<List<HospitalEntity>>

    @Query("SELECT * FROM hospitals WHERE department = :department ORDER BY name ASC")
    fun getHospitalsByDepartment(department: String): Flow<List<HospitalEntity>>

    @Query("SELECT * FROM hospitals WHERE id = :id LIMIT 1")
    suspend fun getHospitalById(id: String): HospitalEntity?

    @Query("SELECT * FROM hospitals WHERE hasNeonatalCardiology = 1 OR hasCardiacSurgery = 1 ORDER BY department ASC")
    fun getCardiologyCenters(): Flow<List<HospitalEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHospitals(hospitals: List<HospitalEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHospital(hospital: HospitalEntity)

    @Query("SELECT COUNT(*) FROM hospitals")
    suspend fun getHospitalCount(): Int

    @Query("DELETE FROM hospitals")
    suspend fun clearAllHospitals()
}
