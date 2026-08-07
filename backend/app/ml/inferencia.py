"""
Envuelve la clasificación de una imagen de ecocardiograma.

`clasificar_dummy` (tarea B06) es un simulador: no usa ningún modelo real,
pero tampoco devuelve siempre lo mismo — calcula el resultado a partir del
contenido de la imagen (un hash), así la MISMA imagen siempre da el MISMO
resultado. Eso le sirve a Sandro para probar la app de forma reproducible
(puede armar un set de imágenes de prueba y saber qué resultado esperar de
cada una) sin depender de que el modelo real ya esté listo.

`clasificar` es la función real. Se completa en B08, cuando Angel entregue
el modelo (I07) — ese día esta función reemplaza a la dummy y el resto del
código (predict.py) no cambia, porque el contrato (B04) es el mismo.
"""

import hashlib

from app.schemas import Clasificacion


def clasificar_dummy(contenido: bytes) -> tuple[Clasificacion, float]:
    huella = hashlib.sha256(contenido).digest()

    clasificacion = (
        Clasificacion.sospecha_cardiopatia if huella[0] >= 128 else Clasificacion.sano
    )
    # confianza entre 0.50 y 0.99, para que se vea como un resultado real
    confianza = round(0.5 + (huella[1] / 255) * 0.49, 2)

    return clasificacion, confianza


def clasificar(imagen_bytes: bytes) -> dict:
    raise NotImplementedError(
        "Pendiente: integrar el modelo real entregado por Angel (ver tarea B08)."
    )
