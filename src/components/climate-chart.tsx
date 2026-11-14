"use client";

import { useState } from "react";
import { Droplets, Thermometer, CloudRain, Info } from "lucide-react";
import type { ClimateContext } from "@/lib/types";

export function number(value: number | null, digits = 0) {
  return value === null
    ? "Sin dato"
    : value.toLocaleString("es-CO", { maximumFractionDigits: digits });
}

export function ClimateChart({ context }: { context: ClimateContext }) {
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected === null ? null : context.months[selected];
  const latestMonth = Number(context.latestDate.slice(5, 7)) - 1;
  const max = Math.max(...context.months.map((m) => m.observedRain ?? 0), 1);
  const fullYearRain = context.annual.rain !== null;
  const rainThrough = context.observedRain.through;
  const rainDate = rainThrough
    ? new Intl.DateTimeFormat("es-CO", {
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
          <span className="metric-label">{fullYearRain ? "Lluvia anual" : "Lluvia acumulada"}</span>
          <strong>
            {number(context.observedRain.total, 1)}
            {context.observedRain.total !== null ? <small> mm</small> : null}
          </strong>
          {!fullYearRain && rainDate ? (
            <small>
              Hasta el {rainDate} · {context.coverage.rain} días con datos
            </small>
          ) : null}
        </div>
        <div>
          <span className="metric-icon coral">
            <Thermometer size={18} />
          </span>
          <span className="metric-label">Temperatura promedio</span>
          <strong>
            {number(context.annual.temperature, 1)} <small>°C</small>
          </strong>
        </div>
        <div>
          <span className="metric-icon green">
            <Droplets size={18} />
          </span>
          <span className="metric-label">Humedad del aire</span>
          <strong>
            {number(context.annual.humidity, 1)} <small>%</small>
          </strong>
        </div>
      </div>
      <div className="chart-heading">
        <span>
          Lluvia por mes <span className="muted">· mm</span>
        </span>
        <span className="legend-dot">NASA POWER · {context.year}</span>
      </div>
      <button
        type="button"
        className="text-button"
        onClick={() => setSelected(latestMonth)}
        aria-pressed={selected === latestMonth}
      >
        Ver último mes con datos · {context.months[latestMonth].label}
      </button>
      <div
        className="rain-chart"
        aria-label={`Lluvia mensual de ${context.year}. Selecciona un mes para ver sus datos.`}
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
              aria-label={`${m.label}: ${m.observedRain === null ? "sin datos de lluvia" : `${number(m.observedRain, 1)} milímetros${m.rain === null ? ", acumulado parcial" : ""}`}`}
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
              <span className="month-name">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="chart-detail" aria-live="polite">
        {active ? (
          <>
            <strong>
              {active.label} {context.year}
            </strong>
            <span>
              {active.observedRain === null
                ? "Sin datos de lluvia"
                : `${number(active.observedRain, 1)} mm${active.rain === null ? " (acumulado parcial)" : ""}`}
              {" · "}
              {number(active.temperature, 1)} °C · HR {number(active.humidity, 1)}%
            </span>
            <small>
              Lluvia: {active.validDays.rain}/{active.days} días · temperatura:{" "}
              {active.validDays.temperature}/{active.days} · humedad: {active.validDays.humidity}/
              {active.days}
            </small>
          </>
        ) : (
          <>
            <Info size={15} />
            <span>
              {wettest
                ? `${wettest.label} tuvo más lluvia entre los meses completos. Selecciona una barra para explorar.`
                : "No hay acumulados mensuales completos disponibles."}
            </span>
          </>
        )}
      </div>
      {partial ? (
        <p className="inline-warning">
          Hay datos hasta el {context.latestDate}. Las barras rayadas muestran acumulados parciales.
          Los promedios de temperatura y humedad usan los días con datos.
        </p>
      ) : null}
      <p className="source-note">
        Estos datos muestran cómo fue el clima de la zona. La lluvia puede variar dentro de tu
        parcela; no indican cómo será el clima en los próximos años.
      </p>
    </>
  );
}
