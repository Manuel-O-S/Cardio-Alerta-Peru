"""
Endpoints de tamizaje neonatal por oximetria de pulso.

Va en app/routers/tamizaje.py. En main.py solo se agrega `tamizaje` al import
y un `include_router`; nada existente se toca.

A diferencia de /predict, estos endpoints no usan modelo: son un algoritmo
determinista publicado. Por eso toda respuesta incluye la banda aplicada y el
estado de sus umbrales.
"""

from fastapi import APIRouter, HTTPException, Query

from app.schemas import (
    AvisoSchema,
    BandaSchema,
    CatalogoResponse,
    SintomaCatalogo,
    TamizajeRequest,
    TamizajeResponse,
)
from app.tamizaje.motor_reglas import (
    BANDAS,
    ETIQUETAS_SINTOMAS,
    HORAS_MINIMAS,
    RONDAS_MAXIMAS,
    SINTOMAS_ALARMA,
    SINTOMAS_CONTEXTO,
    VERSION_UMBRALES,
    Entrada,
    EntradaInvalida,
    banda_por_altitud,
    evaluar_caso,
)

router = APIRouter(prefix="/tamizaje", tags=["tamizaje"])


def _banda_a_schema(banda) -> BandaSchema:
    return BandaSchema(
        id=banda.id,
        nombre=banda.nombre,
        altitud_min=banda.altitud_min,
        altitud_max=banda.altitud_max,
        spo2_critico=banda.spo2_critico,
        spo2_pasa=banda.spo2_pasa,
        diferencia_max=banda.diferencia_max,
        estado=banda.estado.value,
        fuente=banda.fuente,
    )


@router.post("/evaluar", response_model=TamizajeResponse)
def evaluar(peticion: TamizajeRequest):
    """
    Evalua un tamizaje por oximetria de pulso.

    Antes de aplicar el algoritmo se corre una puerta de elegibilidad: un recien
    nacido sintomatico NO se tamiza, se evalua. Devolverle "negativo" a un bebe
    con cianosis central seria el peor error posible de este sistema, asi que en
    ese caso el resultado es `no_elegible` con la conducta correspondiente.

    El resultado sale unicamente del algoritmo de oximetria. Los signos vitales,
    el peso y el soplo se devuelven en `avisos` y explicitamente NO lo alteran:
    combinarlos en un puntaje de riesgo seria fabricar una regla clinica que
    nadie valido.
    """
    try:
        salida = evaluar_caso(
            Entrada(
                altitud_msnm=peticion.altitud_msnm,
                spo2_preductal=peticion.spo2_preductal,
                spo2_postductal=peticion.spo2_postductal,
                horas_de_vida=peticion.horas_de_vida,
                edad_gestacional_sem=peticion.edad_gestacional_sem,
                fc_lpm=peticion.fc_lpm,
                fr_rpm=peticion.fr_rpm,
                peso_kg=peticion.peso_kg,
                sintomas=frozenset(peticion.sintomas),
                oxigeno_suplementario=peticion.oxigeno_suplementario,
                diagnostico_prenatal_cc=peticion.diagnostico_prenatal_cc,
                ronda=peticion.ronda,
            )
        )
    except EntradaInvalida as e:
        raise HTTPException(status_code=422, detail=e.errores) from e

    return TamizajeResponse(
        resultado=salida.resultado.value,
        conducta=salida.conducta,
        motivo_no_elegible=(
            salida.motivo_no_elegible.value if salida.motivo_no_elegible else None
        ),
        sintomas_de_alarma=salida.sintomas_de_alarma,
        banda=_banda_a_schema(salida.banda) if salida.banda else None,
        ronda=salida.ronda,
        proxima_ronda=salida.proxima_ronda,
        minutos_espera=salida.minutos_espera,
        diferencia_spo2=salida.diferencia_spo2,
        avisos=[
            AvisoSchema(codigo=a.codigo, nivel=a.nivel.value, mensaje=a.mensaje)
            for a in salida.avisos
        ],
        version_umbrales=salida.version_umbrales,
        advertencia=salida.advertencia,
    )


@router.get("/catalogo", response_model=CatalogoResponse)
def catalogo(
    altitud_msnm: int | None = Query(
        None, ge=0, le=5100,
        description="Si se manda, la banda correspondiente viene primera en la lista",
    )
):
    """
    Devuelve las bandas y el catalogo de sintomas.

    Existe para que la app y la web construyan sus casillas desde una sola
    fuente: si Davis agrega un sintoma o corrige un umbral, no hay que tocar
    tres interfaces.
    """
    bandas = [_banda_a_schema(b) for b in BANDAS]

    if altitud_msnm is not None:
        activa = banda_por_altitud(altitud_msnm)
        if activa is not None:
            bandas.sort(key=lambda b: b.id != activa.id)

    sintomas = [
        SintomaCatalogo(id=s, etiqueta=ETIQUETAS_SINTOMAS.get(s, s), tipo="alarma")
        for s in sorted(SINTOMAS_ALARMA)
    ] + [
        SintomaCatalogo(id=s, etiqueta=ETIQUETAS_SINTOMAS.get(s, s), tipo="contexto")
        for s in sorted(SINTOMAS_CONTEXTO)
    ]

    return CatalogoResponse(
        version_umbrales=VERSION_UMBRALES,
        bandas=bandas,
        sintomas=sintomas,
        horas_minimas=HORAS_MINIMAS,
        rondas_maximas=RONDAS_MAXIMAS,
    )
