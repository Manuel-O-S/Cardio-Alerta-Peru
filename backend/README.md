# backend

API en FastAPI, desplegada en Render. Responsable: **Manuel**.

## Estructura

```
backend/
  requirements.txt
  app/
    main.py            # arranque de FastAPI + endpoint /health
    routers/
      predict.py         # POST /predict (placeholder, se completa en B06/B08)
      centros.py           # GET /centros-cercanos (placeholder, se completa en B07)
    ml/
      inferencia.py         # envuelve el modelo de Angel (placeholder, B08)
  data/
    centros_referencia.json  # se agrega en B07, con la lista de Davis (C03)
```

## Cómo correrla en local

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # en Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Abre `http://127.0.0.1:8000/health` → debe responder `{"status": "ok"}`.

También puedes ver la documentación interactiva (autogenerada por FastAPI) en
`http://127.0.0.1:8000/docs`.

## Estado

- [x] B03 — esqueleto de la API con `/health` (este commit)
- [x] B04 — contrato formal de `/predict` y `/centros-cercanos` (ver ../docs/Contrato_API.md)
- [x] B05 — desplegar en Render (https://cardio-alerta-peru.onrender.com)
- [x] B06 — `/predict` con clasificación dummy (hash de la imagen, ver app/ml/inferencia.py)
- [ ] B07 — `/centros-cercanos` funcional
- [ ] B08 — modelo real integrado
