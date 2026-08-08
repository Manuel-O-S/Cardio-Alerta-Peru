from fastapi import FastAPI

from app.routers import predict, centros, tamizaje

app = FastAPI(
    title="Cardio Alerta Perú - API",
    description="Backend de apoyo diagnóstico para especialistas de neonatos.",
    version="0.2.0",
)

app.include_router(predict.router)
app.include_router(centros.router)
app.include_router(tamizaje.router)


@app.get("/health", tags=["health"])
def health():
    """Endpoint mínimo para confirmar que la API está viva (tarea B03)."""
    return {"status": "ok"}
