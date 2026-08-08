# Cardio Alerta Perú

App de apoyo diagnóstico para especialistas de neonatos: **tamiza recién nacidos
por oximetría de pulso usando umbrales adaptados a la altitud del Perú**, funciona
con o sin internet, y sugiere el centro especializado más cercano al que derivar al
paciente.

La clasificación de imágenes de ecocardiograma queda como **fase 2** (ver
`modelo/README.md`): el endpoint `/predict` sigue existiendo con una clasificación
simulada, pero ya no es el núcleo del producto. El motivo está explicado en
[`docs/Tamizaje_Numerico.md`](./docs/Tamizaje_Numerico.md).

Proyecto para la **Hackatón Niño San Borja 2026** — Desafío 2: *Cardio Alerta Perú*.

## Equipo

| Integrante | Rol |
|---|---|
| Manuel Ocaña Suarez | Backend, despliegue e integración de IA (Render) |
| Angel Cordova Camargo | Modelo de IA / Machine Learning |
| Sandro Miñope Reyes | App móvil (Kotlin / Android) |
| Said Alferez Andia | Figma, Web (React / Netlify) y documentación |
| Davis Ochoa Mendieta | Lead clínico (Medicina) |

## Estructura del repo

```
/backend      → API en FastAPI, desplegada en Render (Manuel)
/app-kotlin   → App Android (Sandro)
/web-react    → Web del tamizaje, desplegada en Netlify (Said)
/modelo       → Dataset, entrenamiento y exportación del modelo de IA (Angel) — fase 2
/compartido   → Umbrales clínicos y vectores de conformidad del tamizaje
/docs         → Documentación del proyecto: arquitectura, Anexo 1, Anexo 2
/figma        → Prototipo y export de pantallas
```

> **`/compartido` es la fuente de verdad clínica.** El motor de tamizaje está
> implementado tres veces (Kotlin en la app, JavaScript en la web, Python en el
> backend) porque el stack no permite compartir código entre los tres. Los
> umbrales y los casos de prueba viven en `/compartido` para que no diverjan.
>
> **Regla del equipo: quien toque un umbral corre las tres suites, o no mergea.**

Cada carpeta tiene su propio README con instrucciones específicas. El detalle
completo de cómo encajan las piezas está en
[`docs/Arquitectura_Cardio_Alerta_Peru.docx`](./docs/Arquitectura_Cardio_Alerta_Peru.docx).

## Cómo trabajamos

- **Rama principal:** `main`. Cada quien trabaja en su propia rama
  (`backend`, `app-kotlin`, `web-react`, `modelo`, `docs`) y hace *pull request*
  a `main` cuando su parte compila/corre. Evitamos hacer push directo a `main`.
- **Commits:** mensajes cortos en español, en imperativo (`agrega endpoint /predict`,
  no `agregando` ni `added`).
- **Evidencias:** cada avance funcional relevante se documenta con una captura o
  video corto (ver `docs/`).
- **Bloqueos:** si algo te bloquea más de un día, avisa al grupo de inmediato, no
  esperes a la reunión diaria.

## Fechas clave

- Hoy → 13/08: desarrollo remoto (ver cronograma del equipo).
- 14–15/08: hackatón presencial — solo integración final, pruebas y exposición.

## Licencia

Este proyecto se publica bajo licencia MIT (ver `LICENSE`), en línea con el
requisito de las bases de la hackatón de poner a disposición pública los
componentes desarrollados bajo una licencia abierta.
