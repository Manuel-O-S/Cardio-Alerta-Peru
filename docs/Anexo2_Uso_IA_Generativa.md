# Anexo 2 — Declaración de uso de inteligencia artificial generativa

**Proyecto:** Cardio Alerta Perú
**Hackatón Niño San Borja 2026**

> **Nota para el equipo antes de entregar.** Este documento es un borrador
> reconstruido a partir de las sesiones de trabajo con la herramienta de IA.
> Cada integrante debe revisar la sección que le corresponde, corregir lo que
> no coincida con su experiencia real y completar los usos que no estén
> registrados aquí. Los campos entre corchetes deben completarse. Una
> declaración incompleta o inexacta es peor que no tenerla.

---

## 1. Herramientas utilizadas

| Herramienta | Proveedor | Uso principal |
|---|---|---|
| Claude (modelo de lenguaje) | Anthropic | Generación y revisión de código, búsqueda bibliográfica, redacción de documentación |
| [Completar si se usó otra] | | |

## 2. Declaración general

El equipo utilizó inteligencia artificial generativa como herramienta de apoyo
durante el desarrollo. **Ninguna decisión clínica del proyecto fue tomada por
la herramienta.** Los umbrales, criterios de elegibilidad y conductas
recomendadas provienen de literatura médica publicada y citada, y son
responsabilidad del equipo.

La IA no fue utilizada para generar datos clínicos sintéticos, resultados de
pacientes, ni evidencia que no provenga de fuentes verificables.

## 3. Usos por área

### 3.1 Código — motor de tamizaje

**Qué se generó con asistencia de IA:** la implementación del motor de reglas
de tamizaje en tres lenguajes (JavaScript, Kotlin y Python), sus suites de
prueba, los vectores de conformidad compartidos, y el generador que convierte
los vectores a código Kotlin.

**Cómo se verificó:** las tres implementaciones se compilaron y ejecutaron, y
sus suites de prueba se corrieron con resultados registrados: 114
comprobaciones en JavaScript, 17 pruebas en Kotlin y 43 en Python. Los 24
vectores de conformidad se ejecutan de forma idéntica en los tres motores. La
integración se verificó comprobando que los endpoints preexistentes
(`/health`, `/predict`, `/centros-cercanos`) siguen respondiendo sin cambios.

**Qué revisó el equipo:** [completar — quién revisó el código, qué modificó]

### 3.2 Código — API y web

**Qué se generó con asistencia de IA:** los endpoints `/tamizaje/evaluar` y
`/tamizaje/catalogo` con sus esquemas de datos, el proyecto web (React + Vite),
el formulario de tamizaje, el panel de derivación, la persistencia local de
casos pendientes y la configuración de PWA para operación sin conexión.

**Cómo se verificó:** compilación del proyecto sin errores, renderizado de
todos los componentes verificado, y pruebas de la lógica de persistencia.

**Qué revisó el equipo:** [completar]

### 3.3 Contenido clínico

**Qué se generó con asistencia de IA:** la estructura de la tabla de umbrales
por banda de altitud y la redacción de las conductas y avisos mostrados al
usuario.

**Origen de los valores clínicos:** los umbrales de la banda 1 corresponden al
algoritmo estándar de tamizaje por oximetría de pulso. Los de las bandas 2 y 3
fueron **derivados** y están marcados como `provisional` en el sistema:
**no fueron leídos directamente de las figuras de la fuente peruana**. Están
pendientes de verificación por [nombre del responsable clínico].

Esta limitación se declara explícitamente en el código, en la documentación y
en la interfaz de usuario, que muestra un aviso en cada resultado mientras los
umbrales sigan sin verificar.

**Revisión clínica realizada:** [completar — quién verificó qué, con qué
fuente, en qué fecha]

### 3.4 Búsqueda bibliográfica y evaluación de datasets

**Qué se hizo con asistencia de IA:** búsqueda sistemática de datasets públicos
de imagen médica cardíaca en repositorios (PhysioNet, Kaggle, Zenodo, Stanford
AIMI, Grand Challenge, Hugging Face) y de literatura sobre desempeño de modelos
en anatomía congénita. El resultado está en `docs/Datasets_Fase_Imagen.md`.

**Cómo se verificó:** cada afirmación relevante del informe incluye DOI o URL
de la fuente primaria. El informe distingue explícitamente entre lo verificado
en la fuente y lo inferido, e incluye una sección de vacíos de información con
lo que no se pudo confirmar.

**Qué revisó el equipo:** [completar — qué fuentes se verificaron
independientemente]

### 3.5 Documentación

**Qué se generó con asistencia de IA:** la documentación técnica del módulo de
tamizaje, la ampliación del contrato de API, el documento de propuesta del
proyecto y el borrador de este anexo.

**Qué revisó el equipo:** [completar]

## 4. Decisiones que NO tomó la inteligencia artificial

Se deja constancia explícita de lo siguiente:

- La elección del problema a resolver y del enfoque del proyecto.
- La decisión de descartar la fase de análisis de imagen.
- Los valores clínicos de referencia, que provienen de literatura citada.
- La validación clínica de los umbrales, pendiente de [nombre del responsable].
- El diseño de la puerta de elegibilidad como requisito clínico.

## 5. Limitaciones y advertencias

El equipo reconoce que:

- El código generado con asistencia de IA fue verificado mediante ejecución de
  pruebas, pero **no ha sido auditado por un tercero independiente**.
- Los umbrales de las bandas 2 y 3 permanecen sin verificación clínica al
  momento de esta entrega, y así se declara en la interfaz.
- El sistema es un **prototipo de hackatón** y no está aprobado para uso
  clínico. Su uso real requeriría aprobación de comité de ética, validación
  prospectiva y registro ante la autoridad sanitaria competente.

## 6. Integrantes y responsabilidad

Cada integrante declara conocer el contenido de este anexo y asume la
responsabilidad sobre el trabajo entregado, independientemente de las
herramientas utilizadas para producirlo.

| Integrante | Rol | Firma |
|---|---|---|
| [Nombre] | [Rol] | |
| [Nombre] | [Rol] | |
| [Nombre] | [Rol] | |
| [Nombre] | [Rol] | |
| [Nombre] | [Rol] | |

**Fecha:** [completar]
