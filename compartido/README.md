# compartido

**La fuente única de verdad clínica del proyecto.** No pertenece a ninguna
plataforma en particular — Kotlin (app), JavaScript (web) y Python (backend)
leen de acá para no clasificar distinto al mismo bebé.

Existe porque el stack del proyecto no permite compartir código directamente
entre Android, la web y el backend. La solución no fue elegir un solo lenguaje,
fue centralizar los **datos clínicos** (no el código) en un solo lugar y
replicar la lógica tres veces, verificándolas entre sí con los mismos casos de
prueba.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `umbrales.json` | Umbrales de SpO₂ por banda de altitud (crítico / pasa), ventana de tamizaje válida, y reglas de retamizaje. |
| `establecimientos.json` | Catálogo de establecimientos de salud: altitud (define la banda de tamizaje) y coordenadas (para ordenar centros de referencia por cercanía). |
| `vectores_conformidad.json` | Casos de prueba — el contrato clínico del proyecto. Los tres motores deben devolver exactamente el mismo resultado para cada caso. |
| `generar_vectores_kotlin.py` | Script que convierte `vectores_conformidad.json` al formato que consume la suite de pruebas de Android. |

## `umbrales.json` — las tres bandas de altitud

| Banda | Rango | SpO₂ crítico | SpO₂ pasa | Estado |
|---|---|---|---|---|
| B1 | 0 – 2,499 msnm | <90% | ≥95% | ✅ verificado (estándar AAP/CDC) |
| B2 | 2,500 – 3,499 msnm | <86% | ≥91% | ⚠️ provisional |
| B3 | 3,500 – 5,100 msnm | <83% | ≥88% | ⚠️ provisional |

**Las bandas B2 y B3 están marcadas `provisional`** porque sus valores fueron
derivados del percentil 5 de saturación en recién nacidos sanos de altura, pero
**no** fueron leídos directamente de las Figuras 3 y 4 del artículo peruano de
referencia (`doi.org/10.47487/apcyccv.v5i3.366`). El motor lo advierte en cada
respuesta que usa estas bandas.

**Tarea pendiente — Davis:** verificar esos seis números contra el artículo y
corregirlos en `umbrales.json` **y** en las tres implementaciones del motor
(`motorTamizaje.js`, `NeonatalRiskEngine.kt`, `motor_reglas.py`).

También define:
- **Ventana de tamizaje:** válida desde las 24 horas de vida (antes, sube la
  tasa de falsos positivos por la transición circulatoria normal) hasta
  idealmente las 48 horas.
- **Retamizaje:** un resultado "repetir" implica una nueva medición en 60
  minutos; a la tercera ronda sin pasar, el resultado es positivo.

## `establecimientos.json` — por qué altitud y coordenadas viven juntas

Antes la altitud se elegía en el formulario y las coordenadas se escribían
aparte en el panel de derivación — eso permitía terminar con la altitud de un
establecimiento y las coordenadas de otro, derivando desde el lugar
equivocado. Ahora un establecimiento define ambas cosas o no define ninguna.

- Las coordenadas son del centro de la ciudad, no del establecimiento exacto:
  sirven solo para ordenar hospitales por cercanía. Se reemplazan cuando el
  equipo tenga las coordenadas reales de cada uno.
- La altitud se configura por establecimiento y **no se toma del GPS**, porque
  bajo techo el GPS no es confiable para eso.

## Regla del equipo

**Quien cambie un número en `umbrales.json` lo cambia en los tres motores
(Kotlin, JS, Python) y corre las tres suites de conformidad contra
`vectores_conformidad.json` antes de mergear.** Es lo único que garantiza que
la app, la web y el backend clasifiquen igual al mismo paciente.
