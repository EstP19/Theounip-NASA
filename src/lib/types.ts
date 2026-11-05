export type Coordinates = { lat: number; lon: number };
export type SoilEstimate = { mean: number; lower: number | null; upper: number | null };
export type SoilContext = {
  coordinates: Coordinates;
  source: "SoilGrids 2.0 · ISRIC";
  sourceUrl: string;
  sourceUrls: string[];
  retrievedAt: string;
  depth: "5–15 cm";
  resolution: "250 m";
  ph: SoilEstimate | null;
  organicCarbon: SoilEstimate | null;
  warnings: string[];
};
export type PlotState = "young" | "renewal" | "pasture" | "forest";
export type Drainage = "unknown" | "good" | "waterlogged";
export type Priority = "soil" | "water" | "renovation";
export type Species = "inga" | "erythrina" | "canavalia" | "centrosema";
export type Horizon = 3 | 5 | 10;

export type FarmInput = {
  name: string;
  state: PlotState;
  shade: number;
  cover: number;
  shadeKnown?: boolean;
  coverKnown?: boolean;
  drainage: Drainage;
  priority: Priority;
  ph: number | null;
  organicMatter: number | null;
  soilDepth: string;
  soilDate: string;
  soilOrigin: "none" | "declared" | "lab";
  symptoms: "unknown" | "no" | "yes";
  species: Species[];
};

export type MonthClimate = {
  month: number;
  label: string;
  rain: number | null;
  temperature: number | null;
  humidity: number | null;
  days: number;
  validDays: { rain: number; temperature: number; humidity: number };
};

export type ClimateContext = {
  coordinates: Coordinates;
  year: number;
  mode: "snapshot" | "live";
  source: string;
  sourceUrl: string;
  retrievedAt: string;
  apiVersion: string;
  sources: string[];
  timeStandard: string;
  resolution: string;
  months: MonthClimate[];
  annual: { rain: number | null; temperature: number | null; humidity: number | null };
  coverage: { rain: number; temperature: number; humidity: number; expected: number };
};

export type EvidenceId = "wcs" | "ica" | "inga" | "ant" | "soilgrids" | "power";
export type Evidence = {
  id: EvidenceId;
  title: string;
  organization: string;
  detail: string;
  url: string;
};
export type PlanAction = { title: string; reason: string; evidence: EvidenceId; pending?: boolean };
export type Stage = { year: number; label: string; actions: string[] };
export type Scenario = {
  id: "current" | "agroforestry" | "recovery";
  title: string;
  description: string;
  effort: string;
  actions: PlanAction[];
  stages: Stage[];
  effects: { title: string; text: string }[];
};
export type ScenarioResult = {
  blocked: boolean;
  warnings: string[];
  missing: string[];
  scenarios: Scenario[];
};
