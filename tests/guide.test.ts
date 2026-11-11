import assert from "node:assert/strict";
import test from "node:test";
import { calculateDoses, calculateProductDose } from "../src/lib/doses.ts";
import { createGuide, isGuidePath } from "../src/lib/guide.ts";
import { DEFAULT_FARM, hasRequiredLabValues, isFarmInput } from "../src/lib/validation.ts";

test("la guía sanitaria usa las señales y objetivos elegidos en la parcela", () => {
  const farm = {
    ...DEFAULT_FARM,
    state: "established",
    fruiting: "no",
    terrain: "slope",
    drainage: "waterlogged",
    diseases: ["witchesBroom", "moniliasis"],
    goals: ["health", "soil"],
  } as const;
  const input = { ...farm, diseases: [...farm.diseases], goals: [...farm.goals] };
  assert.ok(isFarmInput(input));
  const guide = createGuide(input, "health", null, null);
  assert.ok(guide);
  assert.equal(guide.path, "health");
  assert.deepEqual(
    guide.stages.map((stage) => stage.period),
    ["Inicio", "Labores", "Seguimiento"],
  );
  assert.match(guide.stages[0].tasks[0].title, /encharcamiento/);
  assert.equal(guide.stages[0].tasks[1].basedOn, "Señales reportadas: Escoba de bruja.");
  assert.ok(guide.stages[0].tasks.some((task) => task.basedOn?.includes("ladera")));
  assert.ok(guide.stages[1].tasks.some((task) => task.title.includes("suelo expuesto")));
  assert.equal(createGuide({ ...input, state: "forest" }, "recovery", null, null), null);
  assert.equal(createGuide({ ...input, state: "pasture" }, "current", null, null), null);
  assert.equal(isGuidePath("agroforestry"), false);
});

test("los datos básicos del análisis completo respetan los ceros y el carbono registrado", () => {
  const farm = {
    ...DEFAULT_FARM,
    soilOrigin: "lab" as const,
    ph: 5.6,
    lab: { organicCarbon: 32, phosphorus: 0, potassium: 0.3 },
  };
  assert.ok(isFarmInput(farm));
  assert.ok(hasRequiredLabValues(farm));
  assert.equal(hasRequiredLabValues({ ...farm, lab: {} }), false);
  assert.equal(hasRequiredLabValues({ ...farm, soilOrigin: "declared", lab: {} }), true);
  assert.equal(hasRequiredLabValues({ ...farm, lab: undefined }), true);
});

test("la calculadora aplica el porcentaje del producto y la superficie indicada", () => {
  assert.deepEqual(calculateProductDose(1000, 80, 0.5), { perHa: 1250, total: 625 });
  assert.deepEqual(calculateProductDose(46, 46), { perHa: 100, total: null });
  assert.deepEqual(calculateProductDose(0, 80), { perHa: 0, total: null });
  assert.equal(calculateProductDose(50, 0), null);
  assert.equal(calculateProductDose(null, 80), null);
  assert.equal(calculateDoses({ nutrientRequirement: 50, nutrientContent: 80 }).fertilizer, null);
});
