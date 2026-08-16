package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.local.AppDatabase
import com.example.data.repository.ScreeningRepository
import com.example.domain.engine.NeonatalRiskEngine
import com.example.domain.model.DefaultFacilities
import com.example.domain.model.FacilityLocation
import com.example.domain.model.PendingScreening
import com.example.domain.model.RiskLevel
import com.example.domain.model.ScreeningInput
import com.example.domain.model.ScreeningResult
import com.example.domain.model.ScreeningSymptoms
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class FormUiState(
    val hcNumber: String = "RN-2024-0000",
    val motherName: String = "García Mendoza, Ana",
    val preductalSpo2: Int = 98,
    val postductalSpo2: Int = 97,
    val postnatalAgeHours: Int = 30,
    val isAsymptomatic: Boolean = true,
    val symptoms: ScreeningSymptoms = ScreeningSymptoms(),
    val facility: FacilityLocation = DefaultFacilities.first(), // Lima 150 msnm
    val attemptNumber: Int = 1,
    val activePendingId: Long? = null
)

class ScreeningViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: ScreeningRepository

    init {
        val database = AppDatabase.getDatabase(application)
        repository = ScreeningRepository(database.screeningDao())
    }

    val historyList: StateFlow<List<Pair<ScreeningInput, ScreeningResult>>> = repository.allScreenings
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val pendingList: StateFlow<List<PendingScreening>> = repository.allPendingScreenings
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    private val _selectedTab = MutableStateFlow(0) // 0: Tamizaje, 1: Pendientes, 2: Historial
    val selectedTab: StateFlow<Int> = _selectedTab.asStateFlow()

    private val _formState = MutableStateFlow(FormUiState())
    val formState: StateFlow<FormUiState> = _formState.asStateFlow()

    private val _currentEvaluationResult = MutableStateFlow<Pair<ScreeningInput, ScreeningResult>?>(null)
    val currentEvaluationResult: StateFlow<Pair<ScreeningInput, ScreeningResult>?> = _currentEvaluationResult.asStateFlow()

    private val _showResultDialog = MutableStateFlow(false)
    val showResultDialog: StateFlow<Boolean> = _showResultDialog.asStateFlow()

    private val _isOnline = MutableStateFlow(true)
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    fun setSelectedTab(index: Int) {
        _selectedTab.value = index
    }

    fun toggleOnlineStatus() {
        _isOnline.value = !_isOnline.value
    }

    fun updateHcNumber(value: String) {
        _formState.value = _formState.value.copy(hcNumber = value)
    }

    fun updateMotherName(value: String) {
        _formState.value = _formState.value.copy(motherName = value)
    }

    fun updatePreductalSpo2(value: Int) {
        _formState.value = _formState.value.copy(preductalSpo2 = value.coerceIn(50, 100))
    }

    fun updatePostductalSpo2(value: Int) {
        _formState.value = _formState.value.copy(postductalSpo2 = value.coerceIn(50, 100))
    }

    fun updatePostnatalAgeHours(value: Int) {
        _formState.value = _formState.value.copy(postnatalAgeHours = value.coerceAtLeast(0))
    }

    fun setAsymptomatic(asymptomatic: Boolean) {
        if (asymptomatic) {
            _formState.value = _formState.value.copy(
                isAsymptomatic = true,
                symptoms = ScreeningSymptoms()
            )
        } else {
            _formState.value = _formState.value.copy(isAsymptomatic = false)
        }
    }

    fun toggleSymptom(symptomKey: String) {
        val current = _formState.value.symptoms
        val updated = when (symptomKey) {
            "cyanosis" -> current.copy(hasCentralCyanosis = !current.hasCentralCyanosis)
            "distress" -> current.copy(hasRespiratoryDistress = !current.hasRespiratoryDistress)
            "bradycardia" -> current.copy(hasBradycardia = !current.hasBradycardia)
            "hypotension" -> current.copy(hasHypotension = !current.hasHypotension)
            "perfusion" -> current.copy(hasPoorPerfusion = !current.hasPoorPerfusion)
            "hepatomegaly" -> current.copy(hasHepatomegaly = !current.hasHepatomegaly)
            "murmur" -> current.copy(hasHeartMurmur = !current.hasHeartMurmur)
            "tachycardia" -> current.copy(hasTachycardia = !current.hasTachycardia)
            "oxygen" -> current.copy(hasSupplementalOxygen = !current.hasSupplementalOxygen)
            "prenatal" -> current.copy(hasPrenatalHeartDiagnosis = !current.hasPrenatalHeartDiagnosis)
            else -> current
        }
        val isAny = updated.isAnySymptomPresent
        _formState.value = _formState.value.copy(
            symptoms = updated,
            isAsymptomatic = !isAny
        )
    }

    fun updateFacility(facility: FacilityLocation) {
        _formState.value = _formState.value.copy(facility = facility)
    }

    fun simulateGpsLocation() {
        // Rotates between common clinical regions in Peru or picks GPS
        val regions = DefaultFacilities
        val next = regions.random()
        _formState.value = _formState.value.copy(facility = next)
    }

    fun resetForm() {
        _formState.value = FormUiState(
            hcNumber = "RN-2024-" + (1000..9999).random(),
            motherName = "",
            preductalSpo2 = 98,
            postductalSpo2 = 97,
            postnatalAgeHours = 30,
            isAsymptomatic = true,
            symptoms = ScreeningSymptoms(),
            facility = _formState.value.facility,
            attemptNumber = 1,
            activePendingId = null
        )
        _currentEvaluationResult.value = null
        _showResultDialog.value = false
    }

    fun loadTestPreset(presetType: String) {
        when (presetType) {
            "normal" -> {
                _formState.value = _formState.value.copy(
                    hcNumber = "RN-2024-1042",
                    motherName = "García Mendoza, Ana",
                    preductalSpo2 = 98,
                    postductalSpo2 = 97,
                    postnatalAgeHours = 30,
                    isAsymptomatic = true,
                    symptoms = ScreeningSymptoms(),
                    attemptNumber = 1
                )
            }
            "repetir" -> {
                _formState.value = _formState.value.copy(
                    hcNumber = "RN-2024-2089",
                    motherName = "Flores Quispe, Carmen",
                    preductalSpo2 = 94,
                    postductalSpo2 = 93,
                    postnatalAgeHours = 26,
                    isAsymptomatic = true,
                    symptoms = ScreeningSymptoms(),
                    attemptNumber = 1
                )
            }
            "critico" -> {
                _formState.value = _formState.value.copy(
                    hcNumber = "RN-2024-3174",
                    motherName = "Mamani Choque, Rosa",
                    preductalSpo2 = 88,
                    postductalSpo2 = 84,
                    postnatalAgeHours = 28,
                    isAsymptomatic = true,
                    symptoms = ScreeningSymptoms(),
                    attemptNumber = 1
                )
            }
            "sintomatico" -> {
                _formState.value = _formState.value.copy(
                    hcNumber = "RN-2024-4501",
                    motherName = "Dávila Torres, Lucía",
                    preductalSpo2 = 92,
                    postductalSpo2 = 90,
                    postnatalAgeHours = 18,
                    isAsymptomatic = false,
                    symptoms = ScreeningSymptoms(
                        hasCentralCyanosis = true,
                        hasRespiratoryDistress = true
                    ),
                    attemptNumber = 1
                )
            }
            "cusco_b3" -> {
                val cusco = DefaultFacilities.find { it.name.contains("Cusco") } ?: DefaultFacilities[9]
                _formState.value = _formState.value.copy(
                    facility = cusco,
                    hcNumber = "RN-2024-5280",
                    motherName = "Condori Huamán, Elena",
                    preductalSpo2 = 91,
                    postductalSpo2 = 90,
                    postnatalAgeHours = 32,
                    isAsymptomatic = true,
                    symptoms = ScreeningSymptoms(),
                    attemptNumber = 1
                )
            }
        }
    }

    fun evaluateScreening() {
        val form = _formState.value
        val input = ScreeningInput(
            hcNumber = form.hcNumber.ifBlank { "RN-${System.currentTimeMillis() % 100000}" },
            motherName = form.motherName.ifBlank { "No especificado" },
            preductalSpo2 = form.preductalSpo2,
            postductalSpo2 = form.postductalSpo2,
            postnatalAgeHours = form.postnatalAgeHours,
            isAsymptomatic = form.isAsymptomatic,
            symptoms = form.symptoms,
            facility = form.facility,
            attemptNumber = form.attemptNumber
        )

        val result = NeonatalRiskEngine.evaluate(input)
        val pair = Pair(input, result)
        _currentEvaluationResult.value = pair
        _showResultDialog.value = true

        viewModelScope.launch {
            repository.saveScreening(input, result)
            // If it was evaluating an existing pending item and resolved, remove from pending
            if (form.activePendingId != null && result.riskLevel != RiskLevel.REPEAT_1_HOUR) {
                repository.deletePendingScreening(form.activePendingId)
            }
        }
    }

    fun saveToPendingCases() {
        val current = _currentEvaluationResult.value ?: return
        val input = current.first
        val nextAttempt = (input.attemptNumber + 1).coerceAtMost(3)
        val oneHourLater = System.currentTimeMillis() + (60 * 60 * 1000)

        val pending = PendingScreening(
            hcNumber = input.hcNumber,
            motherName = input.motherName,
            attemptNumber = nextAttempt,
            preductalSpo2 = input.preductalSpo2,
            postductalSpo2 = input.postductalSpo2,
            postnatalAgeHours = input.postnatalAgeHours,
            facilityName = input.facility.name,
            facilityAltitude = input.facility.altitudeMsnm,
            scheduledRepeatTimestamp = oneHourLater,
            createdAtTimestamp = System.currentTimeMillis()
        )

        viewModelScope.launch {
            repository.savePendingScreening(pending)
            dismissResultDialog()
            _selectedTab.value = 1 // Switch to Pendientes tab
        }
    }

    fun startPendingEvaluation(pending: PendingScreening) {
        val facility = DefaultFacilities.find { it.name == pending.facilityName }
            ?: _formState.value.facility

        _formState.value = FormUiState(
            hcNumber = pending.hcNumber,
            motherName = pending.motherName,
            preductalSpo2 = pending.preductalSpo2,
            postductalSpo2 = pending.postductalSpo2,
            postnatalAgeHours = pending.postnatalAgeHours + 1,
            isAsymptomatic = true,
            symptoms = ScreeningSymptoms(),
            facility = facility,
            attemptNumber = pending.attemptNumber,
            activePendingId = pending.id
        )

        _selectedTab.value = 0 // Switch to Tamizaje tab
    }

    fun deletePendingCase(id: Long) {
        viewModelScope.launch {
            repository.deletePendingScreening(id)
        }
    }

    fun dismissResultDialog() {
        _showResultDialog.value = false
    }

    fun viewHistoryDetail(item: Pair<ScreeningInput, ScreeningResult>) {
        _currentEvaluationResult.value = item
        _showResultDialog.value = true
    }

    fun deleteScreening(id: Long) {
        viewModelScope.launch {
            repository.deleteScreening(id)
        }
    }
}
