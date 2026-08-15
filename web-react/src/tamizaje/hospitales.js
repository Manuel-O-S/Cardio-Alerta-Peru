/**
 * Hospitales por ciudad — datos clínicos de referencia.
 *
 * Cada ciudad del catálogo de establecimientos tiene una lista de hospitales
 * con su información clínica: profesionales disponibles, exámenes y procedimientos que ofrece,
 * dirección y contacto.
 *
 * Exámenes y procedimientos relevantes:
 *   - Electrocardiograma: evaluación de la actividad eléctrica del corazón neonatal.
 *   - Ecografía: evaluación complementaria general.
 *   - Radiografía de Tórax: evaluación de la silueta cardíaca y campos pulmonares.
 *   - UCI Neonatal (UCIN): disponibilidad de cuidados intensivos para recién nacidos.
 */

import { deducirDesdeCoordenadas } from "./ubicacion.js";

export const EXAMENES_LABELS = {
  electrocardiograma: "Electrocardiograma",
  ecografia: "Ecografía",
  radiografiaTorax: "Radiografía de Tórax",
  ucin: "UCI Neonatal (UCIN)",
};

export const HOSPITALES = {
  chachapoyas: [
    {
      id: "virgen-fatima",
      nombre: "Hospital Regional Virgen de Fátima",
      nivel: "Nivel II-2",
      profesionales: { disponibles: 4, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Jr. Triunfo 035, Chachapoyas",
      contacto: "(041) 477406",
    },
    {
      id: "higos-urco",
      nombre: "Hospital Higos Urco – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Jr. Ortiz Arrieta 612, Chachapoyas",
      contacto: "(041) 579516",
    },
  ],
  bagua: [
    {
      id: "gustavo-lanatta",
      nombre: "Hospital de Apoyo Gustavo Lanatta Luján",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Héroes del Cenepa 980, Bagua",
      contacto: "(041) 771159",
    },
    {
      id: "heroes-cenepa",
      nombre: "Hospital I Héroes del Cenepa – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Jr. Lambayeque 517, Bagua",
      contacto: "(041) 471424",
    },
    {
      id: "clinica-interregional",
      nombre: "Clínica Interregional",
      nivel: "Nivel II",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Av. Héroes del Cenepa 1795, Bagua",
      contacto: "986215787",
    },
  ],
  utcubamba: [
    {
      id: "santiago-apostol",
      nombre: "Hospital Santiago Apóstol de Utcubamba",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Felipe Santiago s/n, Bagua Grande",
      contacto: "Central de Emergencias",
    },
    {
      id: "buen-samaritano",
      nombre: "Hospital El Buen Samaritano – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Jr. Angamos 990, Bagua Grande",
      contacto: "(041) 474001",
    },
    {
      id: "servimedic-amazonas",
      nombre: "Clínica Servimedic Amazonas",
      nivel: "Nivel II",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Jr. Angamos 1027, Bagua Grande",
      contacto: "966836775",
    },
  ],
  condorcanqui: [
    {
      id: "santa-maria-nieva",
      nombre: "Hospital Santa María de Nieva",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Calle Principal s/n, Nieva",
      contacto: "Central de Emergencias",
    },
  ],
  "rodriguez-mendoza": [
    {
      id: "maria-auxiliadora",
      nombre: "Hospital María Auxiliadora – Rodríguez de Mendoza",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Jr. Alonso de Alvarado s/n, San Nicolás",
      contacto: "Central de Emergencias",
    },
  ],
  lima: [
    {
      id: "hosp-sjl",
      nombre: "Hospital San Juan de Lurigancho",
      nivel: "Nivel II-2",
      profesionales: { disponibles: 4, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Canto Grande s/n, San Juan de Lurigancho",
      contacto: "(01) 388-6513",
    },
    {
      id: "hosp-vitarte",
      nombre: "Hospital II Vitarte",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Nicolás de Piérola s/n, Ate",
      contacto: "(01) 351-4550",
    },
    {
      id: "suarez-angamos",
      nombre: "Hospital II Suárez-Angamos – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Angamos Este 261, Miraflores",
      contacto: "(01) 241-1900",
    },
    {
      id: "ramon-castilla",
      nombre: "Hospital II Ramón Castilla – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Jr. Guillermo Dansey 370, Cercado de Lima",
      contacto: "(01) 433-2820",
    },
    {
      id: "clinica-stella-maris",
      nombre: "Clínica Stella Maris",
      nivel: "Nivel II",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Paso de los Andes 923, Pueblo Libre",
      contacto: "(01) 463-6666",
    },
  ],
  callao: [
    {
      id: "san-jose-callao",
      nombre: "Hospital San José del Callao",
      nivel: "Nivel II-2",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Elmer Faucett 506, Bellavista, Callao",
      contacto: "(01) 319-7830",
    },
    {
      id: "negreiros-callao",
      nombre: "Hospital II Luis Negreiros Vega – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Tomás Valle cdra. 35, San Martín / Callao",
      contacto: "(01) 572-0330",
    },
    {
      id: "clinica-bellavista",
      nombre: "Clínica Bellavista",
      nivel: "Nivel II",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Jr. Las Gaviotas 207, Bellavista",
      contacto: "(01) 429-3530",
    },
  ],
  trujillo: [
    {
      id: "jerusalen-trujillo",
      nombre: "Hospital Jerusalén – La Esperanza",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Cahuide s/n, La Esperanza, Trujillo",
      contacto: "(044) 27-2480",
    },
    {
      id: "esfuerzo-trujillo",
      nombre: "Hospital El Esfuerzo – Florencia de Mora",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Calle 24 de Abril s/n, Trujillo",
      contacto: "(044) 21-1250",
    },
    {
      id: "albrecht-trujillo",
      nombre: "Hospital I Albrecht – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Av. América Norte 1200, Trujillo",
      contacto: "(044) 29-3434",
    },
    {
      id: "chocope-essalud",
      nombre: "Hospital II Chocope – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Mariscal Castilla s/n, Chocope / La Libertad",
      contacto: "(044) 54-2012",
    },
  ],
  iquitos: [
    {
      id: "apoyo-iquitos",
      nombre: "Hospital de Apoyo Iquitos César Garayar García",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. 28 de Julio s/n, Punchana, Iquitos",
      contacto: "(065) 24-1083",
    },
    {
      id: "santa-gema-loreto",
      nombre: "Hospital Santa Gema de Yurimaguas",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Calle Progreso 412, Yurimaguas, Loreto",
      contacto: "(065) 35-1234",
    },
  ],
  arequipa: [
    {
      id: "majes-arequipa",
      nombre: "Hospital Central de Majes",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Principal s/n, El Pedregal, Caylloma, Arequipa",
      contacto: "(054) 58-6120",
    },
    {
      id: "angeles-arequipa",
      nombre: "Hospital Municipal Los Ángeles del Cono Norte",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Av. Aviación km 7, Cerro Colorado, Arequipa",
      contacto: "(054) 38-2040",
    },
    {
      id: "escomel-arequipa",
      nombre: "Hospital I Edmundo Escomel – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Av. Paucarpata 408, Paucarpata, Arequipa",
      contacto: "(054) 46-5200",
    },
    {
      id: "torres-munoz-essalud",
      nombre: "Hospital II Manuel de Torres Muñoz – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Calle Islay s/n, Mollendo, Arequipa",
      contacto: "(054) 53-2080",
    },
  ],
  cajamarca: [
    {
      id: "jaen-cajamarca",
      nombre: "Hospital General de Jaén",
      nivel: "Nivel II-2",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Mesones Muro 415, Jaén, Cajamarca",
      contacto: "(076) 43-1250",
    },
    {
      id: "bambamarca-cajamarca",
      nombre: "Hospital Tito Villar Cabeza – Bambamarca",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Jr. Alfonso Ugarte s/n, Bambamarca",
      contacto: "(076) 55-1120",
    },
    {
      id: "essalud-cajamarca",
      nombre: "Hospital II Cajamarca – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Jr. Mario Urteaga 963, Cajamarca",
      contacto: "(076) 36-1991",
    },
  ],
  huaraz: [
    {
      id: "llanchipal",
      nombre: "Hospital Víctor Ramos Guardia",
      nivel: "Nivel II-2",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Luzuriaga s/n, Huaraz",
      contacto: "(043) 42-1861",
    },
    {
      id: "essalud-huaraz",
      nombre: "Hospital II Huaraz – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: false, ucin: false },
      direccion: "Jr. Amadeo Figueroa 957, Huaraz",
      contacto: "(043) 42-6540",
    },
  ],
  huancayo: [
    {
      id: "el-carmen-huancayo",
      nombre: "Hospital Materno Infantil El Carmen",
      nivel: "Nivel II-2",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Jr. Puno 950, Huancayo",
      contacto: "(064) 23-1181",
    },
    {
      id: "tarma-junin",
      nombre: "Hospital de Apoyo Félix Mayorca Soto – Tarma",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Av. Pacheco s/n, Tarma, Junín",
      contacto: "(064) 32-1400",
    },
    {
      id: "la-oroya-essalud",
      nombre: "Hospital I La Oroya – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Av. Horacio Zevallos 110, Yauli, Junín",
      contacto: "(064) 39-1220",
    },
  ],
  cusco: [
    {
      id: "sicuani-cusco",
      nombre: "Hospital de Sicuani",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Manuel Callo Zevallos s/n, Canchis, Cusco",
      contacto: "(084) 35-1030",
    },
    {
      id: "quillabamba-cusco",
      nombre: "Hospital de Quillabamba",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Jr. Independencia 420, La Convención, Cusco",
      contacto: "(084) 28-1150",
    },
    {
      id: "santiago-essalud",
      nombre: "Hospital I Santiago – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Av. Manzanapata s/n, Santiago, Cusco",
      contacto: "(084) 22-8190",
    },
  ],
  juliaca: [
    {
      id: "carlos-monge",
      nombre: "Hospital Carlos Monge Medrano",
      nivel: "Nivel II-2",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Huancané s/n, Juliaca",
      contacto: "(051) 32-1901",
    },
    {
      id: "cono-sur-juliaca",
      nombre: "Hospital I Cono Sur Juliaca – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Jr. Mariano Melgar s/n, Juliaca",
      contacto: "(051) 32-2250",
    },
  ],
  puno: [
    {
      id: "regional-puno",
      nombre: "Hospital Regional Manuel Núñez Butrón",
      nivel: "Nivel II-2",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. El Sol 1022, Puno",
      contacto: "(051) 36-9696",
    },
    {
      id: "ilave-puno",
      nombre: "Hospital I Ilave – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: false, ucin: false },
      direccion: "Jr. Puno 340, El Collao, Puno",
      contacto: "(051) 85-2010",
    },
  ],
  pasco: [
    {
      id: "carrion-pasco",
      nombre: "Hospital Daniel Alcides Carrión – Pasco",
      nivel: "Nivel II-2",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Los Incas s/n, Cerro de Pasco",
      contacto: "(063) 42-2674",
    },
    {
      id: "essalud-pasco",
      nombre: "Hospital II Pasco – EsSalud",
      nivel: "Nivel II-1",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: false, ucin: false },
      direccion: "Jr. Constitución 269, Cerro de Pasco",
      contacto: "(063) 42-3250",
    },
  ],
  rinconada: [
    {
      id: "centro-rinconada",
      nombre: "Centro de Salud La Rinconada (Referencia a Hosp. II Juliaca)",
      nivel: "Nivel I-4",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { electrocardiograma: false, ecografia: false, radiografiaTorax: false, ucin: false },
      direccion: "La Rinconada, Ananea, Puno",
      contacto: "Sin teléfono directo",
    },
  ],
};

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
  if (nom.includes("clínica") || nom.includes("clinica")) {
    return "Privado";
  }
  return "MINSA / SIS";
}

/**
 * Obtiene la lista de hospitales de una ciudad por su id o coordenadas.
 * Si es una ubicación manual o por GPS, deduce la ciudad de referencia más cercana.
 * Cada hospital incluye su aseguradora (iafas).
 */
export function hospitalesDeCiudad(ciudadId, lat, lon) {
  let lista = [];
  if (ciudadId && ciudadId !== "manual" && HOSPITALES[ciudadId]) {
    lista = HOSPITALES[ciudadId];
  } else {
    const la = Number(lat);
    const lo = Number(lon);
    if (Number.isFinite(la) && Number.isFinite(lo)) {
      const deducido = deducirDesdeCoordenadas(la, lo);
      if (deducido?.id && HOSPITALES[deducido.id]) {
        lista = HOSPITALES[deducido.id];
      }
    }
  }

  return lista.map((h) => ({
    ...h,
    iafas: h.iafas || obtenerIafas(h),
  }));
}
