import { translator, type Locale } from "./i18n.ts";
import { calculateDoses } from "./doses.ts";
import {
  DISEASES,
  FRUIT_DAMAGE_ANSWERS,
  FRUITING_ANSWERS,
  GOALS,
  MATERIALS,
  PATHS,
  SYSTEMS,
} from "./plot-options.ts";
import { evaluateScenarios } from "./scenarios.ts";
import type {
  ClimateContext,
  FarmInput,
  Goal,
  GuidePath,
  PlanAction,
  SoilContext,
  Stage,
} from "./types.ts";

export function isGuidePath(value: unknown): value is GuidePath {
  return typeof value === "string" && Object.hasOwn(PATHS, value);
}

export function pathAvailable(farm: FarmInput, path: GuidePath) {
  return farm.state !== "forest" && (farm.state !== "pasture" || path === "recovery");
}

export function shouldAskHealthQuestions(farm: FarmInput) {
  return pathAvailable(farm, "health") && farm.goals?.includes("health") === true;
}

export function farmForPlan(farm: FarmInput): FarmInput {
  return {
    ...farm,
    drainage: "unknown",
    ...(!shouldAskHealthQuestions(farm)
      ? { symptoms: "unknown", diseases: undefined, fruiting: undefined }
      : {}),
  };
}

function reportedDiseases(farm: FarmInput) {
  return (farm.diseases ?? []).filter((id) => id === "witchesBroom" || farm.fruiting !== "no");
}

export function createAutomaticGuide(
  farm: FarmInput,
  climate: ClimateContext | null,
  soil: SoilContext | null,
  locale: Locale = "es",
) {
  if (farm.state === "forest") return null;
  const askHealth = shouldAskHealthQuestions(farm);
  const path = askHealth
    ? "health"
    : farm.state === "pasture" || farm.state === "renewal"
      ? "recovery"
      : "current";
  const guide = createGuide(farmForPlan(farm), path, climate, soil, locale);
  if (!guide) return null;

  return {
    ...guide,
    healthObservations: askHealth
      ? {
          fruiting: farm.fruiting ?? "unknown",
          fruitDamage: farm.fruiting === "no" ? null : farm.symptoms,
          diseases: reportedDiseases(farm),
        }
      : null,
    stages: askHealth
      ? guide.stages
      : guide.stages.map((stage) => ({
          ...stage,
          tasks: stage.tasks.filter(
            ({ evidence }) =>
              evidence !== "ica" && evidence !== "fundesyram" && evidence !== "plantvillage",
          ),
        })),
  };
}

export function healthAnswerRows(
  guide: NonNullable<ReturnType<typeof createAutomaticGuide>>,
  locale: Locale = "es",
) {
  const t = translator(locale);
  const observations = guide.healthObservations;
  if (!observations) return [];
  return [
    {
      label: t("¿El cacao tiene frutos ahora?"),
      answer: t(FRUITING_ANSWERS[observations.fruiting]),
    },
    ...(observations.fruitDamage !== null
      ? [
          {
            label: t("¿Has visto frutos con manchas o daños?"),
            answer: t(FRUIT_DAMAGE_ANSWERS[observations.fruitDamage]),
          },
        ]
      : []),
    {
      label: t("Señales marcadas"),
      answer:
        observations.diseases.map((id) => t(DISEASES[id].name)).join(", ") ||
        t("Sin señales registradas"),
    },
  ];
}

const periods = ["Inicio", "Labores", "Seguimiento"] as const;

export function createGuide(
  farm: FarmInput,
  path: GuidePath,
  climate: ClimateContext | null,
  soil: SoilContext | null,
  locale: Locale = "es",
) {
  const t = translator(locale);
  if (!pathAvailable(farm, path)) return null;
  const result = evaluateScenarios(farm, 3, climate, soil, locale);
  const base = result.scenarios.find(
    ({ id }) => id === (path === "recovery" ? "recovery" : "current"),
  );
  if (!base) return null;
  const goals = farm.goals ?? [];
  const observations = reportedDiseases(farm);
  const followSignal = {
    moniliasis: t(
      "Registra en qué frutos de cacao aparece polvo claro y si hay otros frutos cercanos con manchas.",
    ),
    witchesBroom: t(
      "Marca los árboles con brotes deformados para revisar las ramas con el técnico.",
    ),
    blackPod: t(
      "Anota si las manchas oscuras avanzan y si los frutos afectados se concentran en sitios húmedos.",
    ),
  };
  const watch: PlanAction = {
    title: t("Registrar las señales por sector"),
    basedOn: observations.length
      ? t("Señales reportadas: {0}.", observations.map((id) => t(DISEASES[id].name)).join(", "))
      : undefined,
    reason: t(
      "Anota la fecha y el sector. {0} Lleva fotos y registros a un técnico para confirmar la causa y decidir cómo intervenir.",
      observations.length
        ? observations.map((id) => followSignal[id]).join(" ")
        : t("Revisa los brotes, las ramas y los frutos de cacao que encuentres."),
    ),
    evidence: "ica",
    supportingEvidence: ["plantvillage"],
  };
  const runoff: PlanAction[] = [];
  if (farm.terrain === "slope")
    runoff.push({
      title: t("Identificar tramos donde se pierde suelo"),
      basedOn: t("Registraste una parcela en ladera."),
      reason: t(
        "Recorre la parcela después de llover. Marca surcos de escorrentía y suelo desnudo. Conserva la cobertura y acuerda con un técnico cómo proteger los tramos afectados.",
      ),
      evidence: "wcs",
    });
  if (farm.terrain === "nearWater" || farm.nearWater)
    runoff.push({
      title: t("Revisar la franja cercana al agua"),
      basedOn: t("La parcela está cerca de una quebrada, río o zona inundable."),
      reason: t(
        "Ubica la vegetación de la orilla y pregunta hasta dónde ha subido el agua en lluvias fuertes. Conserva esa vegetación y revisa el sector con un técnico antes de abrir drenajes o sembrar.",
      ),
      evidence: "wcs",
    });
  const objectiveTasks: Record<Goal, PlanAction> = {
    production: {
      title: t("Medir el avance de la producción"),
      reason:
        farm.state === "pasture"
          ? t(
              "Registra cuántas plantas se establecen en cada sector. Cuando haya cosecha, anota el peso de grano seco por sector y fecha.",
            )
          : t(
              "Registra el peso de grano seco por sector y fecha cuando haya cosecha. Revisa con un técnico los registros de poda, nutrición y estado de los árboles antes de cambiar el manejo.",
            ),
      evidence: "trazabilidad",
    },
    soil: {
      title: t("Proteger los sitios con suelo expuesto"),
      reason: t(
        "Ubica los claros al recorrer la parcela. Conserva hojas y coberturas donde protejan el suelo y registra los mismos puntos después de las lluvias.",
      ),
      evidence: "wcs",
    },
    health: watch,
    diversity: {
      title: t("Elegir dónde diversificar la sombra"),
      reason: t(
        "Haz un croquis de los árboles existentes. Revisa con un técnico dónde conservarlos y dónde probar una especie de sombra o frutal adaptada al sector.",
      ),
      evidence: "wcs",
      supportingEvidence: ["inga"],
    },
  };
  const extras = goals
    .filter((goal) => goal !== "health" || farm.state === "pasture")
    .map((goal) => ({
      ...(goal === "health"
        ? {
            title: t("Planear la vigilancia cuando se establezca el cacao"),
            reason: t(
              "Acuerda con un técnico qué revisar en las plantas durante los recorridos y cómo registrar las señales por sector.",
            ),
            evidence: "wcs" as const,
            supportingEvidence: ["ica" as const],
          }
        : objectiveTasks[goal]),
      basedOn: t("Objetivo elegido: {0}.", t(GOALS[goal])),
    }));
  const labItems = [
    farm.lab?.phosphorus == null ? null : t("P {0} mg/kg", farm.lab.phosphorus),
    farm.lab?.potassium == null
      ? null
      : t("K {0} {1}", farm.lab.potassium, farm.lab.potassiumUnit ?? "cmolc/kg"),
    farm.lab?.aluminium == null ? null : t("Al intercambiable {0} cmolc/kg", farm.lab.aluminium),
    farm.lab?.aluminiumSaturation == null
      ? null
      : t("saturación de Al {0}%", farm.lab.aluminiumSaturation),
    farm.lab?.calcium == null ? null : t("Ca {0} cmolc/kg", farm.lab.calcium),
    farm.lab?.magnesium == null ? null : t("Mg {0} cmolc/kg", farm.lab.magnesium),
    farm.lab?.cice == null ? null : t("CICE {0} cmolc/kg", farm.lab.cice),
    farm.lab?.organicCarbon == null ? null : t("carbono orgánico {0} g/kg", farm.lab.organicCarbon),
    farm.lab?.texture ? t("textura {0}", farm.lab.texture) : null,
  ].filter(Boolean);
  const reviewLab: PlanAction[] =
    farm.soilOrigin !== "none" && labItems.length
      ? [
          {
            title: t("Revisar los datos anotados del análisis"),
            basedOn: labItems.join(" · "),
            reason: t(
              "Lleva el informe y sus unidades a la visita técnica. Confirma el método del laboratorio y cuáles valores orientan la nutrición o el manejo de la acidez.",
            ),
            evidence: "inia-suelos",
          },
        ]
      : [];
  const material =
    farm.cacaoName ||
    (farm.cacaoMaterial && farm.cacaoMaterial !== "unknown"
      ? t(MATERIALS[farm.cacaoMaterial])
      : null);
  const recovery: PlanAction = {
    title:
      farm.state === "renewal"
        ? t("Evaluar opciones de rehabilitación")
        : t("Planear el establecimiento por sectores"),
    basedOn: material ? t("Material registrado: {0}.", material) : undefined,
    reason:
      farm.state === "renewal"
        ? t(
            "Marca plantas productivas, faltantes y árboles con bajo vigor. Con asistencia técnica, revisa dónde conviene rehabilitar mediante poda, evaluar injertos o reponer plantas. Empieza por un sector.",
          )
        : t(
            "Acuerda dónde mantener vegetación, cómo proteger el suelo y dónde ubicar el cacao. Evalúa sombra temporal y permanente con un técnico antes de sembrar.",
          ),
    evidence: farm.state === "renewal" ? "fedecacao-poda" : "wcs",
  };
  const shade: PlanAction[] =
    farm.state !== "pasture" && farm.cropSystem && farm.cropSystem !== "unknown"
      ? [
          {
            title: t("Revisar la sombra según el sistema de cultivo"),
            basedOn: t("Sistema registrado: {0}.", t(SYSTEMS[farm.cropSystem])),
            reason:
              farm.cropSystem === "monoculture"
                ? t(
                    "Marca los sitios más expuestos al sol. Revisa con un técnico si conviene incorporar árboles de sombra y cómo distribuirlos.",
                  )
                : t(
                    "Identifica qué árboles dan sombra, dónde las copas se juntan y por dónde entra aire. Conserva los árboles útiles y ajusta el manejo con asistencia técnica.",
                  ),
            evidence: "fedecacao-poda",
          },
        ]
      : [];
  const stages: Stage[] = base.stages.map((stage) => {
    let tasks = stage.tasks;
    if (stage.year === 0) {
      const healthVisit =
        farm.state !== "pasture" &&
        (path === "health" || goals.includes("health") || observations.length > 0);
      const drainageFirst = farm.drainage === "waterlogged";
      const drainage = stage.tasks[0];
      tasks = [
        ...(drainageFirst
          ? [
              {
                ...drainage,
                reason:
                  path === "recovery"
                    ? drainage.reason
                    : t(
                        "Después de llover, marca dónde quedan charcos y cuánto tardan en desaparecer. Revisa con un técnico por dónde evacuar el agua y cómo mantener el drenaje de la parcela.",
                      ),
              },
            ]
          : []),
        ...(healthVisit ? [watch] : []),
        ...runoff,
        ...stage.tasks
          .slice(drainageFirst ? 1 : 0)
          .filter(({ evidence }) => !healthVisit || evidence !== "plantvillage"),
        ...reviewLab,
      ];
    } else if (stage.year === 1) {
      tasks = [
        ...(path === "recovery" ? [recovery] : []),
        ...(path === "health"
          ? [
              {
                title: t("Organizar recorridos sanitarios"),
                reason: t(
                  "Revisa cada sector de forma regular y registra si aparecen nuevas señales. Cuando haya moniliasis confirmada, acuerda con el técnico la recolección sanitaria semanal de frutos afectados.",
                ),
                evidence: "ica" as const,
              },
            ]
          : []),
        ...shade,
        ...tasks,
        ...extras,
      ];
    }
    return { ...stage, tasks, actions: tasks.map(({ reason }) => reason) };
  });
  if (path === "health") {
    stages[0] = {
      ...stages[0],
      label: t("Localizar y documentar las señales"),
      checkpoint: {
        reason: t(
          "Conserva un registro por sector y confirma con el técnico qué problema estás observando antes de definir el manejo.",
        ),
        evidence: "ica",
      },
    };
    stages[2] = {
      ...stages[2],
      label: t("Revisar cómo evolucionan los daños"),
      checkpoint: {
        reason: t(
          "Compara los registros de las últimas visitas. Si el daño se extiende, solicita una nueva revisión técnica.",
        ),
        evidence: "ica",
      },
    };
  }
  return {
    path,
    title: t(PATHS[path].title),
    goals,
    stages: stages.map(({ label, tasks, checkpoint }, index) => ({
      period: t(periods[index]),
      label,
      tasks,
      checkpoint,
    })),
    warnings: result.warnings,
    missing: result.missing,
    doses: farm.soilOrigin === "none" ? calculateDoses() : calculateDoses(farm.doses),
    nutrient: farm.soilOrigin === "none" ? undefined : farm.doses?.nutrient,
  };
}
