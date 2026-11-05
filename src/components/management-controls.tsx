"use client";

import { Check, Leaf, ArrowUpRight } from "lucide-react";
import { SPECIES } from "@/lib/evidence";
import type { FarmInput, Horizon } from "@/lib/types";

export function ManagementControls({
  farm,
  horizon,
  onChange,
  onHorizon,
  onEvidence,
}: {
  farm: FarmInput;
  horizon: Horizon;
  onChange: (farm: FarmInput) => void;
  onHorizon: (horizon: Horizon) => void;
  onEvidence: () => void;
}) {
  return (
    <section className="panel management-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">A TU RITMO</span>
          <h2>¿Qué te gustaría explorar?</h2>
        </div>
        <Leaf size={22} />
      </div>
      <p className="friendly-intro">
        Puedes elegir árboles que den sombra y plantas que ayuden a cubrir el suelo. Son ideas para
        revisar con alguien que conozca tu finca.
      </p>
      <fieldset className="species-options">
        <legend>
          Plantas que te interesan <span>Opcional</span>
        </legend>
        {SPECIES.map((s) => (
          <label key={s.id} className={farm.species.includes(s.id) ? "chosen" : ""}>
            <input
              type="checkbox"
              checked={farm.species.includes(s.id)}
              onChange={(e) =>
                onChange({
                  ...farm,
                  species: e.target.checked
                    ? [...farm.species, s.id]
                    : farm.species.filter((id) => id !== s.id),
                })
              }
            />
            <span className="plant-check">
              {farm.species.includes(s.id) ? <Check size={13} /> : null}
            </span>
            <span>
              <strong>{s.name}</strong>
              <small>{s.kind === "Cobertura" ? "Para cubrir el suelo" : "Para dar sombra"}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <button className="text-button" onClick={onEvidence}>
        Conocer estas plantas <ArrowUpRight size={14} />
      </button>
      <div className="planning-years">
        <h3>¿Hasta cuándo quieres planear?</h3>
        <p>Puedes empezar con 3 años y cambiarlo después.</p>
        <div className="horizon-control" role="group" aria-label="Tiempo del plan">
          {([3, 5, 10] as const).map((n) => (
            <button key={n} aria-pressed={horizon === n} onClick={() => onHorizon(n)}>
              {n} años
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
