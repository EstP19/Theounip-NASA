"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ManagementControls } from "./management-controls";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CloudRain,
  Compass,
  Crosshair,
  ExternalLink,
  Leaf,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Satellite,
  Save,
  X,
} from "lucide-react";
import type { ClimateContext, Coordinates, EvidenceId, FarmInput } from "@/lib/types";
import {
  DEFAULT_FARM,
  DEMO_POINT,
  hasRequiredLabValues,
  inPilotRegion,
  isFarmInput,
  parseCoordinates,
} from "@/lib/validation";
import { EVIDENCE, SPECIES } from "@/lib/evidence";
import { createAutomaticGuide, farmForPlan, shouldAskHealthQuestions } from "@/lib/guide";
import { SYSTEMS, TERRAIN } from "@/lib/plot-options";
import { ClimateChart } from "./climate-chart";
import { FarmFields, SoilFields } from "./farm-fields";
import { ScenarioPanel } from "./scenario-panel";
import { useSoilContext } from "./use-soil-context";
import { SoilContextPanel } from "./soil-context-panel";
import { HarvestGuide, HealthQuestions, SoilGuide } from "./cacao-care";
import universityMark from "@/app/icon.jpeg";
import universityLogo from "@/assets/uniputumayo-logo.jpeg";
import renTechLogo from "@/assets/ren-tech-logo.webp";

const FarmMap = dynamic(() => import("./farm-map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <Compass size={28} />
      <span>Preparando tu territorio…</span>
    </div>
  ),
});
const STORAGE_KEY = "suelovivo:scenario:v1";

function samePoint(a: Coordinates, b: Coordinates) {
  return a.lat === b.lat && a.lon === b.lon;
}

const STEPS = [
  {
    path: "/ubicacion",
    label: "Ubicación",
    title: "Empecemos por tu parcela",
    description: "Busca el lugar en el mapa. Te acompañamos paso a paso.",
  },
  {
    path: "/parcela",
    label: "Tu parcela",
    title: "Cuéntanos sobre tu parcela",
    description: "Describe la parcela y cómo manejas el cacao.",
  },
  {
    path: "/manejo",
    label: "El suelo",
    title: "Conozcamos un poco más",
    description: "Agrega los resultados de suelo que tengas y elige tus objetivos.",
  },
  {
    path: "/resultados",
    label: "Tu plan",
    title: "Un plan para seguir creciendo",
    description: "Sigue las tareas para tus objetivos y revisa qué comprobar en cada etapa.",
  },
];
const LAST_STEP = STEPS.length - 1;

export function Workspace({
  initialContext,
  children,
}: {
  initialContext: ClimateContext;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const step = Math.max(
    0,
    STEPS.findIndex((item) => item.path === pathname),
  );
  const [stepError, setStepError] = useState("");
  const stepHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    setStepError("");
    stepHeading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  const [point, setPoint] = useState<Coordinates>(DEMO_POINT);
  const [latText, setLatText] = useState(String(DEMO_POINT.lat));
  const [lonText, setLonText] = useState(String(DEMO_POINT.lon));
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [year, setYear] = useState(2025);
  const [context, setContext] = useState<ClimateContext | null>(initialContext);
  const [farm, setFarm] = useState<FarmInput>({ ...DEFAULT_FARM, species: [] });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [focusEvidence, setFocusEvidence] = useState<EvidenceId | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const geoId = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validFarm = isFarmInput(farm);
  const readyFarm = validFarm && hasRequiredLabValues(farm);
  const soilContext = useSoilContext(point, draftReady);
  const guide =
    step === LAST_STEP && draftReady && readyFarm
      ? createAutomaticGuide(farm, context, soilContext.soil)
      : null;
  const soilPanel = <SoilContextPanel {...soilContext} farm={farm} onRetry={soilContext.retry} />;

  useEffect(() => {
    try {
      const draft = JSON.parse(sessionStorage.getItem("suelovivo:working:v2") ?? "null");
      const restoredPoint =
        draft?.point && parseCoordinates(String(draft.point.lat), String(draft.point.lon));
      if (
        draft?.version === 2 &&
        isFarmInput(draft.farm) &&
        restoredPoint &&
        [2023, 2024, 2025].includes(draft.year)
      ) {
        setFarm(draft.farm);
        setPoint(restoredPoint);
        setLatText(String(restoredPoint.lat));
        setLonText(String(restoredPoint.lon));
        setYear(draft.year);
        if (!samePoint(restoredPoint, DEMO_POINT) || draft.year !== 2025) setContext(null);
      }
    } catch {
      /* El almacenamiento es opcional. */
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady || !validFarm) return;
    try {
      sessionStorage.setItem(
        "suelovivo:working:v2",
        JSON.stringify({ version: 2, farm, point, year }),
      );
    } catch {
      /* Se mantiene el guardado manual y la descarga. */
    }
  }, [draftReady, validFarm, farm, point, year]);

  useEffect(() => {
    try {
      setHasSaved(!!localStorage.getItem(STORAGE_KEY));
    } catch {
      /* El guardado es opcional. */
    }
    return () => {
      controller.current?.abort();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    let expanded: HTMLDetailsElement[] = [];
    const beforePrint = () => {
      expanded = [
        ...document.querySelectorAll<HTMLDetailsElement>(".plan-document details:not([open])"),
      ];
      expanded.forEach((element) => {
        element.open = true;
      });
    };
    const afterPrint = () => {
      expanded.forEach((element) => {
        element.open = false;
      });
      expanded = [];
    };
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  };
  const invalidate = useCallback(() => {
    controller.current?.abort();
    requestId.current++;
    setLoading(false);
    setContext(null);
    setError("");
  }, []);
  const selectPoint = useCallback(
    (next: Coordinates) => {
      invalidate();
      geoId.current++;
      setLocating(false);
      setAccuracy(null);
      setPoint(next);
      setLatText(String(next.lat));
      setLonText(String(next.lon));
    },
    [invalidate],
  );

  function openEvidence(id?: EvidenceId) {
    setFocusEvidence(id ?? null);
    dialog.current?.showModal();
  }

  function loadDemo() {
    selectPoint(DEMO_POINT);
    setYear(2025);
    setContext(initialContext);
    setFarm({ ...DEFAULT_FARM, species: [] });
    notify("Caso ilustrativo de San Miguel cargado. El clima de 2025 proviene de NASA POWER.");
  }

  function applyCoordinates() {
    const next = parseCoordinates(latText, lonText);
    if (!next) {
      setError("Escribe latitud entre −90 y 90 y longitud entre −180 y 180.");
      return;
    }
    selectPoint(next);
    if (!inPilotRegion(next))
      setError("El punto está fuera de la zona de consulta de esta demo: Putumayo y su entorno.");
  }

  function locate() {
    if (!navigator.geolocation) {
      setError(
        "Este navegador no ofrece geolocalización. Marca el punto o escribe las coordenadas.",
      );
      return;
    }
    const id = ++geoId.current;
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (id !== geoId.current) return;
        const next = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lon: Number(position.coords.longitude.toFixed(6)),
        };
        selectPoint(next);
        setAccuracy(Math.round(position.coords.accuracy));
        if (!inPilotRegion(next))
          setError(
            "Tu dispositivo está fuera de la zona piloto. Puedes marcar manualmente la parcela en Putumayo.",
          );
      },
      (problem) => {
        if (id !== geoId.current) return;
        setLocating(false);
        setError(
          problem.code === 1
            ? "No se autorizó la ubicación. Puedes seguir con el mapa o las coordenadas."
            : problem.code === 3
              ? "La ubicación tardó demasiado. Intenta de nuevo o marca la parcela."
              : "No fue posible obtener tu ubicación. Usa el mapa o las coordenadas.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  async function queryClimate() {
    if (!inPilotRegion(point)) {
      setError("Marca una ubicación en Putumayo y su entorno para consultar datos.");
      return;
    }
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/context?${new URLSearchParams({ lat: String(point.lat), lon: String(point.lon), year: String(year) })}`,
        { signal: current.signal },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "No se pudo consultar el contexto ambiental.");
      if (id !== requestId.current) return;
      setContext(body as ClimateContext);
      notify("Datos NASA cargados. La procedencia está disponible en el panel ambiental.");
    } catch (problem) {
      if (id !== requestId.current || current.signal.aborted) return;
      setError(problem instanceof Error ? problem.message : "No se pudieron obtener los datos.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  function save() {
    if (!validFarm) {
      notify("Revisa los datos del suelo antes de guardar.");
      return;
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          farm,
          point,
          year,
          savedAt: new Date().toISOString(),
        }),
      );
      setHasSaved(true);
      notify("Escenario guardado en este navegador.");
    } catch {
      notify("El navegador no permitió guardar. Puedes descargar el escenario.");
    }
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      const restoredPoint =
        saved?.point && parseCoordinates(String(saved.point.lat), String(saved.point.lon));
      if (
        saved?.version !== 1 ||
        !isFarmInput(saved.farm) ||
        !restoredPoint ||
        ![2023, 2024, 2025].includes(saved.year)
      )
        throw new Error("Invalid draft");
      selectPoint(restoredPoint);
      setFarm(saved.farm);
      setYear(saved.year);
      if (samePoint(restoredPoint, DEMO_POINT) && saved.year === 2025) setContext(initialContext);
      notify("Escenario restaurado. Confirma o consulta el contexto de esta ubicación.");
    } catch {
      notify("El escenario guardado no es válido. Puedes empezar con el caso ilustrativo.");
    }
  }

  function exportPlan() {
    if (!guide) {
      notify("Revisa los datos antes de descargar.");
      return;
    }
    const file = {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      point,
      farm: farmForPlan(farm),
      climate: context,
      soil: soilContext.soil,
      guide,
      evidence: EVIDENCE,
      note: "La guía usa observaciones de la parcela, clima histórico y estimaciones de SoilGrids. Las cantidades de producto dependen de los requerimientos técnicos ingresados y las etiquetas.",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `suelovivo-plan-${guide.path}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Escenario descargado con sus datos, reglas y fuentes.");
  }

  async function downloadPdf() {
    if (!guide || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const { createPlanPdf } = await import("@/lib/plan-pdf");
      await createPlanPdf(guide, farm.name).download("suelovivo-tu-plan.pdf");
    } catch {
      notify("No pudimos descargar el PDF. Vuelve a intentarlo o usa Imprimir.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  const draftPoint = parseCoordinates(latText, lonText);
  const coordinateChanged = !draftPoint || !samePoint(draftPoint, point);

  function continueStep() {
    if (step === 0 && (coordinateChanged || !inPilotRegion(point))) {
      setStepError("Marca tu parcela en Putumayo o aplica las coordenadas antes de continuar.");
      return;
    }
    if (step === 2 && !readyFarm) {
      setStepError(
        !validFarm
          ? "Revisa los valores y las unidades del análisis."
          : "Completa pH, materia orgánica o carbono, fósforo y potasio, o elige «Tengo solo algunos datos».",
      );
      return;
    }
    if (step === LAST_STEP - 1 && farm.state === "forest") {
      setStepError("Selecciona una parcela intervenida en el paso «Tu parcela».");
      return;
    }
    router.push(STEPS[Math.min(step + 1, LAST_STEP)].path);
  }

  return (
    <>
      <a className="skip-link" href="#contenido">
        Ir al paso actual
      </a>
      <aside className="side-rail" aria-label="Pasos del plan">
        <Link className="rail-brand" href="/ubicacion" aria-label="Inicio SueloVivo">
          <Image
            src={universityMark}
            alt=""
            width={40}
            height={40}
            className="brand-mark"
            unoptimized
          />
        </Link>
        <nav>
          {STEPS.map((item, i) => (
            <Link
              key={item.path}
              href={item.path}
              className={`rail-link ${step === i ? "active" : ""}`}
              aria-label={item.label}
              aria-current={step === i ? "step" : undefined}
            >
              <span className="rail-step-number">{i + 1}</span>
            </Link>
          ))}
        </nav>
        <button
          className="rail-link rail-bottom-help"
          onClick={() => openEvidence()}
          aria-label="Conocer las fuentes"
        >
          <BookOpen size={20} />
        </button>
      </aside>
      <div className="app-shell wizard-shell">
        <header className="topbar">
          <Link className="wordmark" href="/ubicacion">
            suelo<span>vivo</span>
            <span className="wordmark-divider" />
            <span className="territory">PUTUMAYO</span>
          </Link>
          <div className="topbar-actions">
            <button className="text-button" onClick={() => openEvidence()}>
              De dónde vienen las ideas <ArrowUpRight size={14} />
            </button>
          </div>
        </header>
        <main id="contenido">
          <nav className="wizard-progress" aria-label="Avance del plan">
            <ol>
              {STEPS.map((item, i) => (
                <li key={item.path} className={step === i ? "current" : step > i ? "previous" : ""}>
                  <Link href={item.path} aria-current={step === i ? "step" : undefined}>
                    <span className="step-circle">{i < step ? <Check size={16} /> : i + 1}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <section className="wizard-heading">
            <div>
              <p className="eyebrow">
                PASO {step + 1} DE {STEPS.length}
              </p>
              <h1 ref={stepHeading} tabIndex={-1}>
                {STEPS[step].title}
              </h1>
              <p>{STEPS[step].description}</p>
            </div>
            <picture className="wizard-nature">
              <source
                media="(max-width: 760px)"
                srcSet={universityMark.src}
                width={universityMark.width}
                height={universityMark.height}
              />
              <Image
                src={universityLogo}
                alt="Institución Universitaria del Putumayo"
                unoptimized
              />
            </picture>
          </section>
          <div className="workspace-toolbar">
            <div className="toolbar-location">
              <span className="status-dot" />
              <strong>
                {samePoint(point, DEMO_POINT) ? "Ejemplo · San Miguel" : farm.name || "Tu parcela"}
              </strong>
              {context ? (
                <>
                  <span className="toolbar-divider" />
                  <span>Clima de {context.year}</span>
                </>
              ) : null}
            </div>
            <div className="draft-tools">
              {hasSaved ? (
                <button className="text-button" onClick={restore}>
                  Recuperar lo guardado
                </button>
              ) : null}
              <button
                className="text-button"
                onClick={() => {
                  loadDemo();
                  router.push("/ubicacion");
                }}
              >
                <RotateCcw size={13} /> Empezar con un ejemplo
              </button>
            </div>
          </div>
          {step === 0 ? (
            <>
              <section className="panel project-intro" aria-label="Sobre SueloVivo">
                <p>
                  La Institución Universitaria del Putumayo desarrolló SueloVivo para acompañar a
                  quienes cultivan cacao o quieren sembrarlo en parcelas intervenidas de la
                  Amazonía. La herramienta combina tus observaciones con registros de NASA POWER y
                  estimaciones de SoilGrids para preparar una guía de manejo que puedas revisar con
                  un profesional.
                </p>
              </section>
              <section className="panel location-panel location-step" id="ubicacion">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">01 / BUSQUEMOS EL LUGAR</span>
                    <h2>Busca tu parcela en el mapa</h2>
                  </div>
                  <span className="step-icon">
                    <MapPin size={19} />
                  </span>
                </div>
                <FarmMap point={point} accuracy={accuracy} onChange={selectPoint} />
                <div className="location-controls">
                  <button
                    className="secondary-button geo-button"
                    onClick={locate}
                    disabled={locating}
                  >
                    {locating ? (
                      <LoaderCircle size={16} className="spin" />
                    ) : (
                      <Crosshair size={16} />
                    )}
                    {locating ? "Buscando ubicación…" : "Estoy en la parcela: usar mi ubicación"}
                  </button>
                  <p className="field-help">
                    Si estás en la parcela, usa la ubicación del dispositivo. También puedes
                    marcarla manualmente.
                  </p>
                  <details className="precise-values coordinate-details">
                    <summary>Ubicar con coordenadas (opcional)</summary>
                    <div className="coordinate-row">
                      <div>
                        <label htmlFor="latitude">Latitud</label>
                        <input
                          id="latitude"
                          inputMode="decimal"
                          value={latText}
                          onChange={(e) => setLatText(e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="longitude">Longitud</label>
                        <input
                          id="longitude"
                          inputMode="decimal"
                          value={lonText}
                          onChange={(e) => setLonText(e.target.value)}
                        />
                      </div>
                      <button
                        className="coordinate-button"
                        disabled={!coordinateChanged}
                        onClick={applyCoordinates}
                        aria-label="Aplicar coordenadas"
                        title="Aplicar coordenadas"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </div>
                    {coordinateChanged ? (
                      <p className="inline-warning">
                        Pulsa la flecha para aplicar las coordenadas editadas.
                      </p>
                    ) : null}
                    {accuracy !== null ? (
                      <p className="field-help">
                        Precisión aproximada del dispositivo: {accuracy} m. Confirma el punto en el
                        mapa.
                      </p>
                    ) : null}
                  </details>
                  <div className="query-row">
                    <select
                      value={year}
                      aria-label="Año del contexto climático"
                      onChange={(e) => {
                        invalidate();
                        setYear(Number(e.target.value));
                      }}
                    >
                      <option value="2025">Año 2025</option>
                      <option value="2024">Año 2024</option>
                      <option value="2023">Año 2023</option>
                    </select>
                    <button
                      className="primary-button"
                      onClick={queryClimate}
                      disabled={loading || coordinateChanged}
                    >
                      {loading ? (
                        <LoaderCircle size={15} className="spin" />
                      ) : (
                        <Satellite size={16} />
                      )}
                      {loading ? "Buscando datos…" : "Conocer el clima"}
                    </button>
                  </div>
                  {error ? (
                    <div className="inline-error" role="alert">
                      {error}
                      <button className="text-button" onClick={loadDemo}>
                        Abrir caso ilustrativo <ArrowRight size={13} />
                      </button>
                    </div>
                  ) : null}
                </div>
              </section>
              <h2 className="environment-heading">Factores edafoclimáticos de la parcela</h2>
              <div className="wizard-grid environmental-panels">
                <section className="panel climate-panel" aria-busy={loading}>
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">EL CLIMA DE LA ZONA</span>
                      <h2>Conozcamos el clima</h2>
                    </div>
                    <span className="data-badge">
                      <Satellite size={12} /> NASA POWER
                    </span>
                  </div>
                  {context ? (
                    <>
                      <ClimateChart
                        key={`${context.coordinates.lat}:${context.coordinates.lon}:${context.year}:${context.retrievedAt}`}
                        context={context}
                      />
                      <details className="provenance">
                        <summary>
                          <span className="provenance-dot" />
                          {context.mode === "snapshot"
                            ? "Datos de un ejemplo en San Miguel"
                            : "Datos consultados para el lugar elegido"}
                          <span>
                            Ver de dónde vienen los datos <ArrowDown size={12} />
                          </span>
                        </summary>
                        <dl>
                          <div>
                            <dt>Coordenada consultada</dt>
                            <dd>
                              {context.coordinates.lat}, {context.coordinates.lon}
                            </dd>
                          </div>
                          <div>
                            <dt>Periodo</dt>
                            <dd>01 ene – 31 dic {context.year}</dd>
                          </div>
                          <div>
                            <dt>Resolución</dt>
                            <dd>{context.resolution}</dd>
                          </div>
                          <div>
                            <dt>Fuente y versión</dt>
                            <dd>
                              {context.sources.join(" · ")} · API {context.apiVersion}
                            </dd>
                          </div>
                          <div>
                            <dt>Registro de consulta</dt>
                            <dd>
                              {new Intl.DateTimeFormat("es-CO", {
                                timeZone: "America/Bogota",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }).format(new Date(context.retrievedAt))}{" "}
                              (Colombia) · estándar de datos {context.timeStandard}
                            </dd>
                          </div>
                          <div>
                            <dt>Cobertura temporal</dt>
                            <dd>
                              Lluvia {context.coverage.rain}/{context.coverage.expected};
                              temperatura {context.coverage.temperature}/{context.coverage.expected}
                              ; humedad {context.coverage.humidity}/{context.coverage.expected} días
                            </dd>
                          </div>
                        </dl>
                        <a
                          className="text-button"
                          href={context.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir respuesta de NASA <ExternalLink size={12} />
                        </a>
                      </details>
                    </>
                  ) : (
                    <div className="empty-climate">
                      <CloudRain size={38} />
                      <h3>
                        {loading
                          ? "Consultando el contexto regional"
                          : "Un nuevo punto, nuevos datos"}
                      </h3>
                      <p>
                        {loading
                          ? "Estamos solicitando la serie anual a NASA POWER. Puedes seguir describiendo tu parcela."
                          : "Confirma tu ubicación y pulsa Conocer el clima para cargar el clima de este punto."}
                      </p>
                      {loading ? (
                        <span className="loading-line" />
                      ) : (
                        <button
                          className="text-button"
                          onClick={queryClimate}
                          disabled={coordinateChanged}
                        >
                          Consultar esta ubicación <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </section>
                {soilPanel}
              </div>
            </>
          ) : null}
          {step === 1 ? (
            <div className="wizard-grid farm-step">
              <FarmFields farm={farm} onChange={setFarm} />
              <aside className="friendly-aside">
                <span className="aside-illustration">
                  <Leaf size={42} />
                </span>
                <h2>Observa tu parcela</h2>
                <p>
                  No necesitas tener medidas exactas. Elige la opción que más se parezca a lo que
                  observas.
                </p>
                <div className="aside-tip">
                  <strong>¿Hay algo que no sabes?</strong>
                  <p>
                    Puedes indicarlo y seguir. Más adelante podrás regresar y completar la
                    información.
                  </p>
                </div>
                <div className="aside-selected">
                  <MapPin size={16} />
                  <div>
                    <strong>Lugar elegido</strong>
                    <span>
                      {point.lat.toFixed(4)}, {point.lon.toFixed(4)}
                    </span>
                    <Link className="text-button" href="/ubicacion">
                      Cambiar lugar <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          ) : null}
          {step === 2 ? (
            <>
              <section className="panel plot-preview" aria-labelledby="plot-preview-title">
                <h2 id="plot-preview-title">Vista previa edafoclimática de tu parcela</h2>
                <dl>
                  <div>
                    <dt>Ubicación</dt>
                    <dd>
                      {samePoint(point, DEMO_POINT)
                        ? "San Miguel, Putumayo (ejemplo)"
                        : `${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}`}
                    </dd>
                  </div>
                  <div>
                    <dt>Topografía</dt>
                    <dd>{TERRAIN[farm.nearWater ? "nearWater" : (farm.terrain ?? "unknown")]}</dd>
                  </div>
                  <div>
                    <dt>Sistema de cultivo</dt>
                    <dd>
                      {farm.state === "pasture" || farm.state === "forest"
                        ? "Sin cacao establecido"
                        : SYSTEMS[farm.cropSystem ?? "unknown"]}
                    </dd>
                  </div>
                  <div>
                    <dt>Sombra y suelo cubierto</dt>
                    <dd>
                      {farm.shadeKnown === false
                        ? "Sombra por conocer"
                        : `Sombra aprox. ${farm.shade}%`}
                      {" · "}
                      {farm.coverKnown === false
                        ? "Cobertura por conocer"
                        : `Suelo cubierto aprox. ${farm.cover}%`}
                    </dd>
                  </div>
                  <div>
                    <dt>Suelo estimado · SoilGrids</dt>
                    <dd>
                      {soilContext.loading
                        ? "Consultando el mapa…"
                        : `pH ${soilContext.soil?.ph?.mean ?? "sin dato"} · carbono orgánico ${soilContext.soil?.organicCarbon ? `${soilContext.soil.organicCarbon.mean} g/kg` : "sin dato"}`}
                    </dd>
                  </div>
                  <div>
                    <dt>Clima histórico · NASA POWER</dt>
                    <dd>{context ? `Serie de ${context.year}` : "Pendiente de consulta"}</dd>
                  </div>
                </dl>
              </section>
              <div className="wizard-grid soil-step">
                <SoilFields
                  farm={farm}
                  onChange={setFarm}
                  onEvidence={() => openEvidence("inia-suelos")}
                />
                <div className="management-goals">
                  <ManagementControls farm={farm} onChange={setFarm} />
                  {shouldAskHealthQuestions(farm) && (
                    <HealthQuestions farm={farm} onChange={setFarm} />
                  )}
                </div>
              </div>
              <SoilGuide />
            </>
          ) : null}
          {step === LAST_STEP ? (
            <>
              <div className="result-edit-links">
                <Link href="/ubicacion">Cambiar ubicación</Link>
                <Link href="/parcela">Editar parcela</Link>
                <Link href="/manejo">Editar suelo y objetivos</Link>
              </div>
              {guide ? (
                <div className="plan-document">
                  <p className="plan-print-brand">
                    SueloVivo · Institución Universitaria del Putumayo
                  </p>
                  <ScenarioPanel guide={guide} plotName={farm.name} />
                  <HarvestGuide
                    hasFruit={shouldAskHealthQuestions(farm) && farm.fruiting === "yes"}
                  />
                </div>
              ) : (
                <section className="panel guide-unavailable" aria-live="polite">
                  <h2>{!draftReady ? "Cargando tus datos…" : "Completa tu guía"}</h2>
                  {draftReady &&
                    (farm.state === "forest" ? (
                      <p>
                        El bosque natural se conserva. Elige una parcela intervenida para preparar
                        un plan de cacao.
                      </p>
                    ) : (
                      <p>
                        Revisa los campos del análisis o selecciona «Tengo solo algunos datos».{" "}
                        <Link href="/manejo">Volver a El suelo</Link>
                      </p>
                    ))}
                </section>
              )}
              {guide && (
                <section className="save-section">
                  <div className="save-icon">
                    <BookOpen size={23} />
                  </div>
                  <div>
                    <h3>Llévate tu plan</h3>
                    <p>Guárdalo para revisarlo con tu técnico, tu asociación o tu familia.</p>
                  </div>
                  <div className="save-actions">
                    {hasSaved ? (
                      <button className="text-button" onClick={restore}>
                        Restaurar guardado
                      </button>
                    ) : null}
                    <button className="secondary-button" onClick={save} disabled={!validFarm}>
                      <Save size={16} /> Guardar mi plan
                    </button>
                    <button className="secondary-button" onClick={exportPlan}>
                      <ArrowDownToLine size={16} /> Descargar datos (JSON)
                    </button>
                    <button className="text-button" onClick={() => window.print()}>
                      Imprimir
                    </button>
                    <button
                      className="primary-button"
                      onClick={downloadPdf}
                      disabled={downloadingPdf}
                    >
                      <ArrowDownToLine size={16} />{" "}
                      {downloadingPdf ? "Preparando PDF…" : "Descargar PDF"}
                    </button>
                  </div>
                </section>
              )}
            </>
          ) : null}
          {stepError ? (
            <p className="wizard-error" role="alert">
              {stepError}
            </p>
          ) : null}
          <div className="wizard-navigation">
            <div>
              {step > 0 ? (
                <Link className="secondary-button" href={STEPS[step - 1].path}>
                  Volver
                </Link>
              ) : (
                <span className="wizard-small-help">
                  Puedes volver a cualquier paso cuando quieras.
                </span>
              )}
            </div>
            <div>
              {step < LAST_STEP ? (
                <>
                  <span className="next-step-label">Sigue: {STEPS[step + 1].label}</span>
                  <button className="primary-button wizard-next" onClick={continueStep}>
                    {step === LAST_STEP - 1 ? "Ver mi plan" : "Continuar"}
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <Link className="secondary-button" href="/parcela">
                  Seguir probando con mis datos <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </div>
          {step === 0 && !context ? (
            <p className="wizard-small-help">
              Puedes continuar sin el clima. Luego podrás volver y consultarlo.
            </p>
          ) : null}
          {children}
          <footer className="footer">
            <span className="footer-brand">
              <Image
                src={universityMark}
                alt=""
                width={24}
                height={24}
                className="brand-mark"
                unoptimized
              />
              SueloVivo <span>por Theounip</span>
            </span>
            <span className="footer-copy">
              Hecho para acompañar a quienes cultivan cacao en Putumayo.{" "}
              <a
                className="footer-credit"
                href="https://ren-redes.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="footer-credit-logo">
                  <Image src={renTechLogo} alt="" width={30} height={30} unoptimized />
                </span>
                <span>by Ren tech</span>
              </a>
            </span>
            {step !== LAST_STEP && (
              <button className="text-button" onClick={save}>
                <Save size={13} /> Guardar lo que llevo
              </button>
            )}
          </footer>
        </main>
      </div>
      <div className={`toast ${toast ? "visible" : ""}`} role="status" aria-live="polite">
        {toast ? (
          <>
            <Check size={17} />
            <span>{toast}</span>
          </>
        ) : null}
      </div>
      <dialog
        ref={dialog}
        className="evidence-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
        aria-labelledby="evidence-title"
      >
        <div className="dialog-header">
          <div>
            <span className="eyebrow">DATOS CON PROCEDENCIA</span>
            <h2 id="evidence-title">Fuentes y evidencia</h2>
          </div>
          <button
            className="icon-button"
            onClick={() => dialog.current?.close()}
            aria-label="Cerrar fuentes"
          >
            <X size={21} />
          </button>
        </div>
        <p>
          Estas referencias orientan las prácticas. La aplicación explica alternativas de manejo; su
          ejecución requiere revisar las condiciones de la parcela.
        </p>
        <div className="evidence-list">
          {EVIDENCE.map((e) => (
            <article className={focusEvidence === e.id ? "highlighted" : ""} key={e.id}>
              <span>{e.organization}</span>
              <h3>{e.title}</h3>
              {e.section ? (
                <p>
                  <strong>{e.section}</strong>
                </p>
              ) : null}
              <p>{e.detail}</p>
              <a href={e.url} target="_blank" rel="noreferrer">
                Consultar fuente <ArrowUpRight size={14} />
              </a>
            </article>
          ))}
        </div>
        <h3 className="species-dialog-title">Catálogo de especies candidatas</h3>
        <div className="species-list">
          {SPECIES.map((s) => (
            <div key={s.id}>
              <strong>
                {s.name}
                <em>{s.scientific}</em>
              </strong>
              <span>
                {s.kind}
                <small>{s.status}</small>
              </span>
            </div>
          ))}
        </div>
        <p className="source-note">
          Las guías combinan las observaciones de la parcela con el contexto de NASA POWER y
          SoilGrids.
        </p>
      </dialog>
    </>
  );
}
