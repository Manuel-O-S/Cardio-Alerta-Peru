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

Por ahora esta carpeta solo reserva el lugar en el repo.
