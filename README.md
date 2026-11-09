# Theounip-NASA

**SueloVivo Putumayo** — demo de chagra agroforestal satelital para cacao.

Explorador de manejo agroforestal del cacao. Next.js App Router, React, TypeScript y Leaflet 1.9.4, en un único proyecto sin login ni base de datos.

## Ejecutar

Requiere Node.js 24 o superior para ejecutar también las pruebas TypeScript con el runner nativo de Node. La aplicación Next.js requiere Node 20.9 como mínimo.

```powershell
cd C:\Users\USUARIO\Desktop\UNIPUTUMAYO\NASA\suelovivo
npm install
npm run dev
```

Abrir http://127.0.0.1:3000. No requiere API keys.

```powershell
npm run typecheck
npm test
npm run build
npm start
```

## Recorrido de prueba

La aplicación tiene cinco pantallas con direcciones propias. El layout compartido conserva los datos al avanzar, volver o usar el historial del navegador.

1. `/ubicacion` — Tu finca: mapa, ubicación del dispositivo y clima de la zona. Las coordenadas se muestran en una opción adicional.
2. `/parcela` — Tu cultivo: preguntas cotidianas y opciones aproximadas de sombra y cobertura. No lo sé conserva la información como desconocida; no se presenta un porcentaje como dato del usuario.
3. `/manejo` — El suelo: estimación de SoilGrids, análisis opcional y guía para preparar la muestra y leer el informe. Aquí se eligen plantas y tiempo del plan.
4. `/cuidados` — Cuidados: observaciones opcionales, guías de sanidad, sombra y cosecha y un formato descargable de registro por lote.
5. `/resultados` — Tu plan: comparar alternativas, volver a editar cualquier paso, guardar, descargar o imprimir.

El caso inicial de San Miguel es ilustrativo; su clima es una descarga real de NASA POWER para `0.343, -76.91`, año 2025. Un cambio de ubicación invalida ese contexto. Las respuestas se conservan automáticamente durante la sesión de esa pestaña, incluso al recargar. Al recuperar un punto propio se vuelve a consultar el clima; el guardado manual permite conservar un escenario para otra sesión.

Mi ubicación utiliza la geolocalización del navegador bajo HTTPS o localhost. El usuario autoriza su ubicación; si la deniega o está fuera de la zona piloto, puede continuar manualmente. La posición corresponde al dispositivo, no a los linderos de la finca.

## Datos y reglas

- `GET /api/context?lat=0.343&lon=-76.91&year=2025`: consulta T2M, RH2M y PRECTOTCORR de NASA POWER, con tiempo de espera de 25 segundos y caché de hasta 24 horas.
- Años disponibles: 2023, 2024 y 2025. La ventana geográfica limita la demo a Putumayo y su entorno; no es una delimitación administrativa.
- `mode=snapshot` solo admite el punto de respaldo y año 2025. No se reutilizan sus valores para otro punto.
- La lluvia diaria se suma por mes; temperatura y humedad se promedian sobre días válidos. Se conservan contadores de cobertura. Un acumulado de lluvia incompleto se muestra como faltante.
- La fuente es meteorología regional de reanálisis; no una medición bajo el dosel. Los meses más lluviosos de la serie orientan el calendario de observación; no predicen infección ni clima futuro.
- `GET /api/soil?lat=1.018051&lon=-76.61286`: obtiene pH y carbono orgánico de SoilGrids 2.0 (ISRIC), profundidad **5–15 cm**, resolución nativa **250 m**. La consulta se inicia automáticamente al marcar un lugar y se cancela al cambiarlo. Los datos de otro punto no se reutilizan.
- El conector usa **WCS 1.0.0** porque ISRIC anuncia que la API REST está pausada. Descarga seis pequeños GeoTIFF: promedio, Q0.05 y Q0.95 de `phh2o` y `soc`. Lee solo la celda central de un recorte reproyectado a EPSG:4326; el recorte no añade precisión al producto. Valida georreferencia, dimensiones y NoData, sin buscar vecinos. Timeout de 18 segundos y caché del proveedor de hasta 24 horas. [Acceso WCS](https://docs.isric.org/globaldata/soilgrids/wcs.html), [unidades y profundidades](https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html).
- El pH bruto se divide por 10; el carbono orgánico se convierte de dg/kg a g/kg dividiendo por 10. El carbono **no se convierte a materia orgánica**. El rango mostrado corresponde a los percentiles 5–95 de la predicción, no a evolución temporal. Atribución: SoilGrids 2.0 · ISRIC, CC BY 4.0.
- Un pH manual tiene prioridad frente al mapa. Si falta, el pH estimado orienta el muestreo y la revisión de acidez; el carbono estimado orienta el registro inicial y seguimiento de cobertura. Siempre se pide confirmar con análisis local antes de enmiendas. Los datos parciales, errores y celdas sin cobertura se muestran explícitamente y permiten continuar. El punto ilustrativo de San Miguel tiene NoData en SoilGrids; no se rellenan esos datos con los de otra ubicación.
- Materia orgánica sigue siendo una entrada manual. IGAC, CHIRPS e IMERG no tienen conectores activos en esta versión.
- `src/lib/scenarios.ts` implementa reglas deterministas, compartibles entre interfaz y API. Ajustar aquí acciones y etapas; las referencias están en `src/lib/evidence.ts`.
- `POST /api/scenario` recibe `{ farm, horizon, point? }`. Si se proporciona el punto, consulta SoilGrids en el servidor y devuelve el suelo utilizado o el error de consulta junto al plan. Sin punto conserva la evaluación manual. La interfaz añade clima y suelo al mismo motor local. Los datos descargados incluyen las estimaciones, las coordenadas y las fuentes; al restaurar un borrador se vuelve a consultar el suelo para su punto.
- El servidor limita las consultas externas a cinco por minuto por proceso. Para una publicación con tráfico real, sustituirlo por un límite distribuido y definir condiciones de operación.

## Estructura

```text
data/power-san-miguel-2025.json  Respuesta NASA original con fecha de descarga
src/app/                       Página, estilos y rutas API
src/components/                Mapa, formularios, gráfico y escenarios
src/lib/                       Tipos, validación, datos, evidencia y reglas
src/assets/                    Tipografías locales y licencias OFL
tests/                         Agregación de datos y condiciones del motor
```

El motor muestra secuencias de manejo y efectos cualitativos. No estima futuras concentraciones de materia orgánica, dosis de cal, rendimiento ni probabilidad de moniliasis. Las especies candidatas y las intervenciones necesitan revisión local. Bosque natural no genera escenarios de conversión.

El modo de respaldo conserva paneles y reglas si NASA no responde; el mapa base OSM necesita conexión. No se precargan teselas ni se descargan mapas masivamente. Mantener la atribución y cumplir https://operations.osmfoundation.org/policies/tiles/.

Las fuentes originales y el alcance científico se documentan en los archivos de planificación del directorio superior. No se han copiado conversaciones, contactos ni fotografías privadas al proyecto.

## Guías incorporadas

Las fichas y acciones muestran enlaces y secciones de consulta. El plan descargado incluye el catálogo de fuentes en `evidence`.

Las tres tarjetas comparan qué hacer con el suelo, el agua y el cultivo según lo registrado en la finca. Cada fila incluye la fuente de la recomendación.

En «Tu plan», el paso a paso de cada ruta usa el horizonte, el estado del cacao y lo observado en el lote. En la API y el plan descargado, cada etapa conserva `actions` con el texto, incluye `tasks` con títulos, datos de origen cuando aplica (`basedOn`) y referencias a `evidence`, e indica qué comprobar antes de continuar (`checkpoint`).

- [Guía global para los sistemas de cultivo de cacao](https://www.icco.org/wp-content/uploads/B27407-Cocoa-Grower-Guide-Spanish-CFW-v7-interactive.pdf), Daymond y colaboradores, 2022, pp. 10–11. Sombra, agua y adaptación al lugar.
- [Poda y manejo de luz en el cultivo de cacao y otros frutales](https://nvfdhqlkqowvedolvsvw.supabase.co/storage/v1/object/public/Informacion%20Publica/documentos%20tecnicos/Libro%20Manejo%20luz%20cultivo%20cacao.pdf), Fedecacao, 2019, pp. 11–12 y 20–25. Tipos de poda y regulación de la luz. Disponible en la [biblioteca técnica de Fedecacao](https://www.fedecacao.com.co/documentos-tecnicos).
- [Manual técnico de interpretación de análisis de suelos, encalado y fertilización](https://repositorio.inia.gob.pe/items/23143ee9-b964-4d9f-ac33-21f83f832384), INIA Perú, 2025, pp. 40–44 y capítulos 8–10. Muestreo y datos necesarios para interpretar el informe.
- [Cosecha, beneficio y calidad del grano de cacao](https://repository.agrosavia.co/server/api/core/bitstreams/0574b597-1adc-4e02-8cd8-8a9b65b82b43/content), Compañía Nacional de Chocolates, 2019, pp. 9–10, 19–22 y 24–26. Recolección, fermentación, secado y almacenamiento.
- [Prácticas de trazabilidad y cero deforestación en cacao](https://www.mundocacao.com.co/noticias/i/91034386/nueva-cartilla-de-practicas-de-trazabilidad-y-cero-deforestacion-en-cacao), Compañía Nacional de Chocolates, 2025, pp. 30–33. Ubicación de parcelas y registros. El CSV es un formato propio de apoyo al registro.

## Publicar en Netlify

Importar `EstP19/Theounip-NASA` desde GitHub y elegir `main` como rama de producción. `netlify.toml` fija Node.js 24, el comando `npm run build` y la salida `.next`. El adaptador de [Next.js en Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) publica las rutas API como funciones. Las consultas usan fuentes públicas y no requieren claves.

Para publicar desde un proyecto ya vinculado, iniciar sesión con `npx netlify-cli login` y ejecutar `npx netlify-cli deploy --prod`. La carpeta local `.netlify/` está excluida de Git.
