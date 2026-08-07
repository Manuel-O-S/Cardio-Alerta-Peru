from fastapi import APIRouter, File, HTTPException, UploadFile

from app.ml.inferencia import clasificar_dummy
from app.schemas import PrediccionResponse

router = APIRouter(prefix="/predict", tags=["predict"])

TIPOS_PERMITIDOS = {"image/jpeg", "image/png"}


@router.post("/", response_model=PrediccionResponse)
async def predict(
    imagen: UploadFile = File(..., description="Imagen de ecocardiograma (jpg/png)")
):
    """
    Clasifica una imagen de ecocardiograma.

    Contrato (B04): request multipart/form-data con el campo `imagen`,
    response siempre con los 4 campos de PrediccionResponse.

    Estado (B06): usa una clasificación simulada (ver app/ml/inferencia.py),
    no un modelo real todavía. La validación de tipo de archivo de acá es
    básica — el manejo de errores más completo se hace en B09.

    Pendiente:
      - B08: reemplazar clasificar_dummy() por clasificar() (modelo real de Angel).
    """
    if imagen.content_type not in TIPOS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de imagen no soportado: {imagen.content_type}. Usa jpg o png.",
        )

    contenido = await imagen.read()
    if not contenido:
        raise HTTPException(status_code=400, detail="La imagen llegó vacía.")

    clasificacion, confianza = clasificar_dummy(contenido)

    return PrediccionResponse(
        clasificacion=clasificacion,
        confianza=confianza,
        modelo_version="v0-dummy-hash",
    )
