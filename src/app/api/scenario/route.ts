import { evaluateScenarios, ENGINE_VERSION } from "@/lib/scenarios";
import { inPilotRegion, isFarmInput, parseCoordinates } from "@/lib/validation";
import { querySoilContext } from "@/lib/soilgrids";
import type { Horizon, SoilContext } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > 16_000)
    return Response.json({ error: "La entrada es demasiado grande." }, { status: 413 });
  try {
    const body = JSON.parse(text);
    if (!isFarmInput(body.farm) || ![3, 5, 10].includes(body.horizon))
      return Response.json(
        { error: "Revisa los datos de la parcela y el horizonte." },
        { status: 400 },
      );
    let soil: SoilContext | null = null;
    let soilError: string | null = null;
    if (body.point !== undefined) {
      const point = parseCoordinates(String(body.point?.lat ?? ""), String(body.point?.lon ?? ""));
      if (!point || !inPilotRegion(point))
        return Response.json({ error: "Revisa la ubicación de la finca." }, { status: 400 });
      try {
        soil = await querySoilContext(point);
      } catch {
        soilError =
          "SoilGrids no está disponible; el plan usa tus datos y deja pendientes las comprobaciones del suelo.";
      }
    }
    // Las estimaciones se obtienen en el servidor para el punto recibido.
    return Response.json({
      engineVersion: ENGINE_VERSION,
      soil,
      soilError,
      ...evaluateScenarios(body.farm, body.horizon as Horizon, null, soil),
    });
  } catch {
    return Response.json({ error: "Envía un objeto JSON válido." }, { status: 400 });
  }
}
