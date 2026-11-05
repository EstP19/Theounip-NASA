import { getLiveContext, getSnapshot } from "@/lib/context";
import { DEMO_POINT, inPilotRegion, parseCoordinates } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 30;

// Límite global por proceso para una demo sin cuentas; no sustituye un límite distribuido.
let windowStart = 0;
let requestsInWindow = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const point = parseCoordinates(searchParams.get("lat"), searchParams.get("lon"));
  const year = Number(searchParams.get("year") ?? "2025");
  if (!point)
    return Response.json(
      { error: "Ingresa latitud y longitud válidas en grados decimales." },
      { status: 400 },
    );
  if (!inPilotRegion(point))
    return Response.json(
      {
        error: "Esta demo consulta Putumayo y su entorno. Marca un punto dentro de la zona piloto.",
      },
      { status: 400 },
    );
  if (![2023, 2024, 2025].includes(year))
    return Response.json(
      { error: "Selecciona un año disponible: 2023, 2024 o 2025." },
      { status: 400 },
    );
  const mode = searchParams.get("mode") ?? "live";
  if (mode !== "live" && mode !== "snapshot")
    return Response.json({ error: "Modo de consulta no válido." }, { status: 400 });
  if (mode === "snapshot") {
    if (point.lat !== DEMO_POINT.lat || point.lon !== DEMO_POINT.lon || year !== 2025)
      return Response.json(
        {
          error:
            "La descarga de respaldo solo corresponde al punto ilustrativo de San Miguel y al año 2025.",
        },
        { status: 400 },
      );
    return Response.json(getSnapshot());
  }
  const now = Date.now();
  if (now - windowStart >= 60_000) {
    windowStart = now;
    requestsInWindow = 0;
  }
  if (requestsInWindow >= 5)
    return Response.json(
      {
        error:
          "Se alcanzaron cinco consultas en un minuto. Espera un momento; puedes seguir explorando el plan con los datos cargados.",
      },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  requestsInWindow++;
  try {
    const context = await getLiveContext(point, year);
    return Response.json(context, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch (error) {
    const message =
      error instanceof Error && error.message.startsWith("NASA POWER")
        ? error.message
        : "No pudimos recibir datos de NASA POWER en este momento. Conserva el punto e intenta de nuevo, o abre el caso ilustrativo.";
    return Response.json({ error: message }, { status: 502 });
  }
}
