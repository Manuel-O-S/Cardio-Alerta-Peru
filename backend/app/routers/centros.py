from fastapi import APIRouter

router = APIRouter(prefix="/centros-cercanos", tags=["centros"])


@router.get("/")
def centros_placeholder():
    """
    Placeholder del endpoint de derivación.

    Se completa en B07: recibe lat/lon y devuelve el centro más cercano
    según la lista de referencia que arma Davis (C03).
    """
    return {"status": "no implementado todavía", "tarea": "B07"}
