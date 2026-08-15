/**
 * Informacion de ayuda para cada sintoma del tamizaje.
 *
 * Cada entrada tiene:
 * - titulo:      nombre legible del sintoma
 * - imagen:      ruta dentro de public/ (el service worker la cachea)
 * - alt:         texto alternativo de la imagen para accesibilidad
 * - descripcion: explicacion breve y practica para el personal de salud
 */

export const INFO_SINTOMAS = {
  cianosis_central: {
    titulo: "Cianosis central",
    imagen: "/sintomas/cianosis-central.jpg",
    alt:
      "Ilustraci\u00F3n m\u00E9dica de un reci\u00E9n nacido con cianosis central: " +
      "coloraci\u00F3n azulada visible en labios, lengua y mucosas orales.",
    descripcion:
      "Coloraci\u00F3n azul-morada de labios, lengua y mucosas orales que indica " +
      "una saturaci\u00F3n de ox\u00EDgeno insuficiente en la sangre arterial. " +
      "No confundir con la acrocianosis (manos y pies azulados), que es " +
      "frecuente y benigna en las primeras horas de vida.",
  },

  dificultad_respiratoria: {
    titulo: "Dificultad respiratoria",
    imagen: "/sintomas/dificultad-respiratoria.jpg",
    alt:
      "Ilustraci\u00F3n m\u00E9dica de un reci\u00E9n nacido con signos de " +
      "dificultad respiratoria: aleteo nasal, tiraje intercostal y subcostal.",
    descripcion:
      "Signos de esfuerzo respiratorio aumentado: aleteo nasal (las alas de " +
      "la nariz se abren al inspirar), tiraje intercostal y subcostal " +
      "(hundimiento entre las costillas o debajo de ellas), quejido " +
      "espiratorio y/o respiraci\u00F3n r\u00E1pida o irregular.",
  },

  bradicardia: {
    titulo: "Bradicardia",
    imagen: "/sintomas/bradicardia.jpg",
    alt:
      "Ilustraci\u00F3n m\u00E9dica de un reci\u00E9n nacido conectado a un " +
      "monitor card\u00EDaco que muestra frecuencia card\u00EDaca baja (< 100 lpm).",
    descripcion:
      "Frecuencia card\u00EDaca por debajo de 100 latidos por minuto en un " +
      "reci\u00E9n nacido. Puede indicar compromiso cardiaco, hipoxia o " +
      "alteraciones de la conducci\u00F3n el\u00E9ctrica del coraz\u00F3n. " +
      "Requiere evaluaci\u00F3n inmediata.",
  },

  hipotension: {
    titulo: "Hipotensi\u00F3n",
    imagen: "/sintomas/hipotension.jpg",
    alt:
      "Ilustraci\u00F3n m\u00E9dica de la medici\u00F3n de presi\u00F3n arterial " +
      "en un reci\u00E9n nacido con manguito neonatal.",
    descripcion:
      "Presi\u00F3n arterial por debajo de los valores normales para la edad " +
      "gestacional y el peso. Se mide con un manguito neonatal apropiado. " +
      "Puede manifestarse tambi\u00E9n como pulsos d\u00E9biles o ausentes en " +
      "extremidades.",
  },

  mala_perfusion: {
    titulo: "Mala perfusi\u00F3n",
    imagen: "/sintomas/mala-perfusion.jpg",
    alt:
      "Ilustraci\u00F3n m\u00E9dica del test de llenado capilar en un reci\u00E9n " +
      "nacido: presi\u00F3n sobre la piel y retorno de color retardado (> 3 s).",
    descripcion:
      "Llenado capilar prolongado (> 3 segundos): al presionar la piel y " +
      "soltar, el color tarda en volver. Tambi\u00E9n puede observarse piel " +
      "moteada, p\u00E1lida o fr\u00EDa al tacto. Indica que la sangre no " +
      "llega bien a los tejidos perif\u00E9ricos.",
  },

  hepatomegalia: {
    titulo: "Hepatomegalia",
    imagen: "/sintomas/hepatomegalia.jpg",
    alt:
      "Ilustraci\u00F3n m\u00E9dica de la palpaci\u00F3n abdominal de un " +
      "reci\u00E9n nacido mostrando h\u00EDgado agrandado debajo del reborde costal.",
    descripcion:
      "H\u00EDgado palpable m\u00E1s de 2 cm por debajo del reborde costal " +
      "derecho. Se detecta mediante palpaci\u00F3n suave del abdomen. " +
      "En el contexto neonatal puede indicar insuficiencia card\u00EDaca " +
      "congestiva o congesti\u00F3n venosa.",
  },

  soplo_cardiaco: {
    titulo: "Soplo card\u00EDaco",
    imagen: "/sintomas/soplo-cardiaco.jpg",
    alt:
      "Ilustraci\u00F3n m\u00E9dica de auscultaci\u00F3n card\u00EDaca en un " +
      "reci\u00E9n nacido con estetoscopio, mostrando flujo sangu\u00EDneo turbulento.",
    descripcion:
      "Sonido anormal detectado al auscultar el coraz\u00F3n con estetoscopio. " +
      "No todos los soplos en neonatos indican cardiopat\u00EDa (muchos son " +
      "inocentes), pero su presencia junto con otros s\u00EDntomas puede " +
      "sugerir una lesi\u00F3n card\u00EDaca estructural.",
  },

  taquicardia: {
    titulo: "Taquicardia",
    imagen: "/sintomas/taquicardia.jpg",
    alt:
      "Ilustraci\u00F3n m\u00E9dica de un reci\u00E9n nacido conectado a un " +
      "monitor card\u00EDaco que muestra frecuencia card\u00EDaca elevada (> 180 lpm).",
    descripcion:
      "Frecuencia card\u00EDaca sostenida por encima de 180 latidos por " +
      "minuto en reposo. Puede ser un mecanismo compensatorio ante bajo " +
      "gasto card\u00EDaco, anemia, fiebre o una arritmia primaria.",
  },

  oxigeno_suplementario: {
    titulo: "Ox\u00EDgeno suplementario",
    imagen: "/sintomas/oxigeno-suplementario.jpg",
    alt:
      "Ilustraci\u00F3n m\u00E9dica de un reci\u00E9n nacido recibiendo " +
      "ox\u00EDgeno suplementario mediante c\u00E1nula nasal en incubadora.",
    descripcion:
      "El reci\u00E9n nacido ya est\u00E1 recibiendo ox\u00EDgeno " +
      "suplementario (c\u00E1nula nasal, campana cef\u00E1lica, CPAP u otro " +
      "dispositivo). Esto indica que la saturaci\u00F3n basal est\u00E1 " +
      "comprometida y el tamizaje por oximetr\u00EDa no ser\u00EDa v\u00E1lido " +
      "en estas condiciones.",
  },

  diagnostico_prenatal: {
    titulo: "Diagn\u00F3stico prenatal de cardiopat\u00EDa",
    imagen: "/sintomas/diagnostico-prenatal.jpg",
    alt:
      "Ilustraci\u00F3n m\u00E9dica de ecocardiograf\u00EDa fetal prenatal " +
      "mostrando la vista de cuatro c\u00E1maras del coraz\u00F3n.",
    descripcion:
      "Se detect\u00F3 una cardiopat\u00EDa cong\u00E9nita durante el embarazo " +
      "mediante ecocardiograf\u00EDa fetal. Estos neonatos ya tienen un " +
      "diagn\u00F3stico y requieren seguimiento por cardiolog\u00EDa " +
      "pedi\u00E1trica, no tamizaje.",
  },
};
