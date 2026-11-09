import test from "node:test";
import assert from "node:assert/strict";
import { aggregatePower } from "../src/lib/climate.ts";
import { evaluateScenarios } from "../src/lib/scenarios.ts";
import { EVIDENCE } from "../src/lib/evidence.ts";
import {
  DEFAULT_FARM,
  DEMO_POINT,
  inPilotRegion,
  isFarmInput,
  parseCoordinates,
} from "../src/lib/validation.ts";

function dailyYear(year: number) {
  const T2M: Record<string, number> = {},
    RH2M: Record<string, number> = {},
    PRECTOTCORR: Record<string, number> = {};
  for (
    let date = new Date(Date.UTC(year, 0, 1));
    date.getUTCFullYear() === year;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const key = date.toISOString().slice(0, 10).replaceAll("-", "");
    T2M[key] = 24;
    RH2M[key] = 80;
    PRECTOTCORR[key] = 2;
  }
  return {
    header: {
      fill_value: -999,
      start: `${year}0101`,
      end: `${year}1231`,
      api: { version: "test" },
    },
    properties: { parameter: { T2M, RH2M, PRECTOTCORR } },
  };
}

test("acumula precipitación diaria y promedia temperatura sin confundir unidades", () => {
  const result = aggregatePower(dailyYear(2025), DEMO_POINT, 2025, "live", "2026-11-04");
  assert.equal(result.annual.rain, 730);
  assert.equal(result.months[0].rain, 62);
  assert.equal(result.months[1].rain, 56);
  assert.equal(result.annual.temperature, 24);
  assert.equal(result.coverage.expected, 365);
});

test("incluye 29 de febrero y no cuenta datos de otro año", () => {
  const raw = dailyYear(2024);
  raw.properties.parameter.PRECTOTCORR["20250101"] = 999;
  const result = aggregatePower(raw, DEMO_POINT, 2024, "live", "2026-11-04");
  assert.equal(result.months[1].days, 29);
  assert.equal(result.annual.rain, 732);
  assert.equal(result.coverage.expected, 366);
});

test("un dato faltante de lluvia invalida el acumulado, sin convertirlo en cero", () => {
  const raw = dailyYear(2025);
  raw.properties.parameter.PRECTOTCORR["20250104"] = -999;
  raw.properties.parameter.T2M["20250104"] = -999;
  const result = aggregatePower(raw, DEMO_POINT, 2025, "live", "2026-11-04");
  assert.equal(result.months[0].rain, null);
  assert.equal(result.annual.rain, null);
  assert.equal(result.months[0].validDays.rain, 30);
  assert.equal(result.months[0].temperature, 24);
});

test("rechaza respuestas de proveedor con periodo equivocado o formato incompleto", () => {
  assert.throws(() => aggregatePower(dailyYear(2024), DEMO_POINT, 2025, "live", "now"), /periodo/);
  assert.throws(() => aggregatePower({}, DEMO_POINT, 2025, "live", "now"), /variables/);
});

test("rechaza coordenadas vacías, infinitas y fuera de rango, y acepta longitud negativa", () => {
  assert.equal(parseCoordinates("", "-76.91"), null);
  assert.equal(parseCoordinates("Infinity", "0"), null);
  assert.equal(parseCoordinates("95", "0"), null);
  assert.deepEqual(parseCoordinates("0.343", "-76.91"), DEMO_POINT);
  assert.equal(inPilotRegion(DEMO_POINT), true);
  assert.equal(inPilotRegion({ lat: 4.71, lon: -74.07 }), false);
});

test("valida borradores y rechaza valores imposibles o especies duplicadas", () => {
  assert.equal(isFarmInput(DEFAULT_FARM), true);
  assert.equal(isFarmInput({ ...DEFAULT_FARM, ph: 15 }), false);
  assert.equal(isFarmInput({ ...DEFAULT_FARM, cover: Number.NaN }), false);
  assert.equal(isFarmInput({ ...DEFAULT_FARM, organicMatter: -1 }), false);
  assert.equal(isFarmInput({ ...DEFAULT_FARM, species: ["inga", "inga"] }), false);
});

test("no propone conversión de bosque natural", () => {
  const result = evaluateScenarios({ ...DEFAULT_FARM, state: "forest" }, 10);
  assert.equal(result.blocked, true);
  assert.equal(result.scenarios.length, 0);
});

test("el encharcamiento condiciona establecimiento y activa una advertencia", () => {
  const result = evaluateScenarios(
    { ...DEFAULT_FARM, drainage: "waterlogged", state: "pasture" },
    5,
  );
  assert.match(result.warnings.join(" "), /encharcamiento/);
  assert.equal(result.scenarios[2].actions[0].title, "Evaluar el encharcamiento primero");
  assert.match(result.scenarios[2].stages[1].actions.join(" "), /antes de la siembra/);
});

test("el horizonte modifica etapas y la renovación depende del estado del lote", () => {
  const short = evaluateScenarios(DEFAULT_FARM, 3);
  const long = evaluateScenarios({ ...DEFAULT_FARM, state: "renewal" }, 10);
  assert.deepEqual(
    short.scenarios[1].stages.map((s) => s.year),
    [0, 1, 3],
  );
  assert.deepEqual(
    long.scenarios[1].stages.map((s) => s.year),
    [0, 1, 3, 5, 10],
  );
  assert.equal(long.scenarios[2].title, "Renovar poco a poco");
  assert.equal(long.scenarios[0].stages[1].tasks[0].title, "Organizar las labores que ya haces");
  assert.equal(
    long.scenarios[1].stages[1].tasks[0].title,
    "Probar sombra y cobertura en un sector",
  );
  assert.equal(long.scenarios[2].stages[1].tasks[0].title, "Renovar un sector a la vez");
});

test("las rutas con frutos muestran cosecha al inicio y cada tarea enlaza una fuente", () => {
  const withFruit = evaluateScenarios({ ...DEFAULT_FARM, fruiting: "yes", symptoms: "yes" }, 5);
  const withoutFruit = evaluateScenarios({ ...DEFAULT_FARM, fruiting: "no" }, 5);
  const sources = new Set(EVIDENCE.map((source) => source.id));
  for (const scenario of withFruit.scenarios) {
    assert.ok(scenario.stages[0].tasks.some((task) => task.evidence === "cosecha"));
    assert.ok(scenario.stages[0].tasks.some((task) => task.evidence === "plantvillage"));
    for (const { tasks } of scenario.stages) {
      assert.ok(tasks.every((task) => sources.has(task.evidence)));
    }
  }
  assert.ok(
    withoutFruit.scenarios.every((scenario) =>
      scenario.stages[0].tasks.every((task) => task.evidence !== "cosecha"),
    ),
  );
});

test("las tres rutas usan la cobertura declarada y anteponen el drenaje si quedan charcos", () => {
  const farm = { ...DEFAULT_FARM, priority: "renovation" as const, cover: 20, coverKnown: true };
  for (const scenario of evaluateScenarios(farm, 3).scenarios) {
    assert.match(scenario.stages[0].tasks[0].title, /Delimitar los sectores/);
    assert.ok(scenario.stages[1].tasks.some((task) => /20%.*tramos desnudos/.test(task.reason)));
  }
  for (const scenario of evaluateScenarios({ ...farm, drainage: "waterlogged" }, 3).scenarios) {
    assert.equal(scenario.stages[0].tasks[0].title, "Evaluar el encharcamiento primero");
    assert.match(scenario.stages[0].tasks[0].basedOn ?? "", /Indicaste que quedan charcos/);
  }
  const wet = evaluateScenarios({ ...farm, drainage: "waterlogged" }, 5).scenarios;
  assert.match(wet[0].stages[0].checkpoint.reason, /próxima visita/);
  assert.match(wet[1].stages[0].checkpoint.reason, /antes de agregar plantas/);
  assert.match(wet[2].stages[0].checkpoint.reason, /antes de sembrar/);
  assert.ok(wet.every(({ stages }) =>
    stages.every(({ checkpoint }) => EVIDENCE.some(({ id }) => id === checkpoint.evidence)),
  ));
});

test("las tres tarjetas comparan acciones concretas y citan fuentes según el lote", () => {
  const [current, agroforestry, recovery] = evaluateScenarios(
    {
      ...DEFAULT_FARM,
      state: "renewal",
      drainage: "waterlogged",
      coverKnown: true,
      cover: 20,
      shadeKnown: true,
      shade: 70,
      species: ["canavalia"],
      fruiting: "yes",
      symptoms: "yes",
      soilOrigin: "lab",
      ph: 5.3,
    },
    3,
  ).scenarios;
  assert.match(current.effects[0].text, /20%/);
  assert.match(current.effects[2].text, /frutos afectados/);
  assert.match(agroforestry.effects[0].text, /canavalia/);
  assert.match(agroforestry.effects[2].text, /70% de sombra/);
  assert.match(recovery.effects[0].text, /5.3/);
  assert.match(recovery.effects[2].text, /renovar por sectores/);
  const water = [current, agroforestry, recovery].map(({ effects }) => effects[1].text);
  assert.equal(new Set(water).size, 3);
  assert.ok(water.every((text) => text.includes("charcos")));
  for (const { effects } of [current, agroforestry, recovery]) {
    assert.deepEqual(effects.map(({ title }) => title), ["Suelo", "Agua", "Cuidado del cultivo"]);
    assert.ok(effects.every((effect) => EVIDENCE.some((source) => source.id === effect.evidence)));
  }

  const pasture = evaluateScenarios({ ...DEFAULT_FARM, state: "pasture" }, 3).scenarios;
  assert.ok(pasture.every(({ effects }) => !effects[1].text.includes("charcos")));
  assert.match(pasture[0].effects[2].text, /uso|usa hoy el terreno/);
  assert.match(pasture[2].effects[2].text, /antes del cacao/);
});

test("los faltantes se actualizan al ingresar suelo con trazabilidad", () => {
  const result = evaluateScenarios(
    {
      ...DEFAULT_FARM,
      shadeKnown: true,
      coverKnown: true,
      ph: 5.2,
      organicMatter: 3.4,
      soilOrigin: "lab",
      soilDate: "2026-10-01",
      drainage: "good",
    },
    5,
  );
  assert.equal(result.missing.length, 0);
  assert.match(result.scenarios[1].actions[0].reason, /5.2/);
  assert.match(result.scenarios[1].actions[0].reason, /no determina|dependen/);
});

test("el calendario depende de los datos NASA seleccionados, sin convertirlos en pronóstico", () => {
  const raw = dailyYear(2025);
  raw.properties.parameter.PRECTOTCORR["20250201"] = 400;
  const climate = aggregatePower(raw, DEMO_POINT, 2025, "live", "now");
  const result = evaluateScenarios(DEFAULT_FARM, 5, climate);
  const action = result.scenarios[1].actions.find((a) => a.title.includes("vigilancia"));
  assert.ok(action);
  assert.ok(action.reason.startsWith("Feb"));
  assert.match(action.reason, /no es un pronóstico/);
  const noClimate = evaluateScenarios(DEFAULT_FARM, 5);
  assert.ok(
    noClimate.scenarios[1].actions.find((a) => a.title === "Consultar el contexto climático")
      ?.pending,
  );
});

test("más sombra activa revisión de ventilación y las especies candidatas requieren validación", () => {
  const result = evaluateScenarios(
    { ...DEFAULT_FARM, shade: 80, shadeKnown: true, species: ["erythrina"] },
    5,
  );
  assert.match(result.warnings.join(" "), /ventilación/);
  assert.match(result.warnings.join(" "), /validación local/);
  assert.ok(result.scenarios[1].actions.some((a) => a.title === "Regular la sombra existente"));
});

test("no saber la sombra o cobertura no se convierte en un porcentaje declarado", () => {
  const result = evaluateScenarios(
    { ...DEFAULT_FARM, shade: 90, cover: 90, shadeKnown: false, coverKnown: false },
    5,
  );
  assert.ok(result.missing.some((value) => value.includes("sombra")));
  assert.ok(!result.warnings.some((value) => value.includes("densa")));
  assert.ok(
    result.scenarios[1].actions.some((action) =>
      action.reason.includes("Todavía no sabemos cuánta sombra"),
    ),
  );
  assert.ok(!result.scenarios[0].actions[0].reason.includes("90%"));
});
test("los escenarios adaptan el cuidado a plantas sin frutos y admiten borradores anteriores", () => {
  assert.ok(isFarmInput(DEFAULT_FARM));
  assert.ok(!isFarmInput({ ...DEFAULT_FARM, fruiting: "invalid" }));
  const farm = { ...DEFAULT_FARM, fruiting: "no" as const, symptoms: "yes" as const };
  const result = evaluateScenarios(farm, 5);
  assert.ok(
    result.scenarios.every((scenario) =>
      scenario.actions.some((action) => action.title === "Revisar hojas, tallos y brotes"),
    ),
  );
  assert.ok(!result.warnings.some((warning) => warning.includes("frutos afectados")));
});
