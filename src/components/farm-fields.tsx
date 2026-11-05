"use client";

import { SlidersHorizontal, FlaskConical, ArrowUpRight } from "lucide-react";
import type { FarmInput } from "@/lib/types";

type Props = { farm: FarmInput; onChange: (farm: FarmInput) => void };

export function FarmFields({ farm, onChange }: Props) {
  const update = <K extends keyof FarmInput>(key: K, value: FarmInput[K]) =>
    onChange({ ...farm, [key]: value });
  return (
    <section className="panel farm-panel" id="parcela">
      <div className="section-heading">
        <div>
          <span className="eyebrow">02 / TU PARCELA</span>
          <h2>Lo que ves en tu finca</h2>
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
        placeholder="Nombre o referencia del lote"
      />
      <label className="field-label" htmlFor="plot-state">
        Estado del lote
      </label>
      <select
        id="plot-state"
        value={farm.state}
        onChange={(e) => update("state", e.target.value as FarmInput["state"])}
      >
        <option value="young">Cacao joven</option>
        <option value="renewal">Cacao para renovar</option>
        <option value="pasture">Potrero u otro terreno</option>
        <option value="forest">Bosque natural</option>
      </select>
      <fieldset className="friendly-options">
        <legend>¿Cuánta sombra ves en el cultivo?</legend>
        <p>Piensa en la sombra que dan los árboles durante el día.</p>
        <div>
          {[
            { label: "Poca sombra", value: 15 },
            { label: "Algo de sombra", value: 40 },
            { label: "Mucha sombra", value: 75 },
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
        <legend>¿Cómo se ve el suelo entre las plantas?</legend>
        <p>Puede estar descubierto o protegido por hojas, hierba y otras plantas.</p>
        <div>
          {[
            { label: "Casi descubierto", value: 10 },
            { label: "Una parte cubierta", value: 50 },
            { label: "Casi todo cubierto", value: 90 },
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
      <label className="field-label" htmlFor="drainage">
        ¿El agua se queda empozada cuando llueve?
      </label>
      <select
        id="drainage"
        value={farm.drainage}
        onChange={(e) => update("drainage", e.target.value as FarmInput["drainage"])}
      >
        <option value="unknown">No lo sé todavía</option>
        <option value="good">No, el agua sale</option>
        <option value="waterlogged">Sí, quedan charcos</option>
      </select>
      <label className="field-label" htmlFor="priority">
        ¿Qué te gustaría mejorar primero?
      </label>
      <select
        id="priority"
        value={farm.priority}
        onChange={(e) => update("priority", e.target.value as FarmInput["priority"])}
      >
        <option value="soil">Cuidar el suelo</option>
        <option value="water">El manejo del agua</option>
        <option value="renovation">Renovar mi cultivo</option>
      </select>
      <label className="field-label" htmlFor="symptoms">
        ¿Has visto frutos con manchas o daños?
      </label>
      <select
        id="symptoms"
        value={farm.symptoms}
        onChange={(e) => update("symptoms", e.target.value as FarmInput["symptoms"])}
      >
        <option value="unknown">No lo he revisado</option>
        <option value="no">No he observado</option>
        <option value="yes">Sí, he visto algunos</option>
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
        Si tienes un resultado, puedes copiar sus datos. Si todavía no lo tienes, está bien: puedes
        continuar.
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
            ...(e.target.value === "none" ? { ph: null, organicMatter: null } : {}),
          })
        }
      >
        <option value="none">No tengo análisis</option>
        <option value="lab">Sí, tengo un análisis</option>
        <option value="declared">Tengo algunos datos</option>
      </select>
      {farm.soilOrigin === "none" ? (
        <div className="soil-skip-note">
          <span className="note-leaf">
            <FlaskConical size={23} />
          </span>
          <h3>No necesitas tenerlo todo para empezar.</h3>
          <p>
            Usaremos lo que ya nos contaste y las estimaciones del mapa cuando estén disponibles.
            Una muestra de tu finca te ayudará a conocer mejor el suelo.
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
          </div>
          <p className="field-help">
            La materia orgánica viene de restos de plantas y otros seres vivos que se transforman en
            el suelo.
          </p>
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
        </>
      )}
      <button className="text-button" onClick={onEvidence}>
        ¿Para qué sirven estos datos? <ArrowUpRight size={14} />
      </button>
    </section>
  );
}
