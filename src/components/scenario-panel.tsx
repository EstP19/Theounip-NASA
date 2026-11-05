"use client";

import {
  ArrowUpRight,
  ArrowRight,
  Leaf,
  Layers3,
  Sprout,
  Check,
  Info,
  ShieldAlert,
  Clock3,
} from "lucide-react";
import type { EvidenceId, Horizon, ScenarioResult } from "@/lib/types";

type Props = {
  horizon: Horizon;
  result: ScenarioResult | null;
  selected: string;
  onHorizon: (horizon: Horizon) => void;
  onSelect: (id: string) => void;
  onEvidence: (id: EvidenceId) => void;
};

export function ScenarioPanel({
  horizon,
  result,
  selected,
  onHorizon,
  onSelect,
  onEvidence,
}: Props) {
  const active = result?.scenarios.find((s) => s.id === selected) ?? result?.scenarios[0];
  return (
    <section className="scenario-section" id="escenarios">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">TUS OPCIONES</span>
          <h2>¿Qué camino te gustaría explorar?</h2>
          <p>Elige una opción para ver sus pasos. Puedes cambiar de idea y comparar.</p>
        </div>
        <div className="horizon-control" role="group" aria-label="Horizonte del escenario">
          {([3, 5, 10] as const).map((n) => (
            <button key={n} aria-pressed={horizon === n} onClick={() => onHorizon(n)}>
              {n} años
            </button>
          ))}
        </div>
      </div>
      {!result ? (
        <div className="notice warning" role="alert">
          <ShieldAlert size={20} />
          <div>
            <strong>Revisa los valores ingresados</strong>
            <p>
              El pH debe estar entre 0 y 14; la materia orgánica, entre 0 y 100%. Completa los
              campos con valores válidos.
            </p>
          </div>
        </div>
      ) : result.blocked ? (
        <div className="notice warning" role="alert">
          <ShieldAlert size={22} />
          <div>
            <strong>Conservar el bosque es el primer paso</strong>
            <p>{result.warnings[0]}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="scenario-cards">
            {result.scenarios.map((scenario, i) => {
              const Icon = i === 0 ? Layers3 : i === 1 ? Leaf : Sprout;
              const isActive = active?.id === scenario.id;
              return (
                <button
                  className={`scenario-card ${isActive ? "active" : ""}`}
                  key={scenario.id}
                  onClick={() => onSelect(scenario.id)}
                  aria-pressed={isActive}
                >
                  <div className="scenario-top">
                    <span className="scenario-icon">
                      <Icon size={21} />
                    </span>
                    <span className="selection-circle">
                      {isActive ? <Check size={11} /> : null}
                    </span>
                  </div>
                  <h3>{scenario.title}</h3>
                  <p>{scenario.description}</p>
                  <div className="scenario-effort">
                    <Clock3 size={13} />
                    {scenario.effort}
                  </div>
                  <div className="scenario-effects">
                    {scenario.effects.map((effect) => (
                      <div key={effect.title}>
                        <span>{effect.title}</span>
                        <strong>{effect.text}</strong>
                      </div>
                    ))}
                  </div>
                  <span className="scenario-explore">
                    {isActive ? "Escenario seleccionado" : "Explorar este escenario"}
                    <ArrowRight size={15} />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="scenario-footnote">
            <Info size={15} />
            <p>
              Cada finca es diferente. Estas ideas te ayudan a planear; los cambios se conocen al
              observar tu cultivo con el tiempo.
            </p>
          </div>
          {active ? (
            <div className="plan-layout" aria-live="polite">
              <section className="panel action-panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">PASO A PASO</span>
                    <h3>
                      {active.title} · {horizon} años
                    </h3>
                  </div>
                  <Sprout size={22} />
                </div>
                <div className="timeline">
                  {active.stages.map((stage) => (
                    <div className="timeline-stage" key={stage.year}>
                      <div className="timeline-date">
                        <span>{stage.year === 0 ? "Inicio" : `Año ${stage.year}`}</span>
                        <i />
                      </div>
                      <div>
                        <h4>{stage.label}</h4>
                        <ul>
                          {stage.actions.map((action) => (
                            <li key={action}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="panel reasoning-panel">
                <span className="eyebrow">IDEAS PARA TU FINCA</span>
                <h3>¿Por dónde puedes empezar?</h3>
                {active.actions.map((action, i) => (
                  <details key={action.title} open={i === 0}>
                    <summary>
                      <span>{action.title}</span>
                      {action.pending ? (
                        <span className="pending-dot" title="Necesita información o validación" />
                      ) : null}
                    </summary>
                    <p>{action.reason}</p>
                    <button className="text-button" onClick={() => onEvidence(action.evidence)}>
                      De dónde viene esta idea <ArrowUpRight size={13} />
                    </button>
                  </details>
                ))}
              </section>
            </div>
          ) : null}
          <div className="review-grid">
            <div className="notice">
              <Info size={18} />
              <div>
                <strong>
                  {result.missing.length
                    ? "Puedes seguir enriqueciendo tu plan"
                    : "Ya tienes una base para empezar"}
                </strong>
                <p>
                  {result.missing.length
                    ? result.missing.join(" · ")
                    : "Conserva los resultados y verifica su origen antes de decidir."}
                </p>
              </div>
            </div>
            <div className="notice caution">
              <ShieldAlert size={18} />
              <div>
                <strong>Para tener en cuenta</strong>
                {result.warnings.map((w) => (
                  <p key={w}>{w}</p>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
