"""
Motor de tamizaje neonatal por oximetria de pulso.

Python puro, sin dependencias. Se puede importar desde FastAPI, desde un script
o desde un notebook sin arrastrar nada.

ESTO NO ES UN MODELO DE IA, Y ESO ES A PROPOSITO.
Es un algoritmo determinista publicado. Un cardiologo o un regulador tiene que
poder leer la regla completa y verificarla. Un clasificador opaco decidiendo
sobre neonatos es peor producto, no mejor. Por eso la respuesta de la API
incluye siempre `banda`, `estado_umbrales` y `fuente_umbrales`: el especialista
tiene que poder ver de donde salio el numero que se le aplico.

Los umbrales estan replicados desde compartido/umbrales.json. Si cambias un
numero aca, cambialo tambien en motorTamizaje.js y MotorTamizaje.kt, y corre
las tres suites de conformidad.

FUENTES
-------
[1] Bravo-Jaimes K, et al. "Tamizaje neonatal de cardiopatias congenitas
    criticas en el Peru: un llamado de urgencia". Arch Peru Cardiol Cir
    Cardiovasc. 2024;5(3):157-166. doi:10.47487/apcyccv.v5i3.366
[2] Bravo-Jaimes K, et al. ANDES-CHD. J Perinatol. 2024;44(3):373-378.
[3] Rojas-Camayo J, et al. Thorax. 2018.
[4] Ley 31975 (2024), que modifica la Ley 29885.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

VERSION_UMBRALES = "1.0.0"

ADVERTENCIA_FIJA = (
    "Resultado de un tamizaje, no de un diagnostico. "
    "No reemplaza el criterio clinico del especialista."
)


# ---------------------------------------------------------------------------
# Tipos
# ---------------------------------------------------------------------------


class Resultado(str, Enum):
    NO_ELEGIBLE = "no_elegible"
    POSITIVO = "positivo"
    NEGATIVO = "negativo"
    REPETIR = "repetir"
    INCOMPLETO = "incompleto"


class MotivoNoElegible(str, Enum):
    SINTOMATICO = "sintomatico"
    OXIGENO_SUPLEMENTARIO = "oxigeno_suplementario"
    DIAGNOSTICO_PRENATAL = "diagnostico_prenatal"
    MENOR_24H = "menor_24h"


class EstadoUmbral(str, Enum):
    VERIFICADO = "verificado"
    PROVISIONAL = "provisional"


class NivelAviso(str, Enum):
    ALTO = "alto"
    MEDIO = "medio"
    BAJO = "bajo"


@dataclass(frozen=True)
class Banda:
    id: str
    nombre: str
    altitud_min: int
    altitud_max: int
    spo2_critico: int
    spo2_pasa: int
    diferencia_max: int
    estado: EstadoUmbral
    fuente: str


@dataclass(frozen=True)
class Aviso:
    codigo: str
    nivel: NivelAviso
    mensaje: str


@dataclass
class Entrada:
    """Solo altitud_msnm y spo2_preductal son obligatorios."""

    altitud_msnm: int
    spo2_preductal: int
    spo2_postductal: Optional[int] = None
    horas_de_vida: Optional[float] = None
    edad_gestacional_sem: Optional[int] = None
    fc_lpm: Optional[int] = None
    fr_rpm: Optional[int] = None
    peso_kg: Optional[float] = None
    sintomas: frozenset[str] = field(default_factory=frozenset)
    oxigeno_suplementario: bool = False
    diagnostico_prenatal_cc: bool = False
    ronda: int = 1


@dataclass
class Salida:
    resultado: Resultado
    motivo_no_elegible: Optional[MotivoNoElegible]
    sintomas_de_alarma: list[str]
    banda: Optional[Banda]
    conducta: str
    ronda: int
    proxima_ronda: Optional[int]
    minutos_espera: Optional[int]
    diferencia_spo2: Optional[int]
    avisos: list[Aviso]
    version_umbrales: str = VERSION_UMBRALES
    advertencia: str = ADVERTENCIA_FIJA


class EntradaInvalida(ValueError):
    """Los errores vienen en .errores como {campo: mensaje}."""

    def __init__(self, errores: dict[str, str]):
        self.errores = errores
        super().__init__(f"Entrada invalida: {errores}")


# ---------------------------------------------------------------------------
# Tabla de umbrales — espejo de compartido/umbrales.json
# ---------------------------------------------------------------------------

_PENDIENTE = (
    "PROVISIONAL. Derivado del percentil 5 de saturacion en recien nacidos sanos "
    "de altura. NO fue leido de las figuras del articulo peruano. Tarea de Davis: "
    "verificar contra doi.org/10.47487/apcyccv.v5i3.366."
)

BANDAS: tuple[Banda, ...] = (
    Banda(
        "B1", "Nivel del mar hasta 2500 msnm", 0, 2499, 90, 95, 3,
        EstadoUmbral.VERIFICADO,
        "Algoritmo estandar de tamizaje de cardiopatia congenita critica por "
        "oximetria de pulso (AAP/CDC).",
    ),
    Banda("B2", "2500 a 3500 msnm", 2500, 3499, 86, 91, 3, EstadoUmbral.PROVISIONAL, _PENDIENTE),
    Banda("B3", "Mayor a 3500 msnm", 3500, 5100, 83, 88, 3, EstadoUmbral.PROVISIONAL, _PENDIENTE),
)

HORAS_MINIMAS = 24.0
HORAS_IDEALES_MAX = 48.0
RONDAS_MAXIMAS = 3
MINUTOS_ESPERA = 60

FC_MIN, FC_MAX = 100, 180
FR_MIN, FR_MAX = 30, 60
PESO_MIN = 2.5
EDAD_GESTACIONAL_TERMINO = 37

SINTOMAS_ALARMA = frozenset({
    "cianosis_central", "dificultad_respiratoria", "bradicardia",
    "hipotension", "mala_perfusion", "hepatomegalia",
})

SINTOMAS_CONTEXTO = frozenset({"soplo_cardiaco", "taquicardia"})

ETIQUETAS_SINTOMAS = {
    "cianosis_central": "Cianosis central",
    "soplo_cardiaco": "Soplo cardiaco",
    "dificultad_respiratoria": "Dificultad respiratoria",
    "taquicardia": "Taquicardia",
    "bradicardia": "Bradicardia",
    "hipotension": "Hipotension",
    "mala_perfusion": "Mala perfusion",
    "hepatomegalia": "Hepatomegalia",
}


# ---------------------------------------------------------------------------
# Piezas del algoritmo
# ---------------------------------------------------------------------------


def banda_por_altitud(altitud_msnm: int) -> Optional[Banda]:
    """Banda de altitud correspondiente, o None si esta fuera de rango."""
    for b in BANDAS:
        if b.altitud_min <= altitud_msnm <= b.altitud_max:
            return b
    return None


def evaluar_elegibilidad(
    horas_de_vida: Optional[float],
    sintomas: frozenset[str],
    oxigeno_suplementario: bool,
    diagnostico_prenatal_cc: bool,
) -> Optional[MotivoNoElegible]:
    """
    Puerta de elegibilidad. Se corre ANTES del algoritmo.

    La razon de que exista: el tamizaje esta disenado para recien nacidos
    ASINTOMATICOS. Un bebe con cianosis central no necesita que una app le diga
    si "paso" — necesita evaluacion inmediata. Correrle el algoritmo y devolver
    NEGATIVO seria el peor error posible de este producto.
    """
    # El sintomatico domina sobre todo lo demas: es el caso mas urgente.
    if sintomas & SINTOMAS_ALARMA:
        return MotivoNoElegible.SINTOMATICO
    if diagnostico_prenatal_cc:
        return MotivoNoElegible.DIAGNOSTICO_PRENATAL
    if oxigeno_suplementario:
        return MotivoNoElegible.OXIGENO_SUPLEMENTARIO
    if horas_de_vida is not None and horas_de_vida < HORAS_MINIMAS:
        return MotivoNoElegible.MENOR_24H
    return None


def diferencia_con_signo(preductal: int, postductal: Optional[int]) -> Optional[int]:
    """Diferencia con signo, para guardar en el registro."""
    if postductal is None:
        return None
    return preductal - postductal


def evaluar_ronda(banda: Banda, spo2_preductal: int, spo2_postductal: Optional[int]) -> Resultado:
    """
    El algoritmo, en una sola ronda de medicion.

    Si falta la medicion del pie devuelve INCOMPLETO en vez de NEGATIVO: sin el
    diferencial no se detectan las lesiones que cursan con saturacion preductal
    normal (coartacion, interrupcion de arco). Un "negativo" ahi seria una falsa
    tranquilidad.
    """
    if spo2_preductal < banda.spo2_critico:
        return Resultado.POSITIVO
    if spo2_postductal is not None and spo2_postductal < banda.spo2_critico:
        return Resultado.POSITIVO

    if spo2_postductal is None:
        return Resultado.INCOMPLETO

    alguna_pasa = spo2_preductal >= banda.spo2_pasa or spo2_postductal >= banda.spo2_pasa
    diferencia_ok = abs(spo2_preductal - spo2_postductal) <= banda.diferencia_max

    return Resultado.NEGATIVO if (alguna_pasa and diferencia_ok) else Resultado.REPETIR


def aplicar_cierre_de_rondas(resultado: Resultado, ronda: int) -> Resultado:
    """A la tercera ronda sin pasar, el resultado es positivo."""
    if resultado is Resultado.REPETIR and ronda >= RONDAS_MAXIMAS:
        return Resultado.POSITIVO
    return resultado


# ---------------------------------------------------------------------------
# Avisos — informacion clinica que NO altera el resultado
# ---------------------------------------------------------------------------


def construir_avisos(entrada: Entrada, banda: Banda, resultado: Resultado) -> list[Aviso]:
    """
    Deliberadamente NO se combinan signos en un puntaje compuesto. Inventar un
    score que mezcle oximetria + soplo + taquicardia seria fabricar una regla
    clinica que nadie valido. El resultado sale solo del algoritmo publicado.
    """
    avisos: list[Aviso] = []

    if banda.estado is EstadoUmbral.PROVISIONAL:
        avisos.append(Aviso(
            "umbral_provisional", NivelAviso.ALTO,
            f"Los umbrales de la banda {banda.id} son provisionales y estan pendientes "
            "de verificacion contra la fuente peruana. Uso de prototipo unicamente.",
        ))

    if "soplo_cardiaco" in entrada.sintomas:
        avisos.append(Aviso(
            "soplo_cardiaco", NivelAviso.ALTO,
            "Soplo cardiaco registrado. Requiere evaluacion clinica sea cual sea el "
            "resultado del tamizaje: el algoritmo de oximetria no lo toma en cuenta.",
        ))

    if entrada.spo2_postductal is None:
        avisos.append(Aviso(
            "falta_postductal", NivelAviso.ALTO,
            "Falta la SpO2 postductal (pie). Sin ella no se puede evaluar la "
            "diferencia preductal-postductal y el tamizaje queda incompleto.",
        ))

    if entrada.spo2_preductal < 70:
        avisos.append(Aviso(
            "senal_dudosa", NivelAviso.MEDIO,
            "Saturacion muy baja. Confirmar colocacion y senal del sensor antes de actuar.",
        ))

    if entrada.edad_gestacional_sem is not None and entrada.edad_gestacional_sem < EDAD_GESTACIONAL_TERMINO:
        avisos.append(Aviso(
            "prematuro", NivelAviso.MEDIO,
            f"Recien nacido pretermino ({entrada.edad_gestacional_sem} sem). El algoritmo "
            "se valido principalmente en recien nacidos a termino; interpretar con cautela.",
        ))

    if entrada.horas_de_vida is not None and entrada.horas_de_vida > HORAS_IDEALES_MAX:
        avisos.append(Aviso(
            "fuera_de_ventana", NivelAviso.BAJO,
            f"Tamizaje a las {entrada.horas_de_vida} h de vida, fuera de la ventana ideal "
            f"de {int(HORAS_MINIMAS)} a {int(HORAS_IDEALES_MAX)} h.",
        ))

    if entrada.fc_lpm is not None:
        if entrada.fc_lpm > FC_MAX:
            avisos.append(Aviso("fc_alta", NivelAviso.MEDIO,
                f"FC {entrada.fc_lpm} lpm por encima del rango de referencia ({FC_MIN}-{FC_MAX})."))
        elif entrada.fc_lpm < FC_MIN:
            avisos.append(Aviso("fc_baja", NivelAviso.MEDIO,
                f"FC {entrada.fc_lpm} lpm por debajo del rango de referencia ({FC_MIN}-{FC_MAX})."))

    if entrada.fr_rpm is not None:
        if entrada.fr_rpm > FR_MAX:
            avisos.append(Aviso("fr_alta", NivelAviso.MEDIO,
                f"FR {entrada.fr_rpm} rpm por encima del rango de referencia ({FR_MIN}-{FR_MAX}). Taquipnea."))
        elif entrada.fr_rpm < FR_MIN:
            avisos.append(Aviso("fr_baja", NivelAviso.MEDIO,
                f"FR {entrada.fr_rpm} rpm por debajo del rango de referencia ({FR_MIN}-{FR_MAX})."))

    if entrada.peso_kg is not None and entrada.peso_kg < PESO_MIN:
        avisos.append(Aviso("bajo_peso", NivelAviso.BAJO,
            f"Peso {entrada.peso_kg} kg por debajo de {PESO_MIN} kg."))

    if resultado is Resultado.POSITIVO:
        avisos.append(Aviso(
            "positivo_no_es_diagnostico", NivelAviso.ALTO,
            "Tamizaje no superado. Por cada cardiopatia critica detectada hay varios "
            "casos de causa infecciosa o respiratoria: requiere evaluacion medica, no "
            "equivale a diagnostico de cardiopatia.",
        ))
    elif resultado is Resultado.NEGATIVO:
        avisos.append(Aviso(
            "negativo_no_descarta", NivelAviso.MEDIO,
            "Tamizaje superado. No descarta cardiopatia congenita: algunas no cursan "
            "con hipoxemia en el periodo neonatal.",
        ))

    return avisos


# ---------------------------------------------------------------------------
# Validacion
# ---------------------------------------------------------------------------

_RANGOS: dict[str, tuple[float, float]] = {
    "altitud_msnm": (0, 5100),
    "spo2_preductal": (0, 100),
    "spo2_postductal": (0, 100),
    "horas_de_vida": (0, 720),
    "edad_gestacional_sem": (20, 45),
    "fc_lpm": (30, 300),
    "fr_rpm": (5, 150),
    "peso_kg": (0.3, 7.0),
    "ronda": (1, RONDAS_MAXIMAS),
}


def validar_entrada(entrada: Entrada) -> dict[str, str]:
    """Devuelve {campo: mensaje}. Vacio si todo esta bien."""
    errores: dict[str, str] = {}

    for campo, (minimo, maximo) in _RANGOS.items():
        valor = getattr(entrada, campo)
        if valor is None:
            continue
        if valor < minimo or valor > maximo:
            errores[campo] = f"Fuera de rango ({minimo} a {maximo})."

    if "altitud_msnm" not in errores and banda_por_altitud(entrada.altitud_msnm) is None:
        errores["altitud_msnm"] = "Altitud fuera de las bandas definidas (0 a 5100 msnm)."

    return errores


# ---------------------------------------------------------------------------
# Entrada unica al motor
# ---------------------------------------------------------------------------

_CONDUCTAS_NO_ELEGIBLE = {
    MotivoNoElegible.SINTOMATICO:
        "No corresponde tamizaje. Recien nacido sintomatico: evaluacion clinica inmediata.",
    MotivoNoElegible.DIAGNOSTICO_PRENATAL:
        "No corresponde tamizaje. Ya hay diagnostico prenatal de cardiopatia: seguir el plan establecido.",
    MotivoNoElegible.OXIGENO_SUPLEMENTARIO:
        "No corresponde tamizaje mientras reciba oxigeno suplementario. La saturacion no es interpretable.",
    MotivoNoElegible.MENOR_24H:
        f"Aun no corresponde tamizaje. Repetir a partir de las {int(HORAS_MINIMAS)} h de vida.",
}


def evaluar_caso(entrada: Entrada) -> Salida:
    """Evalua un caso completo. Lanza EntradaInvalida si la entrada no valida."""
    errores = validar_entrada(entrada)
    if errores:
        raise EntradaInvalida(errores)

    banda = banda_por_altitud(entrada.altitud_msnm)
    assert banda is not None  # validar_entrada ya lo garantizo

    motivo = evaluar_elegibilidad(
        entrada.horas_de_vida, entrada.sintomas,
        entrada.oxigeno_suplementario, entrada.diagnostico_prenatal_cc,
    )

    if motivo is not None:
        return Salida(
            resultado=Resultado.NO_ELEGIBLE,
            motivo_no_elegible=motivo,
            sintomas_de_alarma=[
                ETIQUETAS_SINTOMAS.get(s, s)
                for s in sorted(entrada.sintomas & SINTOMAS_ALARMA)
            ],
            banda=banda,
            conducta=_CONDUCTAS_NO_ELEGIBLE[motivo],
            ronda=entrada.ronda,
            proxima_ronda=None,
            minutos_espera=None,
            diferencia_spo2=None,
            avisos=[],
        )

    resultado = evaluar_ronda(banda, entrada.spo2_preductal, entrada.spo2_postductal)
    resultado = aplicar_cierre_de_rondas(resultado, entrada.ronda)
    es_repetir = resultado is Resultado.REPETIR

    conducta = {
        Resultado.POSITIVO:
            "Tamizaje no superado. Requiere evaluacion medica y, segun disponibilidad, "
            "ecocardiografia. Considerar derivacion al centro de referencia mas cercano.",
        Resultado.NEGATIVO: "Tamizaje superado. Continuar con los cuidados habituales.",
        Resultado.REPETIR:
            f"Repetir la medicion en {MINUTOS_ESPERA} minutos "
            f"(ronda {entrada.ronda + 1} de {RONDAS_MAXIMAS}).",
        Resultado.INCOMPLETO:
            "Falta la medicion en el pie (postductal). Completar antes de emitir un resultado.",
    }[resultado]

    return Salida(
        resultado=resultado,
        motivo_no_elegible=None,
        sintomas_de_alarma=[],
        banda=banda,
        conducta=conducta,
        ronda=entrada.ronda,
        proxima_ronda=entrada.ronda + 1 if es_repetir else None,
        minutos_espera=MINUTOS_ESPERA if es_repetir else None,
        diferencia_spo2=diferencia_con_signo(entrada.spo2_preductal, entrada.spo2_postductal),
        avisos=construir_avisos(entrada, banda, resultado),
    )
