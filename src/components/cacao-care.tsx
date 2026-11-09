"use client";

import { ArrowUpRight, Download, Sprout } from "lucide-react";
import { EVIDENCE } from "@/lib/evidence";
import type { EvidenceId, FarmInput } from "@/lib/types";

function GuideSource({ id }: { id: EvidenceId }) {
  const source = EVIDENCE.find((item) => item.id === id);
  if (!source) return null;
  return (
    <p className="guide-source">
      <a href={source.url} target="_blank" rel="noreferrer">
        {source.title} <ArrowUpRight size={14} aria-hidden="true" />
      </a>
      <small>
        {source.organization} · {source.section}
      </small>
    </p>
  );
}

export function SoilGuide() {
  return (
    <details className="panel cacao-guide soil-guide">
      <summary>Cómo preparar y leer un análisis de suelo</summary>
      <ol>
        <li>
          <strong>Para tomar la muestra.</strong> Separa sectores con condiciones similares de
          suelo, pendiente y manejo. Reúne varias submuestras del mismo sector y etiqueta la muestra
          con el lote, la fecha y la profundidad.
        </li>
        <li>
          <strong>Para leer el informe.</strong> Revisa con el técnico el pH, la materia orgánica y
          la textura. Lleva las unidades y el método del laboratorio para interpretar fósforo,
          potasio y los demás nutrientes.
        </li>
        <li>
          <strong>Para conversar sobre cal y fertilización.</strong> Pide que revisen la acidez y el
          aluminio intercambiable, calcio, magnesio y CIC efectiva. Los cálculos también dependen de
          la capa de suelo, el cultivo y las características del producto. Usa el análisis de tu
          parcela para decidir con un técnico local.
        </li>
      </ol>
      <GuideSource id="inia-suelos" />
    </details>
  );
}

export function CacaoCare({
  farm,
  onChange,
}: {
  farm: FarmInput;
  onChange: (farm: FarmInput) => void;
}) {
  const hasCrop = farm.state === "young" || farm.state === "renewal";
  return (
    <div className="wizard-grid cacao-care-grid">
      <section className="panel cacao-guide">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PARA TU PRÓXIMA VISITA</span>
            <h2>¿Qué has visto en el cultivo?</h2>
          </div>
          <Sprout size={22} aria-hidden="true" />
        </div>
        {hasCrop ? (
          <>
            <p>Puedes responder lo que recuerdes y seguir al plan.</p>
            <label className="field-label" htmlFor="fruiting">
              ¿El cacao tiene frutos ahora?
            </label>
            <select
              id="fruiting"
              value={farm.fruiting ?? "unknown"}
              onChange={(event) =>
                onChange({ ...farm, fruiting: event.target.value as FarmInput["fruiting"] })
              }
            >
              <option value="unknown">No lo sé todavía</option>
              <option value="yes">Sí, ya tiene frutos</option>
              <option value="no">Todavía no tiene frutos</option>
            </select>
            {farm.fruiting !== "no" ? (
              <>
                <label className="field-label" htmlFor="symptoms">
                  ¿Has visto frutos con manchas o daños?
                </label>
                <select
                  id="symptoms"
                  value={farm.symptoms}
                  onChange={(event) =>
                    onChange({ ...farm, symptoms: event.target.value as FarmInput["symptoms"] })
                  }
                >
                  <option value="unknown">No los he revisado</option>
                  <option value="no">No he observado daños</option>
                  <option value="yes">Sí, he visto algunos</option>
                </select>
              </>
            ) : null}
          </>
        ) : (
          <p>
            Estas guías están disponibles para consulta. El plan se ajusta al terreno que elegiste.
          </p>
        )}
        <details className="precise-values">
          <summary>Qué revisar en las plantas</summary>
          <p>
            Fíjate en manchas oscuras, polvillo claro en frutos y brotes agrupados como escobas.
            Anota en qué parte de la planta aparecen y consulta a un técnico si ves daños. Cuando
            haya frutos, organiza la recolección sanitaria semanal indicada por el ICA para
            moniliasis.
          </p>
          <GuideSource id="ica" />
        </details>
        <details className="precise-values">
          <summary>Cómo revisar sombra y poda</summary>
          <p>
            Observa si las copas protegen el cacao y dejan pasar luz y aire. Para árboles jóvenes,
            revisa la formación de la copa. En plantas en producción, revisa el mantenimiento y la
            entrada de luz según las condiciones del lote.
          </p>
          <GuideSource id="fedecacao-poda" />
          <GuideSource id="icco" />
        </details>
      </section>
      <section className="panel cacao-guide">
        <span className="eyebrow">DEL ÁRBOL AL GRANO</span>
        <h2>Cosecha y registro del lote</h2>
        <p>Consulta estas fichas cuando estés preparando una cosecha.</p>
        <details className="precise-values" open>
          <summary>De la mazorca al grano seco</summary>
          <ol>
            <li>
              Cosecha mazorcas maduras y sanas con herramientas limpias, cuidando el sitio donde
              nacen las flores.
            </li>
            <li>
              Registra el inicio y el seguimiento de la fermentación según el protocolo de tu finca
              o asociación.
            </li>
            <li>
              Seca el grano de forma uniforme. Mide la humedad antes de empacar y protégelo de la
              lluvia y de olores fuertes.
            </li>
            <li>
              Selecciona el grano y guárdalo bajo techo, en sacos rotulados y elevados del piso.
            </li>
          </ol>
          <GuideSource id="cosecha" />
        </details>
        <details className="precise-values">
          <summary>Registrar el origen y las labores</summary>
          <p>
            Asigna un código al lote y anota su origen, la fecha y la labor realizada. Conserva el
            código durante la cosecha y el beneficio. En la venta registra fecha, peso del grano
            seco y comprobante.
          </p>
          <p>
            El punto del mapa ayuda a ubicar la finca. Guarda los linderos y documentos del predio
            por separado cuando necesites acreditar su origen.
          </p>
          <GuideSource id="trazabilidad" />
          <a className="text-button" href="/registro-lote-cacao.csv" download>
            <Download size={15} aria-hidden="true" /> Descargar formato de registro
          </a>
        </details>
      </section>
    </div>
  );
}
