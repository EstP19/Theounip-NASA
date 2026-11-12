"use client";

import { GOALS } from "@/lib/plot-options";
import type { FarmInput, Goal } from "@/lib/types";

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
        <legend>¿Qué te gustaría lograr en tu parcela?</legend>
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
