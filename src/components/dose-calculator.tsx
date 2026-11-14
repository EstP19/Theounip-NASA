"use client";
import { useLanguage } from "@/components/i18n-provider";

import { calculateDoses, DOSE_SOURCE } from "@/lib/doses";
import type { DoseInputs, FarmInput } from "@/lib/types";

const fields = {
  area: "Área que se va a tratar (ha, opcional)",
  limeEquivalent: "Requerimiento de carbonato de calcio (kg CaCO₃/ha)",
  limeEfficiency: "Eficiencia relativa del material encalante (%)",
  nutrientRequirement: "Requerimiento efectivo del nutriente (kg/ha)",
  nutrientContent: "Contenido del nutriente en la etiqueta (%)",
} as const;
type DoseField = keyof typeof fields;

export function DoseCalculator({
  farm,
  onChange,
}: {
  farm: FarmInput;
  onChange: (farm: FarmInput) => void;
}) {
  const { t } = useLanguage();
  const doses = farm.doses ?? {};
  function setValue<K extends keyof DoseInputs>(key: K, value: DoseInputs[K]) {
    onChange({ ...farm, doses: { ...doses, [key]: value } });
  }
  function numberField(key: DoseField, max = 1_000_000) {
    return (
      <div>
        <label className="field-label" htmlFor={`dose-${key}`}>
          {t(fields[key])}
        </label>
        <input
          id={`dose-${key}`}
          type="number"
          min="0"
          max={max}
          step="any"
          value={doses[key] ?? ""}
          placeholder={t("Sin dato")}
          onChange={(event) =>
            setValue(key, event.target.value === "" ? null : event.target.valueAsNumber)
          }
        />
      </div>
    );
  }
  const { lime, fertilizer } = calculateDoses(doses);
  return (
    <details className="precise-values dose-calculator">
      <summary>{t("Calcular cantidades de cal y fertilizante")}</summary>
      <p className="field-help">
        {t(
          "Copia el requerimiento que calculó tu técnico y el porcentaje de la etiqueta. La cantidad resultante se obtiene al dividir el requerimiento por el porcentaje expresado como fracción.",
        )}{" "}
      </p>
      {numberField("area")}
      <fieldset>
        <legend>{t("Cal agrícola")}</legend>
        {numberField("limeEquivalent")}
        {numberField("limeEfficiency", 100)}
        <DoseValue label={t("Cal agrícola")} value={lime} />
        {!lime && (
          <p className="field-help">
            {t("Completa el requerimiento de CaCO₃ y el porcentaje del producto.")}{" "}
          </p>
        )}
      </fieldset>
      <fieldset>
        <legend>{t("Fertilizante")}</legend>
        <label className="field-label" htmlFor="dose-nutrient">
          {t("Nutriente, en la misma forma que indica la etiqueta")}{" "}
        </label>
        <select
          id="dose-nutrient"
          value={doses.nutrient ?? ""}
          onChange={(event) =>
            onChange({
              ...farm,
              doses: {
                ...doses,
                nutrient: (event.target.value || undefined) as DoseInputs["nutrient"],
                nutrientRequirement: null,
                nutrientContent: null,
              },
            })
          }
        >
          <option value="">{t("Selecciona un nutriente")}</option>
          <option value="N">{t("Nitrógeno (N)")}</option>
          <option value="P₂O₅">{t("Fósforo expresado como P₂O₅")}</option>
          <option value="K₂O">{t("Potasio expresado como K₂O")}</option>
        </select>
        {numberField("nutrientRequirement")}
        {numberField("nutrientContent", 100)}
        <DoseValue label={t("Fertilizante")} value={fertilizer} />
        {!fertilizer && (
          <p className="field-help">
            {t("Selecciona un nutriente y completa el requerimiento y el porcentaje.")}{" "}
          </p>
        )}
      </fieldset>
      <p className="field-help">
        {t("Confirma con el técnico el producto, la forma de aplicación y el área tratada.")}{" "}
      </p>
      <a className="text-button" href={DOSE_SOURCE} target="_blank" rel="noreferrer">
        {t("Manual INIA, capítulos 9 y 10")}{" "}
      </a>
    </details>
  );
}

export function DoseValue({
  label,
  value,
}: {
  label: string;
  value: ReturnType<typeof calculateDoses>["lime"];
}) {
  const { t, formatting } = useLanguage();
  const formatKg = new Intl.NumberFormat(formatting, { maximumSignificantDigits: 4 });
  if (!value) return null;
  return (
    <p className="dose-result" role="status">
      <strong>
        {label} · {formatKg.format(value.perHa)} kg/ha
      </strong>
      {value.total !== null && (
        <>
          {" "}
          · {formatKg.format(value.total)} {t("kg para el área indicada")}
        </>
      )}
    </p>
  );
}
