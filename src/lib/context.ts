import snapshot2025 from "../../data/power-san-miguel-2025.json";
import snapshot2026 from "../../data/power-san-miguel-2026.json";
import { aggregatePower, DEMO_CLIMATE_YEAR, powerEndDate, powerUrl } from "./climate";
import type { Coordinates } from "./types";
import { DEMO_POINT } from "./validation";

export const SNAPSHOT_YEARS = [DEMO_CLIMATE_YEAR, 2025];

export function getSnapshot(year = DEMO_CLIMATE_YEAR) {
  const snapshot = year === 2025 ? snapshot2025 : snapshot2026;
  return aggregatePower(
    snapshot.data,
    DEMO_POINT,
    year,
    "snapshot",
    snapshot.retrievedAt,
    snapshot.data.header.end,
  );
}

export async function getLiveContext(point: Coordinates, year: number) {
  const end = powerEndDate(year);
  const response = await fetch(powerUrl(point, year, end), {
    signal: AbortSignal.timeout(25_000),
    next: { revalidate: 86_400 },
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(
      "NASA POWER no pudo completar la consulta. Intenta de nuevo más tarde o abre el caso ilustrativo.",
    );
  return aggregatePower(await response.json(), point, year, "live", new Date().toISOString(), end);
}
