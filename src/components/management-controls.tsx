"use client";

import { pathAvailable } from "@/lib/guide";
import { GOALS, PATHS } from "@/lib/plot-options";
import type { FarmInput, Goal, GuidePath } from "@/lib/types";

export function ManagementControls({
  farm,
  onChange,
}: {
  farm: FarmInput;
  onChange: (farm: FarmInput) => void;
}) {
  const goals = farm.goals ?? [];
  return (
    <section className="panel management-panel">
      <fieldset className="decision-options">
        <legend>¿Qué te gustaría lograr en tu finca?</legend>
        <p>Puedes marcar varios objetivos. Los usaremos para preparar tu guía.</p>
        {(Object.entries(GOALS) as [Goal, string][]).map(([goal, label]) => (
          <label key={goal}>
            <input
              type="checkbox"
              checked={goals.includes(goal)}
              onChange={(event) =>
                onChange({
                  ...farm,
                  goals: event.target.checked
                    ? [...goals, goal]
                    : goals.filter((item) => item !== goal),
                })
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}

export function PathPicker({
  farm,
  path,
  onSelect,
}: {
  farm: FarmInput;
  path: GuidePath | null;
  onSelect: (path: GuidePath) => void;
}) {
  if (farm.state === "forest") {
    return (
      <section className="panel guide-paths">
        <h2>Conservar el bosque</h2>
        <p>Elige una finca ya intervenida para preparar un plan de manejo de cacao.</p>
      </section>
    );
  }
  return (
    <section className="panel guide-paths">
      <fieldset className="decision-options">
        <legend>¿Qué camino quieres seguir?</legend>
        <p>Elige un camino para preparar tu guía paso a paso.</p>
        <div className="guide-path-grid">
          {(Object.keys(PATHS) as GuidePath[]).map((id) => {
            const available = pathAvailable(farm, id);
            return (
              <label key={id} className={id === path ? "chosen" : undefined}>
                <input
                  type="radio"
                  name="guide-path"
                  value={id}
                  checked={id === path}
                  disabled={!available}
                  onChange={() => onSelect(id)}
                />
                <span>
                  <strong>{PATHS[id].title}</strong>
                  <small>
                    {available ? PATHS[id].description : "Disponible para fincas con cacao."}
                  </small>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
