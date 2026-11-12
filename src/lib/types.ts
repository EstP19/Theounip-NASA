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
export type PlotState = "young" | "established" | "renewal" | "pasture" | "forest";
export type Drainage = "unknown" | "good" | "waterlogged";
export type Priority = "soil" | "water" | "renovation";
export type Species = "inga" | "erythrina" | "canavalia" | "centrosema";
export type Horizon = 3 | 5 | 10;
export type GuidePath = "current" | "recovery" | "health";
export type Goal = "production" | "soil" | "health" | "diversity";
export type Disease = "moniliasis" | "witchesBroom" | "blackPod";
export type LabValues = Partial<
  Record<
    | "phosphorus"
    | "potassium"
    | "organicCarbon"
    | "aluminium"
    | "aluminiumSaturation"
    | "calcium"
    | "magnesium"
    | "cice",
    number | null
  >
> & { texture?: string; potassiumUnit?: "cmolc/kg" | "mg/kg" };
export type DoseInputs = Partial<
  Record<
    "limeEquivalent" | "limeEfficiency" | "nutrientRequirement" | "nutrientContent" | "area",
    number | null
  >
> & { nutrient?: "N" | "P₂O₅" | "K₂O" };

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
  fruiting?: "unknown" | "no" | "yes";
  species: Species[];
  terrain?: "flat" | "slope" | "nearWater" | "unknown";
  nearWater?: boolean;
  cropSystem?: "agroforestry" | "monoculture" | "chagra" | "unknown";
  cacaoMaterial?: "seed" | "graft" | "mixed" | "unknown";
  cacaoName?: string;
  goals?: Goal[];
  diseases?: Disease[];
  lab?: LabValues;
  doses?: DoseInputs;
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

export type EvidenceId =
  | "wcs"
  | "ica"
  | "inga"
  | "ant"
  | "soilgrids"
  | "power"
  | "icco"
  | "fedecacao-poda"
  | "inia-suelos"
  | "cosecha"
  | "trazabilidad"
  | "fundesyram"
  | "plantvillage";
export type Evidence = {
  id: EvidenceId;
  title: string;
  organization: string;
  shortName?: string;
  detail: string;
  url: string;
  section?: string;
};
export type PlanAction = {
  title: string;
  reason: string;
  basedOn?: string;
  evidence: EvidenceId;
  supportingEvidence?: EvidenceId[];
  pending?: boolean;
};
export type Checkpoint = Pick<PlanAction, "reason" | "evidence">;
export type Stage = {
  year: number;
  label: string;
  actions: string[];
  tasks: PlanAction[];
  checkpoint: Checkpoint;
};
export type Scenario = {
  id: "current" | "agroforestry" | "recovery";
  title: string;
  description: string;
  effort: string;
  actions: PlanAction[];
  stages: Stage[];
  effects: { title: string; text: string; evidence: EvidenceId }[];
};
export type ScenarioResult = {
  blocked: boolean;
  warnings: string[];
  missing: string[];
  scenarios: Scenario[];
};
