import json
import math
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query

from app.schemas import CentroReferencia, CentrosCercanosResponse

router = APIRouter(prefix="/centros-cercanos", tags=["centros"])

DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "centros_referencia.json"


def _cargar_centros() -> list[dict]:
    with open(DATA_PATH, encoding="utf-8") as f:
        return json.load(f)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distancia en línea recta entre dos puntos (fórmula haversine)."""
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get("/", response_model=CentrosCercanosResponse)
def centros_cercanos(
    lat: float = Query(..., description="Latitud del especialista/paciente"),
    lon: float = Query(..., description="Longitud del especialista/paciente"),
    limite: int = Query(3, ge=1, le=10, description="Cantidad máxima de centros a devolver"),
    tipo_seguro: Optional[str] = Query(
        None,
        description=(
            "Filtra por red de salud: 'MINSA', 'EsSalud' u 'Otras'. "
            "Según indicó Davis, en Perú normalmente se deriva dentro de la "
            "misma red del paciente. Si no se manda, busca en todas las redes."
        ),
    ),
):
    """
    Devuelve los centros de referencia más cercanos a una ubicación (tarea B07).

    Datos: 25 establecimientos con capacidad de atención de cardiopatías
    congénitas en Perú, lista curada por Davis a partir de fuentes oficiales
    (ver backend/data/centros_referencia.json).

    Distancia: línea recta (haversine) entre la ubicación consultada y la
    ubicación aproximada del distrito/ciudad del establecimiento — no es una
    ruta real por calles, es una aproximación suficiente para el alcance de
    la hackatón (ver disclaimer en docs/Arquitectura_Cardio_Alerta_Peru.docx).
    """
    centros = _cargar_centros()

    if tipo_seguro:
        centros = [c for c in centros if c["iafas"].lower() == tipo_seguro.lower()]

    con_distancia = [
        (_haversine_km(lat, lon, c["lat"], c["lon"]), c) for c in centros
    ]
    con_distancia.sort(key=lambda par: par[0])

    resultado = [
        CentroReferencia(
            nombre=c["nombre"],
            direccion=c["direccion"],
            departamento=c["departamento"],
            nivel=c["nivel"],
            iafas=c["iafas"],
            especialidad=c["especialidad"],
            lat=c["lat"],
            lon=c["lon"],
            distancia_km=round(distancia, 1),
        )
        for distancia, c in con_distancia[:limite]
    ]

    return CentrosCercanosResponse(centros=resultado)
