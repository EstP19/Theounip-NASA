"use client";
import { useLanguage } from "@/components/i18n-provider";

import { useState } from "react";
import { Droplets, Thermometer, CloudRain, Info } from "lucide-react";
import { monthLabel } from "@/lib/i18n";
import type { ClimateContext } from "@/lib/types";

export function ClimateChart({ context }: { context: ClimateContext }) {
  const { t, locale, formatting } = useLanguage();
  const number = (value: number | null, digits = 0) =>
    value === null
      ? t("Sin dato")
      : value.toLocaleString(formatting, { maximumFractionDigits: digits });
  const label = (month: number) =>
    locale === "es" ? context.months[month - 1].label : monthLabel(month, locale);
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected === null ? null : context.months[selected];
  const latestMonth = Number(context.latestDate.slice(5, 7)) - 1;
  const max = Math.max(...context.months.map((m) => m.observedRain ?? 0), 1);
  const fullYearRain = context.annual.rain !== null;
  const rainThrough = context.observedRain.through;
  const rainDate = rainThrough
    ? new Intl.DateTimeFormat(formatting, {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(new Date(rainThrough))
    : null;
  const wettest = context.months
    .filter((m) => m.rain !== null)
    .sort((a, b) => b.rain! - a.rain!)[0];
  const partial = Object.entries(context.coverage).some(
    ([k, v]) => k !== "expected" && v < context.coverage.expected,
  );
  return (
    <>
      <div className="climate-metrics">
        <div>
          <span className="metric-icon blue">
            <CloudRain size={18} />
          </span>
          <span className="metric-label">
            {fullYearRain ? t("Lluvia anual") : t("Lluvia acumulada")}
          </span>
          <strong>
            {number(context.observedRain.total, 1)}
            {context.observedRain.total !== null ? <small> mm</small> : null}
          </strong>
          {!fullYearRain && rainDate ? (
            <small>
              {t("Hasta el")} {rainDate} · {context.coverage.rain} {t("días con datos")}{" "}
            </small>
          ) : null}
        </div>
        <div>
          <span className="metric-icon coral">
            <Thermometer size={18} />
          </span>
          <span className="metric-label">{t("Temperatura promedio")}</span>
          <strong>
            {number(context.annual.temperature, 1)} <small>°C</small>
          </strong>
        </div>
        <div>
          <span className="metric-icon green">
            <Droplets size={18} />
          </span>
          <span className="metric-label">{t("Humedad del aire")}</span>
          <strong>
            {number(context.annual.humidity, 1)} <small>%</small>
          </strong>
        </div>
      </div>
      <div className="chart-heading">
        <span>
          {t("Lluvia por mes")} <span className="muted">· mm</span>
        </span>
        <span className="legend-dot">
          {t("NASA POWER ·")} {context.year}
        </span>
      </div>
      <button
        type="button"
        className="text-button"
        onClick={() => setSelected(latestMonth)}
        aria-pressed={selected === latestMonth}
      >
        {t("Ver último mes con datos ·")} {label(latestMonth + 1)}
      </button>
      <div
        className="rain-chart"
        aria-label={t("Lluvia mensual de {0}. Selecciona un mes para ver sus datos.", context.year)}
      >
        <div className="chart-grid" aria-hidden="true">
          <span>{number(max)}</span>
          <span>{number(max / 2)}</span>
          <span>0</span>
        </div>
        <div className="chart-bars">
          {context.months.map((m, i) => (
            <button
              key={m.month}
              type="button"
              className={`month-bar ${selected === i ? "selected" : ""} ${wettest?.month === m.month ? "wettest" : ""} ${m.rain === null && m.observedRain !== null ? "partial-rain" : ""}`}
              onClick={() => setSelected(selected === i ? null : i)}
              aria-pressed={selected === i}
              aria-label={`${label(m.month)}: ${m.observedRain === null ? t("sin datos de lluvia") : t("{0} milímetros{1}", number(m.observedRain, 1), m.rain === null ? t(", acumulado parcial") : "")}`}
            >
              <span className="bar-space">
                <span
                  className="bar-fill"
                  style={{
                    height: `${m.observedRain === null ? 2 : Math.max((m.observedRain / max) * 100, 1)}%`,
                  }}
                >
                  <span className="bar-tip">{number(m.observedRain, 1)}</span>
                </span>
              </span>
              <span className="month-name">{label(m.month)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="chart-detail" aria-live="polite">
        {active ? (
          <>
            <strong>
              {label(active.month)} {context.year}
            </strong>
            <span>
              {active.observedRain === null
                ? t("Sin datos de lluvia")
                : t(
                    "{0} mm{1}",
                    number(active.observedRain, 1),
                    active.rain === null ? t(" (acumulado parcial)") : "",
                  )}
              {" · "}
              {number(active.temperature, 1)} {t("°C · HR")} {number(active.humidity, 1)}%
            </span>
            <small>
              {t("Lluvia:")} {active.validDays.rain}/{active.days} {t("días · temperatura:")}{" "}
              {active.validDays.temperature}/{active.days} {t("· humedad:")}{" "}
              {active.validDays.humidity}/{active.days}
            </small>
          </>
        ) : (
          <>
            <Info size={15} />
            <span>
              {wettest
                ? t(
                    "{0} tuvo más lluvia entre los meses completos. Selecciona una barra para explorar.",
                    label(wettest.month),
                  )
                : t("No hay acumulados mensuales completos disponibles.")}
            </span>
          </>
        )}
      </div>
      {partial ? (
        <p className="inline-warning">
          {t(
            "Hay datos hasta el {0}. Las barras rayadas muestran acumulados parciales. Los promedios de temperatura y humedad usan los días con datos.",
            context.latestDate,
          )}
        </p>
      ) : null}
      <p className="source-note">
        {t(
          "Estos datos muestran cómo fue el clima de la zona. La lluvia puede variar dentro de tu parcela; no indican cómo será el clima en los próximos años.",
        )}{" "}
      </p>
    </>
  );
}
