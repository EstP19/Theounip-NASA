import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  convertSoilValue,
  decodeSoilPixel,
  getSoilContext,
  soilCoverageUrl,
} from "../src/lib/soilgrids.ts";
import { soilAtPoint, soilBasis } from "../src/lib/soil-basis.ts";
import { evaluateScenarios } from "../src/lib/scenarios.ts";
import { DEFAULT_FARM, DEMO_POINT } from "../src/lib/validation.ts";
import type { SoilContext } from "../src/lib/types.ts";

const point = { lat: 1.018051, lon: -76.61286 };
const fixture = async (name: string) => {
  const bytes = await readFile(new URL(`./fixtures/${name}.tif`, import.meta.url));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};
const soil: SoilContext = {
  coordinates: point,
  source: "SoilGrids 2.0 · ISRIC",
  sourceUrl: "https://docs.isric.org/globaldata/soilgrids/",
  sourceUrls: [],
  retrievedAt: "2026-11-05T03:40:44.680Z",
  depth: "5–15 cm",
  resolution: "250 m",
  ph: { mean: 5.4, lower: 3.9, upper: 7.2 },
  organicCarbon: { mean: 111.4, lower: 6.2, upper: 502 },
  warnings: [],
};

test("convierte pH × 10 y dg/kg correctamente, sin convertir carbono en materia orgánica", () => {
  assert.equal(convertSoilValue(54, "phh2o"), 5.4);
  assert.equal(convertSoilValue(1114, "soc"), 111.4);
  for (const value of [-32768, NaN, Infinity, -1])
    assert.equal(convertSoilValue(value, "soc"), null);
  assert.equal(convertSoilValue(141, "phh2o"), null);
  assert.equal(convertSoilValue(0, "soc"), 0);
});

test("lee el píxel central georreferenciado y rechaza una cuadrícula de otra ubicación", async () => {
  const buffer = await fixture("soil-ph-villagarzon");
  assert.equal(await decodeSoilPixel(buffer, point, "phh2o"), 5.4);
  await assert.rejects(decodeSoilPixel(buffer, DEMO_POINT, "phh2o"), /otra ubicación/);
  await assert.rejects(decodeSoilPixel(new ArrayBuffer(2), point, "phh2o"));
});

test("conserva NoData aunque haya píxeles vecinos con datos", async () => {
  assert.equal(await decodeSoilPixel(await fixture("soil-ph-no-data"), DEMO_POINT, "phh2o"), null);
});

test("consulta capas de la misma profundidad y en orden longitud, latitud", () => {
  const url = new URL(soilCoverageUrl(point, "soc", "Q0.95"));
  assert.equal(url.searchParams.get("COVERAGE"), "soc_5-15cm_Q0.95");
  const [west, south, east, north] = url.searchParams.get("BBOX")!.split(",").map(Number);
  assert.ok(Math.abs((west + east) / 2 - point.lon) < 1e-8);
  assert.ok(Math.abs((south + north) / 2 - point.lat) < 1e-8);
});

test("una falla de percentiles conserva las medias válidas y avisa de la incertidumbre faltante", async () => {
  const ph = await fixture("soil-ph-villagarzon"),
    soc = await fixture("soil-soc-villagarzon");
  const fetcher: typeof fetch = async (url) => {
    const query = new URL(String(url)).searchParams.get("COVERAGE")!;
    if (!query.endsWith("mean"))
      return new Response("temporalmente no disponible", { status: 503 });
    return new Response(query.startsWith("soc") ? soc : ph, {
      headers: { "Content-Type": "image/tiff" },
    });
  };
  const context = await getSoilContext(point, fetcher);
  assert.deepEqual(context.ph, { mean: 5.4, lower: null, upper: null });
  assert.equal(context.organicCarbon?.mean, 111.4);
  assert.equal(context.warnings.length, 2);
  assert.equal(context.sourceUrls.length, 6);
});

test("distingue una caída completa del servicio de un punto sin cobertura", async () => {
  await assert.rejects(
    getSoilContext(point, async () => {
      throw new Error("timeout");
    }),
    /No pudimos/,
  );
  const buffer = await fixture("soil-ph-no-data");
  const context = await getSoilContext(
    DEMO_POINT,
    async () => new Response(buffer, { headers: { "Content-Type": "image/tiff" } }),
  );
  assert.equal(context.ph, null);
  assert.equal(context.organicCarbon, null);
  assert.deepEqual(context.warnings, []);
});

test("prioriza el análisis local y permite usar una estimación solo si falta el pH", () => {
  const lab = { ...DEFAULT_FARM, ph: 6.1, soilOrigin: "lab" as const };
  assert.equal(soilBasis(lab, soil).ph, 6.1);
  assert.equal(soilBasis(lab, soil).phSource, "lab");
  assert.equal(soilBasis({ ...lab, ph: null }, soil).phSource, "soilgrids");
  assert.equal(soilBasis({ ...lab, soilOrigin: "none" }, soil).ph, 5.4);
});

test("cambiar el punto invalida el suelo anterior inmediatamente", () => {
  assert.equal(soilAtPoint(soil, point), soil);
  assert.equal(soilAtPoint(soil, DEMO_POINT), null);
  assert.equal(soilAtPoint(null, point), null);
});

test("el plan usa pH y carbono estimados sin inventar materia orgánica o dosis de cal", () => {
  const result = evaluateScenarios(DEFAULT_FARM, 5, null, soil);
  const actions = result.scenarios[1].actions;
  assert.ok(
    actions.some((action) => action.reason.includes("5.4") && action.reason.includes("SoilGrids")),
  );
  assert.ok(
    actions.some(
      (action) => action.reason.includes("111.4 g/kg") && action.reason.includes("No equivale"),
    ),
  );
  assert.ok(result.missing.includes("Materia orgánica del suelo"));
  assert.ok(result.missing.some((text) => text.includes("Confirmar el pH")));
  assert.ok(actions.some((action) => action.reason.includes("No permite decidir una dosis")));
  const labResult = evaluateScenarios(
    { ...DEFAULT_FARM, soilOrigin: "lab", ph: 6.1 },
    5,
    null,
    soil,
  );
  assert.match(labResult.scenarios[1].actions[0].reason, /pH ingresado: 6.1/);
});
