# Cardio Alerta Perú

App de apoyo al tamizaje neonatal para especialistas de enfermería: **tamiza
recién nacidos por oximetría de pulso usando umbrales adaptados a la altitud
del Perú**, funciona con o sin internet, y sugiere el centro especializado más
cercano al que derivar al paciente según su seguro.

Dirigida a **profesionales de enfermería sin especialización en cardiología
neonatal**, que son quienes realizan la evaluación inicial en la mayoría de
establecimientos del país.

La premisa completa está en
[`docs/Propuesta_Proyecto.md`](./docs/Propuesta_Proyecto.md).

El análisis de imagen de ecocardiograma (IA/ML) quedó **fuera del alcance**,
por ausencia de datasets peruanos que permitan validación clínica y porque no
resuelve la brecha del primer nivel de atención, que es donde no hay
ecocardiógrafo ni cardiólogo pediatra disponible. El sustento está en
[`docs/Datasets_Fase_Imagen.md`](./docs/Datasets_Fase_Imagen.md). El motor de
tamizaje **no usa IA**: es un motor de reglas determinista y auditable por un
cardiólogo, basado en umbrales de literatura clínica ya publicada.

Proyecto para la **Hackatón Niño San Borja 2026** — Desafío 2: *Cardio Alerta
Perú: cuidando corazones desde el primer latido*.

## Equipo

| Integrante | Rol |
|---|---|
| Manuel Ocaña Suarez | Backend, despliegue (Render) |
| Angel Cordova Camargo | Web y documentación |
| Sandro Miñope Reyes | App móvil (Kotlin / Android) |
| Said Alferez Andia | Figma, Web (React / Vercel) |
| Davis Ochoa Mendieta | Lead clínico (Medicina): recolección de datos médicos, entrevistas a doctores y enfermeros, tester de la app |

## Estructura del repo

```
/backend      → API en FastAPI, desplegada en Render
/app          → App Android nativa (Kotlin + Jetpack Compose)
/web-react    → Web del tamizaje, desplegada en Vercel
/compartido   → Umbrales clínicos y datos de referencia — fuente única de verdad
/modelo       → Reservado para una posible fase de análisis de imagen (fuera de alcance actual)
/docs         → Documentación del proyecto: arquitectura, Anexo 1, Anexo 2
/figma        → Prototipo de diseño y export de pantallas
```

> **`/compartido` es la fuente de verdad clínica.** El motor de tamizaje está
> implementado tres veces (Kotlin en la app, JavaScript en la web, Python en el
> backend) porque el stack no permite compartir código entre los tres. Los
> umbrales y los casos de prueba viven en `/compartido` para que no diverjan.
>
> **Regla del equipo: quien toque un umbral corre las tres suites de
> conformidad, o no mergea.**

Cada carpeta tiene su propio README con instrucciones específicas. El detalle
completo de cómo encajan las piezas está en
[`docs/Arquitectura_Cardio_Alerta_Peru.docx`](./docs/Arquitectura_Cardio_Alerta_Peru.docx).

## Cómo trabajamos

- **Rama principal:** `main`, siempre desplegable. Nadie hace push directo ahí:
  cada quien trabaja en su propia rama (`backend`, `app-android`, `web-react`,
  `docs`) y abre un *pull request* cuando su parte compila y pasa sus pruebas.
- **La fuente de verdad clínica no se toca a la ligera:** cualquier cambio en
  `compartido/umbrales.json` requiere correr las tres suites de conformidad
  (Kotlin, JS, Python) antes de mergear — un umbral que difiere entre
  plataformas significa que la app y la web pueden clasificar distinto al
  mismo bebé.
- **Commits:** mensajes cortos en español, en imperativo (`agrega endpoint
  /centros-cercanos`, no `agregando` ni `added`).
- **Revisión cruzada:** ningún cambio en la lógica clínica (umbrales, ventana
  de tamizaje, retamizaje) se mergea sin que Davis lo revise primero.
- **Bloqueos:** si algo te frena más de un día, se avisa al grupo de inmediato
  por el canal del equipo, no se espera a la siguiente reunión.
- **Evidencias:** cada avance funcional relevante se documenta con una captura
  o video corto (ver `docs/`).

## Licencia

Este proyecto se publica bajo licencia MIT (ver `LICENSE`), en línea con el
requisito de las bases de la hackatón de poner a disposición pública los
componentes desarrollados bajo una licencia abierta.
