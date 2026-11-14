"use client";
import { useLanguage } from "@/components/i18n-provider";

import { GOALS } from "@/lib/plot-options";
import type { FarmInput, Goal } from "@/lib/types";

export function ManagementControls({
  farm,
  onChange,
}: {
  farm: FarmInput;
  onChange: (farm: FarmInput) => void;
}) {
  const { t } = useLanguage();
  const goals = farm.goals ?? [];
  return (
    <section className="panel management-panel">
      <fieldset className="decision-options">
        <legend>{t("¿Qué te gustaría lograr en tu parcela?")}</legend>
        <p>{t("Puedes marcar varios objetivos. Los usaremos para preparar tu guía.")}</p>
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
            <span>{t(label)}</span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}
