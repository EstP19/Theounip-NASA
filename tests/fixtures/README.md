# Recortes SoilGrids para pruebas

Fuente: SoilGrids 2.0, ISRIC World Soil Information, licencia CC BY 4.0.
Acceso: https://docs.isric.org/globaldata/soilgrids/wcs.html.
Descargados el 5 de noviembre de 2026 (UTC; 4 de noviembre en Colombia).

Son recortes numéricos WCS 1.0.0, EPSG:4326, 101 × 101 píxeles, BBOX ±0.005° del punto. Solo se lee el píxel central, sin buscar vecinos. La cuadrícula nativa del producto tiene 250 m; el recorte reproyectado no mejora esa resolución.

- `soil-ph-villagarzon.tif`: `phh2o_5-15cm_mean`, latitud 1.018051, longitud -76.61286. Valor central bruto: 54; pH: 5.4.
- `soil-soc-villagarzon.tif`: `soc_5-15cm_mean`, mismo punto. Valor bruto: 1114 dg/kg; 111.4 g/kg de carbono orgánico.
- `soil-ph-no-data.tif`: `phh2o_5-15cm_mean`, latitud 0.343, longitud -76.91. Centro NoData (-32768), aunque existen vecinos con datos.

Estos puntos sirven para verificar el conector, no representan una finca medida ni un diagnóstico de laboratorio.
