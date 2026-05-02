"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { normalizeProvinceName, provinceToGeoJsonName } from "@/lib/provinces";
import { useTheme } from "./ThemeProvider";
import type { ThemeTokens } from "./themeTokens";

interface ChinaMapProps {
  visitedProvinces: string[];
  visitedCities?: { name: string; province: string; lat: number; lng: number; photoCount: number; coverUrl?: string }[];
  onProvinceClick?: (name: string) => void;
  onCityClick?: (cityName: string) => void;
  onMapReady?: () => void;
  provinceCount?: number;
  cityCount?: number;
  completionRate?: string;
}

function filterSouthChinaSeaIslands(geoJson: Record<string, unknown>): Record<string, unknown> {
  const cleaned = JSON.parse(JSON.stringify(geoJson));
  const features = (cleaned as { features?: unknown[] }).features;
  if (!features) return geoJson;
  for (const feature of features) {
    const f = feature as { geometry?: { type: string; coordinates: number[][][][] } };
    const geometry = f.geometry;
    if (!geometry?.coordinates) continue;
    geometry.coordinates = geometry.coordinates
      .map((group) => {
        const allCoords = group.flat(2) as unknown as number[][];
        const minLat = Math.min(...allCoords.map((c) => c[1]));
        return minLat < 15 ? [] : group;
      })
      .filter((g) => g.length > 0);
  }
  return cleaned;
}

function buildOption(
  T: ThemeTokens,
  visitedProvinces: string[],
  visitedCities: { name: string; province: string; lat: number; lng: number; photoCount: number }[],
  provinceCount?: number,
  cityCount?: number,
  completionRate?: string
) {
  const flightLineData =
    visitedCities.length < 2
      ? []
      : visitedCities.slice(0, -1).map((c, i) => ({
          fromName: visitedCities[i].name,
          toName: visitedCities[i + 1].name,
          coords: [
            [c.lng, c.lat],
            [visitedCities[i + 1].lng, visitedCities[i + 1].lat],
          ],
        }));

  return {
    geo: {
      map: "china",
      roam: true,
      layoutCenter: ["50%", "50%"],
      layoutSize: "100%",
      aspectScale: 1,
      zoom: 1.25,
      scaleLimit: { min: 1.01, max: 6 },
      label: { show: false },
      itemStyle: {
        areaColor: T.bgCardAlt,
        borderColor: T.inkFaint,
        borderWidth: 1.5,
        shadowColor: "rgba(0,0,0,0.1)",
        shadowBlur: 4,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
      },
      emphasis: {
        label: { color: T.ink, fontSize: 11, fontWeight: 700 },
        itemStyle: {
          areaColor: T.accentLight,
          borderColor: T.ink,
          borderWidth: 2,
          shadowColor: T.accent + "60",
          shadowBlur: 15,
        },
      },
      regions: visitedProvinces.map((name) => ({
        name: provinceToGeoJsonName(name),
        itemStyle: {
          areaColor: T.accent,
          borderColor: T.gold,
          borderWidth: 1.5,
          shadowColor: T.gold + "60",
          shadowBlur: 12,
        },
        label: { color: "#fff", fontWeight: 700, fontSize: 10 },
      })),
    },
    tooltip: {
      trigger: "item" as const,
      backgroundColor: T.bgCard,
      borderColor: T.borderMid,
      textStyle: { color: T.ink },
      formatter: (params: { name: string; seriesType?: string }) => {
        if (params.seriesType === "scatter") return `<b>${params.name}</b>`;
        const normalizedName = normalizeProvinceName(params.name);
        const isVisited = visitedProvinces.includes(normalizedName);
        return `${params.name}<br/>${isVisited ? "已走过" : "未探索"}`;
      },
    },
    series: [
      ...(visitedProvinces.length > 0
        ? [{
            type: "map" as const, map: "china", roam: false, silent: true, zlevel: 0,
            itemStyle: { areaColor: "transparent", borderColor: "transparent", borderWidth: 0 },
            lineStyle: { color: T.ink + "20", width: 4 },
            emphasis: { disabled: true },
            data: visitedProvinces.map((name) => ({
              name: provinceToGeoJsonName(name),
              itemStyle: { areaColor: "transparent" },
              lineStyle: { color: T.ink + "20", width: 4 },
            })),
          }]
        : []),
      ...(visitedCities.length >= 2
        ? [{
            name: "旅行路线", type: "lines" as const, coordinateSystem: "geo" as const, zlevel: 1,
            lineStyle: { color: T.gold, opacity: 0.2, width: 1.5, curveness: 0.3 },
            silent: true, data: flightLineData,
          }]
        : []),
      ...(visitedCities.length >= 2
        ? visitedCities.slice(0, -1).map((city, i) => ({
            name: `旅行路线-${i + 1}`, type: "lines" as const, coordinateSystem: "geo" as const, zlevel: 3,
            effect: { show: true, period: 5 + i * 2.5, trailLength: 0.5, symbol: "arrow" as const, symbolSize: 8, color: T.gold },
            lineStyle: { color: T.gold, opacity: 0, width: 1.5, curveness: 0.3 },
            data: [{ fromName: visitedCities[i].name, toName: visitedCities[i + 1].name, coords: [[visitedCities[i].lng, visitedCities[i].lat], [visitedCities[i + 1].lng, visitedCities[i + 1].lat]] }],
          }))
        : []),
      ...(visitedCities.length >= 2
        ? [{
            name: "旅行节点", type: "scatter" as const, coordinateSystem: "geo" as const, zlevel: 4, symbolSize: 0,
            label: {
              show: true,
              formatter: (params: { dataIndex: number }) => {
                const n = params.dataIndex + 1;
                return `{num|${n}}\n{name|${visitedCities[params.dataIndex]?.name || ""}}`;
              },
              rich: {
                num: { fontSize: 11, fontWeight: 700, color: T.navText, backgroundColor: T.navBg + "D9", borderRadius: 10, padding: [3, 6], borderColor: T.gold, borderWidth: 1 },
                name: { fontSize: 9, color: T.gold, padding: [2, 0, 0, 0] },
              },
              position: "top" as const, offset: [0, 5],
            },
            data: visitedCities.map((city) => ({ name: city.name, value: [city.lng, city.lat] })),
            tooltip: { formatter: (params: { name: string; dataIndex: number }) => `<b>${params.dataIndex + 1}. ${params.name}</b><br/>${visitedCities[params.dataIndex]?.photoCount || 0} 张照片` },
          }]
        : []),
      {
        name: "已访问城市", type: "effectScatter" as const, coordinateSystem: "geo" as const,
        symbolSize: (_val: number[], params: { dataIndex: number }) => 10 + Math.min(8, Math.floor((visitedCities[params.dataIndex]?.photoCount ?? 0) / 10)),
        showEffectOn: "render" as const,
        rippleEffect: { brushType: "stroke" as const, period: 4, scale: 4 },
        label: { show: false },
        itemStyle: { color: T.gold, borderColor: T.navBg, borderWidth: 2, shadowColor: T.gold + "80", shadowBlur: 8 },
        emphasis: {
          itemStyle: { borderWidth: 2, shadowBlur: 15 },
          label: { show: true, color: T.navText, fontSize: 12, fontWeight: 700, backgroundColor: T.navBg + "D9", padding: [4, 8], borderRadius: 4 },
        },
        data: visitedCities.map((city) => ({ name: city.name, value: [city.lng, city.lat] })),
        tooltip: { formatter: (params: { name: string }) => `<b>${params.name}</b><br/>${visitedCities.find((c) => c.name === params.name)?.photoCount || 0} 张照片` },
        zlevel: 2,
      },
    ],
  };
}

export function ChinaMap({ visitedProvinces, visitedCities = [], onProvinceClick, onCityClick, onMapReady, provinceCount, cityCount, completionRate }: ChinaMapProps) {
  const chartRef = useRef<ReactECharts>(null);
  const [loaded, setLoaded] = useState(false);
  const { tokens: T } = useTheme();
  const option = useMemo(() => buildOption(T, visitedProvinces, visitedCities, provinceCount, cityCount, completionRate), [T, visitedProvinces, visitedCities, provinceCount, cityCount, completionRate]);

  useEffect(() => {
    fetch("/china.json?v=6")
      .then((res) => res.json())
      .then((geoJson: Record<string, unknown>) => {
        setTimeout(() => { echarts.registerMap("china", filterSouthChinaSeaIslands(geoJson) as never); setLoaded(true); onMapReady?.(); }, 50);
      })
      .catch((err) => console.error("Failed to load China GeoJSON:", err));
  }, [onMapReady]);

  useEffect(() => {
    if (!loaded || !chartRef.current) return;
    const instance = chartRef.current.getEchartsInstance();
    const dom = instance.getDom();
    if (!dom?.parentElement) return;
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(dom.parentElement);
    return () => observer.disconnect();
  }, [loaded]);

  if (!loaded) {
    return <div className="flex items-center justify-center w-full h-full" style={{ background: T.bgCard, borderRadius: 16 }}><div style={{ color: T.inkFaint, fontSize: 14 }}>加载地图中...</div></div>;
  }

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-3 left-3 px-3 py-2 rounded-lg" style={{ background: T.bgCard + "D9", backdropFilter: "blur(8px)", boxShadow: T.shadow, zIndex: 20, border: `1px solid ${T.border}` }}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2"><span className="text-[10px]" style={{ color: T.inkFaint }}>省份</span><span className="text-sm font-semibold" style={{ color: T.accent }}>{provinceCount ?? visitedProvinces.length}</span></div>
          <div className="flex items-center gap-2"><span className="text-[10px]" style={{ color: T.inkFaint }}>城市</span><span className="text-sm font-semibold" style={{ color: T.accent }}>{cityCount ?? visitedCities.length}</span></div>
          <div className="flex items-center gap-2"><span className="text-[10px]" style={{ color: T.inkFaint }}>完成度</span><span className="text-sm font-semibold" style={{ color: T.accent }}>{completionRate ?? "0"}%</span></div>
        </div>
      </div>
      <ReactECharts ref={chartRef} option={option} notMerge={true} style={{ width: "100%", height: "100%" }}
        onEvents={{
          click: (params: { name: string; componentType: string; seriesType: string }) => {
            if (params.seriesType === "scatter") onCityClick?.(params.name);
            else onProvinceClick?.(normalizeProvinceName(params.name));
          },
        }}
      />
    </div>
  );
}
