"""
Acceso a la base de datos (PostgreSQL / Supabase).

DECISION DE DISENO IMPORTANTE: LA BASE DE DATOS ES OPCIONAL
-----------------------------------------------------------
Si `DATABASE_URL` no esta definida, o si la conexion falla, el sistema NO se
cae: sigue funcionando con `data/centros_referencia.json`. Es deliberado y hay
tres razones concretas:

1. El plan gratuito de Render duerme el servicio tras ~15 min sin trafico, y
   Supabase pausa proyectos inactivos. Justo el minuto de la demo es cuando
   ambos arrancan en frio.
2. Los 25 centros cambian una o dos veces al ano. Que una consulta de datos
   casi estaticos pueda tumbar la derivacion de un recien nacido seria un mal
   intercambio.
3. Cualquiera puede clonar el repo y correrlo sin credenciales.

O sea: la base de datos agrega capacidades (registro de tamizajes, edicion de
centros sin desplegar), no es un requisito para que el tamizaje funcione.

CREDENCIALES
------------
NUNCA se escriben en el codigo ni en el repositorio. Se leen de la variable de
entorno `DATABASE_URL`. En local va en `.env` (ignorado por git); en produccion,
en las variables de entorno de Render.
"""

from __future__ import annotations

import logging
import os
from contextlib import contextmanager
from typing import Iterator, Optional

logger = logging.getLogger(__name__)

# Se resuelve una sola vez al importar.
DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL") or None

_motor = None
_estado: str = "sin_configurar"  # sin_configurar | activa | error


def _construir_motor():
    """
    Crea el motor de SQLAlchemy. Devuelve None si no hay URL, si falta la
    dependencia o si la conexion de prueba falla.
    """
    global _estado

    if not DATABASE_URL:
        _estado = "sin_configurar"
        return None

    try:
        from sqlalchemy import create_engine, text
    except ImportError:
        logger.warning(
            "DATABASE_URL esta definida pero SQLAlchemy no esta instalado. "
            "Se usaran los datos del archivo JSON. "
            "Instalar con: pip install -r requirements.txt"
        )
        _estado = "error"
        return None

    url = DATABASE_URL
    # Supabase entrega la URL con el esquema 'postgresql://'. psycopg (v3)
    # necesita el dialecto explicito.
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)

    try:
        motor = create_engine(
            url,
            pool_pre_ping=True,   # descarta conexiones muertas: el session pooler las cierra
            pool_size=3,          # el plan gratuito de Supabase tiene pocas conexiones
            max_overflow=2,
            pool_recycle=1800,
            connect_args={"connect_timeout": 8},
        )
        with motor.connect() as con:
            con.execute(text("SELECT 1"))
        _estado = "activa"
        logger.info("Conexion a la base de datos establecida.")
        return motor
    except Exception as e:  # noqa: BLE001 — cualquier fallo degrada a JSON
        logger.warning("No se pudo conectar a la base de datos (%s). Se usara el archivo JSON.", e)
        _estado = "error"
        return None


def motor():
    """Motor perezoso: se construye en el primer uso, no al importar."""
    global _motor
    if _motor is None and _estado != "error":
        _motor = _construir_motor()
    return _motor


def hay_base_de_datos() -> bool:
    return motor() is not None


def estado() -> str:
    """'sin_configurar', 'activa' o 'error'. Lo expone GET /health."""
    motor()
    return _estado


@contextmanager
def conexion() -> Iterator[Optional[object]]:
    """
    Contexto de conexion que nunca lanza por problemas de red.

        with conexion() as con:
            if con is None:
                ...  # degradar al JSON
    """
    m = motor()
    if m is None:
        yield None
        return

    con = None
    try:
        con = m.connect()
        yield con
    except Exception as e:  # noqa: BLE001
        logger.warning("Fallo la consulta a la base de datos (%s). Se degrada al archivo JSON.", e)
        yield None
    finally:
        if con is not None:
            try:
                con.close()
            except Exception:  # noqa: BLE001
                pass
