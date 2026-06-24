import { lazy, Suspense, useMemo } from "react";
import type { EChartsOption } from "echarts";
import { ClientOnly } from "@/components/ui/client-only";
import { KNOWLEDGE_CARDS, speciesLatin, positionLatin } from "@/lib/knowledge/bones";
import type { BonePosition, Species } from "@/lib/types";

const ReactECharts = lazy(() => import("echarts-for-react"));

const Loading = (
  <div className="grid h-[560px] place-items-center text-sm tracking-[0.2em] text-ink-muted">
    构建知识图谱 …
  </div>
);

const VERMILION = "#b83540";
const VERMILION_DEEP = "#9d2b33";
const BRONZE = "#b89766";
const BRONZE_DARK = "#8a6e49";
const INK_SOFT = "#3a3632";

// Centre + elliptical ring radii in the hidden [0,100]×[0,56] cartesian space.
const CX = 50;
const CY = 28;
const SPECIES_RING = { rx: 22, ry: 12 };
const POSITION_RING = { rx: 44, ry: 23.5 };

/**
 * "Star-map" knowledge graph on a warm paper stage. A central knowledge-base
 * core links out to every species (inner ring); each species links to every
 * bone position it documents (outer ring). All 87 expert relations carry an
 * animated light pulse, and species nodes ripple — a luminous reading of the
 * same real knowledge base, in the site's ceremonial palette.
 */
export function KnowledgeGraph() {
  const { option, edges, species, positions } = useMemo(buildOption, []);

  return (
    <div>
      <div className="cer-corners relative overflow-hidden rounded-sm" style={{ background: STAGE_BG }}>
        <div className="cer-grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="cer-spotlight pointer-events-none absolute inset-0" />
        <div className="cer-conic pointer-events-none absolute left-1/2 top-1/2 h-[180%] w-[180%] -translate-x-1/2 -translate-y-1/2 opacity-60" />
        <div className="relative">
          <ClientOnly fallback={Loading}>
            <Suspense fallback={Loading}>
              <ReactECharts
                option={option}
                style={{ height: 560, width: "100%" }}
                opts={{ renderer: "canvas" }}
              />
            </Suspense>
          </ClientOnly>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] tracking-[0.18em] text-ink-muted">
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: VERMILION, boxShadow: `0 0 8px ${VERMILION}66` }} />
          {species} 物种
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: BRONZE }} />
          {positions} 骨位
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-px w-6" style={{ background: VERMILION_DEEP }} />
          {edges} 条流动关联
        </span>
        <span className="hidden text-bronze-dark md:inline">悬停查看节点 · 流光示意检索路径</span>
      </div>
    </div>
  );
}

const STAGE_BG =
  "radial-gradient(ellipse 72% 72% at 50% 40%, #faf6ec 0%, #f1ead8 48%, #e6dcc2 80%, #ddd0b1 100%)";

function ellipse(ring: { rx: number; ry: number }, i: number, n: number) {
  const a = (-90 + (360 / n) * i) * (Math.PI / 180);
  return [CX + Math.cos(a) * ring.rx, CY + Math.sin(a) * ring.ry] as [number, number];
}

function buildOption() {
  const speciesDeg = new Map<string, number>();
  const positionDeg = new Map<string, number>();
  for (const c of KNOWLEDGE_CARDS) {
    speciesDeg.set(c.species, (speciesDeg.get(c.species) ?? 0) + 1);
    positionDeg.set(c.position, (positionDeg.get(c.position) ?? 0) + 1);
  }

  const speciesNames = [...speciesDeg.keys()];
  const positionNames = [...positionDeg.keys()];
  const speciesPos = new Map<string, [number, number]>();
  const positionPos = new Map<string, [number, number]>();
  speciesNames.forEach((name, i) =>
    speciesPos.set(name, ellipse(SPECIES_RING, i, speciesNames.length)),
  );
  positionNames.forEach((name, i) =>
    positionPos.set(name, ellipse(POSITION_RING, i, positionNames.length)),
  );

  // ---- node series ----
  const coreNode = {
    name: "专家知识库",
    value: [CX, CY],
    symbolSize: 32,
    itemStyle: {
      color: BRONZE_DARK,
      shadowBlur: 26,
      shadowColor: "rgba(138,110,73,0.65)",
      borderColor: "rgba(245,241,232,0.85)",
      borderWidth: 1.5,
    },
    label: {
      show: true,
      position: "bottom" as const,
      formatter: "专家知识库",
      color: BRONZE_DARK,
      fontFamily: "var(--font-serif)",
      fontSize: 12,
      fontWeight: 700 as const,
    },
    info: `<b style="color:#9d2b33">专家知识库</b><br/>${KNOWLEDGE_CARDS.length} 条形态特征记录`,
  };

  const speciesNodes = speciesNames.map((name) => {
    const deg = speciesDeg.get(name)!;
    return {
      name,
      value: speciesPos.get(name)!,
      symbolSize: 16 + Math.sqrt(deg) * 3.4,
      itemStyle: {
        color: VERMILION,
        shadowBlur: 18,
        shadowColor: "rgba(184,53,64,0.5)",
        borderColor: "rgba(245,241,232,0.85)",
        borderWidth: 1,
      },
      label: {
        show: true,
        position: "inside" as const,
        formatter: "{b}",
        color: "#fff",
        fontFamily: "var(--font-serif)",
        fontSize: 12,
        fontWeight: 700 as const,
      },
      info: `<b style="color:#9d2b33">${name}</b> <i style="color:#8a6e49">${speciesLatin(name as Species)}</i><br/>记录 <b>${deg}</b> 个骨位特征`,
    };
  });

  const positionNodes = positionNames.map((name) => {
    const deg = positionDeg.get(name)!;
    const [x, y] = positionPos.get(name)!;
    const latin = positionLatin(name as BonePosition);
    return {
      name,
      value: [x, y],
      symbolSize: 8 + Math.sqrt(deg) * 3,
      itemStyle: {
        color: BRONZE,
        shadowBlur: 8,
        shadowColor: "rgba(138,110,73,0.45)",
        borderColor: "rgba(255,255,255,0.7)",
        borderWidth: 1,
      },
      label: {
        show: true,
        position: (y < CY ? "top" : "bottom") as "top" | "bottom",
        formatter: "{b}",
        color: INK_SOFT,
        fontFamily: "var(--font-serif)",
        fontSize: 10.5,
      },
      info: `<b style="color:#8a6e49">${name}</b>${latin ? ` <i style="color:#9d2b33">${latin}</i>` : ""}<br/>覆盖 <b>${deg}</b> 个物种`,
    };
  });

  // ---- link series (with travelling light pulses) ----
  const coreLinks = speciesNames.map((name) => ({
    coords: [
      [CX, CY],
      speciesPos.get(name)!,
    ],
  }));

  const webLinks = KNOWLEDGE_CARDS.map((c) => ({
    coords: [
      speciesPos.get(c.species)!,
      positionPos.get(c.position)!,
    ],
  }));

  const option: EChartsOption = {
    backgroundColor: "transparent",
    animationDuration: 1600,
    tooltip: {
      trigger: "item",
      backgroundColor: "#f5f1e8",
      borderColor: BRONZE,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#1a1a1a", fontFamily: "var(--font-sans)", fontSize: 12 },
      extraCssText: "box-shadow:0 8px 26px rgba(26,26,26,0.14);",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => p?.data?.info ?? "",
    },
    xAxis: { type: "value", min: 0, max: 100, show: false },
    yAxis: { type: "value", min: 0, max: 56, show: false, inverse: true },
    grid: { left: 8, right: 8, top: 12, bottom: 12 },
    series: [
      {
        type: "lines",
        coordinateSystem: "cartesian2d",
        silent: true,
        tooltip: { show: false },
        polyline: false,
        lineStyle: { color: VERMILION_DEEP, width: 0.8, opacity: 0.14, curveness: 0.2 },
        effect: {
          show: true,
          period: 6,
          trailLength: 0.4,
          symbol: "circle",
          symbolSize: 2.6,
          color: VERMILION,
        },
        data: webLinks,
        zlevel: 1,
      },
      {
        type: "lines",
        coordinateSystem: "cartesian2d",
        silent: true,
        tooltip: { show: false },
        polyline: false,
        lineStyle: { color: BRONZE_DARK, width: 1, opacity: 0.4, curveness: 0 },
        effect: {
          show: true,
          period: 4,
          trailLength: 0.55,
          symbol: "circle",
          symbolSize: 3.2,
          color: VERMILION_DEEP,
        },
        data: coreLinks,
        zlevel: 2,
      },
      {
        type: "scatter",
        coordinateSystem: "cartesian2d",
        data: positionNodes,
        emphasis: { scale: 1.5 },
        zlevel: 3,
      },
      {
        type: "effectScatter",
        coordinateSystem: "cartesian2d",
        rippleEffect: { scale: 2.4, brushType: "stroke", period: 4 },
        data: speciesNodes,
        emphasis: { scale: 1.25 },
        zlevel: 4,
      },
      {
        type: "effectScatter",
        coordinateSystem: "cartesian2d",
        rippleEffect: { scale: 3, brushType: "stroke", period: 5 },
        data: [coreNode],
        zlevel: 5,
      },
    ],
  };

  return {
    option,
    edges: KNOWLEDGE_CARDS.length,
    species: speciesNames.length,
    positions: positionNames.length,
  };
}
