# Tamizaje numérico por oximetría de pulso

Cómo funciona el módulo de tamizaje, qué decisiones clínicas tiene adentro y qué
falta antes de usarlo con pacientes reales.

---

## 1. Qué hace

Toma la saturación de oxígeno de un recién nacido y la evalúa contra el umbral
que corresponde a **la altitud del establecimiento**, no contra un umbral
genérico.

```
Misma medición — SpO₂ 88% mano derecha, 86% pie, 30 h de vida

  Lima     (150 msnm)  →  POSITIVO   banda B1
  Juliaca (3825 msnm)  →  NEGATIVO   banda B3
```

Un recién nacido sano en Juliaca satura alrededor de 88%. Con el corte
internacional de 95% sale positivo y se termina derivando a un bebé sano a
cientos de kilómetros. Ese contraste es la razón de existir del módulo, y está
fijado como caso de prueba en los tres motores (`demo_lima_vs_juliaca_a` y `_b`),
así que no se puede romper por accidente.

## 2. Por qué no es un modelo de IA

Es un algoritmo determinista publicado, de unas doce comparaciones. Eso es una
decisión, no una limitación:

- Un cardiólogo o un regulador tiene que poder leer la regla completa y
  verificarla. Un clasificador opaco decidiendo sobre neonatos es peor producto,
  no mejor.
- No necesita dataset. La fase de imagen sí, y no existe uno público que permita
  validación clínica de ecocardiografía neonatal.
- Corre en el celular y en el navegador. El requisito offline del documento de
  arquitectura se resuelve con un PWA, sin TFLite y sin APK.

## 3. Las tres decisiones clínicas que importan

### 3.1 Un recién nacido sintomático no se tamiza

Antes del algoritmo corre una **puerta de elegibilidad**. Si hay cianosis
central, dificultad respiratoria, bradicardia, hipotensión, mala perfusión o
hepatomegalia, el resultado es `no_elegible` con la conducta "evaluación clínica
inmediata" — nunca `negativo`.

El tamizaje por oximetría está diseñado para recién nacidos **asintomáticos**. Un
bebé con cianosis central no necesita que una app le diga si "pasó": necesita
que lo vean. Devolverle "tamizaje superado" sería el peor error posible de este
sistema.

También quedan fuera: oxígeno suplementario (la saturación no es interpretable),
diagnóstico prenatal de cardiopatía (ya hay un plan) y menos de 24 h de vida (la
transición circulatoria no terminó y los falsos positivos se disparan).

**El soplo cardíaco es distinto.** No excluye del tamizaje — los soplos son
frecuentes en neonatos y muchos son inocentes — pero genera un aviso obligatorio
de evaluación clínica sea cual sea el resultado del tamizaje.

### 3.2 Sin la medición del pie no hay resultado

Se necesitan **dos** mediciones: mano derecha (preductal) y cualquier pie
(postductal). La diferencia entre ambas es lo que detecta coartación de aorta e
interrupción de arco: lesiones donde la mano derecha satura normal y el pie no.

Si falta el postductal, el resultado es `incompleto`, no `negativo`. Un "pasó el
tamizaje" con una sola medición es falsa tranquilidad.

Excepción: si el preductal ya está bajo el corte crítico, el resultado es
`positivo` sin necesidad del pie. No hace falta la segunda medición para reprobar
a un bebé que satura 85% a nivel del mar.

### 3.3 No hay puntaje compuesto

FC, FR, peso, prematuridad y soplo salen en `avisos` y **no entran al algoritmo**.
El resultado sale únicamente de la oximetría.

Combinar oximetría + soplo + taquicardia en un score de riesgo sería fabricar una
regla clínica que nadie validó. Ante un jurado de cardiólogos pediátricos eso se
detecta al instante, y con razón.

## 4. Las bandas de altitud

| Banda | Rango | Crítico | Pasa | Dif. máx | Estado |
|---|---|---|---|---|---|
| B1 | 0 – 2 499 msnm | < 90% | ≥ 95% | 3 | verificado |
| B2 | 2 500 – 3 499 msnm | < 86% | ≥ 91% | 3 | **provisional** |
| B3 | 3 500 – 5 100 msnm | < 83% | ≥ 88% | 3 | **provisional** |

Un resultado en zona gris (ni crítico ni de paso, o diferencia mayor a 3) es
`repetir`: volver a medir en 60 minutos, hasta 3 rondas. A la tercera sin pasar,
el resultado es positivo.

## 5. Lógica triplicada, y cómo se evita que diverja

El motor está implementado tres veces:

| Implementación | Archivo | Suite |
|---|---|---|
| JavaScript (web, PWA offline) | `web-react/src/tamizaje/motorTamizaje.js` | 114 comprobaciones |
| Kotlin (app Android offline) | `app-kotlin/tamizaje/MotorTamizaje.kt` | 17 pruebas |
| Python (backend, registro y web) | `backend/app/tamizaje/motor_reglas.py` | 43 pruebas |

Es inevitable con este stack: no hay forma de compartir código entre Kotlin,
JavaScript y Python. Por eso existe `/compartido`:

- `umbrales.json` — la tabla clínica, en un solo lugar
- `vectores_conformidad.json` — 24 casos que las tres implementaciones deben
  resolver idéntico. Las suites de JS y Python lo leen directamente; la de Kotlin
  lo consume a través del generador.
- `generar_vectores_kotlin.py` — regenera `VectoresConformidad.kt`

> **Regla del equipo: quien toque un umbral corre las tres suites, o no mergea.**
> Es el único mecanismo que impide que la app y el backend le den resultados
> distintos al mismo bebé.

```bash
# backend
cd backend && pip install -r requirements.txt -r requirements-dev.txt && pytest -v

# web
node web-react/src/tamizaje/motorTamizaje.test.js

# app
./gradlew test        # una vez que exista el proyecto Android (K01)
```

## 6. Pendiente antes de usarlo con pacientes reales

**Bloqueante — Davis.** Los umbrales de las bandas 2 y 3 están marcados
`provisional`: se derivaron del percentil 5 de saturación en recién nacidos sanos
de altura y **no** fueron leídos de las Figuras 3 y 4 del artículo peruano
(`doi.org/10.47487/apcyccv.v5i3.366`). Son seis números. Hay que corregirlos en
`compartido/umbrales.json` y en los tres motores, regenerar los vectores de
Kotlin y correr las tres suites.

Mientras sigan provisionales, cada respuesta del motor incluye un aviso de nivel
`alto` que lo dice, y la UI lo muestra. Es deliberado: preferimos que se vea en
pantalla a que quede escondido en un comentario.

**También Davis.** Confirmar los rangos de FC (100-180), FR (30-60) y peso
(≥ 2.5 kg). Son valores de referencia neonatales de uso general, no de una guía
peruana específica. Solo generan avisos, nunca cambian el resultado.

**Equipo.** La altitud se configura **por establecimiento**, no por GPS. Bajo
techo el GPS es poco confiable y un error cerca del límite de banda cambia el
umbral que se aplica.

**Sandro — lo que este módulo NO resuelve.** La persistencia del estado
`repetir`. El motor dice "repetir en 60 minutos, ronda 2 de 3", pero que ese
estado sobreviva a que se cierre la app, se reinicie el equipo y cambie el turno
es trabajo de la app. Es donde el tamizaje real fracasa más seguido.

## 7. Advertencias que el equipo debe poder explicar

- **`positivo` no significa cardiopatía.** Por cada caso de cardiopatía crítica
  detectado hay varios de causa infecciosa o respiratoria. El texto en pantalla
  dice "tamizaje no superado, requiere evaluación médica".
- **`negativo` no descarta.** Algunas cardiopatías no cursan con hipoxemia en el
  período neonatal.
- **El tamizaje es un complemento del examen físico, no un reemplazo.**

## 8. Fuentes

1. Bravo-Jaimes K, et al. Tamizaje neonatal de cardiopatías congénitas críticas
   en el Perú: un llamado de urgencia. *Arch Peru Cardiol Cir Cardiovasc.*
   2024;5(3):157-166. `doi.org/10.47487/apcyccv.v5i3.366`
2. Bravo-Jaimes K, et al. ANDES-CHD. *J Perinatol.* 2024;44(3):373-378.
3. Rojas-Camayo J, et al. Reference values for oxygen saturation from sea level
   to the highest human habitation in the Andes. *Thorax.* 2018.
4. Ley 31975 (2024), que modifica la Ley 29885 — Ley del Tamizaje Neonatal
   Universal.
