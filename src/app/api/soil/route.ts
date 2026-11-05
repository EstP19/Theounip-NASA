import { querySoilContext, SoilQueryLimit } from "@/lib/soilgrids";
import { inPilotRegion, parseCoordinates } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const point = parseCoordinates(searchParams.get("lat"), searchParams.get("lon"));
  if (!point || !inPilotRegion(point))
    return Response.json(
      { error: "Marca una finca en Putumayo y su entorno para conocer el suelo." },
      { status: 400 },
    );
  try {
    return Response.json(await querySoilContext(point), {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch (error) {
    if (error instanceof SoilQueryLimit)
      return Response.json(
        { error: error.message },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    return Response.json(
      {
        error:
          "No pudimos consultar SoilGrids ahora. Puedes reintentar o seguir con tus propios datos.",
      },
      { status: 502 },
    );
  }
}
