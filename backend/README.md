# backend

API en FastAPI, desplegada en Render. Responsable: **Manuel** (tareas B03-B14 del
cronograma).

Estructura planeada (ver `docs/Arquitectura_Cardio_Alerta_Peru.docx`, sección
"Propuesta de repositorio"):

```
backend/
  app/
    main.py           # arranque de FastAPI, endpoint /health
    routers/
      predict.py       # POST /predict
      centros.py        # GET /centros-cercanos
    ml/
      inferencia.py      # envuelve el modelo que entrega Angel
  data/
    centros_referencia.json   # lista de centros (fuente: Davis)
  requirements.txt
```

Se arma a partir de la tarea **B03** en adelante — por ahora esta carpeta solo
reserva el lugar en el repo.
