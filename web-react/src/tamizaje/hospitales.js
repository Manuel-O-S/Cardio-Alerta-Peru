/**
 * Hospitales por ciudad — datos hardcodeados.
 *
 * Cada ciudad del cat\u00E1logo de establecimientos tiene una lista de hospitales
 * con su informaci\u00F3n cl\u00EDnica: profesionales disponibles, ex\u00E1menes que ofrece,
 * direcci\u00F3n y contacto.
 *
 * Los ex\u00E1menes relevantes para cardiopat\u00EDas cong\u00E9nitas son:
 *   - Ecocardiograma: el est\u00E1ndar de oro para confirmar la cardiopat\u00EDa.
 *   - Ecograf\u00EDa: evaluaci\u00F3n complementaria general.
 *   - Examen tor\u00E1cico (Rx t\u00F3rax): radiograf\u00EDa de t\u00F3rax para evaluar silueta card\u00EDaca.
 *
 * COMO MIGRAR A BACKEND
 * Cuando haya un endpoint que devuelva esta informaci\u00F3n, basta con reemplazar
 * la constante HOSPITALES por una funci\u00F3n async que haga fetch y devuelva la
 * misma estructura. El componente TarjetaHospital no necesita cambiar.
 */

export const EXAMENES_LABELS = {
  ecocardiograma: "Ecocardiograma",
  ecografia: "Ecograf\u00EDa",
  examenToracico: "Examen tor\u00E1cico (Rx)",
};

export const HOSPITALES = {
  lima: [
    {
      id: "rebagliati",
      nombre: "Hospital Edgardo Rebagliati Martins",
      profesionales: { disponibles: 4, total: 4 },
      examenes: { ecocardiograma: true, ecografia: true, examenToracico: true },
      direccion: "Av. Edgardo Rebagliati 490, Jes\u00FAs Mar\u00EDa",
      contacto: "(01) 265-4901",
    },
    {
      id: "nino-brena",
      nombre: "Instituto Nacional de Salud del Ni\u00F1o \u2013 Bre\u00F1a",
      profesionales: { disponibles: 3, total: 4 },
      examenes: { ecocardiograma: true, ecografia: true, examenToracico: true },
      direccion: "Av. Brasil 600, Bre\u00F1a",
      contacto: "(01) 330-0066",
    },
    {
      id: "nino-sba",
      nombre: "Instituto Nacional de Salud del Ni\u00F1o \u2013 San Borja",
      profesionales: { disponibles: 5, total: 5 },
      examenes: { ecocardiograma: true, ecografia: true, examenToracico: true },
      direccion: "Av. Javier Prado Este 3101, San Borja",
      contacto: "(01) 708-0100",
    },
    {
      id: "loayza",
      nombre: "Hospital Nacional Arzobispo Loayza",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, examenToracico: true },
      direccion: "Av. Alfonso Ugarte 848, Cercado de Lima",
      contacto: "(01) 614-4646",
    },
  ],
  callao: [
    {
      id: "sabogal",
      nombre: "Hospital Alberto Sabogal Sologuren",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, examenToracico: true },
      direccion: "Jr. Colina 1081, Bellavista",
      contacto: "(01) 429-1454",
    },
    {
      id: "carrion-callao",
      nombre: "Hospital Daniel Alcides Carri\u00F3n",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: true },
      direccion: "Av. Guardia Chalaca 2176, Bellavista",
      contacto: "(01) 614-8585",
    },
  ],
  trujillo: [
    {
      id: "lazarte",
      nombre: "Hospital V\u00EDctor Lazarte Echegaray",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, examenToracico: true },
      direccion: "Av. Uni\u00F3n 759, Trujillo",
      contacto: "(044) 23-4641",
    },
    {
      id: "belen-trujillo",
      nombre: "Hospital Bel\u00E9n de Trujillo",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: true },
      direccion: "Jr. Bol\u00EDvar 350, Trujillo",
      contacto: "(044) 24-5281",
    },
    {
      id: "regional-trujillo",
      nombre: "Hospital Regional Docente de Trujillo",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { ecocardiograma: true, ecografia: true, examenToracico: false },
      direccion: "Av. Mansiche 795, Trujillo",
      contacto: "(044) 23-1581",
    },
  ],
  iquitos: [
    {
      id: "regional-iquitos",
      nombre: "Hospital Regional de Loreto",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: true },
      direccion: "Av. 28 de Julio s/n, Punchana",
      contacto: "(065) 25-2004",
    },
    {
      id: "essalud-iquitos",
      nombre: "Hospital III Iquitos \u2013 EsSalud",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: true },
      direccion: "Av. Grau 670, Iquitos",
      contacto: "(065) 26-4363",
    },
  ],
  arequipa: [
    {
      id: "honorio-delgado",
      nombre: "Hospital Regional Honorio Delgado Espinoza",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, examenToracico: true },
      direccion: "Av. Daniel Alcides Carri\u00F3n 505, Arequipa",
      contacto: "(054) 23-1818",
    },
    {
      id: "essalud-arequipa",
      nombre: "Hospital Nacional Carlos Alberto Segu\u00EDn Escobedo",
      profesionales: { disponibles: 3, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, examenToracico: true },
      direccion: "Esquina Peral y Filtro, Arequipa",
      contacto: "(054) 23-6420",
    },
    {
      id: "goyeneche",
      nombre: "Hospital III Goyeneche",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: true },
      direccion: "Av. Goyeneche s/n, Arequipa",
      contacto: "(054) 23-3812",
    },
  ],
  cajamarca: [
    {
      id: "regional-cajamarca",
      nombre: "Hospital Regional Docente de Cajamarca",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: true },
      direccion: "Av. Larry Jhonson s/n, Cajamarca",
      contacto: "(076) 36-2038",
    },
    {
      id: "essalud-cajamarca",
      nombre: "Hospital II Cajamarca \u2013 EsSalud",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: true },
      direccion: "Jr. Mario Urteaga 963, Cajamarca",
      contacto: "(076) 36-1991",
    },
  ],
  huaraz: [
    {
      id: "llanchipal",
      nombre: "Hospital V\u00EDctor Ramos Guardia",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: true },
      direccion: "Av. Luzuriaga s/n, Huaraz",
      contacto: "(043) 42-1861",
    },
    {
      id: "essalud-huaraz",
      nombre: "Hospital II Huaraz \u2013 EsSalud",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: false },
      direccion: "Jr. Amadeo Figueroa 957, Huaraz",
      contacto: "(043) 42-6540",
    },
  ],
  huancayo: [
    {
      id: "carrion-huancayo",
      nombre: "Hospital Regional Docente Cl\u00EDnico Quir\u00FArgico Daniel Alcides Carri\u00F3n",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: true, ecografia: true, examenToracico: true },
      direccion: "Av. Daniel Alcides Carri\u00F3n 1551, Huancayo",
      contacto: "(064) 22-3751",
    },
    {
      id: "essalud-huancayo",
      nombre: "Hospital Ramiro Priale Priale \u2013 EsSalud",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { ecocardiograma: true, ecografia: true, examenToracico: true },
      direccion: "Av. Independencia 266, El Tambo",
      contacto: "(064) 24-8025",
    },
  ],
  cusco: [
    {
      id: "regional-cusco",
      nombre: "Hospital Regional del Cusco",
      profesionales: { disponibles: 2, total: 3 },
      examenes: { ecocardiograma: true, ecografia: true, examenToracico: true },
      direccion: "Av. de la Cultura s/n, Cusco",
      contacto: "(084) 22-7661",
    },
    {
      id: "lorena",
      nombre: "Hospital Antonio Lorena",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: true },
      direccion: "Plazoleta Belén 1358, Cusco",
      contacto: "(084) 22-6511",
    },
    {
      id: "essalud-cusco",
      nombre: "Hospital Nacional Adolfo Guevara Velasco \u2013 EsSalud",
      profesionales: { disponibles: 2, total: 2 },
      examenes: { ecocardiograma: true, ecografia: true, examenToracico: true },
      direccion: "Av. Anselmo \u00C1lvarez s/n, Cusco",
      contacto: "(084) 23-1131",
    },
  ],
  juliaca: [
    {
      id: "carlos-monge",
      nombre: "Hospital Carlos Monge Medrano",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: true },
      direccion: "Av. Huancan\u00E9 s/n, Juliaca",
      contacto: "(051) 32-1901",
    },
    {
      id: "essalud-juliaca",
      nombre: "Hospital III Juliaca \u2013 EsSalud",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: true },
      direccion: "Jr. Jos\u00E9 Santos Chocano 335, Juliaca",
      contacto: "(051) 32-1680",
    },
  ],
  puno: [
    {
      id: "regional-puno",
      nombre: "Hospital Regional Manuel N\u00FA\u00F1ez Butr\u00F3n",
      profesionales: { disponibles: 1, total: 2 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: true },
      direccion: "Av. El Sol 1022, Puno",
      contacto: "(051) 36-9696",
    },
    {
      id: "essalud-puno",
      nombre: "Hospital III Puno \u2013 EsSalud",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: false },
      direccion: "Jr. Ricardo Palma 225, Puno",
      contacto: "(051) 36-8072",
    },
  ],
  pasco: [
    {
      id: "carrion-pasco",
      nombre: "Hospital Daniel Alcides Carri\u00F3n \u2013 Pasco",
      profesionales: { disponibles: 1, total: 1 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: true },
      direccion: "Av. Los Incas s/n, Cerro de Pasco",
      contacto: "(063) 42-2674",
    },
    {
      id: "essalud-pasco",
      nombre: "Hospital II Pasco \u2013 EsSalud",
      profesionales: { disponibles: 0, total: 1 },
      examenes: { ecocardiograma: false, ecografia: true, examenToracico: false },
      direccion: "Jr. Constituci\u00F3n 269, Cerro de Pasco",
      contacto: "(063) 42-3250",
    },
  ],
  rinconada: [
    {
      id: "centro-rinconada",
      nombre: "Centro de Salud La Rinconada",
      profesionales: { disponibles: 0, total: 0 },
      examenes: { ecocardiograma: false, ecografia: false, examenToracico: false },
      direccion: "La Rinconada, Ananea, Puno",
      contacto: "Sin tel\u00E9fono directo",
    },
  ],
};

/**
 * Obtiene la lista de hospitales de una ciudad por su id.
 * Devuelve un array vac\u00EDo si no hay hospitales registrados.
 */
export function hospitalesDeCiudad(ciudadId) {
  return HOSPITALES[ciudadId] || [];
}
