# backend

API en FastAPI, desplegada en Render. Responsable: **Manuel**.

## Estructura

```
backend/
  requirements.txt
  app/
    main.py                    # arranque de FastAPI + endpoint /health
    routers/
      predict.py                 # POST /predict (fuera de alcance, ver docs/Datasets_Fase_Imagen.md)
      centros.py                   # GET /centros-cercanos
    ml/
      inferencia.py                 # clasificación simulada, no forma parte del producto
    tamizaje/
      motor_reglas.py                # motor de tamizaje por oximetría (sin dependencias)
  data/
    centros_referencia.json          # ~25 centros de referencia, recolectados por Davis
  tests/
    test_conformidad_tamizaje.py      # pruebas del motor de tamizaje
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

## Base de datos

Opcional. Sin `DATABASE_URL` el backend funciona con
`data/centros_referencia.json`, y así está probado. Configuración y advertencias
de seguridad en [`docs_base_de_datos.md`](./docs_base_de_datos.md).

```bash
cp .env.example .env          # completar la contraseña; .env está en .gitignore
python -m scripts.cargar_datos
```

## Cómo correr las pruebas

```bash
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest -v
```

Las pruebas de tamizaje leen `compartido/vectores_conformidad.json`, el mismo
archivo que usan las suites de la web y de la app. Si un caso falla acá pero pasa
allá, el backend y la app están clasificando distinto al mismo bebé — eso es un
bloqueante, no un detalle menor.

También puedes ver la documentación interactiva (autogenerada por FastAPI) en
`http://127.0.0.1:8000/docs`.

## Despliegue

Configurado como Blueprint en `render.yaml` (raíz del repo): apuntar Render a
este repositorio y el servicio se recrea solo, sin configuración manual en el
panel salvo la contraseña de la base de datos (`DATABASE_URL`, deliberadamente
fuera del repo). Detalle completo en
[`../docs/Despliegue.md`](../docs/Despliegue.md).

URL en producción: `https://cardio-alerta-peru.onrender.com`

## Sobre `/predict` y `/ml`

El endpoint `/predict` y la carpeta `app/ml/` existen en el código pero **no
son parte del producto**: el análisis de imagen de ecocardiograma quedó fuera
de alcance por falta de un dataset peruano validable clínicamente (ver
[`../docs/Datasets_Fase_Imagen.md`](../docs/Datasets_Fase_Imagen.md)). La
clasificación que devuelven es simulada — no usarlos como referencia de
funcionalidad real del proyecto.

## Estado

- [x] API base con `/health`
- [x] Contrato formal de `/predict` y `/centros-cercanos` (ver
      `../docs/Contrato_API.md`)
- [x] Desplegado en Render
- [x] `/centros-cercanos` funcional (centros reales recolectados por Davis,
      filtro por tipo de seguro, distancia haversine)
- [x] `/tamizaje/evaluar` y `/tamizaje/catalogo` con el motor de reglas por
      bandas de altitud, con suite de conformidad
- [ ] **Pendiente — Davis:** verificar los umbrales de las bandas 2 y 3 contra
      las Figuras 3 y 4 de `doi.org/10.47487/apcyccv.v5i3.366`. Hoy están
      marcados `provisional` en `compartido/umbrales.json` y el motor lo
      advierte en cada respuesta.
