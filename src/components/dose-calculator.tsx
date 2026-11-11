"use client";

import { calculateDoses, DOSE_SOURCE } from "@/lib/doses";
import type { DoseInputs, FarmInput } from "@/lib/types";

const formatKg = new Intl.NumberFormat("es-CO", { maximumSignificantDigits: 4 });
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
  const doses = farm.doses ?? {};
  function setValue<K extends keyof DoseInputs>(key: K, value: DoseInputs[K]) {
    onChange({ ...farm, doses: { ...doses, [key]: value } });
  }
  function numberField(key: DoseField, max = 1_000_000) {
    return (
      <div>
        <label className="field-label" htmlFor={`dose-${key}`}>
          {fields[key]}
        </label>
        <input
          id={`dose-${key}`}
          type="number"
          min="0"
          max={max}
          step="any"
          value={doses[key] ?? ""}
          placeholder="Sin dato"
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
      <summary>Calcular cantidades de cal y fertilizante</summary>
      <p className="field-help">
        Copia el requerimiento que calculó tu técnico y el porcentaje de la etiqueta. La cantidad
        resultante se obtiene al dividir el requerimiento por el porcentaje expresado como fracción.
      </p>
      {numberField("area")}
      <fieldset>
        <legend>Cal agrícola</legend>
        {numberField("limeEquivalent")}
        {numberField("limeEfficiency", 100)}
        <DoseValue label="Cal agrícola" value={lime} />
        {!lime && (
          <p className="field-help">
            Completa el requerimiento de CaCO₃ y el porcentaje del producto.
          </p>
        )}
      </fieldset>
      <fieldset>
        <legend>Fertilizante</legend>
        <label className="field-label" htmlFor="dose-nutrient">
          Nutriente, en la misma forma que indica la etiqueta
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
          <option value="">Selecciona un nutriente</option>
          <option value="N">Nitrógeno (N)</option>
          <option value="P₂O₅">Fósforo expresado como P₂O₅</option>
          <option value="K₂O">Potasio expresado como K₂O</option>
        </select>
        {numberField("nutrientRequirement")}
        {numberField("nutrientContent", 100)}
        <DoseValue label="Fertilizante" value={fertilizer} />
        {!fertilizer && (
          <p className="field-help">
            Selecciona un nutriente y completa el requerimiento y el porcentaje.
          </p>
        )}
      </fieldset>
      <p className="field-help">
        Confirma con el técnico el producto, la forma de aplicación y el área tratada.
      </p>
      <a className="text-button" href={DOSE_SOURCE} target="_blank" rel="noreferrer">
        Manual INIA, capítulos 9 y 10
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
  if (!value) return null;
  return (
    <p className="dose-result" role="status">
      <strong>
        {label} · {formatKg.format(value.perHa)} kg/ha
      </strong>
      {value.total !== null && <> · {formatKg.format(value.total)} kg para el área indicada</>}
    </p>
  );
}
