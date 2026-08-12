# Evaluación de datasets para la fase de análisis de imagen

**Proyecto:** Cardio Alerta Perú
**Responsable:** [Angel] · **Fecha:** [completar]

Este documento sustenta la decisión de dejar el análisis de imagen fuera del
alcance del proyecto. La conclusión es negativa, y esa es la contribución: se
evaluó sistemáticamente si era viable y se documentó por qué no lo es.

---

## 1. Pregunta de evaluación

¿Existe un dataset público que permita entrenar y validar clínicamente un
clasificador de cardiopatía congénita sobre imágenes de ecocardiograma
neonatal?

Criterios que debía cumplir simultáneamente:

- **(a)** Población neonatal
- **(b)** Imágenes de ecocardiograma
- **(c)** Etiquetas de diagnóstico de cardiopatía congénita

## 2. Fuentes consultadas

PhysioNet, Kaggle, Zenodo, Hugging Face Datasets, Grand Challenge, Stanford
AIMI, TCIA, IEEE DataPort, figshare, repositorios de challenges MICCAI/ISBI, y
literatura indexada (PubMed, arXiv, Scientific Data, Nature).

## 3. Resultado: ningún dataset cumple los tres criterios

| Dataset | Población | Modalidad | Etiqueta | ¿Cumple? |
|---|---|---|---|---|
| **NED** | Neonatal | Eco (video) | Vista anatómica | No — sin diagnóstico |
| Ragnarsdottir (Zúrich) | Neonatal | Eco (video) | Hipertensión pulmonar | No — privado, patología funcional |
| **CARDIUM** | Fetal | Eco + clínico | Diagnóstico CC | No — fetal, acceso con trámite |
| **Heartbeat** | Fetal | Eco | Diagnóstico CC | No — fetal, descarga no confirmada |
| **EchoNet-Pediatric** | Pediátrica | Eco (video) | FE, volúmenes | No — **excluye CC explícitamente** |
| **CHD-CXR** | Pediátrica | Radiografía | Diagnóstico CC | No — otra modalidad |
| **ImageCHD** | Pediátrica | TC 3D | 7 subestructuras | No — otra modalidad |
| **HVSMR-2.0** | Pediátrica con CC | RM | 4 cámaras + 4 vasos | No — otra modalidad |
| **CAMUS** | Adulta | Eco 2D | Segmentación VI | No |
| **PhysioNet 2016/2022** | Mixta | Fonocardiograma | Soplo | No — otra modalidad |

**El más cercano** es NED, único dataset neonatal de ecocardiograma público:
1 049 videos de aproximadamente un segundo sobre 40 casos de pacientes, con 16
clases etiquetadas por un médico. Pero las clases son **vistas
ecocardiográficas** (Apical 4 Cámaras, Paraesternal Eje Largo, etc.), no
diagnósticos. Permite construir "qué corte estoy viendo", no "este bebé tiene
una cardiopatía".

## 4. Segundo hallazgo: los modelos genéricos fallan en anatomía congénita

Aun disponiendo de datos, hay evidencia de que el enfoque no transfiere.

Wegner et al. (*J Clin Med* 2022;11(3):690, doi:10.3390/jcm11030690) validaron
una CNN entrenada con 14 035 ecocardiogramas de una cohorte general sobre
pacientes con cardiopatía congénita o estructural:

| Población | Exactitud (clasificación de vista) |
|---|---|
| Sin enfermedad cardíaca | 66,7% |
| **Con cardiopatía congénita/estructural** | **48,3%** |
| Red reentrenada en población con CC | 76,1% |

La tarea evaluada es la **fácil** —identificar el corte, no diagnosticar— y aun
así el desempeño cae ~18 puntos en la población de interés. El corazón
malformado no se parece al del conjunto de entrenamiento.

Stanford documenta el mismo fenómeno en dirección pediátrica: los modelos
entrenados en ecocardiogramas de adultos no son aplicables a población
pediátrica.

## 5. Tercer hallazgo: la radiografía tampoco resuelve el diagnóstico

Se evaluó la alternativa de detectar signos radiológicos clásicos (corazón en
bota, corazón en huevo). La literatura la desaconseja:

- La radiografía convencional tiene sensibilidad de 26% a 59% para enfermedad
  cardíaca estructural, con valor predictivo positivo de 46% a 52%.
- El signo del corazón en bota **se sobrediagnostica en neonatos**, que
  normalmente presentan hipertrofia ventricular derecha; y una placa con
  lordosis puede hacer que un corazón normal lo aparente.
- Los recién nacidos con cardiopatía, incluso severa, pueden tener radiografías
  normales.

Un modelo entrenado para esto aprendería posición del paciente y técnica
radiográfica, no enfermedad.

## 6. Conclusión

**No es viable entrenar hoy un clasificador de cardiopatía congénita sobre
imagen neonatal con datos públicos**, por ausencia de datasets que combinen los
tres criterios y por el deterioro documentado de los modelos genéricos en
anatomía congénita.

A esto se suma un argumento de pertinencia: un ecocardiograma requiere equipo y
un especialista que lo opere. Donde ambos existen, el especialista interpreta en
tiempo real y no requiere asistencia automatizada. Donde no existen —el
escenario del proyecto— no hay imagen que analizar. **La brecha del primer
nivel de atención no es de interpretación, sino de acceso.**

## 7. Rutas para retomarlo más adelante

Ordenadas por viabilidad:

1. **Fonocardiograma / estetoscopio digital.** Datasets públicos (PhysioNet
   2016 y 2022), hardware de bajo costo y desempeño reportado alto en
   literatura reciente. Es la ruta de IA más viable en entornos de recursos
   limitados.
2. **Construcción de dataset propio con el INSN.** El camino publicado para
   estos casos es preentrenar en datasets adultos grandes y validar en decenas
   de imágenes neonatales anotadas localmente. No requiere miles de casos.
3. **Clasificación de vistas sobre NED** como control de calidad de captura
   —no como diagnóstico— para asistir a operadores no especializados.

## 8. Vacíos declarados

- No se pudo confirmar enlace de descarga funcional del dataset Heartbeat.
- El dataset primario de fonocardiograma de Bangladesh se describe en la
  literatura pero no está confirmado como público.
- Las cifras de desempeño provienen de las publicaciones originales; no se
  realizó validación independiente.
- El acceso a CARDIUM requiere formulario con verificación de afiliación
  académica, no solicitado a la fecha de este informe.
