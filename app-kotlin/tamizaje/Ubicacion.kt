package pe.cardioalerta.tamizaje

/**
 * Ubicacion del establecimiento: altitud y coordenadas.
 *
 * POR QUE ESTAN JUNTAS
 * La altitud decide que umbral de saturacion se le aplica al recien nacido; las
 * coordenadas deciden a que hospital se lo deriva. Si se configuran por
 * separado, se puede acabar tamizando con la banda de Juliaca y derivando desde
 * Lima. Un establecimiento define ambas o no define ninguna.
 *
 * SE CONFIGURA UNA VEZ POR DISPOSITIVO
 * No es un dato del paciente. En Android conviene guardarlo en DataStore o
 * SharedPreferences y leerlo al abrir, igual que hace la web.
 *
 * Kotlin puro: sin dependencias de Android, para que se pueda probar en JVM.
 * Espejo de compartido/establecimientos.json.
 */
object Ubicacion {

    data class Establecimiento(
        val id: String,
        val nombre: String,
        val departamento: String,
        val altitudMsnm: Int,
        val lat: Double,
        val lon: Double,
    )

    data class UbicacionActual(
        val id: String,
        val nombre: String,
        val altitudMsnm: Int,
        val lat: Double,
        val lon: Double,
        /** True si la escribio una persona. La interfaz debe advertirlo: la altitud define el umbral. */
        val manual: Boolean = false,
    )

    /**
     * Coordenadas del centro de la ciudad, no del establecimiento exacto.
     * Sirven para ordenar hospitales por cercania, que es su unico uso.
     */
    val ESTABLECIMIENTOS = listOf(
        Establecimiento("lima",      "Lima",           "Lima",        150,  -12.0464, -77.0428),
        Establecimiento("callao",    "Callao",         "Callao",      150,  -12.0508, -77.1268),
        Establecimiento("trujillo",  "Trujillo",       "La Libertad", 34,    -8.1116, -79.0288),
        Establecimiento("iquitos",   "Iquitos",        "Loreto",      106,   -3.7437, -73.2516),
        Establecimiento("arequipa",  "Arequipa",       "Arequipa",    2335, -16.4090, -71.5375),
        Establecimiento("cajamarca", "Cajamarca",      "Cajamarca",   2750,  -7.1617, -78.5127),
        Establecimiento("huaraz",    "Huaraz",         "Ancash",      3052,  -9.5278, -77.5278),
        Establecimiento("huancayo",  "Huancayo",       "Junin",       3249, -12.0653, -75.2049),
        Establecimiento("cusco",     "Cusco",          "Cusco",       3399, -13.5320, -71.9675),
        Establecimiento("juliaca",   "Juliaca",        "Puno",        3825, -15.4990, -70.1338),
        Establecimiento("puno",      "Puno",           "Puno",        3827, -15.8402, -70.0219),
        Establecimiento("pasco",     "Cerro de Pasco", "Pasco",       4330, -10.6828, -76.2561),
        Establecimiento("rinconada", "La Rinconada",   "Puno",        5100, -14.6280, -69.4450),
    )

    val POR_DEFECTO = UbicacionActual("lima", "Lima", 150, -12.0464, -77.0428)

    /**
     * Limites del territorio peruano, con margen. No es validacion geografica
     * estricta: evita el error de tipeo que pone el signo al reves, que es el
     * mas comun al escribir coordenadas a mano.
     */
    private val LAT_RANGO = -18.5..0.5
    private val LON_RANGO = -81.5..-68.5

    /** Devuelve los errores por campo. Vacio si las coordenadas son plausibles. */
    fun validarCoordenadas(lat: Double?, lon: Double?): Map<String, String> {
        val errores = mutableMapOf<String, String>()
        if (lat == null) {
            errores["lat"] = "Falta la latitud."
        } else if (lat !in LAT_RANGO) {
            errores["lat"] = "Fuera del Peru (${LAT_RANGO.start} a ${LAT_RANGO.endInclusive}). " +
                "En el Peru la latitud es negativa."
        }
        if (lon == null) {
            errores["lon"] = "Falta la longitud."
        } else if (lon !in LON_RANGO) {
            errores["lon"] = "Fuera del Peru (${LON_RANGO.start} a ${LON_RANGO.endInclusive}). " +
                "En el Peru la longitud es negativa."
        }
        return errores
    }

    fun validarAltitud(altitudMsnm: Int?): String? = when {
        altitudMsnm == null -> "Falta la altitud."
        altitudMsnm !in 0..5100 -> "Debe estar entre 0 y 5100 msnm."
        else -> null
    }

    fun deEstablecimiento(id: String): UbicacionActual? =
        ESTABLECIMIENTOS.firstOrNull { it.id == id }?.let {
            UbicacionActual(it.id, it.nombre, it.altitudMsnm, it.lat, it.lon, manual = false)
        }

    fun manual(nombre: String?, altitudMsnm: Int, lat: Double, lon: Double) = UbicacionActual(
        id = "manual",
        nombre = nombre?.trim()?.takeIf { it.isNotEmpty() } ?: "Ubicacion manual",
        altitudMsnm = altitudMsnm,
        lat = lat,
        lon = lon,
        manual = true,
    )
}
