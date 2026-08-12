#!/usr/bin/env python3
"""
Prepara la base de datos: crea las tablas y carga los 25 centros de referencia.

Uso:
    cd backend
    export DATABASE_URL="postgresql://postgres.xxxx:CLAVE@aws-1-...:5432/postgres"
    python -m scripts.cargar_datos

O con un archivo .env en backend/ (ver .env.example).

Es idempotente: se puede correr las veces que haga falta. Los centros se
identifican por (nombre, departamento); si ya existen, se actualizan.

NUNCA pegues la contrasena dentro de este archivo.
"""

import json
import os
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))


def cargar_dotenv():
    """Lee backend/.env si existe. Evita depender de python-dotenv."""
    ruta = RAIZ / ".env"
    if not ruta.exists():
        return
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        linea = linea.strip()
        if not linea or linea.startswith("#") or "=" not in linea:
            continue
        clave, valor = linea.split("=", 1)
        os.environ.setdefault(clave.strip(), valor.strip().strip('"').strip("'"))


def main() -> int:
    cargar_dotenv()

    url = os.getenv("DATABASE_URL")
    if not url:
        print("ERROR: falta la variable DATABASE_URL.")
        print("       Definila en el entorno o en backend/.env (ver .env.example).")
        return 1

    try:
        from sqlalchemy import create_engine, text
    except ImportError:
        print("ERROR: falta SQLAlchemy. Instalar con:")
        print("       pip install -r requirements.txt")
        return 1

    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)

    # No imprimir la URL: lleva la contrasena.
    print("Conectando a la base de datos…")
    motor = create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 10})

    esquema = (RAIZ / "data" / "esquema.sql").read_text(encoding="utf-8")
    centros = json.loads((RAIZ / "data" / "centros_referencia.json").read_text(encoding="utf-8"))

    # Se ejecuta sentencia por sentencia en vez de todo el archivo de una vez:
    # así, si una falla, el mensaje dice exactamente cuál.
    import re
    sin_comentarios = re.sub(r"--[^\n]*", "", esquema)
    sentencias = [x.strip() for x in sin_comentarios.split(";") if x.strip()]

    with motor.begin() as con:
        print(f"Creando tablas ({len(sentencias)} sentencias)…")
        for sentencia in sentencias:
            try:
                con.execute(text(sentencia))
            except Exception as e:
                etiqueta = " ".join(sentencia.split()[:6])
                print(f"  ERROR en: {etiqueta}\n  {e}")
                raise

        print(f"Cargando {len(centros)} hospitales…")
        insertar = text("""
            INSERT INTO hospitales
                (nombre, direccion, departamento, nivel, iafas, especialidad, lat, lon)
            VALUES
                (:nombre, :direccion, :departamento, :nivel, :iafas, :especialidad, :lat, :lon)
            ON CONFLICT (nombre, departamento) DO UPDATE SET
                direccion    = EXCLUDED.direccion,
                nivel        = EXCLUDED.nivel,
                iafas        = EXCLUDED.iafas,
                especialidad = EXCLUDED.especialidad,
                lat          = EXCLUDED.lat,
                lon          = EXCLUDED.lon
        """)
        for c in centros:
            con.execute(insertar, c)

    with motor.connect() as con:
        total = con.execute(text("SELECT COUNT(*) FROM hospitales")).scalar()
        disponibles = con.execute(
            text("SELECT COUNT(*) FROM hospitales WHERE lower(status) = \'disponible\'")
        ).scalar()
        print(f"\nListo. {total} hospitales en la base de datos, {disponibles} disponibles.")
        print("El script NO toca la columna `status`: la disponibilidad se")
        print("mantiene desde Supabase, no desde el repositorio.")
        print("Verificar con:  curl 'http://127.0.0.1:8000/health'")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
