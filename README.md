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

La aplicación tiene cuatro pantallas con direcciones propias. El layout compartido conserva los datos al avanzar, volver o usar el historial del navegador.

1. `/ubicacion` — Tu finca: mapa, ubicación del dispositivo y clima de la zona. Las coordenadas se muestran en una opción adicional.
2. `/parcela` — Tu cultivo: preguntas cotidianas y opciones aproximadas de sombra y cobertura. No lo sé conserva la información como desconocida; no se presenta un porcentaje como dato del usuario.
3. `/manejo` — El suelo: se puede continuar sin análisis. Si existe, ingresar sus valores y, opcionalmente, fecha y profundidad. Aquí se eligen plantas y tiempo del plan.
4. `/resultados` — Tu plan: comparar alternativas, volver a editar cualquier paso, guardar, descargar o imprimir.

El caso inicial de San Miguel es ilustrativo; su clima es una descarga real de NASA POWER para `0.343, -76.91`, año 2025. Un cambio de ubicación invalida ese contexto. Las respuestas se conservan automáticamente durante la sesión de esa pestaña, incluso al recargar. Al recuperar un punto propio se vuelve a consultar el clima; el guardado manual permite conservar un escenario para otra sesión.

Mi ubicación utiliza la geolocalización del navegador bajo HTTPS o localhost. El usuario autoriza su ubicación; si la deniega o está fuera de la zona piloto, puede continuar manualmente. La posición corresponde al dispositivo, no a los linderos de la finca.

## Datos y reglas

- `GET /api/context?lat=0.343&lon=-76.91&year=2025`: consulta T2M, RH2M y PRECTOTCORR de NASA POWER, con tiempo de espera de 25 segundos y caché de hasta 24 horas.
- Años disponibles: 2023, 2024 y 2025. La ventana geográfica limita la demo a Putumayo y su entorno; no es una delimitación administrativa.
- `mode=snapshot` solo admite el punto de respaldo y año 2025. No se reutilizan sus valores para otro punto.
- La lluvia diaria se suma por mes; temperatura y humedad se promedian sobre días válidos. Se conservan contadores de cobertura. Un acumulado de lluvia incompleto se muestra como faltante.
- La fuente es meteorología regional de reanálisis; no una medición bajo el dosel. Los meses más lluviosos de la serie orientan el calendario de observación; no predicen infección ni clima futuro.
- pH y materia orgánica son entradas manuales. SoilGrids, IGAC, CHIRPS e IMERG no tienen conectores activos en esta versión.
- `src/lib/scenarios.ts` implementa reglas deterministas, compartibles entre interfaz y API. Ajustar aquí acciones y etapas; las referencias están en `src/lib/evidence.ts`.
- `POST /api/scenario` recibe `{ farm, horizon }` y evalúa las entradas agrícolas sin contexto climático. La interfaz añade el contexto consultado al mismo motor local para actualizar el calendario.
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

## Publicar en Vercel

Este repositorio contiene la aplicación en la raíz. En Vercel, importar `EstP19/Theounip-NASA`, seleccionar Next.js y dejar el directorio raíz en `.`. Usar Node.js 24.x y los comandos predeterminados (`npm install` y `npm run build`). No requiere variables de entorno ni claves API.

También se puede publicar desde una sesión autenticada de Vercel CLI:

```powershell
vercel deploy --prod
```

La carpeta `.vercel/` contiene la vinculación local con la cuenta y no se incluye en Git. Las futuras publicaciones deben corresponder a cambios guardados en el repositorio.
