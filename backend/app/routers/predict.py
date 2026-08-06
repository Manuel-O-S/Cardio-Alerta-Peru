from fastapi import APIRouter

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("/")
def predict_placeholder():
    """
    Placeholder del endpoint de clasificación.

    Se completa en B06 (recibir imagen + devolver clasificación dummy)
    y en B08 (reemplazar por el modelo real que entrega Angel en I07).
    """
    return {"status": "no implementado todavía", "tarea": "B06 / B08"}
