"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import type { Lang } from "@/lib/types";
import { fmt } from "@/lib/format";

export interface MapPoint {
  name: string;
  latlon: [number, number];
  value: number | null; // drives colour (sequential ramp)
  size?: number | null; // drives radius (defaults to value)
  extra?: { label: string; value: string }[];
}

const STEPS = ["--seq-150", "--seq-250", "--seq-350", "--seq-450", "--seq-550", "--seq-650"];

function useTokens(names: string[]) {
  const [vals, setVals] = useState<string[]>(names.map(() => "rgb(57, 135, 229)"));
  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      setVals(names.map((n) => cs.getPropertyValue(n).trim() || "rgb(57, 135, 229)"));
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return vals;
}

function useDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => {
      const t = document.documentElement.getAttribute("data-theme");
      setDark(t === "dark" || (t !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches));
    };
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

function Fit({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 6 });
  }, [map, bounds]);
  return null;
}

export default function MapView({ points, unit, sizeUnit, lang, height = 380, legendLabel }: { points: MapPoint[]; unit: string; sizeUnit?: string; lang: Lang; height?: number; legendLabel: string }) {
  const ramp = useTokens(STEPS);
  const [stroke] = useTokens(["--surface"]);
  const dark = useDark();
  const valid = points.filter((p) => p.latlon && p.value !== null);
  const vals = valid.map((p) => p.value as number);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const sizes = valid.map((p) => Math.abs((p.size ?? p.value ?? 0) as number));
  const smax = Math.max(...sizes, 1e-9);
  const bounds = useMemo<LatLngBoundsExpression>(() => {
    const lats = valid.map((p) => p.latlon[0]);
    const lons = valid.map((p) => p.latlon[1]);
    return [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(valid.map((p) => p.latlon))]);
  if (!valid.length) return null;
  const color = (v: number) => {
    const t = hi === lo ? 1 : (v - lo) / (hi - lo);
    return ramp[Math.min(ramp.length - 1, Math.floor(t * ramp.length))];
  };
  const tiles = dark
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
    : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";

  return (
    <div className="map-wrap">
      <MapContainer style={{ height, width: "100%" }} scrollWheelZoom={false} zoomControl attributionControl center={[-25, -60]} zoom={4}>
        <TileLayer key={tiles} url={tiles} attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, OpenStreetMap contributors" maxZoom={16} />
        <Fit bounds={bounds} />
        {valid.map((p, i) => (
          <CircleMarker
            key={p.name}
            center={p.latlon}
            radius={8 + 22 * Math.sqrt(sizes[i] / smax)}
            pathOptions={{ color: stroke, weight: 2, fillColor: color(p.value as number), fillOpacity: 0.85 }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div>{legendLabel}: <b>{fmt(p.value, unit, lang)}</b></div>
              {p.extra?.map((e) => <div key={e.label}>{e.label}: <b>{e.value}</b></div>)}
              {p.size !== undefined && p.size !== null && sizeUnit && <div className="faint">size: {fmt(p.size, sizeUnit, lang)}</div>}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="map-legend">
        <span>{legendLabel}</span>
        <span className="num">{fmt(lo, unit, lang, true)}</span>
        <span className="ramp">{ramp.map((c, i) => <i key={i} style={{ background: c }} />)}</span>
        <span className="num">{fmt(hi, unit, lang, true)}</span>
        <span className="faint">· {lang === "he" ? "גודל = עוצמה" : "size = magnitude"}</span>
      </div>
    </div>
  );
}
