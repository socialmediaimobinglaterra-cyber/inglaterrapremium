"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/components/home/property-map.css";

export function PropertyLocationMap({ latitude, longitude, address }: {
  latitude: number | null;
  longitude: number | null;
  address: string;
}) {
  const section = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tileError, setTileError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const valid = latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 && !(latitude === 0 && longitude === 0);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    if (section.current) observer.observe(section.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !valid || latitude === null || longitude === null) return;
    let disposed = false;
    let map: LeafletMap | undefined;
    let resize: ResizeObserver | undefined;
    const lat = latitude;
    const lng = longitude;
    setStatus("loading");
    setTileError(false);
    async function load() {
      try {
        const L = await import("leaflet");
        if (disposed || !container.current) return;
        map = L.map(container.current, { scrollWheelZoom: false, zoomControl: false }).setView([lat, lng], 16);
        L.control.zoom({ position: "topright", zoomInTitle: "Aproximar", zoomOutTitle: "Afastar" }).addTo(map);
        L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
          updateWhenIdle: true, keepBuffer: 1,
        }).on("tileerror", () => { if (!disposed) setTileError(true); }).addTo(map);
        L.marker([lat, lng], {
          title: "Localização do imóvel", alt: "Localização do imóvel", keyboard: false,
          icon: L.divIcon({ className: "property-map-pin", html: "", iconSize: [48, 54], iconAnchor: [24, 52] }),
        }).addTo(map);
        resize = new ResizeObserver(() => map?.invalidateSize());
        resize.observe(container.current);
        setStatus("ready");
      } catch {
        if (!disposed) setStatus("error");
      }
    }
    void load();
    return () => { disposed = true; resize?.disconnect(); map?.remove(); };
  }, [visible, valid, latitude, longitude, attempt]);

  return (
    <div ref={section}>
      <p className="mb-4 text-detail leading-relaxed text-navy">{address}</p>
      {valid ? <>
        <div className="relative isolate h-[240px] overflow-hidden border border-navy/10 bg-offwhite md:h-[300px]" aria-busy={status === "loading"}>
          <div ref={container} className="property-map h-full w-full" role="region" aria-label="Mapa da localização do imóvel" />
          {status !== "ready" && <div role="status" className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-3 bg-offwhite p-4 text-center text-detail text-navy">
            {status === "loading" ? "Carregando mapa..." : "Não foi possível carregar o mapa."}
            {status === "error" && <button type="button" className="p-3 underline" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>}
          </div>}
          {tileError && status === "ready" && <p role="status" className="absolute bottom-6 left-2 right-2 z-[1000] bg-offwhite p-2 text-detail text-navy">O mapa está indisponível no momento. Use o link abaixo.</p>}
        </div>
        <a className="mt-3 inline-block py-2 text-detail text-terra underline" href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`} target="_blank" rel="noopener noreferrer">Abrir mapa ampliado</a>
      </> : null}
    </div>
  );
}
