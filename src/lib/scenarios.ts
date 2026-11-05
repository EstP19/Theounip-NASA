import type {
  ClimateContext,
  FarmInput,
  Horizon,
  PlanAction,
  Scenario,
  ScenarioResult,
  SoilContext,
  Stage,
} from "./types.ts";
import { SPECIES } from "./evidence.ts";
import { soilBasis } from "./soil-basis.ts";

export const ENGINE_VERSION = "0.2.0";

export function evaluateScenarios(
  farm: FarmInput,
  horizon: Horizon,
  climate: ClimateContext | null = null,
  soil: SoilContext | null = null,
): ScenarioResult {
  if (farm.state === "forest")
    return {
      blocked: true,
      warnings: [
        "Este explorador no propone convertir bosque natural en cacao. Selecciona una parcela previamente intervenida para explorar manejo o recuperación.",
      ],
      missing: [],
      scenarios: [],
    };
  const missing: string[] = [];
  const basis = soilBasis(farm, soil);
  const shadeKnown = farm.shadeKnown !== false;
  const coverKnown = farm.coverKnown !== false;
  const warnings = [
    "Este plan te ayuda a elegir qué hacer y qué observar con el tiempo. No dice exactamente cómo estará el suelo ni cuánto cacao producirás.",
  ];
  if (basis.ph === null) missing.push("pH del suelo");
  else if (basis.phSource === "soilgrids")
    missing.push("Confirmar el pH con una muestra de la finca");
  if (soil?.ph || soil?.organicCarbon)
    warnings.push(
      "SoilGrids orienta el plan con estimaciones del suelo a 5–15 cm y unos 250 m de resolución. Confirma los valores con una muestra antes de aplicar enmiendas; el mapa no muestra cambios futuros.",
    );
  if (!shadeKnown) missing.push("Conocer un poco mejor la sombra del cultivo");
  if (!coverKnown) missing.push("Observar qué tanto está cubierto el suelo");
  if (farm.organicMatter === null) missing.push("Materia orgánica del suelo");
  if (farm.drainage === "unknown") missing.push("Observación de drenaje");
  if (farm.soilOrigin !== "lab") missing.push("Análisis de laboratorio verificable");
  else if (!farm.soilDate) missing.push("Fecha del análisis de suelo");
  if (farm.drainage === "waterlogged")
    warnings.push(
      "Hay encharcamiento declarado. Evaluar el drenaje antes de establecer nuevas plantas.",
    );
  if (shadeKnown && farm.shade >= 60)
    warnings.push(
      "La sombra declarada es densa. Revisar luz y ventilación antes de añadir sombrío; este aviso orienta la inspección, no define un umbral agronómico universal.",
    );
  if (farm.symptoms === "yes")
    warnings.push(
      "Hay síntomas reportados: registrar frutos afectados y solicitar revisión técnica. El clima no confirma el diagnóstico.",
    );
  const candidates = farm.species.filter((s) => s !== "inga");
  if (candidates.length)
    warnings.push(
      "Las especies candidatas seleccionadas necesitan validación local de adaptación y manejo.",
    );
  const soilAction: PlanAction = {
    title:
      basis.phSource === "soilgrids"
        ? "Comprobar la acidez en tu finca"
        : basis.ph === null || farm.soilOrigin !== "lab"
          ? "Completar el análisis de suelo"
          : "Revisar el análisis con un técnico",
    reason:
      basis.phSource === "soilgrids"
        ? `SoilGrids estima un pH de ${basis.ph} a ${soil!.depth}. Úsalo para conversar sobre la acidez del suelo y planear un muestreo. No permite decidir una dosis de cal: hacen falta acidez intercambiable, textura y un análisis local.`
        : basis.ph === null
          ? "Un análisis ayuda a conocer el suelo. Si todavía no lo tienes, puedes empezar por pedir orientación antes de aplicar cal o fertilizantes."
          : `pH ingresado: ${basis.ph}. ${soil?.ph ? "Damos prioridad a tu dato frente a la estimación del mapa. " : ""}La necesidad y dosis de dolomita dependen también de acidez intercambiable, textura y otros resultados.`,
    evidence: "ant",
    pending: true,
  };
  const waterAction: PlanAction = {
    title:
      farm.drainage === "waterlogged"
        ? "Evaluar el encharcamiento primero"
        : "Observar drenaje y circulación del agua",
    reason:
      "Después de llover, observa dónde se queda el agua y por dónde sale. Eso ayuda a decidir qué revisar antes de sembrar.",
    evidence: "ica",
    pending: farm.drainage !== "good",
  };
  const shadeAction: PlanAction = {
    title:
      shadeKnown && farm.shade >= 60
        ? "Regular la sombra existente"
        : "Revisar la sombra de los árboles",
    reason: shadeKnown
      ? `La sombra que indicaste equivale aproximadamente a ${farm.shade}%. Revisa si los árboles protegen al cacao y, a la vez, dejan entrar luz y aire.`
      : "Todavía no sabemos cuánta sombra hay. Observa cómo llega el sol al cacao antes de decidir si hacen falta más árboles o una poda.",
    evidence: farm.species.includes("inga") ? "inga" : "wcs",
  };
  const coverAction: PlanAction = {
    title: !coverKnown
      ? "Observar cómo está protegido el suelo"
      : farm.cover < 40
        ? "Explorar cobertura del suelo"
        : "Manejar la cobertura existente",
    reason: coverKnown
      ? `La cobertura que indicaste equivale aproximadamente a ${farm.cover}%. Revisa si las hojas y plantas protegen el suelo sin dificultar el cuidado del cacao.`
      : "Observa si el suelo está descubierto o protegido por hojas y plantas. Con esa información podrás elegir mejor cómo cuidarlo.",
    evidence: "wcs",
  };
  const healthAction: PlanAction = {
    title: "Organizar rondas sanitarias",
    reason:
      "Revisa los frutos con frecuencia. La guía ICA recomienda retirar cada semana los frutos enfermos antes de que dispersen el hongo, junto con el cuidado de la sombra y las podas.",
    evidence: "ica",
  };
  const carbonAction: PlanAction = {
    title: "Observar los cambios en el suelo",
    reason:
      farm.organicMatter === null
        ? basis.organicCarbon !== null
          ? `SoilGrids estima ${basis.organicCarbon} g/kg de carbono orgánico a ${soil!.depth}. Es una referencia para planear el muestreo y seguir el cuidado de hojas y coberturas. No equivale a materia orgánica medida ni permite atribuir mejoras a una planta; falta una muestra local para comparar cambios.`
          : "Falta una medición de materia orgánica. Registrar la línea base antes de evaluar cambios por coberturas o manejo de residuos."
        : `Materia orgánica ingresada: ${farm.organicMatter}%. Conservar el método y la profundidad para comparar futuros muestreos. Este valor no predice la respuesta a una cobertura.`,
    evidence: "wcs",
    pending: farm.organicMatter === null,
  };
  const sequenceAction: PlanAction = {
    title: "Tener en cuenta la edad del cultivo",
    reason:
      farm.state === "renewal"
        ? "Planear la renovación por sectores según el estado de los árboles y el trabajo disponible."
        : farm.state === "pasture"
          ? "Definir una secuencia de preparación, cobertura, sombra y establecimiento en el área intervenida."
          : "Ajustar prácticas al establecimiento del cacao joven y registrar su desarrollo.",
    evidence: "wcs",
  };
  const wettest = climate?.months
    .filter((m) => m.rain !== null)
    .sort((a, b) => b.rain! - a.rain!)
    .slice(0, 3);
  const calendarAction: PlanAction = {
    title: climate
      ? `Preparar vigilancia con el registro de ${climate.year}`
      : "Consultar el contexto climático",
    reason: wettest?.length
      ? `${wettest.map((m) => m.label).join(", ")} tuvieron los mayores acumulados mensuales en la serie NASA consultada. Usar este antecedente para organizar inspecciones de drenaje y frutos; no es un pronóstico ni confirma enfermedad.`
      : "Falta una serie climática utilizable para esta ubicación. El plan conserva las observaciones del lote, sin sustituir datos de otro sitio.",
    evidence: "power",
    pending: !wettest?.length,
  };
  const selectedNames = SPECIES.filter((s) => farm.species.includes(s.id))
    .map((s) => s.name.toLowerCase())
    .join(", ");
  const stagePlan = (kind: "agroforestry" | "recovery"): Stage[] => [
    {
      year: 0,
      label: "Antes de intervenir",
      actions: [
        "Conocer el suelo, cómo sale el agua y qué había antes en el terreno.",
        "Anotar cómo está la finca y conversar sobre los cambios que quieres hacer.",
      ],
    },
    {
      year: 1,
      label:
        kind === "recovery" ? "Preparar y establecer por etapas" : "Empezar con pequeños cambios",
      actions: [
        farm.drainage === "waterlogged"
          ? "Resolver la evaluación de drenaje antes de la siembra."
          : "Revisar si el terreno está listo antes de sembrar.",
        kind === "recovery" && farm.state === "renewal"
          ? "Definir sectores para renovación gradual, sin asumir reemplazo total."
          : "Elegir plantas para cubrir el suelo y dar sombra según lo que necesita el cacao.",
        selectedNames
          ? `Revisar si ${selectedNames} se adapta al lugar y cómo cuidarlo.`
          : "Seleccionar especies con asesoría local.",
      ],
    },
    {
      year: 3,
      label: "Cuidar y observar los cambios",
      actions: [
        "Cuidar las podas, dejar entrar aire y revisar los frutos con frecuencia.",
        "Si puedes, repite el análisis de suelo y compáralo con el primero, tomando la muestra de la misma manera.",
      ],
    },
    ...(horizon >= 5
      ? [
          {
            year: 5,
            label: "Ajustar lo que sea necesario",
            actions: [
              "Revisar cambios observados en suelo, cobertura y drenaje.",
              "Adaptar podas, especies y sectores con base en los registros.",
            ],
          },
        ]
      : []),
    ...(horizon >= 10
      ? [
          {
            year: 10,
            label: "Pensar en el siguiente ciclo",
            actions: [
              "Evaluar estructura del sistema y necesidades de renovación.",
              "Comparar monitoreos sucesivos; actualizar el plan con el productor.",
            ],
          },
        ]
      : []),
  ];
  const agroActions = [
    shadeAction,
    coverAction,
    soilAction,
    waterAction,
    carbonAction,
    calendarAction,
    healthAction,
    sequenceAction,
  ];
  if (farm.priority === "water")
    agroActions.sort((a, b) => Number(b === waterAction) - Number(a === waterAction));
  if (farm.priority === "soil")
    agroActions.sort((a, b) => Number(b === soilAction) - Number(a === soilAction));
  if (farm.priority === "renovation")
    agroActions.sort((a, b) => Number(b === sequenceAction) - Number(a === sequenceAction));
  const scenarios: Scenario[] = [
    {
      id: "current",
      title: "Cuidar lo que ya tienes",
      description: "Tu punto de partida",
      effort: "Según lo que ya haces",
      actions: [
        {
          title: "Construir la línea base",
          reason: `Empieza registrando lo que observas. ${shadeKnown ? `Sombra aproximada: ${farm.shade}%.` : "La sombra está por conocer."} ${coverKnown ? `Suelo cubierto: aproximadamente ${farm.cover}%.` : "La cobertura del suelo está por conocer."} Lleva un registro para comparar cómo cambia tu cultivo.`,
          evidence: "wcs",
        },
        soilAction,
        waterAction,
        calendarAction,
      ],
      stages: [
        {
          year: 0,
          label: "Registrar el presente",
          actions: ["Guardar prácticas y observaciones del lote."],
        },
        {
          year: horizon,
          label: "Comparar observaciones",
          actions: [
            "Medir de nuevo los mismos indicadores. El manejo actual no implica estabilidad del suelo.",
          ],
        },
      ],
      effects: [
        { title: "Suelo", text: "Ver cómo cambia con el tiempo" },
        { title: "Agua", text: "Observar el agua después de llover" },
        { title: "Cuidado del cultivo", text: "Revisar los frutos y las plantas" },
      ],
    },
    {
      id: "agroforestry",
      title: "Árboles y suelo protegido",
      description: "Combinar plantas y cuidar la sombra",
      effort: "Cuidados a lo largo del año",
      actions: agroActions,
      stages: stagePlan("agroforestry"),
      effects: [
        { title: "Suelo", text: "Proteger con hojas y otras plantas" },
        { title: "Agua", text: "Cuidar sombra, luz y humedad" },
        { title: "Cuidado del cultivo", text: "Dejar entrar aire y cuidar las podas" },
      ],
    },
    {
      id: "recovery",
      title:
        farm.state === "renewal"
          ? "Renovar poco a poco"
          : farm.state === "pasture"
            ? "Recuperación del lote"
            : "Acompañar el crecimiento",
      description: "Cambios por etapas",
      effort: "Más trabajo al comenzar",
      actions: [
        waterAction,
        soilAction,
        {
          title:
            farm.state === "renewal"
              ? "Planificar sectores de renovación"
              : "Preparar una secuencia de establecimiento",
          reason:
            "Definir pasos de cobertura, sombra temporal y cacao según el sitio y disponibilidad de trabajo. La secuencia necesita revisión técnica antes de ejecutarse.",
          evidence: "wcs",
          pending: true,
        },
        coverAction,
        shadeAction,
      ],
      stages: stagePlan("recovery"),
      effects: [
        { title: "Suelo", text: "Conocer el suelo antes de intervenir" },
        { title: "Agua", text: "Revisar charcos antes de sembrar" },
        { title: "Cuidado del cultivo", text: "Observar el cultivo desde el comienzo" },
      ],
    },
  ];
  return { blocked: false, warnings, missing, scenarios };
}
