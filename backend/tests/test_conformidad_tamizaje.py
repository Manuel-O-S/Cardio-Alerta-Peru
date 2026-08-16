"""
Suite de conformidad del motor de tamizaje (Python).

Lee compartido/vectores_conformidad.json, el MISMO archivo que usan las suites
de JavaScript y Kotlin. Si un caso falla aca pero pasa alla, la app y el backend
estan clasificando distinto al mismo bebe.

Correr:  cd backend && pytest tests/ -v
"""

import json
from pathlib import Path

import pytest

from app.tamizaje.motor_reglas import (
    BANDAS,
    VERSION_UMBRALES,
    Entrada,
    EntradaInvalida,
    EstadoUmbral,
    MotivoNoElegible,
    Resultado,
    banda_por_altitud,
    diferencia_con_signo,
    evaluar_caso,
    evaluar_elegibilidad,
    evaluar_ronda,
    validar_entrada,
)

# El JSON compartido vive fuera de backend/. Se busca hacia arriba para que la
# ruta funcione tanto en local como en Render.
_AQUI = Path(__file__).resolve()
_CANDIDATAS = [
    p / "compartido" / "vectores_conformidad.json" for p in _AQUI.parents
]
_RUTA_VECTORES = next((p for p in _CANDIDATAS if p.exists()), None)

pytestmark = pytest.mark.skipif(
    _RUTA_VECTORES is None,
    reason="No se encontro compartido/vectores_conformidad.json",
)

_SPEC = json.loads(_RUTA_VECTORES.read_text(encoding="utf-8")) if _RUTA_VECTORES else {"casos": []}


def _entrada_de(d: dict) -> Entrada:
    """Traduce las claves camelCase del JSON compartido a snake_case de Python."""
    mapa = {
        "altitudMsnm": "altitud_msnm",
        "spo2Preductal": "spo2_preductal",
        "spo2Postductal": "spo2_postductal",
        "horasDeVida": "horas_de_vida",
        "edadGestacionalSem": "edad_gestacional_sem",
        "fcLpm": "fc_lpm",
        "frRpm": "fr_rpm",
        "pesoKg": "peso_kg",
        "sintomas": "sintomas",
        "oxigenoSuplementario": "oxigeno_suplementario",
        "diagnosticoPrenatalCC": "diagnostico_prenatal_cc",
        "ronda": "ronda",
    }
    kwargs = {}
    for k, v in d.items():
        campo = mapa[k]
        kwargs[campo] = frozenset(v) if campo == "sintomas" else v
    return Entrada(**kwargs)


# --- 1. Vectores de conformidad compartidos --------------------------------


def test_version_de_umbrales_coincide():
    assert _SPEC["version_umbrales"] == VERSION_UMBRALES


@pytest.mark.parametrize("caso", _SPEC["casos"], ids=lambda c: c["id"])
def test_vector_de_conformidad(caso):
    salida = evaluar_caso(_entrada_de(caso["entrada"]))
    espera = caso["espera"]

    assert salida.resultado.value == espera["resultado"], caso["descripcion"]

    if "banda" in espera:
        assert salida.banda.id == espera["banda"]
    if "motivoNoElegible" in espera:
        assert salida.motivo_no_elegible.value == espera["motivoNoElegible"]
    if "proximaRonda" in espera:
        assert salida.proxima_ronda == espera["proximaRonda"]
    if "diferenciaSpo2" in espera:
        assert salida.diferencia_spo2 == espera["diferenciaSpo2"]
    if "avisoPresente" in espera:
        assert any(a.codigo == espera["avisoPresente"] for a in salida.avisos)
    if "avisoAusente" in espera:
        assert not any(a.codigo == espera["avisoAusente"] for a in salida.avisos)

    # Invariante que aplica a TODOS los casos.
    assert salida.advertencia


# --- 2. Regresion del bug mas importante -----------------------------------


def test_altitud_alta_no_marca_positivo_a_neonato_sano_de_altura():
    """
    Un recien nacido sano en Juliaca (3825 msnm) satura alrededor de 88%. Con el
    corte de banda 1 sale positivo; con el de su banda, no. Este es el caso que
    justifica el proyecto.
    """
    b1 = banda_por_altitud(150)
    b3 = banda_por_altitud(3825)
    assert evaluar_ronda(b3, 88, 87) is Resultado.NEGATIVO
    assert evaluar_ronda(b1, 88, 87) is Resultado.POSITIVO


# --- 3. La puerta de elegibilidad ------------------------------------------


def test_recien_nacido_sintomatico_no_se_tamiza():
    salida = evaluar_caso(Entrada(
        altitud_msnm=150, spo2_preductal=88, spo2_postductal=86,
        horas_de_vida=24.0, sintomas=frozenset({"cianosis_central"}),
    ))
    assert salida.resultado is Resultado.NO_ELEGIBLE
    assert salida.motivo_no_elegible is MotivoNoElegible.SINTOMATICO
    assert "Cianosis central" in salida.sintomas_de_alarma


def test_el_sintomatico_domina_sobre_las_demas_causas():
    assert evaluar_elegibilidad(
        10.0, frozenset({"mala_perfusion"}), True, True
    ) is MotivoNoElegible.SINTOMATICO


def test_el_soplo_no_excluye_pero_avisa():
    salida = evaluar_caso(Entrada(
        altitud_msnm=150, spo2_preductal=98, spo2_postductal=97,
        horas_de_vida=30.0, sintomas=frozenset({"soplo_cardiaco"}),
    ))
    assert salida.resultado is Resultado.NEGATIVO
    assert any(a.codigo == "soplo_cardiaco" for a in salida.avisos)


def test_elegibilidad_por_edad():
    assert evaluar_elegibilidad(30.0, frozenset(), False, False) is None
    assert evaluar_elegibilidad(23.9, frozenset(), False, False) is MotivoNoElegible.MENOR_24H
    assert evaluar_elegibilidad(24.0, frozenset(), False, False) is None


# --- 4. Medicion incompleta -------------------------------------------------


def test_sin_postductal_queda_incompleto_no_negativo():
    salida = evaluar_caso(Entrada(altitud_msnm=150, spo2_preductal=98, horas_de_vida=30.0))
    assert salida.resultado is Resultado.INCOMPLETO
    assert any(a.codigo == "falta_postductal" for a in salida.avisos)


def test_sin_postductal_pero_preductal_critico_es_positivo():
    salida = evaluar_caso(Entrada(altitud_msnm=150, spo2_preductal=85, horas_de_vida=30.0))
    assert salida.resultado is Resultado.POSITIVO


# --- 5. Retamizaje ----------------------------------------------------------


def test_el_retamizaje_cierra_en_la_tercera_ronda():
    base = dict(altitud_msnm=150, spo2_preductal=92, spo2_postductal=91, horas_de_vida=30.0)
    assert evaluar_caso(Entrada(**base, ronda=1)).resultado is Resultado.REPETIR
    assert evaluar_caso(Entrada(**base, ronda=2)).resultado is Resultado.REPETIR
    assert evaluar_caso(Entrada(**base, ronda=3)).resultado is Resultado.POSITIVO


def test_el_repetir_trae_proxima_ronda_y_espera():
    salida = evaluar_caso(Entrada(
        altitud_msnm=150, spo2_preductal=92, spo2_postductal=91, horas_de_vida=30.0, ronda=1,
    ))
    assert salida.proxima_ronda == 2
    assert salida.minutos_espera == 60


# --- 6. Diferencial ---------------------------------------------------------


def test_la_diferencia_conserva_el_signo():
    assert diferencia_con_signo(92, 97) == -5   # invertida
    assert diferencia_con_signo(96, 90) == 6    # patron de coartacion
    assert diferencia_con_signo(96, None) is None


# --- 7. Umbrales provisionales marcados ------------------------------------


def test_umbrales_provisionales_estan_marcados():
    assert banda_por_altitud(150).estado is EstadoUmbral.VERIFICADO
    assert banda_por_altitud(3000).estado is EstadoUmbral.PROVISIONAL
    assert banda_por_altitud(4000).estado is EstadoUmbral.PROVISIONAL


def test_banda_provisional_genera_aviso():
    salida = evaluar_caso(Entrada(
        altitud_msnm=3825, spo2_preductal=90, spo2_postductal=89, horas_de_vida=30.0,
    ))
    assert any(a.codigo == "umbral_provisional" for a in salida.avisos)


# --- 8. Los signos vitales no alteran el resultado --------------------------


def test_los_signos_vitales_avisan_pero_no_cambian_el_resultado():
    base = dict(altitud_msnm=150, spo2_preductal=98, spo2_postductal=97, horas_de_vida=30.0)
    sin_signos = evaluar_caso(Entrada(**base))
    con_signos = evaluar_caso(Entrada(**base, fc_lpm=200, fr_rpm=80, peso_kg=2.0))

    assert sin_signos.resultado is con_signos.resultado
    codigos = {a.codigo for a in con_signos.avisos}
    assert {"fc_alta", "fr_alta", "bajo_peso"} <= codigos


# --- 9. Validacion ----------------------------------------------------------


def test_entrada_valida_no_da_errores():
    assert validar_entrada(Entrada(altitud_msnm=150, spo2_preductal=98)) == {}


def test_entrada_invalida_se_rechaza():
    with pytest.raises(EntradaInvalida) as exc:
        evaluar_caso(Entrada(altitud_msnm=150, spo2_preductal=120))
    assert "spo2_preductal" in exc.value.errores


def test_altitud_fuera_de_bandas_se_rechaza():
    with pytest.raises(EntradaInvalida) as exc:
        evaluar_caso(Entrada(altitud_msnm=6000, spo2_preductal=98))
    assert "altitud_msnm" in exc.value.errores


# --- 10. Cobertura de las tres bandas ---------------------------------------


def test_las_tres_bandas_cubren_el_rango_peruano_sin_huecos():
    for altitud in range(0, 5101, 25):
        assert banda_por_altitud(altitud) is not None, f"{altitud} msnm sin banda"
    assert banda_por_altitud(5101) is None


def test_las_bandas_no_se_solapan():
    for anterior, siguiente in zip(BANDAS, BANDAS[1:]):
        assert anterior.altitud_max + 1 == siguiente.altitud_min
