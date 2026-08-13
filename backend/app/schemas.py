"""
Contrato de datos de la API (tarea B04).

Estos modelos son la fuente de verdad de qué entra y qué sale de cada
endpoint. FastAPI los usa para validar requests, armar las respuestas y
generar la documentación automática en /docs.

Ver también: docs/Contrato_API.md (versión en prosa, para quien no quiera
leer código).
"""

from enum import Enum
from typing import Optional

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
    departamento: str
    nivel: str = Field(
        ..., description="Nivel de complejidad del establecimiento (ej. III-2, III-1, II-2)",
    )
    iafas: str = Field(
        ..., description="Red de salud a la que pertenece: 'MINSA', 'EsSalud' u 'Otras'",
    )
    especialidad: str
    lat: float
    lon: float
    status: Optional[str] = Field(
        None,
        description=(
            "Disponibilidad reportada: 'Disponible' u 'Ocupado'. Viene en null "
            "cuando los datos salen del archivo de respaldo, que no tiene esta "
            "columna: null significa 'no se sabe', no 'no disponible'."
        ),
    )
    distancia_km: float = Field(
        ..., description="Distancia en línea recta desde la ubicación consultada",
    )


class CentrosCercanosResponse(BaseModel):
    """
    Además de la lista, informa de dónde salieron los datos y si había algún
    hospital disponible. La interfaz necesita las dos cosas para no afirmar
    disponibilidad cuando no puede saberla.
    """

    centros: list[CentroReferencia]

    origen_datos: str = Field(
        "postgresql",
        description="'postgresql' o 'archivo_json'. El segundo no tiene dato de disponibilidad.",
    )
    hay_disponibles: Optional[bool] = Field(
        None,
        description=(
            "True si hay al menos un hospital con status 'Disponible' que cumpla "
            "los filtros. False si todos están ocupados (la lista se devuelve "
            "igual). None si el origen no permite saberlo."
        ),
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "centros": [
                    {
                        "nombre": "Instituto Nacional de Salud del Niño San Borja (INSN SB)",
                        "direccion": "San Borja, Lima",
                        "departamento": "Lima",
                        "nivel": "III-2",
                        "iafas": "MINSA",
                        "especialidad": "Cirugía cardiovascular de máxima complejidad e intervencionismo",
                        "lat": -12.1075,
                        "lon": -76.9998,
                        "distancia_km": 2.4,
                    }
                ]
            }
        }
    )



# ===========================================================================
# TAMIZAJE POR OXIMETRIA DE PULSO
# ===========================================================================


class ResultadoTamizaje(str, Enum):
    no_elegible = "no_elegible"
    positivo = "positivo"
    negativo = "negativo"
    repetir = "repetir"
    incompleto = "incompleto"


class MotivoNoElegibleSchema(str, Enum):
    sintomatico = "sintomatico"
    oxigeno_suplementario = "oxigeno_suplementario"
    diagnostico_prenatal = "diagnostico_prenatal"
    menor_24h = "menor_24h"


class NivelAvisoSchema(str, Enum):
    alto = "alto"
    medio = "medio"
    bajo = "bajo"


class AvisoSchema(BaseModel):
    codigo: str = Field(..., description="Identificador estable, para que la UI decida el icono")
    nivel: NivelAvisoSchema
    mensaje: str


class BandaSchema(BaseModel):
    id: str = Field(..., description="B1, B2 o B3")
    nombre: str
    altitud_min: int
    altitud_max: int
    spo2_critico: int = Field(..., description="Por debajo de este valor, positivo inmediato")
    spo2_pasa: int = Field(..., description="A partir de este valor (y con diferencia dentro del maximo), pasa")
    diferencia_max: int = Field(..., description="Diferencia maxima admitida entre mano derecha y pie")
    estado: str = Field(..., description="'verificado' o 'provisional'")
    fuente: str


class TamizajeRequest(BaseModel):
    """
    Solo `altitud_msnm` y `spo2_preductal` son obligatorios. El resto es
    opcional para que la app pueda evaluar con lo que tenga a mano y el motor
    avise de lo que falta, en vez de bloquear al usuario.
    """

    altitud_msnm: int = Field(
        ..., ge=0, le=5100,
        description="Altitud del establecimiento en metros sobre el nivel del mar. "
                    "Se configura una vez por establecimiento; no conviene tomarla del GPS.",
    )
    spo2_preductal: int = Field(
        ..., ge=0, le=100, description="SpO2 en mano DERECHA, en porcentaje",
    )
    spo2_postductal: Optional[int] = Field(
        None, ge=0, le=100,
        description="SpO2 en cualquier PIE. Sin este dato el tamizaje queda incompleto: "
                    "no se puede evaluar la diferencia preductal-postductal.",
    )
    horas_de_vida: Optional[float] = Field(
        None, ge=0, le=720,
        description="Horas de vida, NO dias. La ventana de tamizaje empieza a las 24 h "
                    "y '1 dia' no distingue entre 24 y 47 h.",
    )
    edad_gestacional_sem: Optional[int] = Field(None, ge=20, le=45)
    fc_lpm: Optional[int] = Field(None, ge=30, le=300, description="Frecuencia cardiaca")
    fr_rpm: Optional[int] = Field(None, ge=5, le=150, description="Frecuencia respiratoria")
    peso_kg: Optional[float] = Field(None, ge=0.3, le=7.0)
    sintomas: list[str] = Field(
        default_factory=list,
        description="Ids de sintomas. Ver GET /tamizaje/catalogo para la lista valida.",
    )
    oxigeno_suplementario: bool = False
    diagnostico_prenatal_cc: bool = False
    ronda: int = Field(1, ge=1, le=3, description="Ronda de retamizaje, 1 a 3")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "altitud_msnm": 3825,
                "spo2_preductal": 88,
                "spo2_postductal": 86,
                "horas_de_vida": 30,
                "edad_gestacional_sem": 38,
                "fc_lpm": 150,
                "fr_rpm": 48,
                "peso_kg": 3.2,
                "sintomas": [],
                "ronda": 1,
            }
        }
    )


class TamizajeResponse(BaseModel):
    resultado: ResultadoTamizaje
    conducta: str = Field(..., description="Que hacer ahora, en el idioma del personal de salud")
    motivo_no_elegible: Optional[MotivoNoElegibleSchema] = None
    sintomas_de_alarma: list[str] = Field(
        default_factory=list,
        description="Solo se llena cuando el resultado es no_elegible por sintomatico",
    )
    banda: Optional[BandaSchema] = None
    ronda: int
    proxima_ronda: Optional[int] = None
    minutos_espera: Optional[int] = None
    diferencia_spo2: Optional[int] = Field(
        None, description="Preductal menos postductal, CON signo (se guarda en el registro)",
    )
    avisos: list[AvisoSchema] = Field(
        default_factory=list,
        description="Contexto clinico. Nunca altera el resultado: no hay puntaje compuesto.",
    )
    version_umbrales: str
    advertencia: str = Field(
        default=(
            "Resultado de un tamizaje, no de un diagnostico. "
            "No reemplaza el criterio clinico del especialista."
        ),
        description="Disclaimer fijo que siempre acompana el resultado",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "resultado": "negativo",
                "conducta": "Tamizaje superado. Continuar con los cuidados habituales.",
                "motivo_no_elegible": None,
                "sintomas_de_alarma": [],
                "banda": {
                    "id": "B3",
                    "nombre": "Mayor a 3500 msnm",
                    "altitud_min": 3500,
                    "altitud_max": 5100,
                    "spo2_critico": 83,
                    "spo2_pasa": 88,
                    "diferencia_max": 3,
                    "estado": "provisional",
                    "fuente": "PROVISIONAL. Pendiente de verificacion contra la fuente peruana.",
                },
                "ronda": 1,
                "proxima_ronda": None,
                "minutos_espera": None,
                "diferencia_spo2": 2,
                "avisos": [
                    {
                        "codigo": "umbral_provisional",
                        "nivel": "alto",
                        "mensaje": "Los umbrales de la banda B3 son provisionales.",
                    }
                ],
                "version_umbrales": "1.0.0",
                "advertencia": (
                    "Resultado de un tamizaje, no de un diagnostico. "
                    "No reemplaza el criterio clinico del especialista."
                ),
            }
        }
    )


class SintomaCatalogo(BaseModel):
    id: str
    etiqueta: str
    tipo: str = Field(..., description="'alarma' saca del tamizaje; 'contexto' solo avisa")


class CatalogoResponse(BaseModel):
    """
    Lo consumen la app y la web para construir las casillas de sintomas sin
    hardcodear la lista en dos lugares.
    """

    version_umbrales: str
    bandas: list[BandaSchema]
    sintomas: list[SintomaCatalogo]
    horas_minimas: float
    rondas_maximas: int


# ===========================================================================
# PAQUETE DE DATOS PARA USO SIN CONEXIÓN
# ===========================================================================


class HospitalOffline(BaseModel):
    """
    Un hospital, sin distancia: se calcula en el dispositivo según dónde esté
    quien consulta.
    """

    nombre: str
    direccion: str
    departamento: str
    nivel: str
    iafas: str
    especialidad: str
    lat: float
    lon: float
    status: Optional[str] = None


class PaqueteOfflineResponse(BaseModel):
    """
    Copia completa de los hospitales de referencia, para guardar en el
    dispositivo y poder derivar sin conexión.

    GARANTÍA DE CONTENIDO
    Este paquete contiene ÚNICAMENTE datos de establecimientos de salud, que
    son información pública. No incluye —ni puede incluir— ningún dato de
    pacientes: el backend no los almacena, y los datos del recién nacido nunca
    salen del dispositivo donde se hace el tamizaje.

    Hay una prueba automática que verifica que ningún campo del paquete
    corresponda a datos de paciente. Si alguien agrega uno por error, falla.
    """

    version: str = Field(..., description="Cambia cuando cambian los datos; sirve para saber si hay que actualizar")
    generado: str = Field(..., description="Fecha y hora ISO 8601 en que se armó el paquete")
    total: int
    origen_datos: str = Field(..., description="'postgresql' o 'archivo_json'")
    contiene_datos_de_paciente: bool = Field(
        False,
        description="Siempre false. Declarado explícitamente para que la interfaz pueda mostrarlo al pedir permiso.",
    )
    hospitales: list[HospitalOffline]
