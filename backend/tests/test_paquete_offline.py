"""
Verifica el contenido del paquete de datos para uso sin conexión.

POR QUE EXISTE ESTA SUITE
La aplicacion le pide permiso a la persona para guardar datos en su
dispositivo, y al pedirlo afirma que solo son datos de establecimientos de
salud. Esa afirmacion tiene que ser verificable, no una promesa en un
comentario.

Si alguien agrega al paquete un campo de paciente —aunque sea sin querer, al
ampliar el modelo— estas pruebas fallan.

Correr:  cd backend && pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

cliente = TestClient(app)


# Campos que NUNCA deben aparecer en el paquete. La lista incluye las variantes
# en las que alguien podria nombrarlos al ampliar el modelo.
CAMPOS_DE_PACIENTE = {
    "historia_clinica", "historiaclinica", "hc", "numero_historia",
    "nombre_paciente", "apellido", "apellido_materno", "apellido_paterno",
    "dni", "documento", "paciente",
    "spo2", "spo2_preductal", "spo2_postductal", "saturacion",
    "fc_lpm", "fr_rpm", "peso_kg", "edad_gestacional_sem", "horas_de_vida",
    "sintomas", "resultado", "tamizaje", "diagnostico",
    "madre", "fecha_nacimiento", "sexo",
}

CAMPOS_ESPERADOS = {
    "nombre", "direccion", "departamento", "nivel",
    "iafas", "especialidad", "lat", "lon", "status",
}


@pytest.fixture(scope="module")
def paquete():
    respuesta = cliente.get("/centros-cercanos/paquete-offline")
    assert respuesta.status_code == 200
    return respuesta.json()


# --- Contenido: solo datos de establecimientos --------------------------


def test_el_paquete_declara_que_no_lleva_datos_de_paciente(paquete):
    assert paquete["contiene_datos_de_paciente"] is False


def test_ningun_hospital_trae_campos_de_paciente(paquete):
    for hospital in paquete["hospitales"]:
        intrusos = {c for c in hospital if c.lower() in CAMPOS_DE_PACIENTE}
        assert not intrusos, (
            f"El paquete offline incluye campos de paciente: {intrusos}. "
            "La interfaz afirma que solo contiene datos de establecimientos."
        )


def test_los_campos_son_exactamente_los_esperados(paquete):
    """
    Si aparece un campo nuevo, esta prueba falla a proposito: obliga a decidir
    conscientemente si corresponde exponerlo y a actualizar el texto del
    permiso que ve la persona.
    """
    for hospital in paquete["hospitales"]:
        assert set(hospital) == CAMPOS_ESPERADOS, (
            f"Campos inesperados: {set(hospital) ^ CAMPOS_ESPERADOS}. "
            "Revisar si corresponde incluirlos y actualizar el texto del permiso."
        )


def test_el_paquete_completo_no_menciona_terminos_de_paciente(paquete):
    """Barrido sobre el JSON entero, por si aparecieran anidados."""
    import json

    texto = json.dumps(paquete).lower()
    criticos = ["historia_clinica", "spo2", "dni", "apellido_materno", "tamizaje"]
    encontrados = [t for t in criticos if t in texto]
    assert not encontrados, f"El paquete menciona: {encontrados}"


# --- Utilidad: que sirva para lo que dice servir ------------------------


def test_trae_todos_los_hospitales_no_solo_los_cercanos(paquete):
    """
    El sentido del paquete es poder buscar sin conexion desde cualquier lugar.
    Si solo trajera los cercanos a un punto, no serviria al mudarse de
    establecimiento o al cambiar de filtro.
    """
    assert paquete["total"] >= 20
    assert len(paquete["hospitales"]) == paquete["total"]


def test_cada_hospital_tiene_coordenadas_usables(paquete):
    """Sin coordenadas no se puede calcular distancia en el dispositivo."""
    for h in paquete["hospitales"]:
        assert isinstance(h["lat"], float)
        assert isinstance(h["lon"], float)
        # Territorio peruano, con margen. Detecta el signo invertido.
        assert -18.5 <= h["lat"] <= 0.5, f"{h['nombre']}: latitud fuera del Peru"
        assert -81.5 <= h["lon"] <= -68.5, f"{h['nombre']}: longitud fuera del Peru"


def test_no_trae_distancias(paquete):
    """
    Las distancias se calculan en el dispositivo. Si vinieran del servidor,
    serian relativas a un punto fijo y no servirian sin conexion.
    """
    for h in paquete["hospitales"]:
        assert "distancia_km" not in h


def test_la_version_es_estable_entre_llamadas(paquete):
    """
    La version es un hash del contenido: sirve para que el dispositivo sepa si
    hace falta volver a descargar. Si cambiara en cada llamada, obligaria a
    descargar siempre.
    """
    otra = cliente.get("/centros-cercanos/paquete-offline").json()
    assert otra["version"] == paquete["version"]


def test_declara_de_donde_salieron_los_datos(paquete):
    assert paquete["origen_datos"] in ("postgresql", "archivo_json")
