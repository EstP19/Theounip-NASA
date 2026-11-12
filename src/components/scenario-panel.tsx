import { ArrowUpRight, Check, Sprout } from "lucide-react";
import { DOSE_SOURCE } from "@/lib/doses";
import { EVIDENCE } from "@/lib/evidence";
import type { createGuide } from "@/lib/guide";
import { GOALS } from "@/lib/plot-options";
import type { EvidenceId } from "@/lib/types";
import { DoseValue } from "./dose-calculator";

function SourceLink({ id }: { id: EvidenceId }) {
  const source = EVIDENCE.find((item) => item.id === id);
  if (!source) return null;
  return (
    <a href={source.url} target="_blank" rel="noreferrer" title={source.section ?? source.title}>
      {source.shortName ?? source.organization}
      <ArrowUpRight size={13} aria-hidden="true" />
    </a>
  );
}

export function ScenarioPanel({
  guide,
  plotName,
}: {
  guide: NonNullable<ReturnType<typeof createGuide>>;
  plotName: string;
}) {
  return (
    <section className="scenario-section" id="escenarios" aria-labelledby="guide-title">
      <section className="panel action-panel farm-guide">
        <div className="section-heading">
          <div>
            <span className="eyebrow">GUÍA PASO A PASO</span>
            <h2 id="guide-title">{guide.title}</h2>
            {plotName && <p className="field-help">Parcela: {plotName}</p>}
          </div>
          <Sprout size={22} aria-hidden="true" />
        </div>
        {guide.goals.length > 0 && (
          <p className="timeline-intro">
            <strong>Objetivos</strong> · {guide.goals.map((goal) => GOALS[goal]).join(" · ")}
          </p>
        )}
        <div className="timeline">
          {guide.stages.map((stage) => (
            <div className="timeline-stage" key={stage.period}>
              <div className="timeline-date">
                <span>{stage.period}</span>
                <i />
              </div>
              <div>
                <h3>{stage.label}</h3>
                <ol className="timeline-tasks">
                  {stage.tasks.map((task) => (
                    <li key={task.title}>
                      <strong>{task.title}</strong>
                      {task.basedOn && <p className="timeline-basis">{task.basedOn}</p>}
                      <p>{task.reason}</p>
                      <div className="timeline-sources">
                        {[task.evidence, ...(task.supportingEvidence ?? [])].map((id) => (
                          <SourceLink key={id} id={id} />
                        ))}
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="timeline-checkpoint">
                  <strong>
                    <Check size={14} aria-hidden="true" /> Antes de seguir
                  </strong>
                  <p>{stage.checkpoint.reason}</p>
                  <div className="timeline-sources">
                    <SourceLink id={stage.checkpoint.evidence} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {(guide.doses.lime || guide.doses.fertilizer) && (
          <section className="guide-dose-summary">
            <h3>Cantidades estimadas para revisar con tu técnico</h3>
            <DoseValue label="Cal agrícola" value={guide.doses.lime} />
            <DoseValue
              label={`Fertilizante · ${guide.nutrient ?? ""}`}
              value={guide.doses.fertilizer}
            />
            <a className="text-button" href={DOSE_SOURCE} target="_blank" rel="noreferrer">
              Manual INIA, capítulos 9 y 10
            </a>
          </section>
        )}
        <div className="guide-notes">
          <h3>Datos por confirmar</h3>
          {guide.missing.length > 0 && <p>{guide.missing.join(" · ")}</p>}
          {guide.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      </section>
    </section>
  );
}
