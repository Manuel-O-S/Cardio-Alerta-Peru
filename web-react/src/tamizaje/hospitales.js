/**
 * Hospitales por ciudad — datos clínicos de referencia oficiales (SUSALUD / RENAES).
 *
 * Cada ciudad del catálogo de establecimientos tiene una lista de hospitales de Nivel II
 * con su información clínica: nivel de categorización, profesionales disponibles, exámenes,
 * dirección oficial, teléfono de contacto y coordenadas geográficas para ordenamiento por proximidad.
 *
 * Exámenes y procedimientos relevantes para Nivel II:
 *   - Ecocardiograma: evaluación de la anatomía y función cardíaca neonatal.
 *   - Ecografía: evaluación complementaria general.
 *   - Radiografía de Tórax: evaluación de la silueta cardíaca y campos pulmonares.
 */

import { deducirDesdeCoordenadas } from "./ubicacion.js";

export const EXAMENES_LABELS = {
  ecocardiograma: "Ecocardiograma",
  ecografia: "Ecografía",
  radiografiaTorax: "Radiografía de Tórax",
};

export const HOSPITALES = {
  chachapoyas: [
    {
      id: "virgen-fatima",
      nombre: "Hospital Regional Virgen de Fátima",
      nivel: "Nivel II-2",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 4, total: 4 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Jr. Triunfo 035, Chachapoyas",
      contacto: "(041) 477406",
      lat: -6.2305,
      lon: -77.8647,
    },
    {
      id: "higos-urco",
      nombre: "Hospital Higos Urco – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Jr. Ortiz Arrieta 612, Chachapoyas",
      contacto: "(041) 579516",
      lat: -6.2278,
      lon: -77.8722,
    },
  ],
  bagua: [
    {
      id: "gustavo-lanatta",
      nombre: "Hospital de Apoyo Gustavo Lanatta Luján",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Héroes del Cenepa 980, Bagua",
      contacto: "(041) 771159",
      lat: -5.6410,
      lon: -78.5320,
    },
    {
      id: "heroes-cenepa",
      nombre: "Hospital I Héroes del Cenepa – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Jr. Lambayeque 517, Bagua",
      contacto: "(041) 471424",
      lat: -5.6380,
      lon: -78.5280,
    },
    {
      id: "clinica-interregional",
      nombre: "Clínica Interregional",
      nivel: "Nivel II",
      iafas: "Privado",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Héroes del Cenepa 1795, Bagua",
      contacto: "986215787",
      lat: -5.6425,
      lon: -78.5350,
    },
  ],
  utcubamba: [
    {
      id: "santiago-apostol",
      nombre: "Hospital Santiago Apóstol de Utcubamba",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Felipe Santiago s/n, Bagua Grande",
      contacto: "(041) 474010",
      lat: -5.7550,
      lon: -78.4420,
    },
    {
      id: "buen-samaritano",
      nombre: "Hospital El Buen Samaritano – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Jr. Angamos 990, Bagua Grande",
      contacto: "(041) 474001",
      lat: -5.7520,
      lon: -78.4390,
    },
    {
      id: "servimedic-amazonas",
      nombre: "Clínica Servimedic Amazonas",
      nivel: "Nivel II",
      iafas: "Privado",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Jr. Angamos 1027, Bagua Grande",
      contacto: "966836775",
      lat: -5.7535,
      lon: -78.4400,
    },
  ],
  condorcanqui: [
    {
      id: "santa-maria-nieva",
      nombre: "Hospital Santa María de Nieva",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Calle Principal s/n, Nieva",
      contacto: "(041) 477015",
      lat: -4.5980,
      lon: -77.8630,
    },
  ],
  "rodriguez-mendoza": [
    {
      id: "maria-auxiliadora",
      nombre: "Hospital María Auxiliadora – Rodríguez de Mendoza",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Jr. Alonso de Alvarado s/n, San Nicolás",
      contacto: "(041) 830020",
      lat: -6.3940,
      lon: -77.4760,
    },
  ],
  lima: [
    {
      id: "hosp-sjl",
      nombre: "Hospital San Juan de Lurigancho",
      nivel: "Nivel II-2",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 4, total: 4 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Canto Grande s/n, San Juan de Lurigancho",
      contacto: "(01) 388-6513",
      lat: -11.9772,
      lon: -77.0068,
    },
    {
      id: "hosp-vitarte",
      nombre: "Hospital Vitarte",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Nicolás Ayllón 5880, Carretera Central, Ate",
      contacto: "(01) 351-4484",
      lat: -12.0260,
      lon: -76.9199,
    },
    {
      id: "hosp-lanfranco",
      nombre: "Hospital Carlos Lanfranco La Hoz",
      nivel: "Nivel II-2",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Sáenz Peña cdra. 6 s/n, Puente Piedra",
      contacto: "(01) 548-2010",
      lat: -11.8653,
      lon: -77.0784,
    },
    {
      id: "hosp-huaycan",
      nombre: "Hospital de Huaycán",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. José C. Mariátegui s/n Zona B, Huaycán, Ate",
      contacto: "(01) 371-6797",
      lat: -12.0159,
      lon: -76.8201,
    },
    {
      id: "suarez-angamos",
      nombre: "Hospital II Suárez-Angamos – EsSalud",
      nivel: "Nivel II-2",
      iafas: "EsSalud",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Angamos Este 261, Miraflores",
      contacto: "(01) 241-1950",
      lat: -12.1135,
      lon: -77.0281,
    },
    {
      id: "ramon-castilla",
      nombre: "Hospital II Ramón Castilla – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Jr. Guillermo Dansey 390, Cercado de Lima",
      contacto: "(01) 528-2970",
      lat: -12.0443,
      lon: -77.0440,
    },
    {
      id: "diaz-ufano",
      nombre: "Hospital I Aurelio Díaz Ufano y Peral – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Calle Majes s/n G-11, Urb. Los Pinos, San Juan de Lurigancho",
      contacto: "(01) 531-3469",
      lat: -11.9685,
      lon: -76.9956,
    },
    {
      id: "alcantara-butterfield",
      nombre: "Hospital I Carlos Alcántara Butterfield – EsSalud",
      nivel: "Nivel II-2",
      iafas: "EsSalud",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Los Constructores 1201, Urb. Covima, La Molina",
      contacto: "(01) 349-2288",
      lat: -12.0621,
      lon: -76.9455,
    },
    {
      id: "mongrut-munoz",
      nombre: "Hospital I Octavio Mongrut Muñoz – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Parque de las Leyendas 255, San Miguel",
      contacto: "(01) 319-8060",
      lat: -12.0660,
      lon: -77.0946,
    },
    {
      id: "uldarico-rocca",
      nombre: "Hospital Uldarico Rocca Fernández – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Separadora Industrial y Av. César Vallejo, Villa El Salvador",
      contacto: "(01) 287-5266",
      lat: -12.2108,
      lon: -76.9320,
    },
    {
      id: "clinica-stella-maris",
      nombre: "Clínica Stella Maris",
      nivel: "Nivel II-2",
      iafas: "Privado",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Paso de los Andes 923, Pueblo Libre",
      contacto: "(01) 463-6666",
      lat: -12.0714,
      lon: -77.0593,
    },
    {
      id: "clinica-centenario",
      nombre: "Clínica Centenario Peruano Japonesa",
      nivel: "Nivel II-2",
      iafas: "Privado",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Paso de los Andes 675, Pueblo Libre",
      contacto: "(01) 208-8000",
      lat: -12.0731,
      lon: -77.0591,
    },
    {
      id: "clinica-good-hope",
      nombre: "Clínica Adventista Good Hope",
      nivel: "Nivel II-2",
      iafas: "Privado",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Malecón Balta 956 / Av. Grau 755, Miraflores",
      contacto: "(01) 610-7300",
      lat: -12.1256,
      lon: -77.0343,
    },
    {
      id: "clinica-san-gabriel",
      nombre: "Clínica San Gabriel",
      nivel: "Nivel II-2",
      iafas: "Privado",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. La Marina 2945, Maranga, San Miguel",
      contacto: "994061549",
      lat: -12.0767,
      lon: -77.0957,
    },
    {
      id: "clinica-jesus-norte",
      nombre: "Clínica Jesús del Norte",
      nivel: "Nivel II-2",
      iafas: "Privado",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Carlos Izaguirre 153, Independencia",
      contacto: "(01) 613-4444",
      lat: -11.9910,
      lon: -77.0713,
    },
  ],
  callao: [
    {
      id: "san-jose-callao",
      nombre: "Hospital San José del Callao",
      nivel: "Nivel II-2",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Elmer Faucett 506, Bellavista, Callao",
      contacto: "(01) 319-7830",
      lat: -12.0552,
      lon: -77.1145,
    },
    {
      id: "negreiros-callao",
      nombre: "Hospital II Luis Negreiros Vega – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Tomás Valle cdra. 35, San Martín / Callao",
      contacto: "(01) 572-0330",
      lat: -12.0150,
      lon: -77.0980,
    },
    {
      id: "clinica-bellavista",
      nombre: "Clínica Bellavista",
      nivel: "Nivel II",
      iafas: "Privado",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Jr. Las Gaviotas 207, Bellavista",
      contacto: "(01) 429-3530",
      lat: -12.0620,
      lon: -77.1210,
    },
  ],
  trujillo: [
    {
      id: "jerusalen-trujillo",
      nombre: "Hospital Jerusalén – La Esperanza",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Cahuide s/n, La Esperanza, Trujillo",
      contacto: "(044) 27-2480",
      lat: -8.0780,
      lon: -79.0420,
    },
    {
      id: "esfuerzo-trujillo",
      nombre: "Hospital El Esfuerzo – Florencia de Mora",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Calle 24 de Abril s/n, Trujillo",
      contacto: "(044) 21-1250",
      lat: -8.0820,
      lon: -79.0250,
    },
    {
      id: "albrecht-trujillo",
      nombre: "Hospital I Albrecht – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Av. América Norte 1200, Trujillo",
      contacto: "(044) 29-3434",
      lat: -8.1060,
      lon: -79.0310,
    },
    {
      id: "chocope-essalud",
      nombre: "Hospital II Chocope – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Mariscal Castilla s/n, Chocope / La Libertad",
      contacto: "(044) 54-2012",
      lat: -7.7910,
      lon: -79.2230,
    },
  ],
  iquitos: [
    {
      id: "apoyo-iquitos",
      nombre: "Hospital de Apoyo Iquitos César Garayar García",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. 28 de Julio s/n, Punchana, Iquitos",
      contacto: "(065) 24-1083",
      lat: -3.7380,
      lon: -73.2450,
    },
    {
      id: "santa-gema-loreto",
      nombre: "Hospital Santa Gema de Yurimaguas",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Calle Progreso 412, Yurimaguas, Loreto",
      contacto: "(065) 35-1234",
      lat: -5.8980,
      lon: -76.1080,
    },
  ],
  arequipa: [
    {
      id: "majes-arequipa",
      nombre: "Hospital Central de Majes",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Principal s/n, El Pedregal, Caylloma, Arequipa",
      contacto: "(054) 58-6120",
      lat: -16.3240,
      lon: -72.2030,
    },
    {
      id: "angeles-arequipa",
      nombre: "Hospital Municipal Los Ángeles del Cono Norte",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Aviación km 7, Cerro Colorado, Arequipa",
      contacto: "(054) 38-2040",
      lat: -16.3560,
      lon: -71.5680,
    },
    {
      id: "escomel-arequipa",
      nombre: "Hospital I Edmundo Escomel – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Paucarpata 408, Paucarpata, Arequipa",
      contacto: "(054) 46-5200",
      lat: -16.4150,
      lon: -71.5160,
    },
    {
      id: "torres-munoz-essalud",
      nombre: "Hospital II Manuel de Torres Muñoz – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Calle Islay s/n, Mollendo, Arequipa",
      contacto: "(054) 53-2080",
      lat: -17.0220,
      lon: -72.0150,
    },
  ],
  cajamarca: [
    {
      id: "jaen-cajamarca",
      nombre: "Hospital General de Jaén",
      nivel: "Nivel II-2",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Mesones Muro 415, Jaén, Cajamarca",
      contacto: "(076) 43-1250",
      lat: -5.7080,
      lon: -78.8060,
    },
    {
      id: "bambamarca-cajamarca",
      nombre: "Hospital Tito Villar Cabeza – Bambamarca",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Jr. Alfonso Ugarte s/n, Bambamarca",
      contacto: "(076) 55-1120",
      lat: -6.6780,
      lon: -78.5230,
    },
    {
      id: "essalud-cajamarca",
      nombre: "Hospital II Cajamarca – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Jr. Mario Urteaga 963, Cajamarca",
      contacto: "(076) 36-1991",
      lat: -7.1640,
      lon: -78.5110,
    },
  ],
  huaraz: [
    {
      id: "llanchipal",
      nombre: "Hospital Víctor Ramos Guardia",
      nivel: "Nivel II-2",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Luzuriaga s/n, Huaraz",
      contacto: "(043) 42-1861",
      lat: -9.5290,
      lon: -77.5260,
    },
    {
      id: "essalud-huaraz",
      nombre: "Hospital II Huaraz – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: false },
      direccion: "Jr. Amadeo Figueroa 957, Huaraz",
      contacto: "(043) 42-6540",
      lat: -9.5310,
      lon: -77.5290,
    },
  ],
  huancayo: [
    {
      id: "el-carmen-huancayo",
      nombre: "Hospital Materno Infantil El Carmen",
      nivel: "Nivel II-2",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Jr. Puno 950, Huancayo",
      contacto: "(064) 23-1181",
      lat: -12.0710,
      lon: -75.2090,
    },
    {
      id: "tarma-junin",
      nombre: "Hospital de Apoyo Félix Mayorca Soto – Tarma",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Pacheco s/n, Tarma, Junín",
      contacto: "(064) 32-1400",
      lat: -11.4210,
      lon: -75.6880,
    },
    {
      id: "la-oroya-essalud",
      nombre: "Hospital I La Oroya – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Horacio Zevallos 110, Yauli, Junín",
      contacto: "(064) 39-1220",
      lat: -11.5280,
      lon: -75.9010,
    },
  ],
  cusco: [
    {
      id: "sicuani-cusco",
      nombre: "Hospital de Sicuani",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Manuel Callo Zevallos s/n, Canchis, Cusco",
      contacto: "(084) 35-1030",
      lat: -14.2760,
      lon: -71.2280,
    },
    {
      id: "quillabamba-cusco",
      nombre: "Hospital de Quillabamba",
      nivel: "Nivel II-1",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Jr. Independencia 420, La Convención, Cusco",
      contacto: "(084) 28-1150",
      lat: -12.8680,
      lon: -72.6950,
    },
    {
      id: "santiago-essalud",
      nombre: "Hospital I Santiago – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Manzanapata s/n, Santiago, Cusco",
      contacto: "(084) 22-8190",
      lat: -13.5350,
      lon: -71.9820,
    },
  ],
  juliaca: [
    {
      id: "carlos-monge",
      nombre: "Hospital Carlos Monge Medrano",
      nivel: "Nivel II-2",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Huancané s/n, Juliaca",
      contacto: "(051) 32-1901",
      lat: -15.4850,
      lon: -70.1280,
    },
    {
      id: "cono-sur-juliaca",
      nombre: "Hospital I Cono Sur Juliaca – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: true },
      direccion: "Jr. Mariano Melgar s/n, Juliaca",
      contacto: "(051) 32-2250",
      lat: -15.5120,
      lon: -70.1410,
    },
  ],
  puno: [
    {
      id: "regional-puno",
      nombre: "Hospital Regional Manuel Núñez Butrón",
      nivel: "Nivel II-2",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. El Sol 1022, Puno",
      contacto: "(051) 36-9696",
      lat: -15.8360,
      lon: -70.0190,
    },
    {
      id: "ilave-puno",
      nombre: "Hospital I Ilave – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: false },
      direccion: "Jr. Puno 340, El Collao, Puno",
      contacto: "(051) 85-2010",
      lat: -16.0840,
      lon: -69.6380,
    },
  ],
  pasco: [
    {
      id: "carrion-pasco",
      nombre: "Hospital Daniel Alcides Carrión – Pasco",
      nivel: "Nivel II-2",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: true, ecografia: true, radiografiaTorax: true },
      direccion: "Av. Los Incas s/n, Cerro de Pasco",
      contacto: "(063) 42-2674",
      lat: -10.6860,
      lon: -76.2520,
    },
    {
      id: "essalud-pasco",
      nombre: "Hospital II Pasco – EsSalud",
      nivel: "Nivel II-1",
      iafas: "EsSalud",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { ecocardiograma: false, ecografia: true, radiografiaTorax: false },
      direccion: "Jr. Constitución 269, Cerro de Pasco",
      contacto: "(063) 42-3250",
      lat: -10.6810,
      lon: -76.2570,
    },
  ],
  rinconada: [
    {
      id: "centro-rinconada",
      nombre: "Centro de Salud La Rinconada (Referencia a Hosp. II Juliaca)",
      nivel: "Nivel I-4",
      iafas: "MINSA / SIS",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { ecocardiograma: false, ecografia: false, radiografiaTorax: false },
      direccion: "La Rinconada, Ananea, Puno",
      contacto: "Sin teléfono directo",
      lat: -14.6280,
      lon: -69.4450,
    },
  ],
};

/**
 * Fórmula de Haversine para calcular distancia geodésica en kilómetros entre dos coordenadas.
 */
export function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  if (!Number.isFinite(lat1) || !Number.isFinite(lon1) || !Number.isFinite(lat2) || !Number.isFinite(lon2)) {
    return null;
  }
  const R = 6371; // Radio de la Tierra en km
  const rad = (g) => (g * Math.PI) / 180;
  const dPhi = rad(lat2 - lat1);
  const dLambda = rad(lon2 - lon1);
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function obtenerIafas(h) {
  if (h.iafas) return h.iafas;
  const nom = (h.nombre || "").toLowerCase();
  if (
    nom.includes("essalud") ||
    nom.includes("negreiros") ||
    nom.includes("suárez") ||
    nom.includes("suarez") ||
    nom.includes("ramón castilla") ||
    nom.includes("ramon castilla") ||
    nom.includes("albrecht") ||
    nom.includes("chocope") ||
    nom.includes("escomel") ||
    nom.includes("torres muñoz") ||
    nom.includes("torres munoz") ||
    nom.includes("la oroya") ||
    nom.includes("santiago") ||
    nom.includes("cono sur") ||
    nom.includes("ilave") ||
    nom.includes("higos urco") ||
    nom.includes("héroes del cenepa") ||
    nom.includes("heroes del cenepa") ||
    nom.includes("samaritano")
  ) {
    return "EsSalud";
  }
  if (nom.includes("clínica") || nom.includes("clinica") || nom.includes("good hope") || nom.includes("stella maris")) {
    return "Privado";
  }
  return "MINSA / SIS";
}

/**
 * Obtiene la lista de hospitales de una ciudad por su id o coordenadas.
 * Calcula la distancia exacta en km a las coordenadas proporcionadas y ordena
 * los hospitales por cercanía (el más cercano primero).
 */
export function hospitalesDeCiudad(ciudadId, lat, lon) {
  let lista = [];
  const la = Number(lat);
  const lo = Number(lon);
  const coordsValidas = Number.isFinite(la) && Number.isFinite(lo);

  if (ciudadId && ciudadId !== "manual" && HOSPITALES[ciudadId]) {
    lista = HOSPITALES[ciudadId];
  } else if (coordsValidas) {
    const deducido = deducirDesdeCoordenadas(la, lo);
    if (deducido?.id && HOSPITALES[deducido.id]) {
      lista = HOSPITALES[deducido.id];
    }
  }

  // Mapear con IAFAS y calcular distancia en km si se cuenta con coordenadas
  const mapeados = lista.map((h) => {
    let dist = null;
    if (coordsValidas && Number.isFinite(h.lat) && Number.isFinite(h.lon)) {
      const d = calcularDistanciaKm(la, lo, h.lat, h.lon);
      dist = d !== null ? Math.round(d * 10) / 10 : null;
    }
    return {
      ...h,
      iafas: h.iafas || obtenerIafas(h),
      distanciaKm: dist,
    };
  });

  // Ordenar por distancia si está disponible
  if (coordsValidas) {
    mapeados.sort((a, b) => {
      if (a.distanciaKm === null && b.distanciaKm === null) return 0;
      if (a.distanciaKm === null) return 1;
      if (b.distanciaKm === null) return -1;
      return a.distanciaKm - b.distanciaKm;
    });
  }

  return mapeados;
}
