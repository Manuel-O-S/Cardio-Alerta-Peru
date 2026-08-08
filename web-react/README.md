# web-react

Web del proyecto, desplegada en Netlify. Responsable: **Said** (tareas W03-W13
del cronograma).

> **Ojo, esto cambió.** Antes esta carpeta era "sitio informativo, fuera del flujo
> clínico crítico". Ahora contiene el formulario de tamizaje, así que **sí es parte
> del flujo clínico**. Ver `docs/Tamizaje_Numerico.md`.

Cuando arranques con **W03**, crea aquí el proyecto (por ejemplo con
`npm create vite@latest . -- --template react`) y organiza:

```
web-react/
  src/
    pages/
    components/
```

## Módulo de tamizaje

`src/tamizaje/` ya tiene el motor y el formulario, listos para usar:

| Archivo | Qué es |
|---|---|
| `motorTamizaje.js` | El motor. JavaScript puro, sin dependencias. |
| `motorTamizaje.test.js` | 114 comprobaciones. Corre con `node src/tamizaje/motorTamizaje.test.js`, sin instalar nada. |
| `FormularioTamizaje.jsx` | El formulario completo, cableado al motor. |

```jsx
import FormularioTamizaje from "./tamizaje/FormularioTamizaje.jsx";
```

El componente no necesita Tailwind, ni librerías de formularios, ni llamadas al
backend: los estilos van en un `<style>` local y **todo el cálculo pasa en el
navegador**. Eso significa que dentro de un PWA el tamizaje funciona sin conexión,
sin TFLite y sin APK — es la forma más barata de cumplir el requisito offline del
documento de arquitectura.

Si prefieres tu propio formulario, usa solo `motorTamizaje.js` y toma el `.jsx`
como referencia de cableado.

Al crear el proyecto con `npm create vite@latest . -- --template react`, Vite va a
avisar que la carpeta no está vacía: elige la opción de continuar sin borrar, para
no perder `src/tamizaje/`.
