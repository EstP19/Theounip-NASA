import snapshot from "../../data/power-san-miguel-2025.json";
import { aggregatePower, powerUrl } from "./climate";
import type { Coordinates } from "./types";
import { DEMO_POINT } from "./validation";

export function getSnapshot() {
  return aggregatePower(snapshot.data, DEMO_POINT, 2025, "snapshot", snapshot.retrievedAt);
}

export async function getLiveContext(point: Coordinates, year: number) {
  const response = await fetch(powerUrl(point, year), {
    signal: AbortSignal.timeout(25_000),
    next: { revalidate: 86_400 },
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(
      "NASA POWER no pudo completar la consulta. Intenta de nuevo más tarde o abre el caso ilustrativo.",
    );
  return aggregatePower(await response.json(), point, year, "live", new Date().toISOString());
}
