# app

App Android nativa, en Kotlin con Jetpack Compose. Responsable: **Sandro**.

Es la versión offline-first del tamizaje: pensada para personal de enfermería
en establecimientos con conectividad limitada o intermitente, que instala la
app una vez con buena señal y después la usa sin depender de internet para
calcular un resultado.

## Estructura

```
app/src/main/java/com/example/
  MainActivity.kt
  domain/
    engine/
      NeonatalRiskEngine.kt        # motor de tamizaje, réplica en Kotlin de compartido/umbrales.json
    model/
      ClinicalModels.kt            # modelos de dominio (paciente, resultado, bandas de altitud)
  data/
    local/
      AppDatabase.kt                 # Room
      dao/                            # ScreeningDao, HospitalDao
      entity/                         # ScreeningEntity, HospitalEntity
    remote/
      HospitalApiService.kt           # llamadas al backend (sincronización de centros)
    repository/
      ScreeningRepository.kt
      DefaultHospitalsProvider.kt      # copia local de respaldo si nunca hubo sincronización
  ui/
    screens/                          # HomeScreen, TamizajeScreen, HistoryScreen, PendientesScreen
    components/                       # diálogos y componentes compartidos entre pantallas
    theme/                            # colores, tipografía
    viewmodel/
      ScreeningViewModel.kt
```

## El motor de tamizaje

`domain/engine/NeonatalRiskEngine.kt` es la implementación en Kotlin del motor
de reglas — la misma lógica que `motorTamizaje.js` (web) y `motor_reglas.py`
(backend), sincronizada a mano contra
[`../compartido/umbrales.json`](../compartido/umbrales.json), que es la fuente
única de verdad.

**Si cambias un número acá, cámbialo también en `compartido/umbrales.json` y en
las otras dos implementaciones, y corre las tres suites de conformidad antes de
hacer merge.** Ver la regla completa en el README raíz del repo.

## Por qué funciona offline

- El cálculo del resultado corre íntegro en el dispositivo — `NeonatalRiskEngine`
  no llama a ningún servicio para clasificar un caso.
- `AppDatabase` (Room) guarda localmente el catálogo de hospitales de
  referencia y los casos tamizados.
- `HospitalApiService` sincroniza el catálogo con el backend cuando hay
  conexión; `DefaultHospitalsProvider` sirve como respaldo si la app nunca
  llegó a sincronizar.

## Cómo compilarla

Requiere Android Studio (o `gradlew` desde línea de comandos) con JDK 17.

```bash
./gradlew assembleDebug     # genera el APK de depuración
./gradlew test              # pruebas unitarias (incluye NeonatalRiskEngineTest)
./gradlew connectedAndroidTest   # pruebas instrumentadas, requieren emulador/dispositivo
```

`compileSdk`/`targetSdk` = 36, `minSdk` = 24 (Android 7.0 en adelante) — ver
`app/build.gradle.kts`.

## Pruebas

| Archivo | Qué prueba |
|---|---|
| `src/test/java/com/example/NeonatalRiskEngineTest.kt` | Conformidad del motor de tamizaje contra `compartido/vectores_conformidad.json` |
| `src/test/java/com/example/GreetingScreenshotTest.kt` | Prueba de captura de pantalla (Robolectric) |
| `src/androidTest/java/com/example/ExampleInstrumentedTest.kt` | Prueba instrumentada base |

## Pendientes conocidos

- Verificar que `NeonatalRiskEngineTest` cubra los mismos vectores de
  conformidad que las suites de la web y el backend, incluyendo los casos de
  las bandas 2 y 3 marcadas como `provisional` (ver tarea de Davis en el
  README raíz).
- Íconos de lanzador y recursos gráficos (`res/drawable/`,
  `res/mipmap-*`) están presentes pero conviene confirmar que coincidan con la
  identidad visual final del proyecto antes de publicar un APK firmado.
