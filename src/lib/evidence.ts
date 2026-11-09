import type { Evidence, Species } from "./types.ts";

export const EVIDENCE: Evidence[] = [
  {
    id: "wcs",
    title: "Sistemas agroforestales de cacao",
    organization: "WCS Colombia · 2022",
    detail:
      "Planificación predial y secuencias de establecimiento para la Amazonía colombiana, con participación de asociaciones de Putumayo. Las prácticas se adaptan al predio.",
    url: "https://colombia.wcs.org/Portals/113/Publicaciones%20y%20libros/Lineamientos%20para%20establecimiento%20de%20Sistemas%20Agroforestales%20de%20cacao_2022.pdf",
  },
  {
    id: "ica",
    title: "Manejo fitosanitario del cacao",
    organization: "Instituto Colombiano Agropecuario",
    section: "Páginas impresas 6–12 y 25–27",
    detail:
      "La guía describe inspección y recolección semanal de frutos enfermos, regulación de sombrío, ventilación y drenaje. Los datos ambientales no diagnostican moniliasis.",
    url: "https://www.ica.gov.co/getattachment/56449f50-f3fa-4254-a410-3153a872e8bb/Manejo-fitosanitario-del-cultivo-del-cacao.pdf",
  },
  {
    id: "icco",
    title: "Guía global para los sistemas de cultivo de cacao",
    organization: "Daymond y colaboradores · University of Reading · 2022",
    section: "Páginas impresas 10–11, manejo de sombra, suelo y agua",
    detail:
      "Resume beneficios y límites del sombrío y explica por qué conviene revisar la distribución de las lluvias y adaptar la fertilización al suelo local.",
    url: "https://www.icco.org/wp-content/uploads/B27407-Cocoa-Grower-Guide-Spanish-CFW-v7-interactive.pdf#page=6",
  },
  {
    id: "fedecacao-poda",
    title: "Poda y manejo de luz en el cultivo de cacao y otros frutales",
    organization: "Fedecacao · Fondo Nacional del Cacao · 2019",
    section: "Páginas impresas 11–12 y 20–25, tipos de poda",
    detail:
      "Distingue la formación del cacao joven, el mantenimiento en producción y el ajuste de las copas de los árboles de sombra según la luz de la finca.",
    url: "https://nvfdhqlkqowvedolvsvw.supabase.co/storage/v1/object/public/Informacion%20Publica/documentos%20tecnicos/Libro%20Manejo%20luz%20cultivo%20cacao.pdf#page=13",
  },
  {
    id: "inia-suelos",
    title:
      "Interpretación de análisis de suelos, cálculos de encalado y fertilización para los cultivos de café y cacao",
    organization: "Noelito Salgado Veramendi y Elvis Ottos Diaz · INIA Perú · 2025",
    section: "Páginas 40–44 y capítulos 8–10, muestreo, análisis y cálculos para cacao",
    detail:
      "Explica cómo tomar y etiquetar muestras y cómo interpretar el informe. Los cálculos de encalado y fertilización usan parámetros del laboratorio, del cultivo y del producto. Sus ejemplos se desarrollaron para Perú.",
    url: "https://repositorio.inia.gob.pe/items/23143ee9-b964-4d9f-ac33-21f83f832384",
  },
  {
    id: "cosecha",
    title: "Cosecha, beneficio y calidad del grano de cacao",
    organization: "Compañía Nacional de Chocolates · 2019",
    section: "Páginas 9–10, 19–22 y 24–26, recolección, beneficio y almacenamiento",
    detail:
      "Orienta la selección de mazorcas maduras, el seguimiento de la fermentación, el secado uniforme y la protección del grano durante el almacenamiento.",
    url: "https://repository.agrosavia.co/server/api/core/bitstreams/0574b597-1adc-4e02-8cd8-8a9b65b82b43/content#page=9",
  },
  {
    id: "trazabilidad",
    title: "Prácticas de trazabilidad y cero deforestación en cacao",
    organization: "Compañía Nacional de Chocolates · 2025",
    section: "Páginas 30–33, ubicación de parcelas y registros de labores y ventas",
    detail:
      "Propone documentar el origen del cacao y mantener registros por lote de las labores, la cosecha, la poscosecha y la venta.",
    url: "https://www.mundocacao.com.co/noticias/i/91034386/nueva-cartilla-de-practicas-de-trazabilidad-y-cero-deforestacion-en-cacao",
  },
  {
    id: "inga",
    title: "Protocolo del guamo Inga edulis",
    organization: "CORPOAMAZONIA · 2025",
    detail:
      "Respaldo territorial de la especie y sus usos regionales. Su incorporación como sombrío requiere revisar sitio, densidad y manejo; no aporta un coeficiente de mejora del suelo.",
    url: "https://api.corpoamazonia.gov.co/images/catalogue/1972/Protocolo_11c7.pdf",
  },
  {
    id: "ant",
    title: "Suelo y manejo en Villagarzón",
    organization: "Agencia Nacional de Tierras",
    detail:
      "Las recomendaciones de enmiendas y fertilización se basan en análisis de suelo. El pH por sí solo no determina una dosis de dolomita.",
    url: "https://geoportal.ant.gov.co/Planes-UAF/86885_VILLAGARZON_PUBLICACION/86885_Villagarzon_Putumayo/DTC%20Villagarz%C3%B3n%20-%20Putumayo%20-%20CB.pdf",
  },
  {
    id: "soilgrids",
    title: "Propiedades y acceso a SoilGrids",
    organization: "ISRIC World Soil Information",
    detail:
      "Estimaciones a 250 m de pH y carbono orgánico para 5–15 cm, consultadas mediante WCS numérico. Se muestran promedio y percentiles 5 y 95 cuando existen. El carbono no se convierte a materia orgánica y el análisis local tiene prioridad. CC BY 4.0.",
    url: "https://docs.isric.org/globaldata/soilgrids/",
  },
  {
    id: "power",
    title: "Datos meteorológicos NASA POWER",
    organization: "NASA Langley Research Center",
    detail:
      "T2M, RH2M y PRECTOTCORR describen contexto regional derivado de reanálisis. Una serie anual histórica no es un pronóstico ni una medición bajo el dosel del cacao.",
    url: "https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/",
  },
];

export const SPECIES: {
  id: Species;
  name: string;
  scientific: string;
  kind: string;
  status: string;
}[] = [
  {
    id: "inga",
    name: "Guamo",
    scientific: "Inga edulis",
    kind: "Sombra permanente",
    status: "Referencia regional",
  },
  {
    id: "erythrina",
    name: "Búcaro",
    scientific: "Erythrina spp.",
    kind: "Sombra",
    status: "Validar adaptación",
  },
  {
    id: "canavalia",
    name: "Canavalia",
    scientific: "Canavalia ensiformis",
    kind: "Cobertura",
    status: "Validar adaptación",
  },
  {
    id: "centrosema",
    name: "Centrosema",
    scientific: "Centrosema spp.",
    kind: "Cobertura",
    status: "Validar adaptación",
  },
];
