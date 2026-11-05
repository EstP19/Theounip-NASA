"use client";

import { useEffect, useState } from "react";
import type { Coordinates, SoilContext } from "@/lib/types";
import { inPilotRegion } from "@/lib/validation";
import { soilAtPoint } from "@/lib/soil-basis";

export function useSoilContext(point: Coordinates, ready: boolean) {
  const [soil, setSoil] = useState<SoilContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const { lat, lon } = point;
  useEffect(() => {
    setSoil(null);
    setError("");
    setLoading(false);
    if (!ready || !inPilotRegion({ lat, lon })) return;
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/soil?${new URLSearchParams({ lat: String(lat), lon: String(lon) })}`,
          {
            signal: controller.signal,
          },
        );
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error ?? "No pudimos conocer el suelo de este lugar.");
        if (!controller.signal.aborted) setSoil(body as SoilContext);
      } catch (problem) {
        if (!controller.signal.aborted)
          setError(problem instanceof Error ? problem.message : "No pudimos consultar el suelo.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 650);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [lat, lon, ready, attempt]);
  return {
    soil: soilAtPoint(soil, point),
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
