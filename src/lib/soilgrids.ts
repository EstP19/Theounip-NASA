import { fromArrayBuffer } from "geotiff";
import type { Coordinates, SoilContext, SoilEstimate } from "./types.ts";

type Property = "phh2o" | "soc";
type Statistic = "mean" | "Q0.05" | "Q0.95";
const SIZE = 101;
const RADIUS = 0.005;
let windowStart = 0;
let requests = 0;

export class SoilQueryLimit extends Error {}

// Protección básica por proceso para ambas rutas; no es un límite distribuido.
export async function querySoilContext(point: Coordinates) {
  if (Date.now() - windowStart >= 60_000) {
    windowStart = Date.now();
    requests = 0;
  }
  if (requests++ >= 5)
    throw new SoilQueryLimit(
      "Hemos consultado varios lugares. Espera un minuto y vuelve a intentar.",
    );
  return getSoilContext(point);
}

// WCS raster numérico: nunca consultar colores de una imagen ni píxeles vecinos.
// Una ventana pequeña evita que el servidor pierda el píxel nativo al reproyectar.
export function soilCoverageUrl(point: Coordinates, property: Property, statistic: Statistic) {
  const params = new URLSearchParams({
    map: `/map/${property}.map`,
    SERVICE: "WCS",
    VERSION: "1.0.0",
    REQUEST: "GetCoverage",
    COVERAGE: `${property}_5-15cm_${statistic}`,
    CRS: "EPSG:4326",
    RESPONSE_CRS: "EPSG:4326",
    BBOX: [point.lon - RADIUS, point.lat - RADIUS, point.lon + RADIUS, point.lat + RADIUS].join(
      ",",
    ),
    WIDTH: String(SIZE),
    HEIGHT: String(SIZE),
    FORMAT: "GEOTIFF_INT16",
  });
  return `https://maps.isric.org/mapserv?${params}`;
}

export function convertSoilValue(
  value: number,
  property: Property,
  noData = -32768,
): number | null {
  if (!Number.isFinite(value) || value === noData || value < 0) return null;
  // phh2o: pH × 10 → pH. soc: dg/kg → g/kg. No convertir carbono a materia orgánica.
  const converted = value / 10;
  return converted <= (property === "phh2o" ? 14 : 1000) ? converted : null;
}

export async function decodeSoilPixel(buffer: ArrayBuffer, point: Coordinates, property: Property) {
  const image = await (await fromArrayBuffer(buffer)).getImage();
  if (
    image.getWidth() !== SIZE ||
    image.getHeight() !== SIZE ||
    image.getSamplesPerPixel() !== 1 ||
    image.getGeoKeys()?.GeographicTypeGeoKey !== 4326
  )
    throw new Error("SoilGrids devolvió una cuadrícula no válida.");
  const [west, south, east, north] = image.getBoundingBox();
  if (
    Math.abs((west + east) / 2 - point.lon) > 1e-7 ||
    Math.abs((south + north) / 2 - point.lat) > 1e-7 ||
    Math.abs(east - west - 2 * RADIUS) > 1e-7 ||
    Math.abs(north - south - 2 * RADIUS) > 1e-7
  )
    throw new Error("SoilGrids devolvió datos de otra ubicación.");
  const center = (SIZE - 1) / 2;
  const values = await image.readRasters({
    window: [center, center, center + 1, center + 1],
    interleave: true,
  });
  return convertSoilValue(Number(values[0]), property, image.getGDALNoData() ?? -32768);
}

export async function getSoilContext(
  point: Coordinates,
  fetcher: typeof fetch = fetch,
): Promise<SoilContext> {
  const signal = AbortSignal.timeout(18_000);
  const properties = ["phh2o", "soc"] as const;
  const statistics = ["mean", "Q0.05", "Q0.95"] as const;
  const urls: string[] = [];
  const warnings: string[] = [];
  const estimates = await Promise.all(
    properties.map(async (property): Promise<SoilEstimate | null> => {
      const results = await Promise.allSettled(
        statistics.map(async (statistic) => {
          const url = soilCoverageUrl(point, property, statistic);
          urls.push(url);
          const response = await fetcher(url, {
            signal,
            next: { revalidate: 86_400 },
          } as RequestInit);
          if (!response.ok || !response.headers.get("content-type")?.includes("image/tiff"))
            throw new Error("SoilGrids no pudo completar la consulta.");
          const buffer = await response.arrayBuffer();
          if (buffer.byteLength > 1_000_000)
            throw new Error("Respuesta de SoilGrids demasiado grande.");
          return decodeSoilPixel(buffer, point, property);
        }),
      );
      const value = (index: number) =>
        results[index].status === "fulfilled" ? results[index].value : null;
      const mean = value(0);
      if (results.some((item) => item.status === "rejected"))
        warnings.push(
          `No se completaron todos los datos de ${property === "phh2o" ? "pH" : "carbono orgánico"}. Puedes volver a consultar.`,
        );
      if (mean === null) return null;
      const lower = value(1),
        upper = value(2);
      const intervalValid = lower !== null && upper !== null && lower <= upper;
      return { mean, lower: intervalValid ? lower : null, upper: intervalValid ? upper : null };
    }),
  );
  // Una caída completa es distinta de una respuesta válida con celdas sin datos.
  if (estimates.every((item) => item === null) && warnings.length === 2)
    throw new Error(
      "No pudimos consultar SoilGrids ahora. Puedes reintentar o seguir con tus propios datos.",
    );
  return {
    coordinates: point,
    source: "SoilGrids 2.0 · ISRIC",
    sourceUrl: "https://docs.isric.org/globaldata/soilgrids/",
    sourceUrls: urls,
    retrievedAt: new Date().toISOString(),
    depth: "5–15 cm",
    resolution: "250 m",
    ph: estimates[0],
    organicCarbon: estimates[1],
    warnings,
  };
}
