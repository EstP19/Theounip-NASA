import pdfMake from "pdfmake/build/pdfmake.js";
import fonts from "pdfmake/build/vfs_fonts.js";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { EVIDENCE } from "./evidence.ts";
import { healthAnswerRows, type createAutomaticGuide } from "./guide.ts";
import { HARVEST_RECORDS, HARVEST_STEPS } from "./harvest.ts";
import { GOALS } from "./plot-options.ts";
import type { EvidenceId } from "./types.ts";

type Guide = NonNullable<ReturnType<typeof createAutomaticGuide>>;
const kg = new Intl.NumberFormat("es-CO", { maximumSignificantDigits: 4 });

function references(ids: EvidenceId[]): Content {
  const sources = EVIDENCE.filter((source) => ids.includes(source.id));
  return {
    text: [
      "Fuentes: ",
      ...sources.flatMap((source, index) => [
        ...(index ? [" · "] : []),
        {
          text: source.shortName ?? source.organization,
          link: source.url,
          decoration: "underline" as const,
        },
      ]),
    ],
    style: "source",
  };
}

function heading(text: string): Content {
  return { text, style: "section", headlineLevel: 1 };
}

export function createPlanPdf(guide: Guide, plotName: string) {
  const answers = healthAnswerRows(guide);
  const content: Content[] = [
    { text: "SueloVivo · Institución Universitaria del Putumayo", style: "brand" },
    { text: guide.title, style: "title" },
    ...(plotName ? [{ text: `Parcela: ${plotName}`, style: "intro" }] : []),
    ...(guide.goals.length
      ? [
          {
            text: `Objetivos: ${guide.goals.map((goal) => GOALS[goal]).join(" · ")}`,
            style: "intro",
          },
        ]
      : []),
  ];

  if (answers.length) {
    content.push({
      unbreakable: true,
      stack: [
        heading("Observaciones de sanidad"),
        ...answers.map(({ label, answer }) => ({
          text: [{ text: `${label}${label.endsWith("?") ? "" : ":"} `, bold: true }, answer],
          style: "answer",
        })),
      ],
    });
  }

  for (const stage of guide.stages) {
    content.push(heading(`${stage.period} · ${stage.label}`));
    for (const [index, task] of stage.tasks.entries()) {
      content.push({
        unbreakable: true,
        stack: [
          { text: `${index + 1}. ${task.title}`, style: "task" },
          ...(task.basedOn ? [{ text: task.basedOn, style: "basis" }] : []),
          task.reason,
          references([task.evidence, ...(task.supportingEvidence ?? [])]),
        ],
      });
    }
    content.push({
      unbreakable: true,
      stack: [
        { text: "Antes de seguir", style: "task" },
        stage.checkpoint.reason,
        references([stage.checkpoint.evidence]),
      ],
    });
  }

  if (guide.doses.lime || guide.doses.fertilizer) {
    content.push(heading("Cantidades estimadas para revisar con tu técnico"));
    const doses = [
      { label: "Cal agrícola", value: guide.doses.lime },
      { label: `Fertilizante · ${guide.nutrient ?? ""}`, value: guide.doses.fertilizer },
    ];
    for (const { label, value } of doses) {
      if (!value) continue;
      const total =
        value.total === null ? "" : ` · ${kg.format(value.total)} kg para el área indicada`;
      content.push({ text: `${label} · ${kg.format(value.perHa)} kg/ha${total}`, style: "answer" });
    }
    content.push(references(["inia-suelos"]));
  }

  if (guide.missing.length || guide.warnings.length) {
    content.push(heading("Datos por confirmar"));
    if (guide.missing.length) content.push({ ul: guide.missing, margin: [0, 0, 0, 5] });
    for (const warning of guide.warnings) content.push({ text: warning, style: "answer" });
  }

  content.push(
    {
      unbreakable: true,
      stack: [
        heading("De la cosecha de cacao al grano seco"),
        { ol: HARVEST_STEPS },
        references(["cosecha"]),
      ],
    },
    {
      unbreakable: true,
      stack: [
        { text: "Registrar el origen y las labores", style: "task" },
        ...HARVEST_RECORDS.map((text) => ({ text, style: "answer" })),
        references(["trazabilidad"]),
      ],
    },
  );

  const document: TDocumentDefinitions = {
    info: { title: `SueloVivo - ${guide.title}`, author: "SueloVivo Putumayo" },
    pageSize: "A4",
    pageMargins: [44, 40, 44, 42],
    defaultStyle: { fontSize: 10.5, lineHeight: 1.18, color: "#24312b" },
    styles: {
      brand: { fontSize: 9, bold: true, color: "#356349", margin: [0, 0, 0, 10] },
      title: { fontSize: 21, bold: true, color: "#173c2d", margin: [0, 0, 0, 8] },
      intro: { margin: [0, 0, 0, 4] },
      section: { fontSize: 14, bold: true, color: "#23523d", margin: [0, 14, 0, 6] },
      task: { bold: true, margin: [0, 5, 0, 3] },
      basis: { color: "#3e5948", italics: true, margin: [0, 0, 0, 3] },
      answer: { margin: [0, 0, 0, 4] },
      source: { fontSize: 9, color: "#356349", margin: [0, 3, 0, 6] },
    },
    content,
    footer: (page, pageCount) => ({
      text: `SueloVivo · ${page} / ${pageCount}`,
      alignment: "right",
      color: "#52645a",
      fontSize: 9,
      margin: [44, 13, 44, 0],
    }),
    pageBreakBefore: (node, container) =>
      node.headlineLevel === 1 && container.getFollowingNodesOnPage().length === 0,
  };
  pdfMake.addVirtualFileSystem(fonts);
  return pdfMake.createPdf(document);
}
