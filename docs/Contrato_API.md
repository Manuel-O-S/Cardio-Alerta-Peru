# Contrato de API — Cardio Alerta Perú

Versión en prosa del contrato definido en `backend/app/schemas.py`. Si hay
alguna diferencia entre este documento y el código, **el código manda** — este
archivo es para no tener que leer Python solo para saber qué mandar/recibir.

También puedes ver esto de forma interactiva corriendo el backend en local y
abriendo `http://127.0.0.1:8000/docs` (Swagger UI, autogenerado por FastAPI).

Base URL:
- En local: `http://127.0.0.1:8000`
- En producción (Render): https://cardio-alerta-peru.onrender.com

---

## GET /health

Confirma que la API está viva. Sin parámetros.

**Response 200**
```json
{ "status": "ok" }
```

---

## POST /predict

Clasifica una imagen de ecocardiograma. Lo usan tanto el modo online de la
app (Sandro, K06) como cualquier prueba manual.

**Request**
- `Content-Type: multipart/form-data`
- Campo `imagen`: archivo (jpg o png)

**Response 200**
```json
{
  "clasificacion": "sospecha_cardiopatia",
  "confianza": 0.87,
  "modelo_version": "v0-placeholder",
  "advertencia": "Resultado de un prototipo experimental. No reemplaza el criterio clínico del especialista."
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `clasificacion` | `"sano"` \| `"sospecha_cardiopatia"` | Único valor posible, sin términos intermedios |
| `confianza` | número, 0.0–1.0 | Qué tan segura está la predicción |
| `modelo_version` | texto | Para saber qué versión del modelo respondió (útil al depurar) |
| `advertencia` | texto | **Siempre viene, fijo.** La app debe mostrarlo junto al resultado — no es opcional, es requisito de las bases (el sistema no reemplaza validación clínica) |

**Errores esperables**
- `422` si no se manda el campo `imagen` o no es un archivo válido (FastAPI lo valida solo)
- `500` si el modelo falla al procesar la imagen (se define el detalle en B08)

**Estado actual:** el valor que devuelve hoy es fijo (`"sano"`, 0.5) —
se vuelve dinámico en B06 y real en B08. El **contrato no cambia** de acá a
la versión final, solo el contenido de la respuesta.

---

## GET /centros-cercanos

Devuelve los centros de referencia más cercanos a una ubicación, para la
derivación del paciente. Lo usa la app cuando hay internet (K06/K08).

**Request** — query params:

| Parámetro | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `lat` | número | Sí | Latitud del especialista/paciente |
| `lon` | número | Sí | Longitud del especialista/paciente |
| `limite` | entero | No (default 3) | Cuántos centros devolver como máximo, 1 a 10 |
| `tipo_seguro` | texto | No | `"MINSA"`, `"EsSalud"` u `"Otras"`. Si no se manda, busca en todas las redes. Ver nota clínica abajo. |

Ejemplo: `GET /centros-cercanos/?lat=-12.089&lon=-76.997&limite=3&tipo_seguro=MINSA`

**Response 200**
```json
{
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
      "distancia_km": 2.4
    }
  ]
}
```

| Campo | Notas |
|---|---|
| `nivel` | Nivel de complejidad del establecimiento (III-2 es el más alto de esta lista) |
| `iafas` | Red de salud: `"MINSA"`, `"EsSalud"` u `"Otras"` (privadas/FFAA) |
| `distancia_km` | Línea recta desde la ubicación consultada hasta el distrito/ciudad del centro — no es ruta real por calles |

`centros` puede venir **vacío** (`"centros": []`) si el filtro `tipo_seguro`
no tiene ningún centro cerca — la app debe manejar ese caso mostrando un
mensaje, no un error.

**Nota clínica (de Davis):** en Perú, un paciente normalmente se deriva
dentro de su misma red de seguro (MINSA/SIS → red MINSA, EsSalud → red
EsSalud). Si la app sabe el tipo de seguro del paciente, conviene mandarlo
en `tipo_seguro` para no sugerir un centro al que el paciente no tiene
acceso directo. Es opcional: sin ese dato, el endpoint igual funciona
buscando en todas las redes.

**Errores esperables**
- `422` si falta `lat` o `lon`, o no son números válidos

**Estado (B07):** ya usa la lista real de 25 establecimientos que armó Davis
(fuente: `backend/data/centros_referencia.json`) y calcula distancia real
por haversine. Pendiente para más adelante (fuera del alcance de la
hackatón): geocodificar direcciones exactas en vez de centro del
distrito/ciudad, y rutas reales en vez de línea recta.

---

## Reglas generales para quien consuma esta API (Sandro, Said)

- Todas las respuestas son JSON.
- El campo `advertencia` de `/predict` se muestra siempre en la UI, sin
  excepción — es un requisito de las bases del INSN, no un detalle estético.
- Si el backend no responde (timeout, sin internet, Render caído), ese es
  exactamente el caso para el que existe el modo offline — no es un bug, es
  la app funcionando como se diseñó (ver `docs/Arquitectura_Cardio_Alerta_Peru.docx`,
  Decisión 1).
