"use client";
import { useLanguage } from "@/components/i18n-provider";

import { LoaderCircle, Sprout } from "lucide-react";
import type { FarmInput, SoilContext, SoilEstimate } from "@/lib/types";
import { soilBasis } from "@/lib/soil-basis";

type Props = {
  soil: SoilContext | null;
  loading: boolean;
  error: string;
  farm: FarmInput;
  onRetry: () => void;
};

function Estimate({
  label,
  estimate,
  unit,
}: {
  label: string;
  estimate: SoilEstimate | null;
  unit?: string;
}) {
  const { t, formatting } = useLanguage();
  const format = (value: number) => value.toLocaleString(formatting, { maximumFractionDigits: 1 });
  return (
    <div className="soil-estimate">
      <span>{label}</span>
      <strong>
        {estimate ? `${format(estimate.mean)}${unit ? ` ${unit}` : ""}` : t("Sin dato aquí")}
      </strong>
      {estimate && estimate.lower !== null && estimate.upper !== null ? (
        <small>
          {t("Rango estimado:")} {format(estimate.lower)}–{format(estimate.upper)}
          {unit ? ` ${unit}` : ""}
        </small>
      ) : estimate ? (
        <small>{t("Rango de incertidumbre no disponible")}</small>
      ) : null}
    </div>
  );
}

export function SoilContextPanel({ soil, loading, error, farm, onRetry }: Props) {
  const { t, formatting } = useLanguage();
  const basis = soilBasis(farm, soil);
  return (
    <section className="panel soil-context-panel" aria-labelledby="soil-context-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("UNA PRIMERA MIRADA AL SUELO")}</span>
          <h2 id="soil-context-title">{t("El suelo de este lugar")}</h2>
        </div>
        <Sprout size={22} className="muted" />
      </div>
      <p className="friendly-intro">
        {t(
          "Al marcar tu parcela, buscamos una referencia del suelo en los mapas de SoilGrids.",
        )}{" "}
      </p>
      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <p className="soil-loading">
            <LoaderCircle size={18} className="spin" /> {t("Estamos conociendo el suelo…")}{" "}
          </p>
        ) : null}
        {error ? (
          <p className="field-help" role="status">
            {error}
          </p>
        ) : null}
        {soil ? (
          <>
            <div className="soil-estimates">
              <Estimate label={t("Acidez (pH)")} estimate={soil.ph} />
              <Estimate label={t("Carbono orgánico")} estimate={soil.organicCarbon} unit="g/kg" />
            </div>
            {!soil.ph && !soil.organicCarbon ? (
              <p className="field-help">
                {t(
                  "El mapa no tiene valores para este punto. Puedes mover el marcador si no quedó sobre tu parcela, o continuar con tus propios datos.",
                )}{" "}
              </p>
            ) : null}
            <p className="field-help">
              {t(
                "Son estimaciones para una zona de unos 250 metros y una profundidad de 5 a 15 cm. No reemplazan una muestra de tu parcela. El carbono orgánico es parte de la materia orgánica; no son el mismo dato.",
              )}{" "}
            </p>
            {soil.ph ? (
              <p className="soil-use-note">
                {basis.phSource === "soilgrids"
                  ? t("Usamos este pH estimado para orientar qué comprobar en tu plan.")
                  : t(
                      "Para tu plan damos prioridad al pH que ingresaste. La estimación del mapa queda como referencia.",
                    )}
              </p>
            ) : null}
            {soil.warnings.map((warning) => (
              <p className="field-help" key={warning}>
                {warning}
              </p>
            ))}
            <details className="precise-values">
              <summary>{t("De dónde vienen estos datos")}</summary>
              <p className="field-help">
                {t(
                  "SoilGrids 2.0 · ISRIC · CC BY 4.0. Promedio predicho y, cuando están disponibles, percentiles 5 y 95 (intervalo de predicción del 90%). El rango expresa incertidumbre del modelo, no cambios con el tiempo.",
                )}{" "}
              </p>
              <p className="field-help">
                {t("Punto:")} {soil.coordinates.lat.toFixed(6)}, {soil.coordinates.lon.toFixed(6)}.
                {t("Consultado:")} {new Date(soil.retrievedAt).toLocaleString(formatting)}.
              </p>
              <a className="text-button" href={soil.sourceUrl} target="_blank" rel="noreferrer">
                {t("Conocer SoilGrids")}{" "}
              </a>
            </details>
          </>
        ) : null}
      </div>
      {!loading ? (
        <button className="text-button" onClick={onRetry}>
          {error ? t("Volver a intentar") : t("Consultar de nuevo")}
        </button>
      ) : null}
      {loading ? (
        <p className="field-help">{t("Puedes continuar mientras buscamos los datos.")}</p>
      ) : null}
    </section>
  );
}
