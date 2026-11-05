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
    detail:
      "La guía describe inspección y recolección semanal de frutos enfermos, regulación de sombrío, ventilación y drenaje. Los datos ambientales no diagnostican moniliasis.",
    url: "https://www.ica.gov.co/getattachment/56449f50-f3fa-4254-a410-3153a872e8bb/Manejo-fitosanitario-del-cultivo-del-cacao.pdf",
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
