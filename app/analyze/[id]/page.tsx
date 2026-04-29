import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/ui/site-chrome";
import { Divider, Frame } from "@/components/ui/frame";
import { SectionTitle } from "@/components/ui/section-title";
import { VerdictSeal } from "@/components/ui/seal";
import { ConfidenceRanking } from "@/components/result/confidence-ranking";
import { DimensionRadar } from "@/components/result/radar-chart";
import { EvidenceChain } from "@/components/result/evidence-chain";
import { ImageTriptych } from "@/components/result/image-triptych";
import { KnowledgeCardGrid } from "@/components/result/knowledge-card-grid";
import { ReasoningPanel } from "@/components/result/reasoning-panel";
import { SplatPreviewViewer } from "@/components/splat/viewer-preview";
import { readAnalysis } from "@/lib/storage";
import { deleteAnalysisAction } from "@/app/actions/analyze";
import { formatTimestamp } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyzePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await readAnalysis(id);
  if (!result) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-[1240px] px-8 py-10">
          <nav className="mb-8 flex items-center gap-3 text-[12px] tracking-[0.22em] text-ink-muted">
            <Link href="/" className="hover:text-vermilion transition-colors">
              首页
            </Link>
            <span>›</span>
            <Link
              href="/history"
              className="hover:text-vermilion transition-colors"
            >
              著录
            </Link>
            <span>›</span>
            <span className="font-mono text-bronze-dark">{result.id}</span>
          </nav>

          {/* Hero: triptych + verdict seal */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              <Frame tone="paper" className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-serif text-[13px] tracking-[0.28em] text-vermilion">
                    壹 · 鉴定影像
                  </span>
                  <span className="font-sans text-[11px] tracking-[0.22em] text-ink-muted">
                    Three-panel Inspection
                  </span>
                </div>
                <ImageTriptych
                  original={result.imagePath}
                  segmented={result.segmentedPath}
                  heatmap={result.heatmapPath}
                  subjectBox={result.subjectBox}
                  featureRegions={result.featureRegions}
                />
              </Frame>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-8">
              <div className="flex flex-col items-center gap-6 pt-4">
                <VerdictSeal
                  species={result.verdict.species}
                  position={result.verdict.position}
                  confidence={result.verdict.confidence}
                />
                <div className="text-center font-serif text-[13px] tracking-[0.28em] text-ink-soft">
                  {result.verdict.speciesLatin && (
                    <div className="italic text-ink-muted text-[12px]">
                      {result.verdict.speciesLatin}
                    </div>
                  )}
                  {result.verdict.positionLatin && (
                    <div className="italic text-ink-muted text-[12px]">
                      {result.verdict.positionLatin}
                    </div>
                  )}
                </div>
              </div>
              <Frame tone="paper" className="p-6">
                <div className="font-serif text-[13px] tracking-[0.28em] text-vermilion">
                  鉴定元数据
                </div>
                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[13px]">
                  <dt className="text-ink-muted tracking-[0.2em]">时间</dt>
                  <dd className="font-mono text-ink-soft">
                    {formatTimestamp(result.timestamp)}
                  </dd>
                  <dt className="text-ink-muted tracking-[0.2em]">编号</dt>
                  <dd className="font-mono text-ink-soft">{result.id}</dd>
                  <dt className="text-ink-muted tracking-[0.2em]">耗时</dt>
                  <dd className="font-mono text-ink-soft">
                    {(result.processingMs / 1000).toFixed(2)} 秒
                  </dd>
                  <dt className="text-ink-muted tracking-[0.2em]">推理</dt>
                  <dd className="font-mono text-ink-soft uppercase">
                    {result.provider}
                  </dd>
                  <dt className="text-ink-muted tracking-[0.2em]">检索</dt>
                  <dd className="font-mono text-ink-soft uppercase">
                    {result.retrievalMode}
                  </dd>
                  {result.channelVerdicts?.thinking && (
                    <>
                      <dt className="text-ink-muted tracking-[0.2em]">通道</dt>
                      <dd className="font-mono text-ink-soft">
                        realtime · thinking
                      </dd>
                    </>
                  )}
                </dl>
              </Frame>
            </div>
          </section>

          <Divider label="鉴定指标" />

          {/* Dimensions + ranking */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7">
              <SectionTitle
                numeral="贰 · 六维度评分"
                subtitle="Multi-axis dimensional scoring"
              >
                多维度评分
              </SectionTitle>
              <Frame tone="paper" className="mt-8 p-6">
                <DimensionRadar dimensions={result.dimensions} />
              </Frame>
            </div>
            <div className="lg:col-span-5">
              <SectionTitle
                numeral="叁 · 候选排序"
                subtitle="Ranked candidates"
              >
                置信度排序
              </SectionTitle>
              <Frame tone="paper" className="mt-8 p-8">
                <ConfidenceRanking ranking={result.verdict.ranking} />
              </Frame>
            </div>
          </section>

          <Divider label="推理依据链" />

          <section>
            <SectionTitle
              numeral="肆 · 依据链"
              subtitle="Evidence chain · 图像观察对照专家特征"
            >
              证据逐条
            </SectionTitle>
            <Frame tone="paper" className="mt-8 p-8">
              <EvidenceChain evidence={result.evidence} />
            </Frame>
          </section>

          <Divider label="思维推理" />

          <section>
            <SectionTitle
              numeral="伍 · 推理链"
              subtitle="Chain of thought · 透明可审计"
            >
              思维链
            </SectionTitle>
            <div className="mt-8 flex flex-col gap-6">
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
          </section>

          <Divider label="关联专家知识" />

          <section>
            <SectionTitle
              numeral="陆 · 知识卡"
              subtitle="Expert reference cards"
            >
              关联知识
            </SectionTitle>
            <div className="mt-8">
              <KnowledgeCardGrid cards={result.knowledgeCards} />
            </div>
          </section>

          {result.glbPath && (
            <>
              <Divider label="SAM 3D 数字标本" />
              <section>
                <SectionTitle
                  numeral="柒 · 数字标本"
                  subtitle="SAM 3D · single-image reconstruction"
                >
                  三维重建
                </SectionTitle>
                <Frame tone="paper" className="mt-8 p-6">
                  <SplatPreviewViewer glbUrl={result.glbPath} />
                </Frame>
              </section>
            </>
          )}

          <Divider />

          <section className="flex flex-wrap items-center justify-between gap-6">
            <Link href="/" className="cer-btn">
              鉴定下一件
            </Link>
            <div className="flex items-center gap-4">
              <Link href={`/api/report/${result.id}`} className="cer-btn-ghost">
                导出鉴定报告
              </Link>
              <form action={deleteAnalysisAction}>
                <input type="hidden" name="id" value={result.id} />
                <button
                  type="submit"
                  className="cer-btn-ghost hover:text-vermilion-deep"
                >
                  删除此条著录
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
