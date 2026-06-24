import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/ui/site-chrome";
import { Frame } from "@/components/ui/frame";
import { SectionTitle } from "@/components/ui/section-title";
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

const SECTIONS = [
  { id: "evidence", numeral: "壹", label: "影像 · 证据" },
  { id: "scores", numeral: "贰", label: "维度评分" },
  { id: "reasoning", numeral: "叁", label: "推理链" },
  { id: "knowledge", numeral: "肆", label: "关联知识" },
];

function AnalyzePage() {
  const result = Route.useLoaderData();
  const router = useRouter();
  // Shared hover link between the evidence chain and the image region boxes.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [active, setActive] = useState(SECTIONS[0]!.id);

  // Scroll-spy: highlight the section nearest the top of the viewport.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive((vis[0].target as HTMLElement).id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  async function handleDelete() {
    await deleteAnalysisFn({ data: { id: result.id } });
    await router.navigate({ to: "/history" });
  }

  function jump(e: React.MouseEvent, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }

  const conf = Math.round(result.verdict.confidence * 100);

  return (
    <div className="flex min-h-screen flex-col">
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ===== LEFT: 目录 side nav (sticky) ===== */}
            <aside className="hidden lg:block lg:col-span-2">
              <nav className="lg:sticky lg:top-8">
                <div className="mb-4 font-serif text-[12px] tracking-[0.32em] text-ink-muted">
                  目录
                </div>
                <ul className="flex flex-col">
                  {SECTIONS.map((s) => {
                    const on = active === s.id;
                    return (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          onClick={(e) => jump(e, s.id)}
                          className={`-ml-px flex items-baseline gap-2 border-l-2 py-2 pl-4 font-serif text-[13px] tracking-[0.14em] transition-colors ${
                            on
                              ? "border-vermilion text-vermilion"
                              : "border-bronze/30 text-ink-soft hover:text-ink"
                          }`}
                        >
                          <span className="text-[11px] text-bronze-dark">
                            {s.numeral}
                          </span>
                          {s.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>

            {/* ===== CENTER: detail sections ===== */}
            <div className="order-2 lg:order-none lg:col-span-6 flex flex-col gap-14">
              <section id="evidence" className="scroll-mt-8">
                <SectionTitle
                  numeral="壹 · 影像证据"
                  subtitle="Evidence · 图像观察对照专家特征"
                >
                  影像与证据
                </SectionTitle>
                <Frame tone="paper" className="mt-6 p-6">
                  <div className="flex flex-col gap-6">
                    <ImageTriptych
                      original={result.imagePath}
                      segmented={result.segmentedPath}
                      heatmap={result.heatmapPath}
                      subjectBox={result.subjectBox}
                      featureRegions={result.featureRegions}
                      activeKey={activeKey}
                      onHover={setActiveKey}
                    />
                    <EvidenceChain
                      evidence={result.evidence}
                      activeKey={activeKey}
                      onHover={setActiveKey}
                    />
                  </div>
                </Frame>
              </section>

              <section id="scores" className="scroll-mt-8">
                <SectionTitle
                  numeral="贰 · 维度评分"
                  subtitle="Multi-axis dimensional scoring"
                >
                  多维度评分
                </SectionTitle>
                <Frame tone="paper" className="mt-6 p-6">
                  <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-2">
                    <DimensionRadar dimensions={result.dimensions} />
                    <ConfidenceRanking ranking={result.verdict.ranking} />
                  </div>
                </Frame>
              </section>

              <section id="reasoning" className="scroll-mt-8">
                <SectionTitle
                  numeral="叁 · 推理链"
                  subtitle="Chain of thought · 透明可审计"
                >
                  思维链
                </SectionTitle>
                <Frame tone="paper" className="mt-6 p-6">
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
                </Frame>
              </section>

              <section id="knowledge" className="scroll-mt-8">
                <SectionTitle
                  numeral="肆 · 关联知识"
                  subtitle="Expert reference cards"
                >
                  关联知识
                </SectionTitle>
                <div className="mt-6">
                  <KnowledgeCardGrid cards={result.knowledgeCards} />
                </div>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-6 pt-2">
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

            {/* ===== RIGHT: sticky result card (verdict + 3D merged) ===== */}
            <aside className="order-1 lg:order-none lg:col-span-4">
              <div className="lg:sticky lg:top-8">
                <Frame tone="paper" className="overflow-hidden p-0">
                  <div className="flex flex-col items-center gap-4 p-6 text-center">
                    <VerdictSeal
                      species={result.verdict.species}
                      position={result.verdict.position}
                      confidence={result.verdict.confidence}
                    />
                    {(result.verdict.speciesLatin ||
                      result.verdict.positionLatin) && (
                      <div className="font-serif text-[12px] italic tracking-[0.14em] text-ink-muted">
                        {result.verdict.speciesLatin}
                        {result.verdict.positionLatin
                          ? ` · ${result.verdict.positionLatin}`
                          : ""}
                      </div>
                    )}
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
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.16em] text-ink-muted">
                      <span>{formatTimestamp(result.timestamp)}</span>
                      <span>· {(result.processingMs / 1000).toFixed(1)}s</span>
                      <span>· {result.provider.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="relative border-t border-bronze/40">
                    <div className="absolute left-4 top-3 z-10 font-sans text-[10px] tracking-[0.22em] text-ink-muted">
                      {result.glbPath
                        ? "SAM 3D RECONSTRUCTION"
                        : "三维数字标本 · 自动旋转"}
                    </div>
                    <SplatPreviewViewer
                      glbUrl={
                        result.glbPath ??
                        specimenModelFor(
                          result.verdict.species,
                          result.verdict.position,
                        )
                      }
                      reconstruction={Boolean(result.glbPath)}
                      species={result.verdict.species}
                      position={result.verdict.position}
                      heightClass="h-[260px]"
                      autoRotateAlways
                      fitMargin={1.1}
                    />
                  </div>
                </Frame>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
