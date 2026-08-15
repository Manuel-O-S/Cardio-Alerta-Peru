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
  lima: [
    {
      id: "rebagliati",
      nombre: "Hospital Edgardo Rebagliati Martins",
      profesionales: { disponibles: 4, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Edgardo Rebagliati 490, Jesús María",
      contacto: "(01) 265-4901",
    },
    {
      id: "nino-brena",
      nombre: "Instituto Nacional de Salud del Niño – Breña",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Brasil 600, Breña",
      contacto: "(01) 330-0066",
    },
    {
      id: "nino-sba",
      nombre: "Instituto Nacional de Salud del Niño – San Borja",
      profesionales: { disponibles: 5, total: 5 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Javier Prado Este 3101, San Borja",
      contacto: "(01) 708-0100",
    },
    {
      id: "loayza",
      nombre: "Hospital Nacional Arzobispo Loayza",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Alfonso Ugarte 848, Cercado de Lima",
      contacto: "(01) 614-4646",
    },
  ],
  callao: [
    {
      id: "sabogal",
      nombre: "Hospital Alberto Sabogal Sologuren",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Jr. Colina 1081, Bellavista",
      contacto: "(01) 429-1454",
    },
    {
      id: "carrion-callao",
      nombre: "Hospital Daniel Alcides Carrión",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Guardia Chalaca 2176, Bellavista",
      contacto: "(01) 614-8585",
    },
  ],
  trujillo: [
    {
      id: "lazarte",
      nombre: "Hospital Víctor Lazarte Echegaray",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Unión 759, Trujillo",
      contacto: "(044) 23-4641",
    },
    {
      id: "belen-trujillo",
      nombre: "Hospital Belén de Trujillo",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Jr. Bolívar 350, Trujillo",
      contacto: "(044) 24-5281",
    },
    {
      id: "regional-trujillo",
      nombre: "Hospital Regional Docente de Trujillo",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Mansiche 795, Trujillo",
      contacto: "(044) 23-1581",
    },
  ],
  iquitos: [
    {
      id: "regional-iquitos",
      nombre: "Hospital Regional de Loreto",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. 28 de Julio s/n, Punchana",
      contacto: "(065) 25-2004",
    },
    {
      id: "essalud-iquitos",
      nombre: "Hospital III Iquitos – EsSalud",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Av. Grau 670, Iquitos",
      contacto: "(065) 26-4363",
    },
  ],
  arequipa: [
    {
      id: "honorio-delgado",
      nombre: "Hospital Regional Honorio Delgado Espinoza",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Daniel Alcides Carrión 505, Arequipa",
      contacto: "(054) 23-1818",
    },
    {
      id: "essalud-arequipa",
      nombre: "Hospital Nacional Carlos Alberto Seguín Escobedo",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Esquina Peral y Filtro, Arequipa",
      contacto: "(054) 23-6420",
    },
    {
      id: "goyeneche",
      nombre: "Hospital III Goyeneche",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Av. Goyeneche s/n, Arequipa",
      contacto: "(054) 23-3812",
    },
  ],
  cajamarca: [
    {
      id: "regional-cajamarca",
      nombre: "Hospital Regional Docente de Cajamarca",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Larry Jhonson s/n, Cajamarca",
      contacto: "(076) 36-2038",
    },
    {
      id: "essalud-cajamarca",
      nombre: "Hospital II Cajamarca – EsSalud",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Jr. Mario Urteaga 963, Cajamarca",
      contacto: "(076) 36-1991",
    },
  ],
  huaraz: [
    {
      id: "llanchipal",
      nombre: "Hospital Víctor Ramos Guardia",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Av. Luzuriaga s/n, Huaraz",
      contacto: "(043) 42-1861",
    },
    {
      id: "essalud-huaraz",
      nombre: "Hospital II Huaraz – EsSalud",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: false, ucin: false },
      direccion: "Jr. Amadeo Figueroa 957, Huaraz",
      contacto: "(043) 42-6540",
    },
  ],
  huancayo: [
    {
      id: "carrion-huancayo",
      nombre: "Hospital Regional Docente Clínico Quirúrgico Daniel Alcides Carrión",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Daniel Alcides Carrión 1551, Huancayo",
      contacto: "(064) 22-3751",
    },
    {
      id: "essalud-huancayo",
      nombre: "Hospital Ramiro Priale Priale – EsSalud",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Independencia 266, El Tambo",
      contacto: "(064) 24-8025",
    },
  ],
  cusco: [
    {
      id: "regional-cusco",
      nombre: "Hospital Regional del Cusco",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. de la Cultura s/n, Cusco",
      contacto: "(084) 22-7661",
    },
    {
      id: "lorena",
      nombre: "Hospital Antonio Lorena",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Plazoleta Belén 1358, Cusco",
      contacto: "(084) 22-6511",
    },
    {
      id: "essalud-cusco",
      nombre: "Hospital Nacional Adolfo Guevara Velasco – EsSalud",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: true },
      direccion: "Av. Anselmo Álvarez s/n, Cusco",
      contacto: "(084) 23-1131",
    },
  ],
  juliaca: [
    {
      id: "carlos-monge",
      nombre: "Hospital Carlos Monge Medrano",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Av. Huancané s/n, Juliaca",
      contacto: "(051) 32-1901",
    },
    {
      id: "essalud-juliaca",
      nombre: "Hospital III Juliaca – EsSalud",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Jr. José Santos Chocano 335, Juliaca",
      contacto: "(051) 32-1680",
    },
  ],
  puno: [
    {
      id: "regional-puno",
      nombre: "Hospital Regional Manuel Núñez Butrón",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Av. El Sol 1022, Puno",
      contacto: "(051) 36-9696",
    },
    {
      id: "essalud-puno",
      nombre: "Hospital III Puno – EsSalud",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: false, ucin: false },
      direccion: "Jr. Ricardo Palma 225, Puno",
      contacto: "(051) 36-8072",
    },
  ],
  pasco: [
    {
      id: "carrion-pasco",
      nombre: "Hospital Daniel Alcides Carrión – Pasco",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: true, ucin: false },
      direccion: "Av. Los Incas s/n, Cerro de Pasco",
      contacto: "(063) 42-2674",
    },
    {
      id: "essalud-pasco",
      nombre: "Hospital II Pasco – EsSalud",
      profesionales: { disponibles: 0, total: 1 },
      examenes: { electrocardiograma: true, ecografia: true, radiografiaTorax: false, ucin: false },
      direccion: "Jr. Constitución 269, Cerro de Pasco",
      contacto: "(063) 42-3250",
    },
  ],
  rinconada: [
    {
      id: "centro-rinconada",
      nombre: "Centro de Salud La Rinconada",
      profesionales: { disponibles: 0, total: 0 },
      examenes: { electrocardiograma: false, ecografia: false, radiografiaTorax: false, ucin: false },
      direccion: "La Rinconada, Ananea, Puno",
      contacto: "Sin teléfono directo",
    },
  ],
};

/**
 * Obtiene la lista de hospitales de una ciudad por su id o coordenadas.
 * Si es una ubicación manual o por GPS, deduce la ciudad de referencia más cercana.
 */
export function hospitalesDeCiudad(ciudadId, lat, lon) {
  if (ciudadId && ciudadId !== "manual" && HOSPITALES[ciudadId]) {
    return HOSPITALES[ciudadId];
  }
  const la = Number(lat);
  const lo = Number(lon);
  if (Number.isFinite(la) && Number.isFinite(lo)) {
    const deducido = deducirDesdeCoordenadas(la, lo);
    if (deducido?.id && HOSPITALES[deducido.id]) {
      return HOSPITALES[deducido.id];
    }
  }
  return [];
}
