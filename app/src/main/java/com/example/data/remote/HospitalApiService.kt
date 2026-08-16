package com.example.data.remote

import com.squareup.moshi.Json
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.GET
import java.util.concurrent.TimeUnit

data class HospitalDto(
    @Json(name = "id") val id: String?,
    @Json(name = "name") val name: String,
    @Json(name = "institution") val institution: String? = "MINSA",
    @Json(name = "department") val department: String,
    @Json(name = "province") val province: String? = "",
    @Json(name = "address") val address: String,
    @Json(name = "latitude") val latitude: Double,
    @Json(name = "longitude") val longitude: Double,
    @Json(name = "emergency_phone") val emergencyPhone: String? = "106",
    @Json(name = "referral_hotline") val referralHotline: String? = "113",
    @Json(name = "care_level") val careLevel: String? = "Nivel III-1",
    @Json(name = "has_neonatal_cardiology") val hasNeonatalCardiology: Boolean? = true,
    @Json(name = "has_ucin") val hasUcin: Boolean? = true,
    @Json(name = "has_cardiac_surgery") val hasCardiacSurgery: Boolean? = false,
    @Json(name = "has_telemedicine") val hasTelemedicine: Boolean? = true,
    @Json(name = "transport_capacity") val transportCapacity: String? = "Ambulancia SAMU Tipo III",
    @Json(name = "description") val description: String? = ""
)

interface HospitalApiService {
    @GET("api/hospitals")
    suspend fun getHospitals(): Response<List<HospitalDto>>

    @GET("hospitals")
    suspend fun getHospitalsFallback(): Response<List<HospitalDto>>

    companion object {
        private const val BASE_URL = "https://cardio-alerta-peru.onrender.com/"

        fun create(): HospitalApiService {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }

            val client = OkHttpClient.Builder()
                .connectTimeout(8, TimeUnit.SECONDS)
                .readTimeout(8, TimeUnit.SECONDS)
                .addInterceptor(logging)
                .build()

            val moshi = Moshi.Builder()
                .add(KotlinJsonAdapterFactory())
                .build()

            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .build()
                .create(HospitalApiService::class.java)
        }
    }
}
