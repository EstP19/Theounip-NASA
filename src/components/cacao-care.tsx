"use client";
import { useLanguage } from "@/components/i18n-provider";

import { ArrowUpRight, Download, Sprout } from "lucide-react";
import { EVIDENCE } from "@/lib/evidence";
import { HARVEST_RECORDS, HARVEST_STEPS } from "@/lib/harvest";
import { DISEASES, FRUIT_DAMAGE_ANSWERS, FRUITING_ANSWERS } from "@/lib/plot-options";
import type { Disease, EvidenceId, FarmInput } from "@/lib/types";

function GuideSource({ id }: { id: EvidenceId }) {
  const { t } = useLanguage();
  const source = EVIDENCE.find((item) => item.id === id);
  if (!source) return null;
  return (
    <p className="guide-source">
      <a href={source.url} target="_blank" rel="noreferrer">
        {t(source.title)} <ArrowUpRight size={14} aria-hidden="true" />
      </a>
      <small>
        {t(source.organization)} · {source.section && t(source.section)}
      </small>
    </p>
  );
}

export function SoilGuide() {
  const { t } = useLanguage();
  return (
    <details className="panel cacao-guide soil-guide">
      <summary>{t("Cómo preparar y leer un análisis de suelo")}</summary>
      <ol>
        <li>
          <strong>{t("Para tomar la muestra.")}</strong>{" "}
          {t(
            "Separa sectores con condiciones similares de suelo, pendiente y manejo. Reúne varias submuestras del mismo sector y etiqueta la muestra con el lote, la fecha y la profundidad.",
          )}{" "}
        </li>
        <li>
          <strong>{t("Para leer el informe.")}</strong>{" "}
          {t(
            "Revisa con el técnico el pH, la materia orgánica y la textura. Lleva las unidades y el método del laboratorio para interpretar fósforo, potasio y los demás nutrientes.",
          )}{" "}
        </li>
        <li>
          <strong>{t("Para conversar sobre cal y fertilización.")}</strong>{" "}
          {t(
            "Pide que revisen la acidez y el aluminio intercambiable, calcio, magnesio y CIC efectiva. Los cálculos también dependen de la capa de suelo, el cultivo y las características del producto. Usa el análisis de tu parcela para decidir con un técnico local.",
          )}{" "}
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
  const { t } = useLanguage();
  return (
    <section className="panel cacao-guide health-questions" aria-labelledby="health-heading">
      <div className="section-heading">
        <h2 id="health-heading">{t("¿Qué has visto en el cultivo?")}</h2>
        <Sprout size={22} aria-hidden="true" />
      </div>
      <p>{t("Estas respuestas orientan las recomendaciones de sanidad de tu plan.")}</p>
      <label className="field-label" htmlFor="fruiting">
        {t("¿El cacao tiene frutos ahora?")}{" "}
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
            {t(label)}
          </option>
        ))}
      </select>
      {farm.fruiting !== "no" ? (
        <>
          <label className="field-label" htmlFor="symptoms">
            {t("¿Has visto frutos con manchas o daños?")}{" "}
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
                {t(label)}
              </option>
            ))}
          </select>
        </>
      ) : null}

      <fieldset className="decision-options disease-options">
        <legend>{t("¿Qué señales has observado?")}</legend>
        <p>{t("Marca las que se parezcan a lo que ves. Un técnico puede confirmar la causa.")}</p>
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
                <strong>{t(name)}</strong>
                <small>{t(observation)}</small>
              </span>
            </label>
          ))}
      </fieldset>
    </section>
  );
}

export function HarvestGuide({ hasFruit }: { hasFruit: boolean }) {
  const { t, locale } = useLanguage();
  return (
    <section className="panel cacao-guide harvest-guide">
      <span className="eyebrow">{t("DEL ÁRBOL AL GRANO")}</span>
      <h2>{t("Cosecha de cacao y registro de la parcela")}</h2>
      <p>{t("Consulta estas fichas cuando estés preparando la cosecha de cacao.")}</p>
      <details className="precise-values" open={hasFruit}>
        <summary>{t("De la cosecha de cacao al grano seco")}</summary>
        <ol>
          {HARVEST_STEPS.map((step) => (
            <li key={t(step)}>{t(step)}</li>
          ))}
        </ol>
        <GuideSource id="cosecha" />
      </details>
      <details className="precise-values">
        <summary>{t("Registrar el origen y las labores")}</summary>
        {HARVEST_RECORDS.map((item) => (
          <p key={t(item)}>{t(item)}</p>
        ))}
        <GuideSource id="trazabilidad" />
        <a
          className="text-button"
          href={locale === "en" ? "/cacao-lot-record.csv" : "/registro-lote-cacao.csv"}
          download
        >
          <Download size={15} aria-hidden="true" /> {t("Descargar formato de registro")}{" "}
        </a>
      </details>
    </section>
  );
}
