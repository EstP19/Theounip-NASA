export const SPACE_APPS_CHALLENGE =
  "https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/?tab=resources";

export const GIBS_WMS = "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi";

type MapLayer = {
  id: string;
  title: string;
  period: string;
  date?: string;
  legend?: string;
  maxNativeZoom?: number;
  detail: string;
  colors: string;
};

const NDVI_COLORS =
  "Los tonos claros y cafés indican poco verdor. Los verdes, especialmente los más oscuros, indican más verdor. Una zona verde puede incluir cacao, árboles de sombra u otra vegetación.";

// Periodos con imágenes verificadas en el entorno de San Miguel.
export const NASA_MAP_LAYERS: readonly MapLayer[] = [
  {
    id: "IMERG_Precipitation_Rate",
    title: "Lluvia · GPM IMERG",
    date: "2026-11-11",
    period: "11 nov 2026",
    legend: "GPM_Precipitation_Rate_H.png",
    detail:
      "Intensidad estimada de lluvia en mm/h. El mapa muestra un día, y el gráfico usa acumulados de NASA POWER.",
    colors:
      "En la escala de lluvia, verde indica menor intensidad, amarillo y naranja indican más lluvia, y rojo oscuro indica la mayor intensidad. El gris claro marca lluvia muy débil y el gris oscuro marca zonas sin datos.",
  },
  {
    id: "SMAP_L4_Analyzed_Root_Zone_Soil_Moisture",
    title: "Humedad en las raíces · SMAP",
    date: "2026-11-10",
    period: "10 nov 2026",
    legend: "SMAP_Analyzed_Soil_Moisture_H.png",
    detail:
      "Estimación regional de agua en el suelo hasta 1 m de profundidad, en una cuadrícula de unos 9 km.",
    colors:
      "Naranja y amarillo indican menos humedad. El verde representa niveles intermedios. Celeste y azul indican más humedad. Usa los números de la escala para distinguir valores cercanos.",
  },
  {
    id: "MODIS_Terra_L3_NDVI_Monthly",
    title: "Verdor · MODIS Terra",
    date: "2026-10-01",
    period: "oct 2026",
    legend: "MODIS_L3_NDVI_H.png",
    detail: "El índice de vegetación (NDVI) ayuda a distinguir áreas con más o menos verdor.",
    colors: NDVI_COLORS,
  },
  {
    id: "VIIRS_SNPP_L3_NDVI_Monthly",
    title: "Verdor · VIIRS",
    date: "2026-10-01",
    period: "oct 2026",
    legend: "MODIS_L3_NDVI_H.png",
    detail: "Otra vista mensual del verdor de la zona para comparar patrones regionales.",
    colors: NDVI_COLORS,
  },
  {
    id: "HLS_S30_Nadir_BRDF_Adjusted_Reflectance",
    title: "Imagen satelital · Sentinel-2 / HLS",
    date: "2026-11-05",
    period: "5 nov 2026",
    maxNativeZoom: 12,
    detail: "Imagen de un paso del satélite. Puede haber nubes o sectores sin imagen ese día.",
    colors:
      "La imagen usa colores parecidos a los de una fotografía. El verde suele ser vegetación, los tonos cafés pueden ser suelo expuesto y las manchas blancas pueden ser nubes.",
  },
  {
    id: "GLDAS_Underground_Soil_Moisture_Monthly",
    title: "Humedad del suelo · GLDAS",
    date: "2026-06-01",
    period: "jun 2026",
    legend: "GLDAS_Underground_Soil_Moisture_Monthly_H.png",
    detail:
      "Estimación mensual de humedad del suelo entre 0 y 10 cm, en una cuadrícula de unos 28 km.",
    colors:
      "Rojos y naranjas indican menos agua en la capa superficial, amarillos y verdes indican niveles intermedios, y azules o morados indican valores más altos. La escala expresa kilogramos de agua por metro cuadrado.",
  },
  {
    id: "SRTM_Color_Index",
    title: "Relieve · SRTM",
    period: "levantamiento de 2000",
    maxNativeZoom: 11,
    legend: "SRTM_Color_Index_H.png",
    detail: "Altitud en metros para reconocer valles y laderas.",
    colors:
      "Los verdes indican terrenos más bajos. Los amarillos y cafés representan terrenos más altos. Los grises y blancos corresponden a las mayores altitudes de la escala.",
  },
  {
    id: "GEDI_ISS_L3_Canopy_Height_Mean_RH100_201904-202303",
    title: "Altura del dosel · GEDI",
    period: "abr 2019–mar 2023",
    legend: "GEDI_RH100_Mean_Color_Index_H.png",
    detail:
      "Altura estimada de la vegetación a partir de un conjunto histórico de mediciones láser.",
    colors:
      "Los grises claros y verdes claros indican vegetación más baja. Los verdes oscuros indican vegetación más alta. La escala muestra la altura en metros.",
  },
];

type ChallengeResource = {
  name: string;
  url: string;
  usage: string;
};

export const CHALLENGE_RESOURCES: readonly ChallengeResource[] = [
  {
    name: "NASA POWER",
    url: "https://power.larc.nasa.gov/",
    usage: "En el gráfico y el plan · Serie diaria de 2026 para el punto elegido.",
  },
  {
    name: "GPM / IMERG",
    url: "https://gpm.nasa.gov/data",
    usage: "En el mapa · Intensidad de lluvia de noviembre de 2026.",
  },
  {
    name: "SMAP",
    url: "https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap",
    usage: "En el mapa · Humedad en la zona de raíces en noviembre de 2026.",
  },
  {
    name: "MODIS / LP DAAC",
    url: "https://www.earthdata.nasa.gov/centers/lp-daac",
    usage: "En el mapa · Índice de verdor de octubre de 2026.",
  },
  {
    name: "VIIRS / Earthdata Search",
    url: "https://search.earthdata.nasa.gov/search?q=VIIRS",
    usage: "En el mapa · Índice de verdor de octubre de 2026.",
  },
  {
    name: "SRTM",
    url: "https://www.earthdata.nasa.gov/data/instruments/srtm",
    usage: "En el mapa · Altitud del levantamiento de 2000.",
  },
  {
    name: "NLDAS / GLDAS",
    url: "https://www.earthdata.nasa.gov/",
    usage: "GLDAS en el mapa · Humedad del suelo de junio de 2026. NLDAS cubre Norteamérica.",
  },
  {
    name: "GEDI",
    url: "https://gedi.umd.edu/data-collection-started/",
    usage: "En el mapa · Altura del dosel del periodo 2019–2023.",
  },
  {
    name: "Sentinel-2 / Copernicus Data Space",
    url: "https://dataspace.copernicus.eu/",
    usage: "En el mapa · Imagen de noviembre de 2026 por el producto armonizado HLS.",
  },
  {
    name: "Landsat / EarthExplorer",
    url: "https://earthexplorer.usgs.gov/",
    usage:
      "Catálogo de escenas. La cobertura local depende de la fecha y la selección de una escena.",
  },
  {
    name: "ECOSTRESS",
    url: "https://ecostress.jpl.nasa.gov/data",
    usage:
      "Earthdata lista una escena de temperatura superficial del 10 de noviembre de 2026 sobre San Miguel. La descarga y la revisión de la calidad del píxel están pendientes.",
  },
  {
    name: "ERA5 / ECMWF",
    url: "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview",
    usage:
      "Reanálisis global para contrastar el clima. Su descarga programática usa una cuenta y la licencia del servicio.",
  },
  {
    name: "FAO GAEZ",
    url: "https://gaez.fao.org/",
    usage:
      "Capas globales de aptitud agroecológica para consultar los periodos de referencia de cada producto.",
  },
  {
    name: "USDA Ag Data Commons",
    url: "https://www.nal.usda.gov/services/agdatacommons",
    usage: "Catálogo de estudios. La cobertura geográfica y temporal depende de cada estudio.",
  },
  {
    name: "USDA Web Soil Survey",
    url: "https://websoilsurvey.nrcs.usda.gov/app/",
    usage: "Mapas y propiedades del suelo de Estados Unidos.",
  },
  {
    name: "USDA Cropland Data Layer / CropScape",
    url: "https://www.nass.usda.gov/Research_and_Science/Cropland/sarsfaqs2.php",
    usage: "Clasificación anual de cultivos de Estados Unidos.",
  },
  {
    name: "PRISM Climate Data",
    url: "https://prism.oregonstate.edu/",
    usage: "Datos climáticos de Estados Unidos.",
  },
  {
    name: "USDA SSURGO / STATSGO2",
    url: "https://www.nrcs.usda.gov/resources/data-and-reports/soils",
    usage: "Inventarios de suelos de Estados Unidos.",
  },
  {
    name: "USDA National Agriculture Imagery Program",
    url: "https://naip-usdaonline.hub.arcgis.com/",
    usage: "Imágenes aéreas de Estados Unidos.",
  },
  {
    name: "USGS National Land Cover Database",
    url: "https://www.usgs.gov/centers/eros/science/annual-nlcd-data-access",
    usage: "Series de cobertura terrestre de Estados Unidos.",
  },
  {
    name: "CoCoRaHS",
    url: "https://www.cocorahs.org/Maps/",
    usage: "Red comunitaria de observaciones de precipitación en Norteamérica y el Caribe.",
  },
  {
    name: "USGS National Water Information System",
    url: "https://www.usgs.gov/tools/water-data-nation-wdfn",
    usage: "Registros hidrológicos de Estados Unidos.",
  },
  {
    name: "USDA AMS Market News",
    url: "https://www.ams.usda.gov/market-news",
    usage: "Reportes de mercados de Estados Unidos y comercio. Sirve como referencia comercial.",
  },
  {
    name: "USDA NASS QuickStats",
    url: "https://quickstats.nass.usda.gov/",
    usage: "Estadísticas agrícolas de Estados Unidos.",
  },
  {
    name: "OpenET",
    url: "https://etdata.org/",
    usage: "El producto citado en el reto cubre el oeste de Estados Unidos.",
  },
  {
    name: "USFS LANDFIRE",
    url: "https://landfire.gov/",
    usage: "Mapas de vegetación y combustibles de Estados Unidos.",
  },
];
