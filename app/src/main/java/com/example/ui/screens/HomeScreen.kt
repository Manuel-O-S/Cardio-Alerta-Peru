package com.example.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.components.AppMedicalHeader
import com.example.ui.components.AppTabsBar
import com.example.ui.components.ScreeningResultDialog
import com.example.ui.viewmodel.ScreeningViewModel

@Composable
fun HomeScreen(
    viewModel: ScreeningViewModel,
    modifier: Modifier = Modifier
) {
    val selectedTab by viewModel.selectedTab.collectAsStateWithLifecycle()
    val pendingList by viewModel.pendingList.collectAsStateWithLifecycle()
    val isOnline by viewModel.isOnline.collectAsStateWithLifecycle()
    val showResultDialog by viewModel.showResultDialog.collectAsStateWithLifecycle()
    val currentEvaluation by viewModel.currentEvaluationResult.collectAsStateWithLifecycle()

    val context = LocalContext.current
    var showTestMenu by remember { mutableStateOf(false) }

    // Evaluation Result Modal
    if (showResultDialog && currentEvaluation != null) {
        ScreeningResultDialog(
            item = currentEvaluation!!,
            onDismiss = { viewModel.dismissResultDialog() },
            onSaveToPending = { viewModel.saveToPendingCases() }
        )
    }

    // Quick Test Profiles Modal / Sheet
    if (showTestMenu) {
        AlertDialog(
            onDismissRequest = { showTestMenu = false },
            title = {
                Row {
                    Icon(Icons.Default.Science, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Perfiles Clínicos de Prueba (TEST)",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    )
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Selecciona un caso clínico preconfigurado para probar el algoritmo inmediatamente:",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontWeight = FontWeight.Medium
                        )
                    )
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
                    OutlinedButton(
                        onClick = {
                            viewModel.loadTestPreset("normal")
                            showTestMenu = false
                            viewModel.setSelectedTab(0)
                            Toast.makeText(context, "Cargado: Recién nacido normal (Pasa)", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            "1. Normal / Pasa (SpO₂ 98% / 97% - Lima B1)",
                            color = Color(0xFF15803D),
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                    OutlinedButton(
                        onClick = {
                            viewModel.loadTestPreset("repetir")
                            showTestMenu = false
                            viewModel.setSelectedTab(0)
                            Toast.makeText(context, "Cargado: Zona indeterminada (Repetir)", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            "2. Zona Indeterminada (SpO₂ 94% / 93% - Repetir)",
                            color = Color(0xFFD97706),
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                    OutlinedButton(
                        onClick = {
                            viewModel.loadTestPreset("critico")
                            showTestMenu = false
                            viewModel.setSelectedTab(0)
                            Toast.makeText(context, "Cargado: Alerta Crítica CCHD", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            "3. Positivo Crítico CCHD (SpO₂ 88% / 84% <90%)",
                            color = Color(0xFFDC2626),
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                    OutlinedButton(
                        onClick = {
                            viewModel.loadTestPreset("sintomatico")
                            showTestMenu = false
                            viewModel.setSelectedTab(0)
                            Toast.makeText(context, "Cargado: Sintomático (Excluido de tamizaje)", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            "4. Sintomático / Excluido (Cianosis central)",
                            color = Color(0xFF9A3412),
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                    OutlinedButton(
                        onClick = {
                            viewModel.loadTestPreset("cusco_b3")
                            showTestMenu = false
                            viewModel.setSelectedTab(0)
                            Toast.makeText(context, "Cargado: Gran Altitud Cusco B3 (3399 msnm)", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            "5. Altitud Cusco Banda B3 (SpO₂ 91% / 90% - Normal)",
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showTestMenu = false }) {
                    Text("Cerrar", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
            }
        )
    }

    Scaffold(
        topBar = {
            Column {
                AppMedicalHeader(
                    isOnline = isOnline,
                    onTestClick = { showTestMenu = true },
                    onExitClick = {
                        viewModel.resetForm()
                        Toast.makeText(context, "Sesión restablecida", Toast.LENGTH_SHORT).show()
                    },
                    onToggleOnline = { viewModel.toggleOnlineStatus() }
                )
                AppTabsBar(
                    selectedTab = selectedTab,
                    pendingCount = pendingList.size,
                    onTabSelected = { viewModel.setSelectedTab(it) }
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            when (selectedTab) {
                0 -> TamizajeScreen(viewModel = viewModel)
                1 -> PendientesScreen(viewModel = viewModel)
                2 -> HistoryScreen(viewModel = viewModel)
            }
        }
    }
}
