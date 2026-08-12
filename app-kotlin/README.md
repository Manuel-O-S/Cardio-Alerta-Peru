# app-kotlin

App Android nativa. Responsable: **Sandro** (tareas K01-K14 del cronograma).

Cuando arranques con **K01**, crea aquí el proyecto desde Android Studio
("New Project" → Empty Activity, Kotlin, minSdk razonable para el hardware de
demo) y organiza el código siguiendo los módulos definidos en
`docs/Arquitectura_Cardio_Alerta_Peru.docx` (sección 5):

```
app/src/main/java/.../
  ui/            # pantallas: captura, resultado, historial
  camera/        # captura de imagen, nada más
  conectividad/  # detecta modo online/offline
  inferencia/    # envoltorio del modelo TFLite
  api/           # cliente HTTP hacia el backend
  ubicacion/     # GPS / altitud
  derivacion/    # lógica de centro más cercano
  historial/     # persistencia local

app/src/main/assets/
  modelo.tflite
  centros_referencia.json   # si se aprueba la Decisión 3 del doc de arquitectura
```

## Módulo de tamizaje — ya está acá, pero fuera de sitio

`app-kotlin/tamizaje/` contiene el motor de tamizaje por oximetría, listo y con
sus pruebas. **No es su ruta final:** el proyecto Android todavía no existe (K01),
y si dejo los archivos en `app/src/main/java/...` sin que esa ruta exista, se
pierden.

Cuando crees el proyecto en K01, muévelos así:

```
tamizaje/MotorTamizaje.kt        → app/src/main/java/pe/cardioalerta/tamizaje/
tamizaje/Ubicacion.kt            → app/src/main/java/pe/cardioalerta/tamizaje/
tamizaje/VectoresConformidad.kt  → app/src/test/java/pe/cardioalerta/tamizaje/
tamizaje/MotorTamizajeTest.kt    → app/src/test/java/pe/cardioalerta/tamizaje/
```

Después borra la carpeta `tamizaje/` de acá.

`MotorTamizaje.kt` es Kotlin puro: cero dependencias de Android y cero librerías
externas. Las pruebas son unitarias de JVM (`test/`, no `androidTest/`), así que
corren con `./gradlew test` sin emulador ni Robolectric. El paquete declarado es
`pe.cardioalerta.tamizaje`; si usas otro nombre de paquete, cámbialo en los tres
archivos.

`VectoresConformidad.kt` está **generado**, no lo edites a mano. Para regenerarlo
después de tocar un umbral:

```bash
python3 compartido/generar_vectores_kotlin.py > app-kotlin/tamizaje/VectoresConformidad.kt
```

Uso desde una pantalla:

```kotlin
val evaluacion = MotorTamizaje.evaluarCaso(
    MotorTamizaje.Entrada(
        altitudMsnm = 3825,
        spo2Preductal = 88,
        spo2Postductal = 86,
        horasDeVida = 30.0,
    )
)
when (evaluacion) {
    is MotorTamizaje.Evaluacion.Invalida -> mostrarErrores(evaluacion.errores)
    is MotorTamizaje.Evaluacion.Valida   -> mostrarResultado(evaluacion.salida)
}
```

El resto de la carpeta sigue reservando el lugar en el repo.
