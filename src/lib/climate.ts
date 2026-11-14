import type { ClimateContext, Coordinates, MonthClimate } from "./types.ts";

type Daily = Record<string, number | null>;
type PowerData = {
  header: {
    fill_value?: number;
    api?: { version?: string };
    sources?: string[];
    time_standard?: string;
    start?: string;
    end?: string;
  };
  properties: { parameter: { T2M: Daily; RH2M: Daily; PRECTOTCORR: Daily } };
};

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const round = (v: number) => Math.round(v * 10) / 10;
const mean = (v: number[]) => (v.length ? round(v.reduce((a, b) => a + b, 0) / v.length) : null);

export const CLIMATE_YEARS = [2026, 2025, 2024, 2023];
export const DEMO_CLIMATE_YEAR = 2026;

export function powerEndDate(year: number, date = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" })
    .format(date)
    .replaceAll("-", "");
  const yearEnd = `${year}1231`;
  return today < yearEnd ? today : yearEnd;
}

export function powerUrl(point: Coordinates, year: number, end = `${year}1231`) {
  const url = new URL("https://power.larc.nasa.gov/api/temporal/daily/point");
  url.search = new URLSearchParams({
    parameters: "T2M,RH2M,PRECTOTCORR",
    community: "AG",
    latitude: String(point.lat),
    longitude: String(point.lon),
    start: `${year}0101`,
    end,
    format: "JSON",
  }).toString();
  return url.toString();
}

export function aggregatePower(
  raw: unknown,
  point: Coordinates,
  year: number,
  mode: ClimateContext["mode"],
  retrievedAt: string,
  requestedEnd = `${year}1231`,
): ClimateContext {
  const data = raw as PowerData;
  const params = data?.properties?.parameter;
  if (!params?.T2M || !params.RH2M || !params.PRECTOTCORR || !data.header)
    throw new Error("La fuente no devolvió las tres variables esperadas.");
  const start = `${year}0101`;
  const end = data.header.end;
  if (
    data.header.start !== start ||
    !end ||
    !/^\d{8}$/.test(end) ||
    end < start ||
    end > requestedEnd
  )
    throw new Error("La fuente devolvió un periodo diferente al solicitado.");
  const values = { rain: [] as number[], temperature: [] as number[], humidity: [] as number[] };
  const fill = data.header.fill_value ?? -999;
  let latest = "";
  function valid(v: unknown, min: number, max: number): v is number {
    return typeof v === "number" && Number.isFinite(v) && v !== fill && v >= min && v <= max;
  }
  const months: MonthClimate[] = MONTHS.map((label, i) => {
    const days = new Date(Date.UTC(year, i + 1, 0)).getUTCDate();
    const rain: number[] = [],
      temperature: number[] = [],
      humidity: number[] = [];
    for (let day = 1; day <= days; day++) {
      const key = `${year}${String(i + 1).padStart(2, "0")}${String(day).padStart(2, "0")}`;
      if (key > end) break;
      const rainValue = params.PRECTOTCORR[key];
      const temperatureValue = params.T2M[key];
      const humidityValue = params.RH2M[key];
      const hasRain = valid(rainValue, 0, 3000);
      const hasTemperature = valid(temperatureValue, -90, 65);
      const hasHumidity = valid(humidityValue, 0, 100);
      if (hasRain) rain.push(rainValue);
      if (hasTemperature) temperature.push(temperatureValue);
      if (hasHumidity) humidity.push(humidityValue);
      if (hasRain || hasTemperature || hasHumidity) latest = key;
    }
    values.rain.push(...rain);
    values.temperature.push(...temperature);
    values.humidity.push(...humidity);
    return {
      month: i + 1,
      label,
      days,
      validDays: { rain: rain.length, temperature: temperature.length, humidity: humidity.length },
      rain: rain.length === days ? round(rain.reduce((a, b) => a + b, 0)) : null,
      temperature: mean(temperature),
      humidity: mean(humidity),
    };
  });
  const expected = months.reduce((n, m) => n + m.days, 0);
  if (!values.rain.length && !values.temperature.length && !values.humidity.length)
    throw new Error("La fuente devolvió únicamente datos faltantes.");
  return {
    coordinates: point,
    year,
    mode,
    source: "NASA POWER",
    sourceUrl: powerUrl(point, year, requestedEnd),
    retrievedAt,
    latestDate: `${latest.slice(0, 4)}-${latest.slice(4, 6)}-${latest.slice(6)}`,
    apiVersion: data.header.api?.version ?? "No informada",
    sources: data.header.sources ?? [],
    timeStandard: data.header.time_standard ?? "LST",
    resolution: "Meteorología regional · cuadrícula nominal de 0,5° × 0,625°",
    months,
    annual: {
      rain: values.rain.length === expected ? round(values.rain.reduce((a, b) => a + b, 0)) : null,
      temperature: mean(values.temperature),
      humidity: mean(values.humidity),
    },
    coverage: {
      rain: values.rain.length,
      temperature: values.temperature.length,
      humidity: values.humidity.length,
      expected,
    },
  };
}
