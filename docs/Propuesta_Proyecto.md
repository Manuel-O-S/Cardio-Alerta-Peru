# Cardio Alerta Perú — Propuesta del proyecto

**Hackatón Niño San Borja 2026 · Instituto Nacional de Salud del Niño San Borja**

> Este documento reemplaza la premisa original del proyecto (clasificación de
> imágenes de ecocardiograma). El motivo del cambio está en
> [`Datasets_Fase_Imagen.md`](./Datasets_Fase_Imagen.md) y se resume en la
> sección 7.

---

## 1. El problema

En el Perú nacen alrededor de medio millón de niños al año. La cardiopatía
congénita crítica es una de las principales causas de muerte neonatal evitable,
y su detección temprana depende de un tamizaje que en la práctica no se realiza
de forma uniforme.

Hay dos brechas, y la segunda es la que casi nadie atiende:

**Brecha de acceso.** En un establecimiento de altura no hay cardiólogo
pediatra, no hay ecocardiógrafo y no hay quien lo opere. El diagnóstico
especializado no está disponible en el punto donde nace el niño.

**Brecha de umbral.** El tamizaje por oximetría de pulso usa internacionalmente
un corte de 95% de saturación. Ese valor se estableció a nivel del mar. Un
recién nacido **sano** en Juliaca, a 3 825 msnm, satura alrededor de 88%.
Aplicarle el corte internacional lo marca como positivo y desencadena una
derivación de cientos de kilómetros para un niño que no tiene nada.

El Perú tiene una proporción alta de nacimientos por encima de los 2 500 msnm.
Un tamizaje que ignora la altitud no es un tamizaje: es una fábrica de falsos
positivos que agota la confianza del personal y el presupuesto de traslados.

## 2. Qué construimos

Una herramienta de apoyo al tamizaje neonatal dirigida a **profesionales de
enfermería sin especialización en cardiología neonatal** — que son quienes
realizan la evaluación inicial en la mayoría de establecimientos del país.

El personal ingresa los datos que ya toma de rutina, y la herramienta devuelve
una clasificación de riesgo, una conducta concreta y, cuando corresponde, el
centro de referencia más cercano.

### Datos que se ingresan

| Dato | Obligatorio | Nota |
|---|---|---|
| Altitud del establecimiento | Sí | Se configura una vez, no por paciente |
| SpO₂ preductal (mano derecha) | Sí | |
| SpO₂ postductal (pie) | Recomendado | Sin este dato el tamizaje queda incompleto |
| Horas de vida | No | En horas, no en días |
| Edad gestacional | No | |
| Peso, FC, FR | No | Generan avisos, no alteran el resultado |
| Signos y síntomas | No | Algunos excluyen del tamizaje |

### Qué devuelve

Uno de cinco resultados, cada uno con su conducta:

| Resultado | Conducta |
|---|---|
| **No elegible** | No corresponde tamizaje. Evaluación clínica inmediata. |
| **Positivo** | Tamizaje no superado. Evaluación médica y derivación. |
| **Negativo** | Tamizaje superado. Cuidados habituales. |
| **Repetir** | Zona gris. Repetir en 60 minutos, hasta 3 rondas. |
| **Incompleto** | Falta la medición del pie. No se emite resultado. |

## 3. Las cuatro decisiones de diseño que sostienen el proyecto

### 3.1 Umbrales por banda de altitud

El corte de saturación no es un número, es una tabla de tres bandas. La misma
medición produce resultados distintos —y correctos— según dónde se tome.

| Banda | Rango | Crítico | Pasa |
|---|---|---|---|
| B1 | 0 – 2 499 msnm | < 90% | ≥ 95% |
| B2 | 2 500 – 3 499 msnm | < 86% | ≥ 91% |
| B3 | 3 500 – 5 100 msnm | < 83% | ≥ 88% |

Los umbrales de B2 y B3 están marcados **provisionales** en el sistema y
pendientes de verificación contra la fuente peruana. Mientras lo estén, cada
resultado incluye un aviso visible que lo declara. Es deliberado: preferimos
que se vea en pantalla a que quede escondido en un comentario del código.

### 3.2 Un recién nacido sintomático no se tamiza

Antes de aplicar el algoritmo corre una **puerta de elegibilidad**. Si hay
cianosis central, dificultad respiratoria, bradicardia, hipotensión, mala
perfusión o hepatomegalia, el resultado es *no elegible* con conducta de
evaluación inmediata — nunca *negativo*.

El tamizaje por oximetría está diseñado para recién nacidos **asintomáticos**.
Un bebé con cianosis central no necesita que una app le diga si pasó: necesita
que lo vean. Devolverle "tamizaje superado" sería el peor error posible de este
sistema, y por eso la puerta existe antes que el cálculo.

También quedan fuera del tamizaje: oxígeno suplementario (la saturación no es
interpretable), diagnóstico prenatal ya establecido, y menos de 24 horas de
vida (la transición circulatoria no ha terminado).

El **soplo cardíaco** es distinto: no excluye del tamizaje, porque los soplos
son frecuentes en neonatos y muchos son inocentes, pero genera un aviso
obligatorio de evaluación clínica sea cual sea el resultado.

### 3.3 No hay puntaje compuesto

Peso, FC, FR, prematuridad y soplo se muestran como avisos y **no entran al
algoritmo**. El resultado sale únicamente de la oximetría.

Combinar oximetría, soplo y taquicardia en un score de riesgo sería fabricar
una regla clínica que nadie validó. La herramienta muestra el contexto; la
interpretación es del profesional.

### 3.4 No es un modelo de inteligencia artificial, y es a propósito

El núcleo es un **motor de reglas determinista** basado en el algoritmo de
tamizaje por oximetría publicado, con umbrales ajustados por altitud. No es un
clasificador entrenado.

Es una decisión, no una limitación:

- Un cardiólogo o un regulador puede leer la regla completa y verificarla. Un
  clasificador opaco decidiendo sobre neonatos es peor producto, no mejor.
- No requiere dataset ni validación de un modelo estadístico.
- Corre íntegro en el dispositivo, lo que resuelve el requisito de operación
  sin conexión sin necesidad de empaquetar un modelo.

## 4. Derivación

Cuando el tamizaje no se supera, la herramienta muestra los establecimientos
con capacidad de evaluación cardiológica neonatal más cercanos, filtrables por
red de aseguramiento (MINSA/SIS, EsSalud, otras), con la distancia calculada
desde la ubicación del establecimiento.

La base contiene 25 centros de referencia con sus coordenadas, nivel de
complejidad y red. Las distancias son en línea recta; la distancia real por
carretera es mayor y así se indica en pantalla.

## 5. Funcionamiento sin conexión

El motor de tamizaje corre completo en el dispositivo, así que **el cálculo
funciona sin internet**. No depende del servidor.

La lista de centros se guarda localmente tras la primera consulta con conexión.
Si después no hay red, la herramienta muestra esa copia y declara en pantalla
que los datos son de la última sincronización.

Los casos que quedan en estado *repetir* se guardan en el dispositivo con la
hora en que corresponde la siguiente ronda. Es la pieza que evita el modo de
falla más común del tamizaje real: no el error de cálculo, sino el caso que
queda pendiente y se pierde en el cambio de turno.

## 6. Arquitectura

| Componente | Tecnología | Estado |
|---|---|---|
| Motor de tamizaje | JS, Kotlin y Python | 174 pruebas, verificado |
| API | FastAPI, desplegada en Render | Funcionando |
| Web / PWA | React + Vite, en Netlify | Funcionando |
| App móvil | Kotlin | Roadmap |

El motor está implementado tres veces porque el stack no permite compartir
código entre los tres lenguajes. Para que no diverjan, existe
`compartido/vectores_conformidad.json`: 24 casos clínicos que las tres
implementaciones deben resolver de forma idéntica.

> Regla del equipo: quien modifique un umbral corre las tres suites, o no
> integra. Es el único mecanismo que impide que la app y el servidor entreguen
> resultados distintos para el mismo paciente.

## 7. Por qué el análisis de imagen quedó fuera

La propuesta inicial contemplaba clasificar imágenes de ecocardiograma. Se
descartó tras una evaluación sistemática documentada en
[`Datasets_Fase_Imagen.md`](./Datasets_Fase_Imagen.md), por dos razones:

**No existen los datos.** Ningún dataset público combina población neonatal,
imágenes de ecocardiograma y etiquetas de diagnóstico de cardiopatía congénita
validables clínicamente. Los datasets neonatales de ecocardiograma existentes
etiquetan vistas anatómicas, no diagnósticos; los que sí etiquetan cardiopatía
son fetales o de otra modalidad. Adicionalmente, la literatura documenta que
los modelos entrenados en cohortes generales caen de forma severa al aplicarse
a anatomía congénita.

**No resuelve la brecha de este contexto.** Un ecocardiograma requiere un
equipo y un especialista que lo opere. Donde ambos existen, el especialista
interpreta la imagen en tiempo real y no necesita asistencia automatizada.
Donde no existen —que es precisamente el escenario del proyecto— no hay imagen
que analizar.

La brecha real no es de interpretación: es de acceso. Por eso el proyecto se
concentra en una herramienta que funciona con un oxímetro de pulso, un
dispositivo que sí está disponible en el primer nivel de atención.

## 8. Limitaciones declaradas

- Los umbrales de las bandas 2 y 3 son provisionales y están pendientes de
  verificación contra la fuente peruana.
- Un resultado positivo **no equivale a diagnóstico de cardiopatía**: por cada
  caso de cardiopatía crítica detectado hay varios de causa infecciosa o
  respiratoria.
- Un resultado negativo **no descarta** cardiopatía congénita: algunas no
  cursan con hipoxemia en el período neonatal.
- El tamizaje es un complemento del examen físico, no un reemplazo.
- La herramienta es un prototipo de hackatón. Su uso clínico real requeriría
  aprobación de comité de ética, validación prospectiva en población peruana y
  registro del software como dispositivo médico ante DIGEMID.

## 9. Marco normativo

La Ley que modifica la Ley 29885, publicada en enero de 2024, incorpora la
cardiopatía congénita al Programa de Tamizaje Neonatal Universal, entre las
condiciones de descarte obligatorio en todo nacido vivo durante los primeros 28
días de vida. La implementación nacional está en curso.

El tratamiento de datos de salud de menores se rige por la Ley 29733 de
Protección de Datos Personales y su reglamento, que exige consentimiento de
quienes ejercen la patria potestad. El prototipo no transmite datos
identificables del paciente: el cálculo ocurre en el dispositivo y el
identificador de historia clínica se guarda solo localmente.

## 10. Fuentes

1. Bravo-Jaimes K, et al. Tamizaje neonatal de cardiopatías congénitas críticas
   en el Perú: un llamado de urgencia. *Arch Peru Cardiol Cir Cardiovasc.*
   2024;5(3):157-166. `doi.org/10.47487/apcyccv.v5i3.366`
2. Bravo-Jaimes K, Vasquez-Loarte T, Rojas-Camayo J, et al. A new algorithm
   DEtectS critical Congenital Heart Disease at different altitudes: ANDES-CHD
   study. *J Perinatol.* 2024;44(3):373-378. `doi.org/10.1038/s41372-024-01888-5`
3. Thangaratinam S, et al. Pulse oximetry screening for critical congenital
   heart defects in asymptomatic newborn babies: a systematic review and
   meta-analysis. *Lancet.* 2012;379:2459-2464.
4. Rojas-Camayo J, et al. Reference values for oxygen saturation from sea level
   to the highest human habitation in the Andes. *Thorax.* 2018.
5. Ley que modifica la Ley 29885 — Ley del Tamizaje Neonatal Universal (2024).
