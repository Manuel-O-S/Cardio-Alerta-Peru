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
    tamizaje/
      motor_reglas.py        # motor de tamizaje por oximetría (sin dependencias)
  data/
    centros_referencia.json  # se agrega en B07, con la lista de Davis (C03)
  tests/
    test_conformidad_tamizaje.py  # 43 pruebas del motor de tamizaje
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

## Cómo correr las pruebas

```bash
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest -v
```

Las pruebas de tamizaje leen `compartido/vectores_conformidad.json`, el mismo
archivo que usan las suites de la web y de la app. Si un caso falla acá pero pasa
allá, el backend y la app están clasificando distinto al mismo bebé.

También puedes ver la documentación interactiva (autogenerada por FastAPI) en
`http://127.0.0.1:8000/docs`.

## Estado

- [x] B03 — esqueleto de la API con `/health` (este commit)
- [x] B04 — contrato formal de `/predict` y `/centros-cercanos` (ver ../docs/Contrato_API.md)
- [x] B05 — desplegar en Render (https://cardio-alerta-peru.onrender.com)
- [x] B06 — `/predict` con clasificación dummy (hash de la imagen, ver app/ml/inferencia.py)
- [x] B07 — `/centros-cercanos` funcional (25 centros reales de Davis, filtro por tipo_seguro, distancia haversine)
- [ ] B08 — modelo real integrado (fase 2, ver README raíz)
- [x] T01 — `/tamizaje/evaluar` y `/tamizaje/catalogo` con el motor de reglas por
      bandas de altitud (43 pruebas)
- [ ] T02 — **Davis**: verificar los umbrales de las bandas 2 y 3 contra las
      Figuras 3 y 4 de `doi.org/10.47487/apcyccv.v5i3.366`. Hoy están marcados
      `provisional` y el motor lo advierte en cada respuesta. Son seis números en
      `compartido/umbrales.json` y en los tres motores.
