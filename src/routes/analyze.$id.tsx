import { useState } from "react";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/ui/site-chrome";
import { Frame } from "@/components/ui/frame";
import { VerdictSeal } from "@/components/ui/seal";
import { ConfidenceRanking } from "@/components/result/confidence-ranking";
import { DimensionRadar } from "@/components/result/radar-chart";
import { EvidenceChain } from "@/components/result/evidence-chain";
import { ImageTriptych } from "@/components/result/image-triptych";
import { KnowledgeCardGrid } from "@/components/result/knowledge-card-grid";
import { ReasoningPanel } from "@/components/result/reasoning-panel";
import { SplatPreviewViewer, specimenModelFor } from "@/components/splat/viewer-preview";
import { getAnalysis } from "@/server/data";
import { deleteAnalysisFn } from "@/server/analyze";
import { formatTimestamp } from "@/lib/utils";

export const Route = createFileRoute("/analyze/$id")({
  loader: async ({ params }) => {
    const result = await getAnalysis({ data: params.id });
    if (!result) throw notFound();
    return result;
  },
  component: AnalyzePage,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 grid place-items-center">
        <div className="text-center">
          <div className="font-serif text-2xl tracking-[0.16em] text-ink">
            未找到该条著录
          </div>
          <Link to="/" className="cer-btn mt-8 inline-flex">
            返回鉴定
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

type TabKey = "evidence" | "scores" | "reasoning" | "knowledge";

const TABS: { k: TabKey; label: string; en: string }[] = [
  { k: "evidence", label: "影像 · 证据", en: "Evidence" },
  { k: "scores", label: "维度评分", en: "Scoring" },
  { k: "reasoning", label: "推理链", en: "Reasoning" },
  { k: "knowledge", label: "关联知识", en: "Knowledge" },
];

function AnalyzePage() {
  const result = Route.useLoaderData();
  const router = useRouter();
  // Shared hover link between the evidence chain and the image region boxes.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("evidence");

  async function handleDelete() {
    await deleteAnalysisFn({ data: { id: result.id } });
    await router.navigate({ to: "/history" });
  }

  const conf = Math.round(result.verdict.confidence * 100);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-[1240px] px-8 py-8">
          <nav className="mb-6 flex items-center gap-3 text-[12px] tracking-[0.22em] text-ink-muted">
            <Link to="/" className="hover:text-vermilion transition-colors">
              首页
            </Link>
            <span>›</span>
            <Link to="/history" className="hover:text-vermilion transition-colors">
              著录
            </Link>
            <span>›</span>
            <span className="font-mono text-bronze-dark">{result.id}</span>
          </nav>

          {/* ===== IMPACT HERO: 3D specimen + verdict ===== */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7">
              <Frame tone="paper" className="relative h-full overflow-hidden p-0">
                <div className="absolute left-5 top-4 z-10 flex items-center gap-3">
                  <span className="font-serif text-[12px] tracking-[0.28em] text-vermilion">
                    三维数字标本
                  </span>
                  <span className="font-sans text-[10px] tracking-[0.22em] text-ink-muted">
                    {result.glbPath ? "SAM 3D RECONSTRUCTION" : "3D SPECIMEN"}
                  </span>
                </div>
                <SplatPreviewViewer
                  glbUrl={
                    result.glbPath ??
                    specimenModelFor(result.verdict.species, result.verdict.position)
                  }
                  reconstruction={Boolean(result.glbPath)}
                  species={result.verdict.species}
                  position={result.verdict.position}
                  heightClass="h-[460px]"
                />
              </Frame>
            </div>

            <div className="lg:col-span-5">
              <Frame
                tone="paper"
                className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center"
              >
                <VerdictSeal
                  species={result.verdict.species}
                  position={result.verdict.position}
                  confidence={result.verdict.confidence}
                />
                {(result.verdict.speciesLatin || result.verdict.positionLatin) && (
                  <div className="font-serif text-[12px] italic tracking-[0.14em] text-ink-muted">
                    {result.verdict.speciesLatin}
                    {result.verdict.positionLatin
                      ? ` · ${result.verdict.positionLatin}`
                      : ""}
                  </div>
                )}

                <div className="flex items-end justify-center gap-2">
                  <span className="font-serif text-[64px] leading-none text-vermilion">
                    {conf}
                  </span>
                  <span className="mb-2 font-sans text-[14px] tracking-[0.2em] text-ink-soft">
                    % 置信度
                  </span>
                </div>

                {/* compact 马/黄牛 split */}
                <div className="flex w-full max-w-[280px] flex-col gap-2">
                  {result.verdict.ranking.slice(0, 2).map((r) => (
                    <div key={r.species} className="flex items-center gap-3">
                      <span className="w-10 text-right font-serif text-[13px] text-ink">
                        {r.species}
                      </span>
                      <div className="h-[6px] flex-1 bg-bronze/20">
                        <div
                          className="h-full bg-vermilion transition-all"
                          style={{ width: `${Math.round(r.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="w-10 font-mono text-[11px] text-ink-soft">
                        {Math.round(r.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.16em] text-ink-muted">
                  <span>{formatTimestamp(result.timestamp)}</span>
                  <span>· {(result.processingMs / 1000).toFixed(1)}s</span>
                  <span>· {result.provider.toUpperCase()}</span>
                  <span>· {result.retrievalMode.toUpperCase()}</span>
                </div>
              </Frame>
            </div>
          </section>

          {/* ===== TABBED DETAILS ===== */}
          <div className="mt-8">
            <div className="flex flex-wrap gap-1 border-b border-bronze/40">
              {TABS.map((t) => {
                const on = tab === t.k;
                return (
                  <button
                    key={t.k}
                    type="button"
                    onClick={() => setTab(t.k)}
                    className={`-mb-px border-b-2 px-5 py-3 font-serif text-[14px] tracking-[0.18em] transition-colors ${
                      on
                        ? "border-vermilion text-vermilion"
                        : "border-transparent text-ink-muted hover:text-ink"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <Frame tone="paper" className="mt-6 p-8">
              {tab === "evidence" && (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-5">
                    <ImageTriptych
                      original={result.imagePath}
                      segmented={result.segmentedPath}
                      heatmap={result.heatmapPath}
                      subjectBox={result.subjectBox}
                      featureRegions={result.featureRegions}
                      activeKey={activeKey}
                      onHover={setActiveKey}
                    />
                  </div>
                  <div className="lg:col-span-7">
                    <EvidenceChain
                      evidence={result.evidence}
                      activeKey={activeKey}
                      onHover={setActiveKey}
                    />
                  </div>
                </div>
              )}

              {tab === "scores" && (
                <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
                  <DimensionRadar dimensions={result.dimensions} />
                  <ConfidenceRanking ranking={result.verdict.ranking} />
                </div>
              )}

              {tab === "reasoning" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="mb-3 font-serif text-[12px] tracking-[0.3em] text-bronze-dark">
                      实时通道 · Realtime
                    </div>
                    <ReasoningPanel reasoning={result.reasoning} />
                  </div>
                  {result.thinkingReasoning && (
                    <div>
                      <div className="mb-3 font-serif text-[12px] tracking-[0.3em] text-vermilion">
                        精推通道 · Thinking
                      </div>
                      <ReasoningPanel reasoning={result.thinkingReasoning} />
                    </div>
                  )}
                </div>
              )}

              {tab === "knowledge" && (
                <KnowledgeCardGrid cards={result.knowledgeCards} />
              )}
            </Frame>
          </div>

          {/* ===== actions ===== */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
            <Link to="/" className="cer-btn">
              鉴定下一件
            </Link>
            <div className="flex items-center gap-4">
              <a
                href={`/api/report/${result.id}`}
                target="_blank"
                rel="noreferrer"
                className="cer-btn-ghost"
              >
                导出鉴定报告
              </a>
              <button
                type="button"
                onClick={handleDelete}
                className="cer-btn-ghost hover:text-vermilion-deep"
              >
                删除此条著录
              </button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
