"use client";

import { ArrowUpRight, Download, Sprout } from "lucide-react";
import { EVIDENCE } from "@/lib/evidence";
import { HARVEST_RECORDS, HARVEST_STEPS } from "@/lib/harvest";
import { DISEASES, FRUIT_DAMAGE_ANSWERS, FRUITING_ANSWERS } from "@/lib/plot-options";
import type { Disease, EvidenceId, FarmInput } from "@/lib/types";

function GuideSource({ id }: { id: EvidenceId }) {
  const source = EVIDENCE.find((item) => item.id === id);
  if (!source) return null;
  return (
    <p className="guide-source">
      <a href={source.url} target="_blank" rel="noreferrer">
        {source.title} <ArrowUpRight size={14} aria-hidden="true" />
      </a>
      <small>
        {source.organization} · {source.section}
      </small>
    </p>
  );
}

export function SoilGuide() {
  return (
    <details className="panel cacao-guide soil-guide">
      <summary>Cómo preparar y leer un análisis de suelo</summary>
      <ol>
        <li>
          <strong>Para tomar la muestra.</strong> Separa sectores con condiciones similares de
          suelo, pendiente y manejo. Reúne varias submuestras del mismo sector y etiqueta la muestra
          con el lote, la fecha y la profundidad.
        </li>
        <li>
          <strong>Para leer el informe.</strong> Revisa con el técnico el pH, la materia orgánica y
          la textura. Lleva las unidades y el método del laboratorio para interpretar fósforo,
          potasio y los demás nutrientes.
        </li>
        <li>
          <strong>Para conversar sobre cal y fertilización.</strong> Pide que revisen la acidez y el
          aluminio intercambiable, calcio, magnesio y CIC efectiva. Los cálculos también dependen de
          la capa de suelo, el cultivo y las características del producto. Usa el análisis de tu
          parcela para decidir con un técnico local.
        </li>
      </ol>
      <GuideSource id="inia-suelos" />
    </details>
  );
}

export function HealthQuestions({
  farm,
  onChange,
}: {
  farm: FarmInput;
  onChange: (farm: FarmInput) => void;
}) {
  return (
    <section className="panel cacao-guide health-questions" aria-labelledby="health-heading">
      <div className="section-heading">
        <h2 id="health-heading">¿Qué has visto en el cultivo?</h2>
        <Sprout size={22} aria-hidden="true" />
      </div>
      <p>Estas respuestas orientan las recomendaciones de sanidad de tu plan.</p>
      <label className="field-label" htmlFor="fruiting">
        ¿El cacao tiene frutos ahora?
      </label>
      <select
        id="fruiting"
        value={farm.fruiting ?? "unknown"}
        onChange={(event) =>
          onChange({
            ...farm,
            fruiting: event.target.value as FarmInput["fruiting"],
            ...(event.target.value === "no"
              ? {
                  symptoms: "unknown",
                  diseases: farm.diseases?.filter((id) => id === "witchesBroom"),
                }
              : {}),
          })
        }
      >
        {Object.entries(FRUITING_ANSWERS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {farm.fruiting !== "no" ? (
        <>
          <label className="field-label" htmlFor="symptoms">
            ¿Has visto frutos con manchas o daños?
          </label>
          <select
            id="symptoms"
            value={farm.symptoms}
            onChange={(event) =>
              onChange({ ...farm, symptoms: event.target.value as FarmInput["symptoms"] })
            }
          >
            {Object.entries(FRUIT_DAMAGE_ANSWERS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </>
      ) : null}

      <fieldset className="decision-options disease-options">
        <legend>¿Qué señales has observado?</legend>
        <p>Marca las que se parezcan a lo que ves. Un técnico puede confirmar la causa.</p>
        {(Object.entries(DISEASES) as [Disease, (typeof DISEASES)[Disease]][])
          .filter(([id]) => id === "witchesBroom" || farm.fruiting !== "no")
          .map(([id, { name, observation }]) => (
            <label key={id}>
              <input
                type="checkbox"
                checked={farm.diseases?.includes(id) ?? false}
                onChange={(event) => {
                  const diseases = farm.diseases ?? [];
                  onChange({
                    ...farm,
                    diseases: event.target.checked
                      ? [...diseases, id]
                      : diseases.filter((item) => item !== id),
                  });
                }}
              />
              <span>
                <strong>{name}</strong>
                <small>{observation}</small>
              </span>
            </label>
          ))}
      </fieldset>
    </section>
  );
}

export function HarvestGuide({ hasFruit }: { hasFruit: boolean }) {
  return (
    <section className="panel cacao-guide harvest-guide">
      <span className="eyebrow">DEL ÁRBOL AL GRANO</span>
      <h2>Cosecha de cacao y registro de la parcela</h2>
      <p>Consulta estas fichas cuando estés preparando la cosecha de cacao.</p>
      <details className="precise-values" open={hasFruit}>
        <summary>De la cosecha de cacao al grano seco</summary>
        <ol>
          {HARVEST_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <GuideSource id="cosecha" />
      </details>
      <details className="precise-values">
        <summary>Registrar el origen y las labores</summary>
        {HARVEST_RECORDS.map((item) => (
          <p key={item}>{item}</p>
        ))}
        <GuideSource id="trazabilidad" />
        <a className="text-button" href="/registro-lote-cacao.csv" download>
          <Download size={15} aria-hidden="true" /> Descargar formato de registro
        </a>
      </details>
    </section>
  );
}
