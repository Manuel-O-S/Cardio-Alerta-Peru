from fastapi import APIRouter, File, UploadFile

from app.schemas import Clasificacion, PrediccionResponse

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("/", response_model=PrediccionResponse)
async def predict(
    imagen: UploadFile = File(..., description="Imagen de ecocardiograma (jpg/png)")
):
    """
    Clasifica una imagen de ecocardiograma.

    Contrato (tarea B04):
      - Request: multipart/form-data con un único campo `imagen`.
      - Response: siempre los 4 campos de PrediccionResponse (ver app/schemas.py).

    Pendiente de implementar:
      - B06: devolver una clasificación dummy real (no fija) a partir del archivo recibido.
      - B08: reemplazar por el modelo real que entrega Angel (I07).
    """
    return PrediccionResponse(
        clasificacion=Clasificacion.sano,
        confianza=0.5,
        modelo_version="v0-placeholder",
    )
