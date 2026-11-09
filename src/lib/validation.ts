import type { Coordinates, FarmInput } from "./types.ts";

export const DEMO_POINT: Coordinates = { lat: 0.343, lon: -76.91 };
export const DEFAULT_FARM: FarmInput = {
  name: "Parcela de exploración",
  state: "young",
  shade: 35,
  cover: 25,
  shadeKnown: false,
  coverKnown: false,
  drainage: "unknown",
  priority: "soil",
  ph: null,
  organicMatter: null,
  soilDepth: "0–20 cm",
  soilDate: "",
  soilOrigin: "none",
  symptoms: "unknown",
  species: ["inga"],
};

export function parseCoordinates(lat: string | null, lon: string | null): Coordinates | null {
  if (lat === null || lon === null || lat.trim() === "" || lon.trim() === "") return null;
  const point = { lat: Number(lat), lon: Number(lon) };
  if (
    !Number.isFinite(point.lat) ||
    !Number.isFinite(point.lon) ||
    Math.abs(point.lat) > 90 ||
    Math.abs(point.lon) > 180
  )
    return null;
  return point;
}

export function inPilotRegion(point: Coordinates): boolean {
  // Ventana amplia de Putumayo y su entorno; no es una delimitación administrativa.
  return point.lat >= -1.6 && point.lat <= 1.8 && point.lon >= -77.9 && point.lon <= -73.9;
}

export function isFarmInput(value: unknown): value is FarmInput {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const percent = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100;
  const nullable = (n: unknown, min: number, max: number) =>
    n === null || (typeof n === "number" && Number.isFinite(n) && n >= min && n <= max);
  return (
    typeof v.name === "string" &&
    v.name.length <= 100 &&
    ["young", "renewal", "pasture", "forest"].includes(v.state as string) &&
    percent(v.shade) &&
    percent(v.cover) &&
    (v.shadeKnown === undefined || typeof v.shadeKnown === "boolean") &&
    (v.coverKnown === undefined || typeof v.coverKnown === "boolean") &&
    ["unknown", "good", "waterlogged"].includes(v.drainage as string) &&
    ["soil", "water", "renovation"].includes(v.priority as string) &&
    nullable(v.ph, 0, 14) &&
    nullable(v.organicMatter, 0, 100) &&
    ["none", "declared", "lab"].includes(v.soilOrigin as string) &&
    ["unknown", "no", "yes"].includes(v.symptoms as string) &&
    (v.fruiting === undefined || ["unknown", "no", "yes"].includes(v.fruiting as string)) &&
    typeof v.soilDepth === "string" &&
    v.soilDepth.length <= 40 &&
    typeof v.soilDate === "string" &&
    /^$|^\d{4}-\d{2}-\d{2}$/.test(v.soilDate) &&
    Array.isArray(v.species) &&
    v.species.length <= 4 &&
    new Set(v.species).size === v.species.length &&
    v.species.every((s) => ["inga", "erythrina", "canavalia", "centrosema"].includes(s))
  );
}
