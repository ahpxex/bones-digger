"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import type {
  RadarComponentOption,
  TitleComponentOption,
  TooltipComponentOption,
} from "echarts";
import type { RadarSeriesOption } from "echarts/charts";
import type { ComposeOption } from "echarts/core";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] grid place-items-center text-ink-muted text-sm tracking-[0.2em]">
      加载图表 …
    </div>
  ),
});

function useSilenceEChartsTickWarning() {
  useEffect(() => {
    const orig = console.warn;
    console.warn = (...args: unknown[]) => {
      const first = args[0];
      if (
        typeof first === "string" &&
        first.startsWith("[ECharts]") &&
        first.includes("The ticks may be not readable")
      ) {
        return;
      }
      orig(...(args as []));
    };
    return () => {
      console.warn = orig;
    };
  }, []);
}

type Opt = ComposeOption<
  | RadarSeriesOption
  | RadarComponentOption
  | TitleComponentOption
  | TooltipComponentOption
>;

export function DimensionRadar({
  dimensions,
}: {
  dimensions: Record<string, number>;
}) {
  useSilenceEChartsTickWarning();
  const indicators = Object.keys(dimensions).map((name) => ({
    name,
    max: 100,
  }));
  const values = Object.values(dimensions).map((v) => v * 100);

  const option: Opt = {
    tooltip: {
      backgroundColor: "#f5f1e8",
      borderColor: "#b89766",
      borderWidth: 1,
      textStyle: { color: "#1a1a1a", fontFamily: "var(--font-sans)" },
      formatter: (params: unknown) => {
        const p = params as { value: number[]; name: string };
        return p.value
          .map(
            (v, i) =>
              `<div style="display:flex;justify-content:space-between;gap:20px"><span>${indicators[i]?.name ?? ""}</span><span style="font-family:monospace">${v.toFixed(1)}%</span></div>`,
          )
          .join("");
      },
    },
    radar: {
      indicator: indicators,
      center: ["50%", "52%"],
      radius: "68%",
      splitNumber: 4,
      shape: "polygon",
      axisLabel: { show: false },
      axisName: {
        color: "#3a3632",
        fontFamily: "var(--font-serif)",
        fontSize: 13,
      },
      splitArea: {
        areaStyle: {
          color: [
            "rgba(184,151,102,0.02)",
            "rgba(184,151,102,0.06)",
            "rgba(184,151,102,0.10)",
            "rgba(184,151,102,0.14)",
          ],
        },
      },
      splitLine: {
        lineStyle: { color: "rgba(184,151,102,0.4)", width: 1 },
      },
      axisLine: {
        lineStyle: { color: "rgba(184,151,102,0.4)" },
      },
    },
    series: [
      {
        type: "radar",
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: "#9d2b33", width: 2 },
        itemStyle: { color: "#9d2b33" },
        areaStyle: { color: "rgba(157, 43, 51, 0.18)" },
        data: [
          {
            value: values,
            name: "鉴定评分",
          },
        ],
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 360, width: "100%" }}
      opts={{ renderer: "svg" }}
    />
  );
}
