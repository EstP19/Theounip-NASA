import { evaluateScenarios, ENGINE_VERSION } from "@/lib/scenarios";
import { isFarmInput } from "@/lib/validation";
import type { Horizon } from "@/lib/types";

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
    // La ruta evalúa entradas agrícolas. El clima se consulta por separado desde /api/context.
    return Response.json({
      engineVersion: ENGINE_VERSION,
      ...evaluateScenarios(body.farm, body.horizon as Horizon),
    });
  } catch {
    return Response.json({ error: "Envía un objeto JSON válido." }, { status: 400 });
  }
}
