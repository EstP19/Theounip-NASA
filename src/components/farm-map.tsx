"use client";
import { useLanguage } from "@/components/i18n-provider";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import { GIBS_WMS, NASA_MAP_LAYERS } from "@/lib/space-apps";
import type { Coordinates } from "@/lib/types";

type Props = {
  point: Coordinates;
  accuracy: number | null;
  onChange: (point: Coordinates) => void;
};

export default function FarmMap({ point, accuracy, onChange }: Props) {
  const { t } = useLanguage();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const zoom = useRef<L.Control.Zoom | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const precision = useRef<L.Circle | null>(null);
  const changeRef = useRef(onChange);
  const [tileError, setTileError] = useState(false);
  const [layerId, setLayerId] = useState("");
  const [failedLayer, setFailedLayer] = useState("");
  const initial = useRef(point);
  const selectedLayer = NASA_MAP_LAYERS.find(({ id }) => id === layerId);
  const legendUrl = selectedLayer?.legend
    ? `https://gibs.earthdata.nasa.gov/legends/${selectedLayer.legend}`
    : null;

  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!container.current) return;
    const m = L.map(container.current, { zoomControl: false, scrollWheelZoom: false }).setView(
      [initial.current.lat, initial.current.lon],
      10,
    );
    map.current = m;
    zoom.current = L.control.zoom({ position: "bottomright" }).addTo(m);
    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(m);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    })
      .on("tileerror", () => setTileError(true))
      .addTo(m);
    const icon = L.divIcon({
      className: "farm-marker-wrapper",
      html: '<span class="farm-marker"><span></span></span>',
      iconSize: [38, 48],
      iconAnchor: [19, 44],
    });
    const pin = L.marker([initial.current.lat, initial.current.lon], {
      icon,
      draggable: true,
    }).addTo(m);
    marker.current = pin;
    m.on("click", (event: L.LeafletMouseEvent) =>
      changeRef.current({
        lat: Number(event.latlng.lat.toFixed(6)),
        lon: Number(event.latlng.lng.toFixed(6)),
      }),
    );
    pin.on("dragend", () => {
      const p = pin.getLatLng();
      changeRef.current({ lat: Number(p.lat.toFixed(6)), lon: Number(p.lng.toFixed(6)) });
    });
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
      marker.current = null;
      precision.current = null;
    };
  }, []);

  useEffect(() => {
    const controls = zoom.current?.getContainer();
    for (const [css, label] of [
      [".leaflet-control-zoom-in", t("Acercar")],
      [".leaflet-control-zoom-out", t("Alejar")],
    ]) {
      const control = controls?.querySelector(css);
      control?.setAttribute("title", label);
      control?.setAttribute("aria-label", label);
    }
    const pin = marker.current?.getElement();
    pin?.setAttribute("title", t("Ubicación seleccionada de la parcela"));
    pin?.setAttribute("aria-label", t("Marcador de la parcela"));
  }, [t]);

  useEffect(() => {
    if (!map.current || !selectedLayer) return;
    const overlay = L.tileLayer.wms(GIBS_WMS, {
      layers: selectedLayer.id,
      ...(selectedLayer.date ? { time: selectedLayer.date } : {}),
      format: "image/png",
      transparent: true,
      opacity: 0.65,
      maxNativeZoom: selectedLayer.maxNativeZoom ?? 8,
      maxZoom: 19,
      attribution: '<a href="https://www.earthdata.nasa.gov/data/tools/gibs">NASA EOSDIS GIBS</a>',
    });
    overlay.on("tileerror", () => setFailedLayer(selectedLayer.id)).addTo(map.current);
    return () => {
      overlay.off();
      overlay.remove();
    };
  }, [selectedLayer]);

  useEffect(() => {
    if (!map.current || !marker.current) return;
    const p: L.LatLngExpression = [point.lat, point.lon];
    marker.current.setLatLng(p);
    if (!map.current.getBounds().contains(p)) map.current.setView(p, 12, { animate: false });
    if (precision.current) {
      precision.current.remove();
      precision.current = null;
    }
    if (accuracy !== null)
      precision.current = L.circle(p, {
        radius: accuracy,
        color: "#1e6b4e",
        fillOpacity: 0.08,
        weight: 1,
      }).addTo(map.current);
  }, [point.lat, point.lon, accuracy]);

  return (
    <>
      <div className="map-shell">
        <div
          className="leaflet-map"
          ref={container}
          role="region"
          aria-label={t("Mapa de ubicación de la parcela en Putumayo")}
        />
        <div className="map-label">
          <span className="map-dot" /> {t("PUTUMAYO, COLOMBIA")}{" "}
        </div>
        <div className="map-instruction">{t("Haz clic o arrastra el marcador")}</div>
        {tileError ? (
          <div className="map-error" role="status">
            {t("El mapa base no está disponible. Puedes ingresar las coordenadas debajo.")}{" "}
          </div>
        ) : null}
      </div>
      <div className="map-layer-controls">
        <label htmlFor="nasa-map-layer">{t("Ver una capa satelital")}</label>
        <select
          id="nasa-map-layer"
          value={layerId}
          onChange={(event) => {
            setFailedLayer("");
            setLayerId(event.target.value);
          }}
        >
          <option value="">{t("Mapa base")}</option>
          {NASA_MAP_LAYERS.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {t(layer.title)}
            </option>
          ))}
        </select>
        <div className="map-layer-guide" aria-live="polite">
          {selectedLayer ? (
            <>
              <p>
                <strong>{t(selectedLayer.period)}.</strong> {t(selectedLayer.detail)}
              </p>
              <p>
                <strong>{t("Cómo leer los colores.")}</strong> {t(selectedLayer.colors)}
              </p>
              {legendUrl ? (
                <a href={legendUrl} target="_blank" rel="noreferrer">
                  <Image
                    src={legendUrl}
                    alt={t("Escala oficial de colores de {0}", t(selectedLayer.title))}
                    width={420}
                    height={selectedLayer.id === "IMERG_Precipitation_Rate" ? 195 : 95}
                    unoptimized
                  />
                </a>
              ) : null}
              <p className="source-note">
                {t(
                  "Si en un sector solo ves el mapa base, puede que allí falten datos para esa fecha.",
                )}{" "}
              </p>
            </>
          ) : (
            <p className="source-note">
              {t(
                "El mapa base te ayuda a ubicar la parcela. Elige una capa para ver qué muestran sus colores.",
              )}{" "}
            </p>
          )}
        </div>
        {failedLayer && failedLayer === layerId ? (
          <p className="inline-warning" role="status">
            {t("Parte de la capa no se pudo cargar. El mapa base sigue disponible.")}{" "}
          </p>
        ) : null}
      </div>
    </>
  );
}
