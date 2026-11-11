import type { DoseInputs } from "./types.ts";

export const DOSE_SOURCE =
  "https://repositorio.inia.gob.pe/items/23143ee9-b964-4d9f-ac33-21f83f832384";

export function calculateProductDose(
  requirement?: number | null,
  percentage?: number | null,
  area?: number | null,
) {
  if (
    requirement == null ||
    !Number.isFinite(requirement) ||
    requirement < 0 ||
    percentage == null ||
    !Number.isFinite(percentage) ||
    percentage <= 0 ||
    percentage > 100
  )
    return null;

  const perHa = requirement / (percentage / 100);
  const total = area != null && Number.isFinite(area) && area > 0 ? perHa * area : null;
  if (!Number.isFinite(perHa) || (total !== null && !Number.isFinite(total))) return null;
  return { perHa, total };
}

export function calculateDoses(input: DoseInputs = {}) {
  return {
    lime: calculateProductDose(input.limeEquivalent, input.limeEfficiency, input.area),
    fertilizer: input.nutrient
      ? calculateProductDose(input.nutrientRequirement, input.nutrientContent, input.area)
      : null,
  };
}
