-- ---------------------------------------------------------------------------
-- Cardio Alerta Peru — esquema de base de datos
--
-- Correr una sola vez en el SQL Editor de Supabase, o con:
--     psql "$DATABASE_URL" -f backend/data/esquema.sql
--
-- Es idempotente: se puede volver a correr sin romper nada.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- Hospitales de referencia
--
-- Duplica lo que hoy vive en centros_referencia.json. La ventaja de tenerlo en
-- base de datos es poder corregir un telefono o agregar un centro sin volver a
-- desplegar el backend. El JSON se mantiene como respaldo: si la base no
-- responde, la API sigue sirviendo desde el archivo.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospitales (
    id            BIGSERIAL PRIMARY KEY,
    nombre        TEXT NOT NULL,
    direccion     TEXT NOT NULL,
    departamento  TEXT NOT NULL,
    nivel         TEXT NOT NULL,
    iafas         TEXT NOT NULL,       -- 'MINSA' | 'EsSalud' | 'Otras'
    especialidad  TEXT NOT NULL,
    lat           NUMERIC NOT NULL,
    lon           NUMERIC NOT NULL,

    -- Disponibilidad reportada por el establecimiento: 'Disponible' u 'Ocupado'.
    -- Es lo que decide a donde se deriva, asi que conviene que alguien la
    -- mantenga al dia; un dato de disponibilidad viejo es peor que no tenerlo.
    status        VARCHAR NOT NULL DEFAULT 'Disponible',

    -- Evita duplicados si el script de carga se corre dos veces.
    CONSTRAINT hospitales_nombre_departamento_unico UNIQUE (nombre, departamento)
);

CREATE INDEX IF NOT EXISTS idx_hospitales_iafas  ON hospitales (iafas);
CREATE INDEX IF NOT EXISTS idx_hospitales_status ON hospitales (status);


-- ---------------------------------------------------------------------------
-- Registro de tamizajes
--
-- ATENCION — PROTECCION DE DATOS
-- Esta tabla NO guarda datos identificables del recien nacido: ni nombre, ni
-- apellido, ni numero de historia clinica. Guarda unicamente los valores
-- clinicos y el resultado, para poder responder preguntas agregadas del tipo
-- "cuantos tamizajes se hicieron por banda de altitud" o "que proporcion
-- quedo en repetir".
--
-- La razon es la Ley 29733: los datos de salud son datos sensibles, y los de
-- un menor exigen consentimiento de quienes ejercen la patria potestad. Un
-- prototipo de hackaton no tiene ese consentimiento, asi que no debe
-- almacenar datos identificables en la nube.
--
-- El identificador de historia clinica se queda SOLO en el dispositivo
-- (localStorage), donde sirve para el seguimiento del turno y no sale de ahi.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tamizajes (
    id                    BIGSERIAL PRIMARY KEY,
    creado                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Contexto
    altitud_msnm          INTEGER NOT NULL,
    banda                 TEXT NOT NULL,          -- 'B1' | 'B2' | 'B3'
    version_umbrales      TEXT NOT NULL,

    -- Valores medidos
    spo2_preductal        INTEGER NOT NULL,
    spo2_postductal       INTEGER,
    horas_de_vida         DOUBLE PRECISION,
    edad_gestacional_sem  INTEGER,
    fc_lpm                INTEGER,
    fr_rpm                INTEGER,
    peso_kg               DOUBLE PRECISION,
    sintomas              TEXT[] NOT NULL DEFAULT '{}',

    -- Resultado
    resultado             TEXT NOT NULL,          -- positivo | negativo | repetir | incompleto | no_elegible
    motivo_no_elegible    TEXT,
    ronda                 INTEGER NOT NULL DEFAULT 1,

    -- Trazabilidad del establecimiento, NO del paciente
    establecimiento       TEXT
);

CREATE INDEX IF NOT EXISTS idx_tamizajes_creado    ON tamizajes (creado DESC);
CREATE INDEX IF NOT EXISTS idx_tamizajes_resultado ON tamizajes (resultado);
CREATE INDEX IF NOT EXISTS idx_tamizajes_banda     ON tamizajes (banda);


-- ---------------------------------------------------------------------------
-- Seguridad a nivel de fila
--
-- Supabase expone las tablas por su API REST publica. Sin RLS activo,
-- cualquiera con la clave anonima puede leer y escribir. Se activa y NO se
-- crean politicas: asi solo el backend, que usa la cadena de conexion directa,
-- puede acceder.
--
-- Si mas adelante se quiere leer desde el navegador, hay que crear politicas
-- explicitas — y pensarlo bien en el caso de `tamizajes`.
-- ---------------------------------------------------------------------------
ALTER TABLE hospitales ENABLE ROW LEVEL SECURITY;
ALTER TABLE tamizajes          ENABLE ROW LEVEL SECURITY;
