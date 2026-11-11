"use client";

import { SlidersHorizontal, FlaskConical, ArrowUpRight } from "lucide-react";
import type { FarmInput, LabValues } from "@/lib/types";
import { MATERIALS, SYSTEMS, TERRAIN } from "@/lib/plot-options";
import { DoseCalculator } from "./dose-calculator";

type Props = { farm: FarmInput; onChange: (farm: FarmInput) => void };

export function FarmFields({ farm, onChange }: Props) {
  const update = <K extends keyof FarmInput>(key: K, value: FarmInput[K]) =>
    onChange({ ...farm, [key]: value });
  return (
    <section className="panel farm-panel" id="parcela">
      <div className="section-heading">
        <div>
          <span className="eyebrow">02 / TU PARCELA</span>
          <h2>Lo que ves en tu parcela</h2>
        </div>
        <SlidersHorizontal size={19} className="muted" />
      </div>
      <p className="panel-intro">
        Elige lo que más se parezca a tu cultivo. No necesitas saberlo todo.
      </p>
      <label className="field-label" htmlFor="farm-name">
        Nombre de la parcela
      </label>
      <input
        id="farm-name"
        value={farm.name}
        maxLength={100}
        onChange={(e) => update("name", e.target.value)}
        placeholder="Nombre o referencia de la parcela"
      />
      <label className="field-label" htmlFor="plot-state">
        Estado de la parcela
      </label>
      <select
        id="plot-state"
        value={farm.state}
        onChange={(e) => update("state", e.target.value as FarmInput["state"])}
      >
        <option value="young">Cacao joven</option>
        <option value="established">Cacao establecido o en producción</option>
        <option value="renewal">Cacao para renovar</option>
        <option value="pasture">Potrero u otro terreno</option>
        <option value="forest">Bosque natural</option>
      </select>
      <fieldset className="friendly-options">
        <legend>¿Cuánta sombra observas en la parcela?</legend>
        <p>Piensa en la sombra que dan los árboles durante el día.</p>
        <div>
          {[
            { label: "Poca o ninguna sombra", value: 15 },
            { label: "Sombra media", value: 40 },
            { label: "Sombra densa", value: 75 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={
                farm.shadeKnown !== false &&
                (item.value === 15
                  ? farm.shade <= 25
                  : item.value === 40
                    ? farm.shade > 25 && farm.shade <= 55
                    : farm.shade > 55)
              }
              onClick={() => onChange({ ...farm, shade: item.value, shadeKnown: true })}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={farm.shadeKnown === false}
            onClick={() => onChange({ ...farm, shadeKnown: false })}
          >
            No lo sé
          </button>
        </div>
      </fieldset>
      <fieldset className="friendly-options">
        <legend>¿Cómo se ve el suelo de la parcela?</legend>
        <p>Puede estar descubierto o protegido por hojas, hierba y otras plantas.</p>
        <div>
          {[
            { label: "Descubierto", value: 10 },
            { label: "Medianamente cubierto", value: 50 },
            { label: "Casi todo protegido", value: 90 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={
                farm.coverKnown !== false &&
                (item.value === 10
                  ? farm.cover < 30
                  : item.value === 50
                    ? farm.cover >= 30 && farm.cover < 75
                    : farm.cover >= 75)
              }
              onClick={() => onChange({ ...farm, cover: item.value, coverKnown: true })}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={farm.coverKnown === false}
            onClick={() => onChange({ ...farm, coverKnown: false })}
          >
            No lo sé
          </button>
        </div>
      </fieldset>
      <details className="precise-values">
        <summary>Si conoces los porcentajes, puedes ajustarlos aquí</summary>
        <p className="field-help">
          Las opciones anteriores usan aproximaciones. Solo ajusta estos valores si los conoces.
        </p>
        <div className="range-field">
          <label htmlFor="shade">
            Sombra actual{" "}
            <output>{farm.shadeKnown === false ? "Sin estimar" : `${farm.shade}%`}</output>
          </label>
          <input
            id="shade"
            type="range"
            min="0"
            max="100"
            step="5"
            value={farm.shade}
            onChange={(e) => onChange({ ...farm, shade: Number(e.target.value), shadeKnown: true })}
            style={{ "--range-progress": `${farm.shade}%` } as React.CSSProperties}
          />
          <div className="range-scale">
            <span>Abierto</span>
            <span>Sombra densa</span>
          </div>
        </div>
        <div className="range-field">
          <label htmlFor="cover">
            Suelo con cobertura{" "}
            <output>{farm.coverKnown === false ? "Sin estimar" : `${farm.cover}%`}</output>
          </label>
          <input
            id="cover"
            type="range"
            min="0"
            max="100"
            step="5"
            value={farm.cover}
            onChange={(e) => onChange({ ...farm, cover: Number(e.target.value), coverKnown: true })}
            style={{ "--range-progress": `${farm.cover}%` } as React.CSSProperties}
          />
          <div className="range-scale">
            <span>Suelo descubierto</span>
            <span>Cubierto</span>
          </div>
        </div>
      </details>
      <label className="field-label" htmlFor="terrain">
        ¿Cómo es el terreno?
      </label>
      <select
        id="terrain"
        value={farm.terrain ?? "unknown"}
        onChange={(event) => update("terrain", event.target.value as FarmInput["terrain"])}
      >
        {Object.entries(TERRAIN).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <label className="inline-check">
        <input
          type="checkbox"
          checked={farm.nearWater ?? false}
          onChange={(event) => update("nearWater", event.target.checked)}
        />
        Está cerca de un río, quebrada o zona inundable
      </label>
      {farm.state !== "pasture" && farm.state !== "forest" && (
        <>
          <label className="field-label" htmlFor="crop-system">
            Sistema de cultivo
          </label>
          <select
            id="crop-system"
            value={farm.cropSystem ?? "unknown"}
            onChange={(event) =>
              update("cropSystem", event.target.value as FarmInput["cropSystem"])
            }
          >
            {Object.entries(SYSTEMS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="field-label" htmlFor="cacao-material">
            Variedad o tipo de cacao
          </label>
          <select
            id="cacao-material"
            value={farm.cacaoMaterial ?? "unknown"}
            onChange={(event) =>
              update("cacaoMaterial", event.target.value as FarmInput["cacaoMaterial"])
            }
          >
            {Object.entries(MATERIALS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="field-label" htmlFor="cacao-name">
            Variedad o clon, si lo conoces
          </label>
          <input
            id="cacao-name"
            value={farm.cacaoName ?? ""}
            maxLength={60}
            placeholder="Ej. CCN-51 o variedad local"
            onChange={(event) => update("cacaoName", event.target.value)}
          />
        </>
      )}
      <label className="field-label" htmlFor="drainage">
        ¿Quedan charcos después de llover? (opcional)
      </label>
      <select
        id="drainage"
        value={farm.drainage}
        onChange={(event) => update("drainage", event.target.value as FarmInput["drainage"])}
      >
        <option value="unknown">No lo sé todavía</option>
        <option value="good">No, el agua sale</option>
        <option value="waterlogged">Sí, quedan charcos</option>
      </select>
      <p className="field-help">
        Tus respuestas son aproximadas. Podrás cambiarlas cuando conozcas mejor el cultivo.
      </p>
    </section>
  );
}

export function SoilFields({ farm, onChange, onEvidence }: Props & { onEvidence: () => void }) {
  const updateNumber = (key: "ph" | "organicMatter", text: string) =>
    onChange({ ...farm, [key]: text === "" ? null : Number(text) });
  const setLab = <K extends keyof LabValues>(key: K, value: LabValues[K]) =>
    onChange({ ...farm, lab: { ...farm.lab, [key]: value } });
  const labFields = [
    ["aluminium", "Aluminio intercambiable", "cmolc/kg"],
    ["aluminiumSaturation", "Saturación de aluminio", "%"],
    ["calcium", "Calcio", "cmolc/kg"],
    ["magnesium", "Magnesio", "cmolc/kg"],
    ["cice", "Capacidad de intercambio catiónico efectiva (CICE)", "cmolc/kg"],
  ] as const;
  return (
    <section className="panel soil-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">LO QUE SABEMOS DEL SUELO</span>
          <h2>¿Tienes un análisis de suelo?</h2>
        </div>
        <FlaskConical size={22} className="muted" />
      </div>
      <p className="friendly-intro">
        Copia los valores y las unidades de tu informe. Si tienes solo algunos datos, ingresa los
        que conoces.
      </p>
      <label className="field-label" htmlFor="soil-origin">
        Elige una opción
      </label>
      <select
        id="soil-origin"
        value={farm.soilOrigin}
        onChange={(e) =>
          onChange({
            ...farm,
            soilOrigin: e.target.value as FarmInput["soilOrigin"],
            ...(e.target.value === "none"
              ? { ph: null, organicMatter: null, lab: undefined, doses: undefined }
              : { lab: farm.lab ?? {} }),
          })
        }
      >
        <option value="none">No tengo análisis</option>
        <option value="lab">Sí, tengo el análisis completo</option>
        <option value="declared">Tengo solo algunos datos</option>
      </select>
      {farm.soilOrigin === "none" ? (
        <div className="soil-skip-note">
          <span className="note-leaf">
            <FlaskConical size={23} />
          </span>
          <h3>No necesitas tenerlo todo para empezar.</h3>
          <p>
            Usaremos lo que ya nos contaste y las estimaciones del mapa cuando estén disponibles.
            Una muestra de tu parcela te ayudará a conocer mejor el suelo.
          </p>
        </div>
      ) : (
        <>
          <div className="soil-inputs">
            <div>
              <label htmlFor="soil-ph">
                Acidez (pH)<span>0–14</span>
              </label>
              <input
                id="soil-ph"
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={farm.ph ?? ""}
                onChange={(e) => updateNumber("ph", e.target.value)}
                placeholder="Sin dato"
              />
              <small>Copia el valor de tu análisis.</small>
            </div>
            <div>
              <label htmlFor="soil-om">
                Materia orgánica<span>%</span>
              </label>
              <input
                id="soil-om"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={farm.organicMatter ?? ""}
                onChange={(e) => updateNumber("organicMatter", e.target.value)}
                placeholder="Sin dato"
              />
              <small>Déjalo vacío si no aparece.</small>
            </div>
            <LabNumber
              id="phosphorus"
              label="Fósforo disponible"
              unit="mg/kg (ppm)"
              value={farm.lab?.phosphorus}
              onChange={(value) => setLab("phosphorus", value)}
            />
            <LabNumber
              id="potassium"
              label="Potasio"
              value={farm.lab?.potassium}
              onChange={(value) => setLab("potassium", value)}
            />
          </div>
          <label className="field-label" htmlFor="potassium-unit">
            Unidad del potasio según tu informe
          </label>
          <select
            id="potassium-unit"
            value={farm.lab?.potassiumUnit ?? "cmolc/kg"}
            onChange={(event) =>
              setLab("potassiumUnit", event.target.value as LabValues["potassiumUnit"])
            }
          >
            <option value="cmolc/kg">cmol(+)/kg o meq/100 g</option>
            <option value="mg/kg">mg/kg o ppm</option>
          </select>
          {farm.soilOrigin === "lab" && (
            <p className="field-help">
              Ingresa pH, fósforo, potasio y materia orgánica. Si el informe trae carbono orgánico
              en lugar de materia orgánica, regístralo en los datos adicionales.
            </p>
          )}
          <details className="precise-values">
            <summary>Agregar datos adicionales del análisis</summary>
            <div className="soil-inputs">
              <LabNumber
                id="organicCarbon"
                label="Carbono orgánico"
                unit="g/kg"
                value={farm.lab?.organicCarbon}
                onChange={(value) => setLab("organicCarbon", value)}
              />
              {labFields.map(([id, label, unit]) => (
                <LabNumber
                  key={id}
                  id={id}
                  label={label}
                  unit={unit}
                  value={farm.lab?.[id]}
                  max={id === "aluminiumSaturation" ? 100 : undefined}
                  onChange={(value) => setLab(id, value)}
                />
              ))}
            </div>
            <label className="field-label" htmlFor="soil-texture">
              Textura del suelo
            </label>
            <input
              id="soil-texture"
              maxLength={50}
              value={farm.lab?.texture ?? ""}
              placeholder="Ej. Franco arcilloso"
              onChange={(event) => setLab("texture", event.target.value)}
            />
          </details>
          {farm.soilOrigin === "lab" ? (
            <details className="precise-values">
              <summary>Agregar fecha y profundidad de la muestra</summary>
              <div className="field-row">
                <div>
                  <label className="field-label" htmlFor="soil-date">
                    ¿Cuándo tomaron la muestra?
                  </label>
                  <input
                    id="soil-date"
                    type="date"
                    value={farm.soilDate}
                    onChange={(e) => onChange({ ...farm, soilDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="soil-depth">
                    Profundidad que indica el análisis
                  </label>
                  <input
                    id="soil-depth"
                    maxLength={40}
                    value={farm.soilDepth}
                    onChange={(e) => onChange({ ...farm, soilDepth: e.target.value })}
                    placeholder="Ej. 0–20 cm"
                  />
                </div>
              </div>
            </details>
          ) : null}
          <DoseCalculator farm={farm} onChange={onChange} />
        </>
      )}
      <button className="text-button" onClick={onEvidence}>
        ¿Para qué sirven estos datos? <ArrowUpRight size={14} />
      </button>
    </section>
  );
}

function LabNumber({
  id,
  label,
  unit,
  value,
  onChange,
  max = 1_000_000,
}: {
  id: string;
  label: string;
  unit?: string;
  value?: number | null;
  onChange: (value: number | null) => void;
  max?: number;
}) {
  return (
    <div>
      <label htmlFor={`lab-${id}`}>
        {label} {unit && <span>{unit}</span>}
      </label>
      <input
        id={`lab-${id}`}
        type="number"
        min="0"
        max={max}
        step="any"
        value={value ?? ""}
        placeholder="Sin dato"
        onChange={(event) =>
          onChange(event.target.value === "" ? null : event.target.valueAsNumber)
        }
      />
    </div>
  );
}
