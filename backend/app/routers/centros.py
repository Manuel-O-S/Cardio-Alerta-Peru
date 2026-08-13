import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query

from app.db import conexion
from app.schemas import (
    CentroReferencia,
    CentrosCercanosResponse,
    HospitalOffline,
    PaqueteOfflineResponse,
)

router = APIRouter(prefix="/centros-cercanos", tags=["centros"])

DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "centros_referencia.json"

# La tabla vive en Supabase y se llama `hospitales`.
TABLA = "hospitales"
CAMPOS = ("nombre", "direccion", "departamento", "nivel", "iafas",
          "especialidad", "lat", "lon", "status")

DISPONIBLE = "disponible"


def _a_float(valor) -> float:
    """
    Las columnas lat/lon son `numeric` en Postgres, así que psycopg las devuelve
    como Decimal. Mezclar Decimal y float en la fórmula de distancia revienta,
    así que se convierten en el borde y no más adentro.
    """
    return float(valor)


def _cargar_desde_json() -> list[dict]:
    """
    Respaldo local. El archivo no tiene columna `status`, así que no se puede
    saber la disponibilidad: se marca como desconocida en vez de inventar que
    todos están disponibles.
    """
    with open(DATA_PATH, encoding="utf-8") as f:
        centros = json.load(f)
    for c in centros:
        c.setdefault("status", None)
    return centros


def _cargar_desde_bd() -> Optional[list[dict]]:
    """Devuelve los hospitales de la base de datos, o None si no está disponible."""
    with conexion() as con:
        if con is None:
            return None
        try:
            from sqlalchemy import text

            filas = con.execute(
                text(f"SELECT {', '.join(CAMPOS)} FROM {TABLA}")
            ).fetchall()
            if not filas:
                # Una tabla vacía no es una respuesta válida: mejor caer al JSON
                # que dejar sin centros a quien necesita derivar.
                return None
            centros = [dict(zip(CAMPOS, fila)) for fila in filas]
            for c in centros:
                c["lat"] = _a_float(c["lat"])
                c["lon"] = _a_float(c["lon"])
            return centros
        except Exception:  # noqa: BLE001 — cualquier fallo degrada al archivo
            return None


def _cargar_centros() -> tuple[list[dict], str]:
    """
    Base de datos primero, archivo después.

    Devuelve también el origen, porque cambia lo que se le puede prometer al
    usuario: desde el archivo no hay dato de disponibilidad.
    """
    desde_bd = _cargar_desde_bd()
    if desde_bd is not None:
        return desde_bd, "postgresql"
    return _cargar_desde_json(), "archivo_json"


def _esta_disponible(centro: dict) -> bool:
    status = centro.get("status")
    return isinstance(status, str) and status.strip().lower() == DISPONIBLE


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
    lat: float = Query(..., description="Latitud del establecimiento que deriva"),
    lon: float = Query(..., description="Longitud del establecimiento que deriva"),
    limite: int = Query(3, ge=1, le=10, description="Cantidad máxima de centros a devolver"),
    tipo_seguro: Optional[str] = Query(
        None,
        description=(
            "Filtra por red de salud: 'MINSA', 'EsSalud' u 'Otras'. "
            "Según indicó Davis, en Perú normalmente se deriva dentro de la "
            "misma red del paciente. Si no se manda, busca en todas las redes."
        ),
    ),
    solo_disponibles: bool = Query(
        True,
        description=(
            "Si es true (por defecto), devuelve solo hospitales con status "
            "'Disponible'. Si ninguno lo está, devuelve los ocupados igual y lo "
            "avisa en `hay_disponibles`: es preferible dar una opción ocupada "
            "que no dar ninguna."
        ),
    ),
):
    """
    Devuelve los hospitales de referencia más cercanos a una ubicación (tarea B07).

    Ordena por distancia en línea recta (haversine) desde la ubicación
    consultada. **No es una ruta por carretera**: la distancia real de traslado
    es siempre mayor, y así se indica en la interfaz.

    Sobre la disponibilidad: por defecto solo se devuelven los hospitales con
    status 'Disponible'. Si no hay ninguno que cumpla el resto de filtros, se
    devuelven los ocupados de todas formas con `hay_disponibles: false` — dejar
    la pantalla vacía sería peor que mostrar una opción ocupada, porque el
    equipo puede llamar y confirmar.

    Cuando los datos vienen del archivo de respaldo no hay columna de
    disponibilidad. En ese caso `status` viene en `null` y `hay_disponibles`
    también, para que la interfaz no afirme algo que no puede saber.
    """
    centros, origen = _cargar_centros()
    sabe_disponibilidad = origen == "postgresql"

    if tipo_seguro:
        centros = [c for c in centros if c["iafas"].lower() == tipo_seguro.lower()]

    hay_disponibles: Optional[bool] = None
    if sabe_disponibilidad:
        disponibles = [c for c in centros if _esta_disponible(c)]
        hay_disponibles = len(disponibles) > 0
        if solo_disponibles and disponibles:
            centros = disponibles
        # Si se pidieron solo disponibles y no hay ninguno, se devuelven todos:
        # `hay_disponibles` en false le dice a la interfaz que lo advierta.

    con_distancia = sorted(
        ((_haversine_km(lat, lon, c["lat"], c["lon"]), c) for c in centros),
        key=lambda par: par[0],
    )

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
            status=c.get("status"),
            distancia_km=round(distancia, 1),
        )
        for distancia, c in con_distancia[:limite]
    ]

    return CentrosCercanosResponse(
        centros=resultado,
        origen_datos=origen,
        hay_disponibles=hay_disponibles,
    )


@router.get("/paquete-offline", response_model=PaqueteOfflineResponse)
def paquete_offline():
    """
    Copia completa de los hospitales, para guardar en el dispositivo.

    Lo pide la web SOLO si la persona da permiso explícito. No se descarga
    solo, y la aplicación funciona sin él: sin el paquete, la derivación
    consulta el servidor en cada búsqueda y deja de funcionar sin conexión.

    QUÉ CONTIENE Y QUÉ NO
    Únicamente establecimientos de salud, que son información pública: nombre,
    dirección, departamento, nivel, red de aseguramiento, capacidad,
    coordenadas y disponibilidad reportada.

    **No contiene datos de pacientes.** No es una promesa de diseño: el backend
    no almacena datos identificables de recién nacidos, y los del tamizaje
    nunca salen del dispositivo. Hay una prueba automática que verifica que
    ningún campo del paquete corresponda a un dato de paciente.

    No trae distancias: se calculan en el dispositivo según dónde esté quien
    consulta, que es justamente lo que permite buscar sin conexión.
    """
    centros, origen = _cargar_centros()

    # La versión es un hash del contenido: si los datos no cambiaron, no
    # cambia, y el dispositivo sabe que no hace falta volver a descargar.
    huella = hashlib.sha256(
        json.dumps(centros, sort_keys=True, default=str).encode("utf-8")
    ).hexdigest()[:12]

    return PaqueteOfflineResponse(
        version=huella,
        generado=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        total=len(centros),
        origen_datos=origen,
        contiene_datos_de_paciente=False,
        hospitales=[
            HospitalOffline(
                nombre=c["nombre"],
                direccion=c["direccion"],
                departamento=c["departamento"],
                nivel=c["nivel"],
                iafas=c["iafas"],
                especialidad=c["especialidad"],
                lat=c["lat"],
                lon=c["lon"],
                status=c.get("status"),
            )
            for c in centros
        ],
    )
