package com.example.ui.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.domain.model.FacilityLocation
import com.example.ui.components.FacilityCard
import com.example.ui.components.FacilityPickerDialog
import com.example.ui.components.StepSectionHeader
import com.example.ui.components.SymptomItemRow
import com.example.ui.components.appOutlinedTextFieldColors
import com.example.ui.theme.*
import com.example.ui.viewmodel.ScreeningViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TamizajeScreen(
    viewModel: ScreeningViewModel,
    modifier: Modifier = Modifier
) {
    val formState by viewModel.formState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var showFacilityPicker by remember { mutableStateOf(false) }

    if (showFacilityPicker) {
        FacilityPickerDialog(
            currentFacility = formState.facility,
            onFacilitySelected = { facility ->
                viewModel.updateFacility(facility)
            },
            onDismiss = { showFacilityPicker = false }
        )
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Attempt indicator if re-evaluating
        if (formState.attemptNumber > 1) {
            item {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFFFEF3C7),
                    border = BorderStroke(1.dp, Color(0xFFF59E0B)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Schedule,
                            contentDescription = null,
                            tint = Color(0xFF92400E),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Reevaluación de caso pendiente (Intento ${formState.attemptNumber} de 3)",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF78350F)
                            )
                        )
                    }
                }
            }
        }

        // Establecimiento & Altitude Card
        item {
            FacilityCard(
                facility = formState.facility,
                onLocalizeCoordinates = {
                    viewModel.simulateGpsLocation()
                    Toast.makeText(context, "Coordenadas GPS actualizadas", Toast.LENGTH_SHORT).show()
                },
                onPickFromList = {
                    showFacilityPicker = true
                }
            )
        }

        // SECCIÓN 1: Identificación del paciente
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StepSectionHeader(
                        stepNumber = 1,
                        title = "Identificación del paciente",
                        subtitle = "Solo lo necesario para identificar el caso"
                    )

                    // N° Historia clínica
                    OutlinedTextField(
                        value = formState.hcNumber,
                        onValueChange = { viewModel.updateHcNumber(it) },
                        label = { Text("N° Historia clínica", fontWeight = FontWeight.SemiBold) },
                        placeholder = { Text("RN-2024-0000") },
                        leadingIcon = {
                            Icon(Icons.Default.Badge, contentDescription = null)
                        },
                        singleLine = true,
                        colors = appOutlinedTextFieldColors(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_hc_number"),
                        shape = RoundedCornerShape(10.dp)
                    )

                    // Apellido y nombre de la madre
                    OutlinedTextField(
                        value = formState.motherName,
                        onValueChange = { viewModel.updateMotherName(it) },
                        label = { Text("Apellido y nombre de la madre", fontWeight = FontWeight.SemiBold) },
                        placeholder = { Text("García Mendoza, Ana") },
                        leadingIcon = {
                            Icon(Icons.Default.Person, contentDescription = null)
                        },
                        singleLine = true,
                        colors = appOutlinedTextFieldColors(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_mother_name"),
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }
        }

        // SECCIÓN 2: Signos vitales
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    StepSectionHeader(
                        stepNumber = 2,
                        title = "Signos vitales",
                        subtitle = "La saturación determina el resultado"
                    )

                    // Preductal & Postductal inputs side-by-side
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // SpO2 preductal (%)
                        Card(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "SpO₂ preductal",
                                    style = MaterialTheme.typography.labelMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                )
                                Text(
                                    text = "Mano derecha",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontWeight = FontWeight.Medium
                                    )
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    IconButton(
                                        onClick = { viewModel.updatePreductalSpo2(formState.preductalSpo2 - 1) },
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.RemoveCircleOutline,
                                            contentDescription = "Menos",
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                    Text(
                                        text = "${formState.preductalSpo2}%",
                                        style = MaterialTheme.typography.titleLarge.copy(
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 24.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        ),
                                        modifier = Modifier.padding(horizontal = 4.dp)
                                    )
                                    IconButton(
                                        onClick = { viewModel.updatePreductalSpo2(formState.preductalSpo2 + 1) },
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.AddCircleOutline,
                                            contentDescription = "Más",
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                }
                            }
                        }

                        // SpO2 postductal (%)
                        Card(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "SpO₂ postductal",
                                    style = MaterialTheme.typography.labelMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                )
                                Text(
                                    text = "Cualquier pie",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontWeight = FontWeight.Medium
                                    )
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    IconButton(
                                        onClick = { viewModel.updatePostductalSpo2(formState.postductalSpo2 - 1) },
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.RemoveCircleOutline,
                                            contentDescription = "Menos",
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                    Text(
                                        text = "${formState.postductalSpo2}%",
                                        style = MaterialTheme.typography.titleLarge.copy(
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 24.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        ),
                                        modifier = Modifier.padding(horizontal = 4.dp)
                                    )
                                    IconButton(
                                        onClick = { viewModel.updatePostductalSpo2(formState.postductalSpo2 + 1) },
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.AddCircleOutline,
                                            contentDescription = "Más",
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Delta Gradient calculation indicator
                    val delta = kotlin.math.abs(formState.preductalSpo2 - formState.postductalSpo2)
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (delta > 3) Color(0xFFFEE2E2) else MaterialTheme.colorScheme.surfaceVariant,
                        border = BorderStroke(1.dp, if (delta > 3) Color(0xFFEF4444) else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Gradiente Pre/Postductal (ΔSpO₂)",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (delta > 3) Color(0xFF7F1D1D) else MaterialTheme.colorScheme.onSurface
                                )
                            )
                            Text(
                                text = "$delta% ${if (delta > 3) "· PATOLÓGICO (>3%)" else "· Normal (≤3%)"}",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = if (delta > 3) Color(0xFFDC2626) else Color(0xFF15803D)
                                )
                            )
                        }
                    }

                    // Horas de vida
                    Column {
                        Text(
                            text = "Horas de vida · En horas, no en días",
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = formState.postnatalAgeHours.toString(),
                                onValueChange = {
                                    val num = it.toIntOrNull() ?: 0
                                    viewModel.updatePostnatalAgeHours(num)
                                },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                colors = appOutlinedTextFieldColors(),
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("input_horas_vida"),
                                shape = RoundedCornerShape(10.dp),
                                trailingIcon = {
                                    Text(
                                        "hrs",
                                        modifier = Modifier.padding(end = 12.dp),
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            )

                            // Quick preset chips for hours
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                FilterChip(
                                    selected = formState.postnatalAgeHours == 24,
                                    onClick = { viewModel.updatePostnatalAgeHours(24) },
                                    label = { Text("24h", fontWeight = FontWeight.Bold) }
                                )
                                FilterChip(
                                    selected = formState.postnatalAgeHours == 30,
                                    onClick = { viewModel.updatePostnatalAgeHours(30) },
                                    label = { Text("30h", fontWeight = FontWeight.Bold) }
                                )
                                FilterChip(
                                    selected = formState.postnatalAgeHours == 48,
                                    onClick = { viewModel.updatePostnatalAgeHours(48) },
                                    label = { Text("48h", fontWeight = FontWeight.Bold) }
                                )
                            }
                        }

                        if (formState.postnatalAgeHours < 24) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = Color(0xFFFEF3C7),
                                border = BorderStroke(1.dp, Color(0xFFF59E0B).copy(alpha = 0.5f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = "⚠️ < 24 horas: Puede arrojar falsos positivos por adaptación cardiopulmonar transicional.",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = Color(0xFF78350F),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold
                                    ),
                                    modifier = Modifier.padding(8.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // SECCIÓN 3: Síntomas presentes
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StepSectionHeader(
                        stepNumber = 3,
                        title = "Síntomas presentes",
                        subtitle = "Cualquier síntoma en rojo excluye del tamizaje"
                    )

                    // Prominent Asintomático Card
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { viewModel.setAsymptomatic(!formState.isAsymptomatic) },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (formState.isAsymptomatic) Color(0xFFDCFCE7) else MaterialTheme.colorScheme.surfaceVariant
                        ),
                        border = BorderStroke(
                            1.5.dp,
                            if (formState.isAsymptomatic) Color(0xFF16A34A) else MaterialTheme.colorScheme.outline
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(CircleShape)
                                        .background(if (formState.isAsymptomatic) Color(0xFF16A34A) else MaterialTheme.colorScheme.outline),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = if (formState.isAsymptomatic) Icons.Default.Check else Icons.Default.Close,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = "Asintomático",
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontWeight = FontWeight.Bold,
                                            color = if (formState.isAsymptomatic) Color(0xFF14532D) else MaterialTheme.colorScheme.onSurface
                                        )
                                    )
                                    Text(
                                        text = "Se revisó y no presenta ninguno de los signos de abajo",
                                        style = MaterialTheme.typography.bodySmall.copy(
                                            color = if (formState.isAsymptomatic) Color(0xFF166534) else MaterialTheme.colorScheme.onSurfaceVariant,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Medium
                                        )
                                    )
                                }
                            }

                            Switch(
                                checked = formState.isAsymptomatic,
                                onCheckedChange = { viewModel.setAsymptomatic(it) },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = Color(0xFF16A34A),
                                    uncheckedThumbColor = MaterialTheme.colorScheme.surface,
                                    uncheckedTrackColor = MaterialTheme.colorScheme.outline
                                ),
                                modifier = Modifier.testTag("switch_asintomatico")
                            )
                        }
                    }

                    Text(
                        text = "Marca los signos clínicos presentes en caso de identificarlos:",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontWeight = FontWeight.SemiBold
                        )
                    )

                    // 10 Specific Exclusion / Warning Symptoms
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        SymptomItemRow(
                            title = "Cianosis central",
                            checked = formState.symptoms.hasCentralCyanosis,
                            onCheckedChange = { viewModel.toggleSymptom("cyanosis") },
                            modifier = Modifier.testTag("symptom_cyanosis")
                        )

                        SymptomItemRow(
                            title = "Dificultad respiratoria",
                            checked = formState.symptoms.hasRespiratoryDistress,
                            onCheckedChange = { viewModel.toggleSymptom("distress") },
                            modifier = Modifier.testTag("symptom_distress")
                        )

                        SymptomItemRow(
                            title = "Bradicardia",
                            checked = formState.symptoms.hasBradycardia,
                            onCheckedChange = { viewModel.toggleSymptom("bradycardia") },
                            modifier = Modifier.testTag("symptom_bradycardia")
                        )

                        SymptomItemRow(
                            title = "Hipotensión",
                            checked = formState.symptoms.hasHypotension,
                            onCheckedChange = { viewModel.toggleSymptom("hypotension") },
                            modifier = Modifier.testTag("symptom_hypotension")
                        )

                        SymptomItemRow(
                            title = "Mala perfusión",
                            checked = formState.symptoms.hasPoorPerfusion,
                            onCheckedChange = { viewModel.toggleSymptom("perfusion") },
                            modifier = Modifier.testTag("symptom_perfusion")
                        )

                        SymptomItemRow(
                            title = "Hepatomegalia",
                            checked = formState.symptoms.hasHepatomegaly,
                            onCheckedChange = { viewModel.toggleSymptom("hepatomegaly") },
                            modifier = Modifier.testTag("symptom_hepatomegaly")
                        )

                        SymptomItemRow(
                            title = "Soplo cardíaco",
                            checked = formState.symptoms.hasHeartMurmur,
                            onCheckedChange = { viewModel.toggleSymptom("murmur") },
                            modifier = Modifier.testTag("symptom_murmur")
                        )

                        SymptomItemRow(
                            title = "Taquicardia",
                            checked = formState.symptoms.hasTachycardia,
                            onCheckedChange = { viewModel.toggleSymptom("tachycardia") },
                            modifier = Modifier.testTag("symptom_tachycardia")
                        )

                        SymptomItemRow(
                            title = "Oxígeno suplementario",
                            checked = formState.symptoms.hasSupplementalOxygen,
                            onCheckedChange = { viewModel.toggleSymptom("oxygen") },
                            modifier = Modifier.testTag("symptom_oxygen")
                        )

                        SymptomItemRow(
                            title = "Diagnóstico prenatal de cardiopatía",
                            checked = formState.symptoms.hasPrenatalHeartDiagnosis,
                            onCheckedChange = { viewModel.toggleSymptom("prenatal") },
                            modifier = Modifier.testTag("symptom_prenatal")
                        )
                    }
                }
            }
        }

        // Action Buttons: Evaluar tamizaje & Limpiar
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = { viewModel.evaluateScreening() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp)
                        .testTag("btn_evaluar_tamizaje"),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
                ) {
                    Icon(Icons.Default.Favorite, contentDescription = null)
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Evaluar tamizaje",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    )
                }

                OutlinedButton(
                    onClick = {
                        viewModel.resetForm()
                        Toast.makeText(context, "Formulario restablecido", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("btn_limpiar_formulario"),
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Icon(
                        Icons.Default.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Limpiar",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    )
                }
            }
        }
    }
}
