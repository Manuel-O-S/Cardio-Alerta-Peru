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

---

# Tamizaje por oximetría de pulso

Diferencia importante respecto de `/predict`: **acá no hay modelo**. Es un
algoritmo determinista publicado. Por eso cada respuesta trae la banda aplicada
con su `estado` y su `fuente` — el especialista tiene que poder ver de dónde salió
el número que se le aplicó. Un veredicto sobre un neonato sin la regla que lo
produjo no es auditable.

Todo el cálculo también existe en la app (Kotlin) y en la web (JavaScript), y los
tres pasan los mismos casos de `compartido/vectores_conformidad.json`.

---

## POST /tamizaje/evaluar

Evalúa un tamizaje. Lo usan la app y la web cuando hay internet; sin internet cada
una usa su propio motor local, que da el mismo resultado.

**Request** — `application/json`. Solo `altitud_msnm` y `spo2_preductal` son
obligatorios: el resto es opcional para que el personal pueda evaluar con lo que
tenga y el motor avise de lo que falta, en vez de bloquear.

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `altitud_msnm` | entero 0-5100 | Sí | Altitud del **establecimiento**. Se configura una vez, no se toma del GPS: bajo techo el GPS es poco confiable y un error cerca del límite de banda cambia el umbral. |
| `spo2_preductal` | entero 0-100 | Sí | Mano **derecha** |
| `spo2_postductal` | entero 0-100 | No | Cualquier **pie**. Sin este dato el tamizaje queda `incompleto`. |
| `horas_de_vida` | número 0-720 | No | En **horas**, no en días. La ventana empieza a las 24 h y "1 día" no distingue entre 24 y 47 h. |
| `edad_gestacional_sem` | entero 20-45 | No | |
| `fc_lpm` | entero 30-300 | No | Solo genera avisos |
| `fr_rpm` | entero 5-150 | No | Solo genera avisos |
| `peso_kg` | número 0.3-7.0 | No | Solo genera avisos |
| `sintomas` | lista de texto | No | Ids. Ver `GET /tamizaje/catalogo` |
| `oxigeno_suplementario` | booleano | No | default `false` |
| `diagnostico_prenatal_cc` | booleano | No | default `false` |
| `ronda` | entero 1-3 | No | default 1 |

Ejemplo:

```json
{
  "altitud_msnm": 3825,
  "spo2_preductal": 88,
  "spo2_postductal": 86,
  "horas_de_vida": 30,
  "sintomas": []
}
```

**Response 200**

```json
{
  "resultado": "negativo",
  "conducta": "Tamizaje superado. Continuar con los cuidados habituales.",
  "motivo_no_elegible": null,
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
    "fuente": "PROVISIONAL. Pendiente de verificación contra la fuente peruana."
  },
  "ronda": 1,
  "proxima_ronda": null,
  "minutos_espera": null,
  "diferencia_spo2": 2,
  "avisos": [
    { "codigo": "umbral_provisional", "nivel": "alto", "mensaje": "..." }
  ],
  "version_umbrales": "1.0.0",
  "advertencia": "Resultado de un tamizaje, no de un diagnóstico. No reemplaza el criterio clínico del especialista."
}
```

### Los cinco valores de `resultado`

| Valor | Qué significa | Qué hace la UI |
|---|---|---|
| `no_elegible` | No corresponde tamizaje. Ver `motivo_no_elegible`. | Mostrar la conducta, **no** mostrar un veredicto de tamizaje |
| `positivo` | Tamizaje no superado | Evaluación médica + ofrecer derivación con `/centros-cercanos` |
| `negativo` | Tamizaje superado | Cuidados habituales |
| `repetir` | Zona gris. Repetir en `minutos_espera`. | Guardar el caso con `proxima_ronda` y programar recordatorio |
| `incompleto` | Falta la SpO₂ del pie | Pedir la medición, **no** emitir resultado |

`motivo_no_elegible` puede ser `sintomatico`, `oxigeno_suplementario`,
`diagnostico_prenatal` o `menor_24h`.

### Tres reglas que conviene entender antes de consumir esto

**Un recién nacido sintomático no se tamiza.** Si viene cianosis central,
dificultad respiratoria, bradicardia, hipotensión, mala perfusión o hepatomegalia,
el resultado es `no_elegible` con motivo `sintomatico` — nunca `negativo`. El
tamizaje por oximetría está diseñado para recién nacidos **asintomáticos**;
devolverle "pasó" a un bebé con cianosis sería el peor error posible del sistema.

**Sin la medición del pie no hay resultado.** La diferencia preductal-postductal
es lo que detecta coartación de aorta e interrupción de arco: lesiones donde la
mano derecha satura normal y el pie no. Sin ella el resultado es `incompleto`, no
`negativo`.

**Los signos vitales nunca alteran el resultado.** FC, FR, peso y soplo cardíaco
salen en `avisos` y no entran al algoritmo. Combinarlos en un puntaje de riesgo
sería fabricar una regla clínica que nadie validó.

**Errores esperables**
- `422` si un campo está fuera de rango (lo valida pydantic) o si la altitud cae
  fuera de las bandas definidas

---

## GET /tamizaje/catalogo

Devuelve las bandas de altitud y el catálogo de síntomas. Existe para que la app y
la web construyan sus casillas desde una sola fuente: si Davis agrega un síntoma o
corrige un umbral, no hay que tocar tres interfaces.

**Request** — query params:

| Parámetro | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `altitud_msnm` | entero 0-5100 | No | Si se manda, la banda correspondiente viene primera en la lista |

**Response 200** — `version_umbrales`, `bandas`, `sintomas` (cada uno con `tipo`
`alarma` o `contexto`), `horas_minimas` y `rondas_maximas`.

---

## Nota sobre `estado: "provisional"`

Los umbrales de las bandas 2 y 3 (por encima de 2500 msnm) están marcados
`provisional`: se derivaron del percentil 5 de saturación en recién nacidos sanos
de altura y **no** fueron leídos de las Figuras 3 y 4 del artículo peruano
(`doi.org/10.47487/apcyccv.v5i3.366`).

Mientras sigan así, cada respuesta incluye un aviso de nivel `alto` que lo dice.
**La UI debe mostrarlo.** Es preferible que se vea en pantalla a que quede
escondido en un comentario del código.
