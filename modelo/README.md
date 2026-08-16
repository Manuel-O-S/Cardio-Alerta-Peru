# modelo

Dataset, entrenamiento y exportación del modelo de IA. Responsable: **Angel**
(tareas I01-I13 del cronograma). Es un mundo aparte, sin relación de código con
la app o el backend — solo entrega archivos a `backend/data/` y
`app-kotlin/.../assets/`.

Estructura sugerida:

```
modelo/
  data/                 # dataset (no versionar imágenes pesadas, ver .gitignore)
  train.py              # entrenamiento
  export_tflite.py       # exporta a .tflite (para la app)
  export_backend.py       # exporta el script de inferencia (para el backend)
```

Por ahora esta carpeta solo reserva el lugar en el repo.
