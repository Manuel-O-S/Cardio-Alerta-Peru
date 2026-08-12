# Despliegue

Backend en **Render**, web en **Netlify**, base de datos en **Supabase**.

El orden importa: Netlify necesita la URL del backend, y Render necesita la URL
de Netlify. Se resuelve en la última vuelta.

---

## Antes de empezar

Subir todo el código al repositorio. **Este es el paso que bloquea todo lo
demás**: si Render y Netlify apuntan a un repo con código viejo, van a
desplegar código viejo.

```bash
git add .
git status          # revisar que NO aparezca backend/.env
git commit -m "Módulo de tamizaje, web y capa de base de datos"
git push
```

> Si `backend/.env` aparece en `git status`, parar. Está en `.gitignore`, así
> que no debería. Si aparece, se filtraría la contraseña de la base de datos.

---

## 1. Supabase — cargar los datos

Solo la primera vez.

```bash
cd backend
cp .env.example .env          # completar la contraseña real
pip install -r requirements.txt
python -m scripts.cargar_datos
```

Debe terminar con algo como `25 hospitales en la base de datos, N disponibles`.

Si falla, el error dice exactamente qué sentencia SQL o qué parte de la
conexión no funcionó.

> La tabla se llama `hospitales`. La columna `status` (`Disponible` / `Ocupado`)
> **no la toca el script**: se administra desde Supabase.

---

## 2. Render — el backend

`render.yaml` está en la raíz del repo, así que no hace falta configurar nada a
mano.

1. En Render: **New → Blueprint**
2. Conectar el repositorio
3. Render lee `render.yaml` y pide una variable: **`DATABASE_URL`**. Pegar ahí
   la cadena de Supabase con la contraseña real.
4. Desplegar

Cuando termine, verificar:

```bash
curl https://TU-SERVICIO.onrender.com/health
```

Debe responder:

```json
{ "status": "ok", "version": "0.3.0", "base_datos": "activa", "origen_centros": "postgresql" }
```

**Si dice `"base_datos": "error"`**, la conexión falla pero el servicio funciona
igual usando el archivo JSON. Revisar `DATABASE_URL` en el panel de Render.

Anotar la URL del servicio: hace falta en el paso siguiente.

---

## 3. Netlify — la web

`netlify.toml` está en la raíz del repo, con `base = "web-react"`. No hace falta
tocar nada en el panel.

1. En Netlify: **Add new site → Import an existing project**
2. Conectar el repositorio
3. Netlify lee `netlify.toml` y despliega

**Si el backend NO está en `cardio-alerta-peru.onrender.com`**, hay dos cosas
que cambiar antes de desplegar:

- En Netlify, **Site settings → Environment variables**: agregar
  `VITE_API_URL` con la URL real del backend.
- En `netlify.toml`, la directiva `connect-src` de la
  `Content-Security-Policy`: reemplazar la URL por la real. **Si esto no se
  hace, el navegador bloquea las llamadas al backend y la derivación queda en
  blanco sin decir por qué.**

Anotar la URL que asigna Netlify.

---

## 4. Cerrar el círculo: CORS

En Render, **Environment → `ORIGENES_PERMITIDOS`**: poner la URL real de
Netlify, sin barra final.

```
https://TU-SITIO.netlify.app
```

Render reinicia solo al guardar.

**Esto no es opcional.** Sin la URL correcta, el navegador bloquea todas las
llamadas de la web al backend. Y falla **solo en producción**, nunca en local —
que es el peor momento para descubrirlo.

---

## 5. Probar la cadena completa

Desde un teléfono con **datos móviles, no wifi de la casa**:

1. Abrir la URL de Netlify
2. Cambiar el establecimiento a **Juliaca**
3. Tamizar con SpO₂ preductal **88**, postductal **86**, 30 horas de vida
   → debe dar **negativo, banda B3** (a nivel del mar el mismo caso da positivo)
4. Tamizar con SpO₂ **80 / 78**
   → debe dar **positivo** y mostrar el hospital de referencia más cercano
5. Poner el teléfono en **modo avión** y repetir el paso 3
   → el tamizaje debe seguir funcionando

Si el paso 4 no muestra hospitales pero el 3 sí funciona, el problema es CORS o
`connect-src`. Abrir la consola del navegador: el error lo dice explícitamente.

---

## Lo que va a pasar el día de la presentación

**El plan gratuito de Render duerme el servicio tras ~15 minutos sin tráfico.**
El primer arranque tarda cerca de un minuto.

Consecuencia concreta: el tamizaje funciona igual —el motor corre en el
navegador, no en el servidor— pero **la derivación se queda esperando** mientras
Render despierta.

Mitigación: abrir la app y hacer una consulta **cinco minutos antes de
presentar**. Suena tonto y es lo que más veces salva una demo.

Y grabar un video del recorrido completo funcionando, por si el wifi de la sede
falla.

---

## Resolución de problemas

| Síntoma | Causa probable |
|---|---|
| Netlify: "build command failed" | Falta `package-lock.json` en el repo; `npm ci` lo necesita |
| La web carga pero la derivación queda vacía | CORS: `ORIGENES_PERMITIDOS` no tiene la URL exacta de Netlify |
| Consola: "Refused to connect" | `connect-src` de la CSP no incluye la URL del backend |
| `/health` dice `base_datos: error` | `DATABASE_URL` mal, o Supabase pausado. El servicio funciona igual con el JSON |
| El modo offline no activa | El service worker no se registró. Revisar que la CSP no bloquee el bundle |
| Primera consulta tarda un minuto | Arranque en frío de Render. Normal en el plan gratuito |

---

## Estado de verificación

| Qué | Cómo se verificó |
|---|---|
| Comando de arranque de Render | Probado: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` responde |
| `/health`, `/centros-cercanos`, `/tamizaje/evaluar` | Probados en el puerto de producción |
| CORS | Probado: permite Netlify, bloquea orígenes ajenos |
| Build de Netlify | Probado con `npm ci && npm run build` |
| `dist/` incluye manifest y service worker | Verificado |
| **Despliegue real en Render y Netlify** | **NO probado** — requiere las cuentas del equipo |
| **Conexión real a Supabase** | **NO probada** — sin acceso de red al pooler |
