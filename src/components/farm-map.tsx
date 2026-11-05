"use client";

import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import type { Coordinates } from "@/lib/types";

type Props = {
  point: Coordinates;
  accuracy: number | null;
  onChange: (point: Coordinates) => void;
};

export default function FarmMap({ point, accuracy, onChange }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const precision = useRef<L.Circle | null>(null);
  const changeRef = useRef(onChange);
  const [tileError, setTileError] = useState(false);
  const initial = useRef(point);

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
    L.control
      .zoom({ position: "bottomright", zoomInTitle: "Acercar", zoomOutTitle: "Alejar" })
      .addTo(m);
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
      title: "Ubicación seleccionada de la parcela",
      alt: "Marcador de la parcela",
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
    <div className="map-shell">
      <div
        className="leaflet-map"
        ref={container}
        role="region"
        aria-label="Mapa de ubicación de la finca en Putumayo"
      />
      <div className="map-label">
        <span className="map-dot" /> PUTUMAYO, COLOMBIA
      </div>
      <div className="map-instruction">Haz clic o arrastra el marcador</div>
      {tileError ? (
        <div className="map-error" role="status">
          El mapa base no está disponible. Puedes ingresar las coordenadas debajo.
        </div>
      ) : null}
    </div>
  );
}
