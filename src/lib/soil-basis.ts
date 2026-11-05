import type { Coordinates, FarmInput, SoilContext } from "./types.ts";

export function soilAtPoint(soil: SoilContext | null, point: Coordinates) {
  return soil && soil.coordinates.lat === point.lat && soil.coordinates.lon === point.lon
    ? soil
    : null;
}

export function soilBasis(farm: FarmInput, soil: SoilContext | null) {
  const manual = farm.soilOrigin !== "none" && farm.ph !== null;
  return {
    ph: manual ? farm.ph : (soil?.ph?.mean ?? null),
    phSource: manual ? farm.soilOrigin : soil?.ph ? "soilgrids" : "none",
    organicCarbon: soil?.organicCarbon?.mean ?? null,
  };
}
