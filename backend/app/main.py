import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import estado as estado_bd
from app.routers import predict, centros, tamizaje

app = FastAPI(
    title="Cardio Alerta Perú - API",
    description="Backend de apoyo diagnóstico para especialistas de neonatos.",
    version="0.3.0",
)

# ---------------------------------------------------------------------------
# CORS
#
# Sin esto el navegador bloquea las llamadas de la web (Netlify) al backend
# (Render), porque son orígenes distintos. Falla solo en producción, nunca en
# local, que es el peor momento para descubrirlo.
#
# ORIGENES_PERMITIDOS acepta una lista separada por comas. Configurar en Render
# con la URL real de Netlify una vez que se conozca.
# ---------------------------------------------------------------------------
_origenes = os.getenv("ORIGENES_PERMITIDOS", "").strip()
origenes = [o.strip() for o in _origenes.split(",") if o.strip()] or [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://cardio-alerta-peru.netlify.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(centros.router)
app.include_router(tamizaje.router)


@app.get("/health", tags=["health"])
def health():
    """
    Confirma que la API está viva (tarea B03) e informa de dónde salen los datos.

    `base_datos` puede ser:
      - "activa"          → los centros salen de PostgreSQL
      - "sin_configurar"  → no hay DATABASE_URL; se usa el archivo JSON
      - "error"           → hay URL pero la conexión falla; se usa el JSON

    Los dos últimos NO son fallos del servicio: el sistema está diseñado para
    funcionar sin base de datos. Sirve para saber qué está pasando sin abrir
    los logs de Render.
    """
    bd = estado_bd()
    return {
        "status": "ok",
        "version": app.version,
        "base_datos": bd,
        "origen_centros": "postgresql" if bd == "activa" else "archivo_json",
    }
