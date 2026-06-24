import { lazy, Suspense, useMemo } from "react";
import type {
  LegendComponentOption,
  TooltipComponentOption,
} from "echarts";
import type { GraphSeriesOption } from "echarts/charts";
import type { ComposeOption } from "echarts/core";
import { ClientOnly } from "@/components/ui/client-only";
import { KNOWLEDGE_CARDS, speciesLatin, positionLatin } from "@/lib/knowledge/bones";
import type { BonePosition, Species } from "@/lib/types";

const ReactECharts = lazy(() => import("echarts-for-react"));

const Loading = (
  <div className="grid h-[560px] place-items-center text-sm tracking-[0.2em] text-ink-muted">
    构建知识图谱 …
  </div>
);

type Opt = ComposeOption<
  GraphSeriesOption | TooltipComponentOption | LegendComponentOption
>;

const VERMILION = "#9d2b33";
const BRONZE = "#b89766";

/**
 * Force-directed knowledge graph linking every species to every bone position
 * for which an expert morphology card exists. Built entirely from the real
 * knowledge base (87 edges across 7 species × 18 positions). Hovering a node
 * isolates its adjacency; nodes are draggable and the canvas roams.
 */
export function KnowledgeGraph() {
  const { option, edges } = useMemo(buildOption, []);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="cer-conic absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70" />
      </div>
      <ClientOnly fallback={Loading}>
        <Suspense fallback={Loading}>
          <ReactECharts
            option={option}
            style={{ height: 560, width: "100%" }}
            opts={{ renderer: "canvas" }}
          />
        </Suspense>
      </ClientOnly>
      <div className="relative -mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] tracking-[0.18em] text-ink-muted">
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: VERMILION }} />
          物种节点
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: BRONZE }} />
          骨位节点
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-px w-6" style={{ background: BRONZE }} />
          {edges} 条专家关联
        </span>
        <span className="hidden text-bronze-dark md:inline">悬停高亮 · 拖拽布局 · 滚轮缩放</span>
      </div>
    </div>
  );
}

function buildOption(): { option: Opt; edges: number } {
  const speciesDeg = new Map<string, number>();
  const positionDeg = new Map<string, number>();
  for (const c of KNOWLEDGE_CARDS) {
    speciesDeg.set(c.species, (speciesDeg.get(c.species) ?? 0) + 1);
    positionDeg.set(c.position, (positionDeg.get(c.position) ?? 0) + 1);
  }

  const speciesNodes = [...speciesDeg.entries()].map(([name, deg]) => ({
    id: name,
    name,
    category: 0,
    symbolSize: 22 + Math.sqrt(deg) * 4.2,
    value: deg,
    label: {
      show: true,
      position: "inside" as const,
      fontFamily: "var(--font-serif)",
      fontSize: 14,
      fontWeight: 700 as const,
      color: "#f5f1e8",
    },
    tooltip: {
      formatter: () =>
        `<b>${name}</b> <i style="color:#8a6e49">${speciesLatin(name as Species)}</i><br/>记录 <b>${deg}</b> 个骨位特征`,
    },
  }));

  const positionNodes = [...positionDeg.entries()].map(([name, deg]) => ({
    id: name,
    name,
    category: 1,
    symbolSize: 11 + Math.sqrt(deg) * 4.5,
    value: deg,
    label: {
      show: true,
      position: "bottom" as const,
      fontFamily: "var(--font-serif)",
      fontSize: 11,
      color: "#3a3632",
    },
    tooltip: {
      formatter: () => {
        const latin = positionLatin(name as BonePosition);
        return `<b>${name}</b>${latin ? ` <i style="color:#8a6e49">${latin}</i>` : ""}<br/>覆盖 <b>${deg}</b> 个物种`;
      },
    },
  }));

  const links = KNOWLEDGE_CARDS.map((c) => ({
    source: c.species,
    target: c.position,
  }));

  const option: Opt = {
    tooltip: {
      backgroundColor: "#f5f1e8",
      borderColor: BRONZE,
      borderWidth: 1,
      textStyle: { color: "#1a1a1a", fontFamily: "var(--font-sans)", fontSize: 12 },
      extraCssText: "box-shadow:0 6px 24px rgba(26,26,26,0.12);",
    },
    legend: { show: false },
    animationDuration: 1400,
    animationEasingUpdate: "quinticInOut",
    series: [
      {
        type: "graph",
        layout: "force",
        roam: true,
        draggable: true,
        zoom: 1,
        center: ["50%", "50%"],
        categories: [
          { name: "物种", itemStyle: { color: VERMILION } },
          { name: "骨位", itemStyle: { color: BRONZE } },
        ],
        force: {
          initLayout: "circular",
          repulsion: 680,
          edgeLength: [90, 240],
          gravity: 0.075,
          friction: 0.15,
          layoutAnimation: true,
        },
        itemStyle: {
          borderColor: "rgba(245,241,232,0.9)",
          borderWidth: 1.5,
          shadowBlur: 14,
          shadowColor: "rgba(157,43,51,0.18)",
        },
        lineStyle: {
          color: "source",
          opacity: 0.28,
          width: 1,
          curveness: 0.12,
        },
        emphasis: {
          focus: "adjacency",
          scale: 1.08,
          lineStyle: { width: 2.5, opacity: 0.85 },
          label: { fontWeight: 700 },
        },
        blur: {
          itemStyle: { opacity: 0.12 },
          lineStyle: { opacity: 0.04 },
          label: { opacity: 0.1 },
        },
        data: [...speciesNodes, ...positionNodes],
        links,
      },
    ],
  };

  return { option, edges: links.length };
}
