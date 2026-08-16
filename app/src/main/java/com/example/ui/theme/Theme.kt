package com.example.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = CardioRedLight,
    onPrimary = Color.White,
    primaryContainer = CardioRedDark,
    onPrimaryContainer = Color.White,
    secondary = Color(0xFF22D3EE),
    onSecondary = Color(0xFF0F172A),
    secondaryContainer = Color(0xFF164E63),
    onSecondaryContainer = Color(0xFFCFFAFE),
    tertiary = Color(0xFF93C5FD),
    background = MedicalBgDark,
    onBackground = TextMainDark,
    surface = MedicalSurfaceDark,
    onSurface = TextMainDark,
    surfaceVariant = MedicalSurfaceVariantDark,
    onSurfaceVariant = TextMutedDark,
    outline = MedicalBorderDark,
    outlineVariant = Color(0xFF64748B)
)

private val LightColorScheme = lightColorScheme(
    primary = CardioRedPrimary,
    onPrimary = Color.White,
    primaryContainer = CardioRedPrimary,
    onPrimaryContainer = Color.White,
    secondary = CardioTeal,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE0F7FA),
    onSecondaryContainer = Color(0xFF004D40),
    tertiary = CardioNavy,
    background = MedicalBgLight,
    onBackground = TextMainLight,
    surface = MedicalSurfaceLight,
    onSurface = TextMainLight,
    surfaceVariant = MedicalSurfaceVariantLight,
    onSurfaceVariant = TextMutedLight,
    outline = MedicalBorderLight,
    outlineVariant = Color(0xFF94A3B8)
)

@Composable
fun CardioAlertaPeruTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                window.statusBarColor = colorScheme.primary.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
