# Cardio Alerta Perú

App de apoyo diagnóstico para especialistas de neonatos: clasifica imágenes de
ecocardiograma en busca de sospecha de cardiopatía crítica, funciona con o sin
internet, y sugiere el centro especializado más cercano al que derivar al paciente.

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
/web-react    → Sitio informativo, desplegado en Netlify (Said)
/modelo       → Dataset, entrenamiento y exportación del modelo de IA (Angel)
/docs         → Documentación del proyecto: arquitectura, Anexo 1, Anexo 2
/figma        → Prototipo y export de pantallas
```

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
