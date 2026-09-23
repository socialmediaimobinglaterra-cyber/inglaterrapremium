"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Map as LeafletMap } from "leaflet";
import { createPropertyIndex, MAP_MAX_ZOOM, type MapDataset } from "@/lib/property-map";
import "leaflet/dist/leaflet.css";
import "./property-map.css";

export function PropertyMap() {
  const section = useRef<HTMLElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [visible, setVisible] = useState(false);
  const [negocio, setNegocio] = useState<"Comprar" | "Alugar">("Comprar");
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [total, setTotal] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [tileError, setTileError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    if (section.current) observer.observe(section.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let disposed = false;
    let resize: ResizeObserver | undefined;
    const controller = new AbortController();
    setStatus("loading");
    setTileError(false);
    async function load() {
      try {
        const [L, response] = await Promise.all([
          import("leaflet"),
          fetch(`/api/imoveis/map?negocio=${negocio}`, { signal: controller.signal }),
        ]);
        if (!response.ok) throw new Error("map_unavailable");
        const data: MapDataset = await response.json();
        if (disposed || !container.current) return;
        setTotal(data.points.length);
        if (!data.points.length) { setStatus("empty"); return; }
        const index = createPropertyIndex(data.points);
        const map = L.map(container.current, {
          minZoom: 3, maxZoom: MAP_MAX_ZOOM, scrollWheelZoom: false,
          zoomControl: false, worldCopyJump: true,
        });
        mapRef.current = map;
        L.control.zoom({ position: "topright", zoomInTitle: "Aproximar", zoomOutTitle: "Afastar" }).addTo(map);
        L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: MAP_MAX_ZOOM,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          updateWhenIdle: true, keepBuffer: 1,
        }).on("tileerror", () => { if (!disposed) setTileError(true); }).addTo(map);
        const markers = L.layerGroup().addTo(map);
        function draw() {
          markers.clearLayers();
          const bounds = map.getBounds();
          const zoom = Math.floor(map.getZoom());
          for (const item of index.getClusters([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], zoom)) {
            const properties = item.properties;
            const count = "cluster" in properties ? properties.point_count : 1;
            const key = "cluster" in properties ? `c${properties.cluster_id}` : `p${properties.id}`;
            const [lng, lat] = item.geometry.coordinates;
            const label = `Ver ${count} ${count === 1 ? "imóvel" : "imóveis"} nesta localização`;
            const marker = L.marker([lat, lng], {
              keyboard: true, title: label, alt: label, autoPanOnFocus: false,
              icon: L.divIcon({ className: "property-map-pin", html: `<span>${count}</span>`, iconSize: [48, 48], iconAnchor: [24, 24] }),
            }).addTo(markers);
            const openSelection = () => {
              const params = new URLSearchParams({ mapa: `${data.version}:${zoom}:${key}`, negocio });
              router.push(`/imoveis?${params}`);
            };
            marker.on("click", openSelection);
            const element = marker.getElement();
            element?.setAttribute("role", "link");
            element?.setAttribute("aria-label", label);
            element?.addEventListener("keydown", (event) => {
              if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); openSelection(); }
            });
          }
        }
        map.fitBounds(L.latLngBounds(data.points.map((point) => [point.latitude, point.longitude])), { padding: [40, 40], maxZoom: 14 });
        map.on("moveend zoomend", draw);
        draw();
        resize = new ResizeObserver(() => map.invalidateSize());
        resize.observe(container.current);
        setStatus("ready");
      } catch {
        if (!disposed) setStatus("error");
      }
    }
    void load();
    return () => { disposed = true; controller.abort(); resize?.disconnect(); mapRef.current?.remove(); mapRef.current = null; };
  }, [visible, negocio, attempt, router]);

  return (
    <section ref={section} className="site-container my-[160px]" aria-labelledby="property-map-title">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 id="property-map-title" className="text-[28px] font-light leading-tight text-navy md:text-[40px]">Imóveis por localização</h2>
          {status === "ready" && <p className="mt-3 text-sm text-navy">{total} imóveis no mapa</p>}
        </div>
        <div className="flex border border-navy/20" role="group" aria-label="Finalidade dos imóveis no mapa">
          {(["Comprar", "Alugar"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={negocio === value} onClick={() => setNegocio(value)} className={`px-5 py-3 text-sm ${negocio === value ? "bg-navy text-offwhite" : "text-navy"}`}>{value}</button>
          ))}
        </div>
      </div>
      <div className="relative isolate h-[420px] border border-navy/10 bg-offwhite md:h-[560px]" aria-busy={status === "loading"}>
        <div ref={container} className="property-map h-full w-full" aria-label="Mapa de imóveis disponíveis" />
        {status !== "ready" && (
          <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-4 bg-offwhite px-6 text-center text-sm text-navy" role="status">
            {status === "loading" ? "Carregando mapa..." : status === "empty" ? "Nenhum imóvel com localização disponível nesta seleção." : "Não foi possível carregar o mapa."}
            {status === "error" && <button type="button" className="underline" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button>}
          </div>
        )}
        {tileError && status === "ready" && <p role="status" className="absolute bottom-8 left-3 right-3 z-[1000] bg-offwhite p-3 text-sm text-navy">O mapa de ruas está indisponível no momento.</p>}
      </div>
    </section>
  );
}
