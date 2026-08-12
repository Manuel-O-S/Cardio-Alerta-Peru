# Base de datos

PostgreSQL en Supabase, vía *session pooler*. Guarda los centros de referencia
y, opcionalmente, un registro anonimizado de tamizajes.

---

## Lo primero: la base de datos es opcional

**Si `DATABASE_URL` no está definida, o si la conexión falla, el backend sigue
funcionando** con `backend/data/centros_referencia.json`. Está probado: los tres
casos (sin URL, URL inválida, URL con sintaxis rota) devuelven los 25 centros
sin caerse.

Tres razones para que sea así:

1. El plan gratuito de Render duerme el servicio tras unos 15 minutos sin
   tráfico, y Supabase pausa proyectos inactivos. El minuto de la demo es
   justamente cuando ambos arrancan en frío.
2. Los centros cambian una o dos veces al año. Que una consulta de datos casi
   estáticos pueda tumbar la derivación de un recién nacido sería un mal
   intercambio.
3. Cualquiera puede clonar el repo y correrlo sin credenciales.

`GET /health` dice de dónde salen los datos:

```json
{ "status": "ok", "base_datos": "activa", "origen_centros": "postgresql" }
```

`base_datos` puede ser `activa`, `sin_configurar` o `error`. Los dos últimos no
son fallos del servicio.

---

## Configuración

### 1. Obtener la cadena de conexión

En Supabase: **Project Settings → Database → Connection string → Session
pooler**. Tiene esta forma:

```
postgresql://postgres.<ref>:<CONTRASEÑA>@aws-1-us-west-2.pooler.supabase.com:5432/postgres
```

*Session pooler* es la opción correcta acá. El *transaction pooler* no admite
sentencias preparadas, que es lo que usa SQLAlchemy por defecto.

### 2. En local

```bash
cd backend
cp .env.example .env
# editar .env y poner la contraseña real
```

`.env` está en `.gitignore`. **Verificá con `git status` antes de cada commit.**

### 3. Crear las tablas y cargar los centros

```bash
cd backend
pip install -r requirements.txt
python -m scripts.cargar_datos
```

Es idempotente: se puede correr las veces que haga falta. Los centros se
identifican por `(nombre, departamento)`; si ya existen, se actualizan.

### 4. En Render

En **Environment → Environment Variables**:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | la cadena completa con la contraseña |
| `ORIGENES_PERMITIDOS` | la URL real de Netlify, separada por comas si hay varias |

No hace falta redesplegar: Render reinicia el servicio al guardar.

---

## Seguridad

**La contraseña no se escribe nunca en el repositorio, ni en un archivo de
configuración versionado, ni en un mensaje de chat, ni en una captura de
pantalla.** Solo en `.env` local y en las variables de entorno de Render.

Si se filtró alguna vez, hay que rotarla desde Supabase: **Settings → Database →
Reset database password**. Es un botón.

`esquema.sql` activa *Row Level Security* en ambas tablas y **no crea
políticas**. Eso es deliberado: Supabase expone las tablas por su API REST
pública, y sin RLS cualquiera con la clave anónima podría leerlas y escribirlas.
Con RLS activo y sin políticas, solo el backend —que usa la conexión directa—
tiene acceso.

---

## Qué se guarda y qué no

### `hospitales`

Los establecimientos de referencia, con una columna que el archivo de respaldo
no tiene: **`status`** (`Disponible` u `Ocupado`).

Esa columna decide a dónde se deriva, así que alguien tiene que mantenerla al
día. **Un dato de disponibilidad viejo es peor que no tener el dato**: la
interfaz afirma disponibilidad basándose en él. El script de carga
deliberadamente **no toca `status`** — se administra desde Supabase.

Comportamiento de `GET /centros-cercanos/`:

| Situación | Qué hace |
|---|---|
| Hay disponibles | Devuelve solo esos, ordenados por distancia |
| Ninguno disponible | Devuelve los ocupados igual, con `hay_disponibles: false` |
| Datos del archivo JSON | `status: null` y `hay_disponibles: null` = "no se sabe" |

Devolver los ocupados cuando no hay disponibles es deliberado: una pantalla
vacía sería peor que una opción ocupada, porque el equipo puede llamar y
confirmar.

### `tamizajes`

**No guarda datos identificables del recién nacido**: ni nombre, ni apellido, ni
número de historia clínica. Solo valores clínicos, resultado y establecimiento.
Sirve para preguntas agregadas: cuántos tamizajes por banda de altitud, qué
proporción quedó en repetir.

El motivo es la Ley 29733: los datos de salud son datos sensibles, y los de un
menor exigen consentimiento de quienes ejercen la patria potestad. Un prototipo
de hackatón no tiene ese consentimiento, así que no debe almacenar datos
identificables en la nube.

El identificador de historia clínica se queda **solo en el dispositivo**
(localStorage), donde sirve para el seguimiento del turno y no sale de ahí.

> Si el equipo decide más adelante guardar datos identificables, eso requiere
> aprobación del comité de ética del INSN y consentimiento parental informado.
> No es un cambio técnico.

---

## Estado de verificación

| Qué | Cómo se verificó |
|---|---|
| Degradación sin `DATABASE_URL` | Probado: devuelve 25 centros del JSON |
| Degradación con URL inválida | Probado: no se cae, cae al JSON en 0,3 s |
| Degradación con URL rota | Probado: no se cae |
| CORS desde Netlify | Probado: permite el origen configurado, bloquea el resto |
| Sintaxis de `esquema.sql` | Validada con parser de PostgreSQL (8 sentencias) |
| **Conexión real a Supabase** | **NO probada** — ver abajo |

**Lo que falta probar.** La conexión contra la instancia real de Supabase no se
pudo verificar durante el desarrollo, porque el entorno donde se escribió el
código no tenía acceso de red a `pooler.supabase.com`. La prueba la tiene que
correr el equipo:

```bash
cd backend
python -m scripts.cargar_datos     # debe terminar con "25 centros activos"
uvicorn app.main:app --reload
curl http://127.0.0.1:8000/health  # debe decir "base_datos":"activa"
```

Si algo falla ahí, el mensaje de error dirá qué sentencia o qué parte de la
conexión es la que no funciona.
