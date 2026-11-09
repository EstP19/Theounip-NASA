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

export const ENGINE_VERSION = "0.4.1";

function stage(year: number, label: string, tasks: PlanAction[]): Stage {
  // Los consumidores anteriores del plan pueden seguir leyendo la lista de textos.
  return { year, label, actions: tasks.map((task) => task.reason), tasks };
}

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
  if (farm.symptoms === "yes" && farm.fruiting !== "no" && farm.state !== "pasture")
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
          : `pH ingresado: ${basis.ph}. ${soil?.ph ? "Damos prioridad a tu dato frente a la estimación del mapa. " : ""}La necesidad y dosis de dolomita dependen también de acidez intercambiable, textura y otros resultados. Revisa con un técnico el aluminio, calcio y magnesio, las unidades y la profundidad de la muestra.`,
    evidence: "inia-suelos",
    pending: true,
  };
  const waterAction: PlanAction = {
    title:
      farm.drainage === "waterlogged"
        ? "Evaluar el encharcamiento primero"
        : "Observar drenaje y circulación del agua",
    reason:
      farm.drainage === "waterlogged"
        ? "Después de llover, marca los charcos y anota cuánto tardan en desaparecer y hacia dónde corre el agua. Revisa el drenaje del sector con un técnico antes de la siembra."
        : "Observa por dónde sale el agua después de llover. Si cargaste el clima, fíjate también en cómo se repartió la lluvia durante el año para decidir cuándo recorrer la finca.",
    evidence: farm.drainage === "waterlogged" ? "ica" : "icco",
    pending: farm.drainage !== "good",
  };
  const shadeAction: PlanAction = {
    title:
      shadeKnown && farm.shade >= 60
        ? "Regular la sombra existente"
        : "Revisar la sombra de los árboles",
    reason: shadeKnown
      ? `La sombra que indicaste equivale aproximadamente a ${farm.shade}%. Revisa la entrada de luz y aire en distintos sectores. ${farm.state === "young" ? "En cacao joven, revisa con un técnico cómo formar la copa y mantener la protección de las plantas." : "Ajusta la poda y la sombra según la etapa del cultivo y cómo reciben luz las copas."}`
      : "Todavía no sabemos cuánta sombra hay. Observa cómo llega el sol al cacao antes de decidir si hacen falta más árboles o una poda.",
    evidence: "fedecacao-poda",
  };
  const coverAction: PlanAction = {
    title: !coverKnown
      ? "Observar cómo está protegido el suelo"
      : farm.cover < 40
        ? "Explorar cobertura del suelo"
        : "Manejar la cobertura existente",
    reason: coverKnown
      ? `Indicaste cerca de ${farm.cover}% de suelo cubierto. ${farm.cover < 40 ? "Marca primero los tramos desnudos o con señales de erosión y conserva la cobertura que ya los bordea." : "Revisa si quedan claros entre las hileras y conserva la cobertura donde protege el suelo y permite el paso."}`
      : "En el recorrido, distingue los tramos desnudos de los que están protegidos por hojas o plantas. Anota dónde falta cobertura antes de decidir cómo manejarla.",
    evidence: "wcs",
  };
  const healthAction: PlanAction = {
    title:
      farm.state === "pasture"
        ? "Preparar el seguimiento del cacao"
        : farm.fruiting === "no"
          ? "Revisar hojas, tallos y brotes"
          : "Organizar rondas sanitarias",
    reason:
      farm.state === "pasture"
        ? "Al establecer el cacao, organiza recorridos para observar el estado de las plantas y anotar las zonas donde se acumula agua."
        : farm.fruiting === "no"
          ? "En plantas sin frutos, observa hojas, tallos y brotes. Anota cambios visibles y consulta a un técnico si aparecen daños."
          : "Cuando haya frutos, revísalos durante los recorridos. Para el manejo de moniliasis, el ICA recomienda retirar cada semana los frutos enfermos antes de que produzcan esporas.",
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
  const existingCacao = farm.state !== "pasture";
  const hasFruit = existingCacao && farm.fruiting === "yes";
  const affectedFruit = existingCacao && farm.fruiting !== "no" && farm.symptoms === "yes";
  const denseShade = shadeKnown && farm.shade >= 60;
  const waterlogged = farm.drainage === "waterlogged";
  const cropRecord: PlanAction = {
    title: "Identificar los lotes y sus labores",
    reason:
      "Dale un código a cada sector. Anota fecha, labor y observaciones con ese código. Al vender, conserva el peso seco y el comprobante asociado al lote.",
    evidence: "trazabilidad",
  };
  const sampling: PlanAction = {
    ...soilAction,
    ...(basis.phSource === "soilgrids" ? { supportingEvidence: ["soilgrids"] } : {}),
    reason:
      farm.soilOrigin === "lab" && farm.ph !== null
        ? `Lleva el informe con el pH de ${farm.ph}${farm.organicMatter !== null ? ` y la materia orgánica de ${farm.organicMatter}%` : ""}. Confirma la fecha, profundidad y unidades. Revisa con el técnico el aluminio, calcio, magnesio y la textura antes de decidir el encalado.`
        : `${basis.phSource === "soilgrids" ? `Usa el pH estimado de ${basis.ph} a ${soil!.depth} para orientar la visita. ` : ""}Separa zonas de suelo, pendiente y manejo parecidos. Reúne submuestras de cada zona, etiqueta lote, fecha y profundidad, y llévalas al laboratorio.`,
  };
  const localSoilReview: PlanAction = {
    title: "Acordar el manejo del suelo con el técnico",
    reason:
      "Entrega el análisis del sector. Revisa con el técnico la acidez y los nutrientes para decidir si hace falta una enmienda o fertilizante y cómo aplicarlo.",
    evidence: "ant",
  };
  const describeDamage: PlanAction = {
    title: "Describir los daños que observaste",
    reason:
      "Anota el sector, la parte de la planta y el aspecto de las manchas o el polvillo. Compara tus observaciones con las fichas y llévalas a la visita técnica.",
    evidence: "plantvillage",
  };
  const harvest: PlanAction = {
    title: hasFruit ? "Cuidar la próxima cosecha" : "Preparar el beneficio cuando haya cosecha",
    reason:
      "Escoge mazorcas maduras y sanas y protege los puntos donde nacen las flores. Registra el inicio de fermentación, seca el grano de manera uniforme y mide su humedad antes de empacarlo.",
    evidence: "cosecha",
  };
  const repeatSoil: PlanAction = {
    title: "Comparar el suelo con el registro inicial",
    reason:
      "Toma muestras del mismo sector y a la misma profundidad que al inicio. Compara pH y materia orgánica usando métodos equivalentes. Si aún falta la primera muestra, tómala y consérvala como punto de partida.",
    evidence: "inia-suelos",
  };
  const speciesReview: PlanAction = {
    title: "Revisar las plantas elegidas",
    reason: selectedNames
      ? `Revisa con el técnico si ${selectedNames} se adapta al sector y qué espacio y manejo requiere. En la visita de seguimiento, anota cuáles plantas prendieron y dónde hace falta ajustar la sombra o cobertura.`
      : "Identifica qué sectores necesitan sombra o cobertura. Escoge las plantas con asesoría local y acuerda cómo revisar su establecimiento.",
    evidence: farm.species.length === 1 && farm.species.includes("inga") ? "inga" : "wcs",
  };
  const wetShadeReview: PlanAction = {
    title: "Revisar humedad y ventilación",
    reason:
      "Después de llover, recorre los sectores húmedos. Fíjate dónde tarda en secarse el cultivo y dónde las copas se juntan. Anota esos lugares para orientar la revisión de sombra y sanidad.",
    evidence: "fundesyram",
  };
  const renewalSurvey: PlanAction = {
    title: "Delimitar los sectores que necesitan atención",
    reason: existingCacao
      ? "En un croquis, señala plantas productivas, faltantes y tramos con problemas. Lleva ese registro a la visita técnica para definir dónde empezar los ajustes."
      : "Dibuja los sectores según el uso anterior, la pendiente y las zonas que conservan vegetación. Señala cuáles conviene recuperar primero con asesoría local.",
    evidence: "wcs",
  };
  const yearlyWork: Record<Scenario["id"], PlanAction> = {
    current: {
      title: existingCacao
        ? "Organizar las labores que ya haces"
        : "Registrar el manejo actual del terreno",
      reason: existingCacao
        ? "Haz un calendario por sector con la poda, el cuidado de la cobertura y las rondas de revisión. Anota la fecha de cada labor y las plantas que requieren seguimiento."
        : "Marca los tramos con suelo cubierto, pisoteo o charcos y anota cómo se usa el terreno. Guarda fotos de esos puntos para comparar en las próximas visitas.",
      evidence: "wcs",
    },
    agroforestry: {
      title: "Probar sombra y cobertura en un sector",
      reason:
        "Ubica los árboles que ya dan sombra y los tramos de suelo descubierto. Define con el técnico qué conservar, dónde ensayar coberturas y cómo dejar espacio para recorrer el cacao.",
      evidence: "wcs",
    },
    recovery: {
      title:
        farm.state === "renewal"
          ? "Renovar un sector a la vez"
          : "Preparar el sector para recuperar",
      reason:
        farm.state === "renewal"
          ? "Marca los árboles productivos, los que requieren poda y los que conviene evaluar para renovación. Acuerda con el técnico el primer sector y conserva los árboles útiles mientras haces el cambio."
          : farm.state === "pasture"
            ? "Delimita el terreno intervenido y revisa su drenaje. Planifica la cobertura y la sombra junto con el establecimiento del cacao. Conserva los bosques y la vegetación asociada a las quebradas."
            : "Marca los tramos con plantas débiles, faltantes o suelo descubierto. Revisa qué ajustes de sombra y cobertura necesita cada tramo antes de reponer plantas.",
      evidence: farm.state === "renewal" ? "fedecacao-poda" : "wcs",
    },
  };
  const followUp: Record<Scenario["id"], PlanAction> = {
    current: {
      title: "Volver a los mismos puntos del lote",
      reason:
        "Repite el recorrido inicial. Compara fotos, zonas encharcadas y plantas con daños usando el mismo sector y un recorrido comparable. Ajusta la frecuencia de las labores donde se repitan problemas.",
      evidence: "wcs",
    },
    agroforestry: {
      title: "Comprobar cómo quedó la combinación de plantas",
      reason:
        "Revisa cuáles plantas se establecieron, cuánto suelo quedó protegido y cómo pasa el aire entre las copas. Usa esas observaciones para decidir dónde ajustar la poda o extender el ensayo.",
      evidence: "fedecacao-poda",
    },
    recovery: {
      title: "Evaluar los sectores recuperados",
      reason:
        "Cuenta las plantas que se establecieron y anota los sitios que siguen con charcos, suelo descubierto o fallas de crecimiento. Revisa esas causas antes de reponer plantas o pasar al siguiente sector.",
      evidence: "wcs",
    },
  };
  const stagePlan = (kind: Scenario["id"]): Stage[] => {
    const includesCacao = existingCacao || kind !== "current";
    const initial = [sampling, cropRecord];
    if (farm.priority === "renovation") initial.unshift(renewalSurvey);
    if (waterlogged || farm.priority === "water") initial.unshift(waterAction);
    else initial.push(waterAction);
    if (existingCacao) initial.push(healthAction);
    if (affectedFruit) initial.push(describeDamage);
    if (hasFruit) initial.push(harvest);
    if (wettest?.length) initial.push(calendarAction);

    const firstYear = [yearlyWork[kind]];
    if (waterlogged && kind !== "current") firstYear.unshift(waterAction);
    if (existingCacao) firstYear.push(shadeAction);
    firstYear.push(coverAction);
    if (denseShade || waterlogged) firstYear.push(wetShadeReview);
    if (kind !== "current") firstYear.push(speciesReview);
    firstYear.push(localSoilReview);

    const stages = [
      stage(
        0,
        {
          current: "Registrar cómo manejas la finca",
          agroforestry: "Elegir dónde probar los cambios",
          recovery: "Identificar qué sectores recuperar",
        }[kind],
        initial,
      ),
      stage(1, "Poner en práctica el manejo elegido", firstYear),
      stage(3, "Revisar el avance por sector", [
        followUp[kind],
        repeatSoil,
        ...(includesCacao ? [harvest] : []),
      ]),
    ];
    if (horizon >= 5) {
      stages.push(
        stage(5, "Decidir qué conviene ajustar", [
          {
            title: "Revisar qué funcionó y cuánto trabajo requirió",
            reason: `Compara las labores y sus costos por sector${includesCacao ? " junto con los registros de grano seco que tengas" : ""}. ${kind === "current" ? "Conserva las labores que dieron resultado y cambia las que dejaron problemas repetidos." : kind === "agroforestry" ? "Extiende las combinaciones que funcionaron donde haya condiciones parecidas de luz, suelo y agua." : "Elige el siguiente sector según el establecimiento de las plantas, el drenaje y el trabajo disponible."}`,
            evidence: "wcs",
          },
          cropRecord,
        ]),
      );
    }
    if (horizon >= 10) {
      stages.push(
        stage(10, "Preparar el siguiente ciclo de manejo", [
          {
            title: "Actualizar el plan con los registros de la finca",
            reason:
              kind === "current"
                ? "Compara los registros de suelo, agua y labores de cada sector. Acuerda con la familia qué prácticas mantener y qué problemas necesitan un nuevo plan de manejo."
                : kind === "agroforestry"
                  ? "Actualiza el croquis de árboles y coberturas. Revisa dónde las copas se cerraron y dónde sigue el suelo descubierto. Acuerda qué conservar y cómo ajustar la combinación de plantas."
                  : "Revisa qué sectores se recuperaron y dónde persisten fallas de establecimiento. Acuerda con el técnico los trabajos pendientes y el orden de los próximos sectores.",
            evidence: "wcs",
          },
          repeatSoil,
        ]),
      );
    }
    return stages;
  };
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

  const hasLabPh = basis.phSource === "lab";
  const coverNames = SPECIES.filter(
    (s) => (s.id === "canavalia" || s.id === "centrosema") && farm.species.includes(s.id),
  )
    .map((s) => s.name.toLowerCase())
    .join(" o ");
  const effects: Record<Scenario["id"], Scenario["effects"]> = {
    current: [
      {
        title: "Suelo",
        text: coverKnown
          ? `Registrar el ${farm.cover}% de suelo cubierto`
          : hasLabPh
            ? `Guardar el pH medido de ${basis.ph} para comparar`
            : "Anotar qué zonas tienen el suelo cubierto",
        evidence: coverKnown || !hasLabPh ? "wcs" : "inia-suelos",
      },
      {
        title: "Agua",
        text: waterlogged
          ? "Marcar dónde quedan los charcos tras la lluvia"
          : farm.drainage === "good"
            ? "Mantener libres las salidas de agua"
            : "Mirar por dónde corre el agua al llover",
        evidence: farm.drainage === "unknown" ? "icco" : "ica",
      },
      {
        title: "Cuidado del cultivo",
        text: !existingCacao
          ? "Registrar cómo se usa hoy el terreno"
          : affectedFruit
            ? "Anotar y mostrar los frutos afectados"
            : hasFruit
              ? "Separar las mazorcas maduras y sanas"
              : farm.fruiting === "no"
                ? "Revisar hojas, tallos y brotes"
                : "Revisar las plantas y anotar si ya hay frutos",
        evidence: !existingCacao ? "wcs" : hasFruit && !affectedFruit ? "cosecha" : "ica",
      },
    ],
    agroforestry: [
      {
        title: "Suelo",
        text: !coverKnown
          ? "Ubicar suelo desnudo antes de elegir coberturas"
          : farm.cover >= 40
            ? "Conservar la cobertura y revisar los claros"
            : coverNames
              ? `Evaluar ${coverNames} en un sector`
              : "Probar cobertura en un tramo descubierto",
        evidence: "wcs",
      },
      {
        title: "Agua",
        text: waterlogged
          ? "Revisar los charcos antes de añadir plantas"
          : farm.drainage === "good"
            ? "Mantener el drenaje al probar la cobertura"
            : "Revisar el drenaje donde probarás la cobertura",
        evidence: waterlogged ? "ica" : "icco",
      },
      {
        title: "Cuidado del cultivo",
        text: denseShade
          ? `Revisar la luz y el aire con ${farm.shade}% de sombra`
          : !shadeKnown
            ? "Observar la sombra antes de añadir árboles"
            : farm.species.includes("inga")
              ? "Evaluar si el guamo cabe en el sector"
              : "Elegir sombra que deje pasar luz y aire",
        evidence: !denseShade && shadeKnown && farm.species.includes("inga")
          ? "inga"
          : "fedecacao-poda",
      },
    ],
    recovery: [
      {
        title: "Suelo",
        text: hasLabPh
          ? `Revisar con un técnico el pH de ${basis.ph}`
          : basis.phSource === "soilgrids"
            ? `Confirmar en la finca el pH estimado de ${basis.ph}`
            : "Tomar una muestra del primer sector",
        evidence: "inia-suelos",
      },
      {
        title: "Agua",
        text: waterlogged
          ? "Revisar primero el drenaje del sector con charcos"
          : farm.drainage === "good"
            ? "Conservar el drenaje al intervenir cada sector"
            : "Comprobar el drenaje del primer sector",
        evidence: farm.drainage === "unknown" ? "icco" : "ica",
      },
      {
        title: "Cuidado del cultivo",
        text: farm.state === "pasture"
          ? "Preparar sombra y cobertura antes del cacao"
          : farm.state === "renewal"
            ? "Conservar plantas productivas y renovar por sectores"
            : affectedFruit
              ? "Revisar los daños antes de reponer plantas"
              : "Ubicar las plantas débiles o los sitios sin cacao",
        evidence: farm.state === "renewal" ? "fedecacao-poda" : affectedFruit ? "ica" : "wcs",
      },
    ],
  };
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
        healthAction,
        calendarAction,
      ],
      stages: stagePlan("current"),
      effects: effects.current,
    },
    {
      id: "agroforestry",
      title: "Árboles y suelo protegido",
      description: "Combinar plantas y cuidar la sombra",
      effort: "Cuidados a lo largo del año",
      actions: agroActions,
      stages: stagePlan("agroforestry"),
      effects: effects.agroforestry,
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
        healthAction,
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
      effects: effects.recovery,
    },
  ];
  return { blocked: false, warnings, missing, scenarios };
}
