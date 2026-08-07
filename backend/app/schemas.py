"""
Contrato de datos de la API (tarea B04).

Estos modelos son la fuente de verdad de qué entra y qué sale de cada
endpoint. FastAPI los usa para validar requests, armar las respuestas y
generar la documentación automática en /docs.

Ver también: docs/Contrato_API.md (versión en prosa, para quien no quiera
leer código).
"""

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class Clasificacion(str, Enum):
    sano = "sano"
    sospecha_cardiopatia = "sospecha_cardiopatia"


class PrediccionResponse(BaseModel):
    clasificacion: Clasificacion
    confianza: float = Field(
        ..., ge=0.0, le=1.0,
        description="Probabilidad de la clase predicha, entre 0 y 1",
    )
    modelo_version: str = Field(
        ..., description="Versión del modelo que generó esta predicción",
    )
    advertencia: str = Field(
        default=(
            "Resultado de un prototipo experimental. "
            "No reemplaza el criterio clínico del especialista."
        ),
        description="Disclaimer fijo que siempre acompaña el resultado",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "clasificacion": "sospecha_cardiopatia",
                "confianza": 0.87,
                "modelo_version": "v0-placeholder",
                "advertencia": (
                    "Resultado de un prototipo experimental. "
                    "No reemplaza el criterio clínico del especialista."
                ),
            }
        }
    )


class CentroReferencia(BaseModel):
    nombre: str
    direccion: str
    lat: float
    lon: float
    especialidad: str
    distancia_km: float = Field(
        ..., description="Distancia en línea recta desde la ubicación consultada",
    )


class CentrosCercanosResponse(BaseModel):
    centros: list[CentroReferencia]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "centros": [
                    {
                        "nombre": "Instituto Nacional de Salud del Niño - San Borja",
                        "direccion": "Av. Javier Prado Este 3101, San Borja, Lima",
                        "lat": -12.0891,
                        "lon": -76.9975,
                        "especialidad": "Cardiología pediátrica",
                        "distancia_km": 2.4,
                    }
                ]
            }
        }
    )
