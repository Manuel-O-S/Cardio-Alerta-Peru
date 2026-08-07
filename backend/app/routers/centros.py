from fastapi import APIRouter, Query

from app.schemas import CentroReferencia, CentrosCercanosResponse

router = APIRouter(prefix="/centros-cercanos", tags=["centros"])


@router.get("/", response_model=CentrosCercanosResponse)
def centros_cercanos(
    lat: float = Query(..., description="Latitud del especialista/paciente"),
    lon: float = Query(..., description="Longitud del especialista/paciente"),
    limite: int = Query(3, ge=1, le=10, description="Cantidad máxima de centros a devolver"),
):
    """
    Devuelve los centros de referencia más cercanos a una ubicación.

    Contrato (tarea B04):
      - Request: query params `lat`, `lon` (obligatorios) y `limite` (opcional, default 3).
      - Response: lista de centros (puede venir vacía), ver CentrosCercanosResponse.

    Pendiente de implementar:
      - B07: reemplazar el valor fijo de abajo por la búsqueda real contra la
        lista de centros que arma Davis (C03), ordenando por distancia
        (fórmula haversine) y respetando `limite`.
    """
    return CentrosCercanosResponse(
        centros=[
            CentroReferencia(
                nombre="(placeholder) Centro de ejemplo",
                direccion="Se completa en B07",
                lat=lat,
                lon=lon,
                especialidad="Cardiología pediátrica",
                distancia_km=0.0,
            )
        ]
    )
