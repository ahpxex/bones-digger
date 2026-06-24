import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/ui/site-chrome";
import { Divider, Frame } from "@/components/ui/frame";
import { SectionTitle } from "@/components/ui/section-title";
import { DemoGallery } from "@/components/upload/demo-gallery";
import { DropZone } from "@/components/upload/drop-zone";
import { SpecimenShowcase } from "@/components/splat/specimen-showcase";
import { Reveal } from "@/components/ui/reveal";
import { Counter } from "@/components/ui/counter";
import { toChineseNumeral } from "@/lib/utils";

const STATS = [
  { to: 7, suffix: "", label: "覆盖物种", en: "Species" },
  { to: 18, suffix: "", label: "鉴定骨位", en: "Bone positions" },
  { to: 264, suffix: "+", label: "专家特征", en: "Expert features" },
  { to: 15, suffix: "", label: "古代品种", en: "Ancient breeds" },
];

const TECH_BADGES = [
  "Doubao-Seed 2.1 Pro",
  "SAM 3.1 Multiplex",
  "SAM 3D Objects",
  "Doubao-Embedding",
  "RAG Grounding",
  "TanStack Start",
  "Cloudflare Workers",
];

const TRUST_ITEMS = [
  { label: "中国社会科学院考古研究所", sub: "CASS · IA" },
  { label: "字节跳动 · 火山引擎方舟", sub: "Volcengine ARK" },
  { label: "Cloudflare Edge Network", sub: "Global Compute" },
  { label: "中国计算机设计大赛", sub: "2026 参赛作品" },
];

export const Route = createFileRoute("/")({ component: HomePage });

const STEPS = [
  {
    title: "拍摄与上传",
    body: "在田野现场或实验室将骨骼正置于干净背景中，单角度拍摄即可上传。",
    tag: "Edge Capture",
  },
  {
    title: "分割与重建",
    body:
      "SAM 3.1 去除泥土 / 手指 / 比例尺干扰；SAM 3D 用同一张图重建为可旋转的 3D 数字标本。",
    tag: "SAM 3.1 + 3D",
  },
  {
    title: "检索与比对",
    body:
      "Doubao-Embedding 在专家知识库中检索相关条目，豆包视觉语言模型据此推理。",
    tag: "RAG Retrieval",
  },
  {
    title: "鉴定与著录",
    body:
      "输出种属、骨位、置信度、推理依据链与可导出的鉴定报告，同步入著录。",
    tag: "Verdict + Report",
  },
];

const PIPELINE_NODES = [
  { icon: "photo", label: "图像采集", tech: "Mobile / DSLR", sub: "≤16MB" },
  { icon: "cut", label: "智能分割", tech: "SAM 3.1", sub: "背景剥离" },
  { icon: "cube", label: "3D 重建", tech: "SAM 3D", sub: "单图重建" },
  { icon: "search", label: "向量检索", tech: "Embedding", sub: "264 条目" },
  { icon: "brain", label: "多模态推理", tech: "Doubao VLM", sub: "双通道" },
  { icon: "doc", label: "著录输出", tech: "JSON + PDF", sub: "可导出" },
];

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden">
          {/* layered backgrounds */}
          <div className="absolute inset-0 cer-grid-bg opacity-50" />
          <div className="absolute inset-0 cer-spotlight" />
          <div className="absolute left-0 top-0 bottom-0 w-[3px] cer-vbar opacity-70" />

          <div className="relative mx-auto max-w-[1240px] px-8 pt-12 pb-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3">
                <span className="inline-block h-2 w-2 rounded-full bg-jade cer-pulse-dot" />
                <div className="font-serif text-[13px] tracking-[0.34em] text-vermilion">
                  中国社会科学院考古研究所 · 合作项目
                </div>
              </div>

              <h1 className="mt-6 font-serif text-[96px] leading-[0.95] font-bold tracking-[0.06em] cer-gradient-text cer-text-glow">
                骨鉴
              </h1>
              <div className="mt-4 font-serif text-2xl tracking-[0.2em] text-ink-soft">
                动物骨骼智能鉴定系统
              </div>
              <div className="mt-2 font-sans text-[12px] tracking-[0.42em] text-bronze-dark uppercase">
                OSTEOGNOSIS · AI-Powered Zooarchaeology
              </div>

              <Divider className="!my-6 max-w-xl" />

              <p className="max-w-xl font-sans text-[15px] leading-[1.9] text-ink-soft">
                依托
                <span className="mx-1 font-semibold text-vermilion">
                  豆包（Doubao）原生多模态
                </span>
                与
                <span className="mx-1 font-semibold text-vermilion">
                  SAM 3.1
                </span>
                分割能力，结合动物考古学专家知识库，在田野发掘现场快速判断出土骨骼种属与骨位，并以可解释的推理依据链支撑判定结果。
              </p>

              {/* tech badges */}
              <div className="mt-7 flex flex-wrap gap-2">
                {TECH_BADGES.map((badge) => (
                  <span key={badge} className="cer-badge">
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex items-center gap-6">
                <div className="flex items-center gap-3 text-[12px] tracking-[0.22em] text-ink-muted">
                  <span className="h-px w-8 bg-bronze" />
                  限定马牛二分类
                </div>
                <div className="flex items-center gap-3 text-[12px] tracking-[0.22em] text-ink-muted">
                  <span className="h-px w-8 bg-bronze" />
                  十八骨位鉴定
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <Frame tone="paper" className="cer-glow-hover">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-serif text-[13px] tracking-[0.28em] text-vermilion">
                    壹 · 提交鉴定
                  </span>
                  <span className="font-sans text-[11px] tracking-[0.22em] text-ink-muted">
                    Evidence Submission
                  </span>
                </div>
                <DropZone />
              </Frame>
            </div>
          </div>

          {/* 3D specimen showcase */}
          <div className="relative mx-auto max-w-[1240px] px-8 pb-16">
            <div className="mb-4 flex items-baseline gap-4">
              <span className="font-serif text-[13px] tracking-[0.28em] text-vermilion">
                数字标本馆
              </span>
              <span className="font-sans text-[11px] tracking-[0.22em] text-ink-muted">
                3D Specimen Library · 真实光度扫描 · 点击切换骨位
              </span>
            </div>
            <Frame tone="paper" className="p-6 cer-glow-hover">
              <SpecimenShowcase />
            </Frame>
          </div>
        </section>

        {/* ===== STATS BAND ===== */}
        <Reveal>
          <section className="relative border-y border-bronze/40 bg-paper-warm/50 overflow-hidden">
            <div className="absolute inset-0 cer-grid-bg opacity-30" />
            <div className="relative mx-auto grid max-w-[1240px] grid-cols-2 gap-8 px-8 py-14 md:grid-cols-4">
              {STATS.map((s, i) => (
                <Reveal key={s.label} delay={i * 100}>
                  <div className="text-center">
                    <div className="cer-stat-num text-[56px] leading-none">
                      <Counter to={s.to} suffix={s.suffix} />
                    </div>
                    <div className="mt-3 font-serif text-[14px] tracking-[0.24em] text-ink">
                      {s.label}
                    </div>
                    <div className="mt-1 font-sans text-[10px] tracking-[0.22em] text-ink-muted uppercase">
                      {s.en}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ===== PIPELINE DIAGRAM ===== */}
        <Reveal>
          <section className="mx-auto max-w-[1240px] px-8 py-16">
            <SectionTitle
              numeral="贰 · 技术流水线"
              subtitle="End-to-end pipeline · 从照片到著录的全自动链路"
            >
              鉴定流水线
            </SectionTitle>

            {/* Desktop flow */}
            <div className="mt-12 hidden md:flex items-stretch justify-between gap-0">
              {PIPELINE_NODES.map((node, i) => (
                <div key={node.label} className="flex items-center gap-0 flex-1">
                  <div className="cer-node cer-corners cer-glow-hover p-5 text-center w-[150px] shrink-0">
                    <PipelineIcon name={node.icon} />
                    <div className="mt-3 font-serif text-[15px] font-semibold tracking-[0.1em] text-ink">
                      {node.label}
                    </div>
                    <div className="mt-1 font-mono text-[10px] tracking-[0.1em] text-vermilion">
                      {node.tech}
                    </div>
                    <div className="font-sans text-[10px] tracking-[0.16em] text-ink-muted">
                      {node.sub}
                    </div>
                  </div>
                  {i < PIPELINE_NODES.length - 1 && (
                    <div className="flex-1 flex items-center justify-center px-1">
                      <svg
                        width="100%"
                        height="20"
                        viewBox="0 0 80 20"
                        preserveAspectRatio="none"
                      >
                        <line
                          x1="0"
                          y1="10"
                          x2="70"
                          y2="10"
                          stroke="#b89766"
                          strokeWidth="1.5"
                          className="cer-dash-anim"
                        />
                        <path
                          d="M65 5 L75 10 L65 15"
                          fill="none"
                          stroke="#9d2b33"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile flow — stacked */}
            <div className="mt-8 space-y-3 md:hidden">
              {PIPELINE_NODES.map((node, i) => (
                <div key={node.label}>
                  <div className="cer-node cer-corners p-4 flex items-center gap-4">
                    <PipelineIcon name={node.icon} />
                    <div className="flex-1">
                      <div className="font-serif text-[15px] font-semibold tracking-[0.1em] text-ink">
                        {node.label}
                      </div>
                      <div className="font-mono text-[10px] text-vermilion">
                        {node.tech}
                      </div>
                    </div>
                    <div className="font-sans text-[10px] text-ink-muted">
                      {node.sub}
                    </div>
                  </div>
                  {i < PIPELINE_NODES.length - 1 && (
                    <div className="flex justify-center py-1">
                      <svg width="20" height="24" viewBox="0 0 20 24">
                        <line
                          x1="10"
                          y1="0"
                          x2="10"
                          y2="18"
                          stroke="#b89766"
                          strokeWidth="1.5"
                          className="cer-dash-anim"
                        />
                        <path
                          d="M5 14 L10 22 L15 14"
                          fill="none"
                          stroke="#9d2b33"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ===== DEMO GALLERY ===== */}
        <Reveal>
          <section className="mx-auto max-w-[1240px] px-8 py-10">
            <Frame tone="paper" className="p-8 cer-glow-hover">
              <DemoGallery />
            </Frame>
          </section>
        </Reveal>

        {/* ===== 4-STEP PROTOCOL ===== */}
        <Reveal>
          <section className="mx-auto max-w-[1240px] px-8 py-16">
            <SectionTitle
              numeral="叁 · 鉴定流程"
              subtitle="Four-stage protocol · 田野到著录"
            >
              四步著录
            </SectionTitle>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step, i) => (
                <Frame
                  key={step.title}
                  tone="paper"
                  className="p-7 cer-glow-hover"
                >
                  <div className="flex items-baseline justify-between">
                    <div className="font-serif text-[14px] tracking-[0.3em] text-vermilion">
                      第 {toChineseNumeral(i + 1)} 步
                    </div>
                    <span className="cer-badge">{step.tag}</span>
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-semibold tracking-[0.12em] text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-3 font-sans text-[13px] leading-[1.85] text-ink-soft">
                    {step.body}
                  </p>
                </Frame>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ===== DUAL-CHANNEL ARCHITECTURE ===== */}
        <Reveal>
          <section className="mx-auto max-w-[1240px] px-8 py-16">
            <SectionTitle
              numeral="肆 · 技术构成"
              subtitle="Dual-channel VLM · RAG-grounded"
            >
              双通道推理
            </SectionTitle>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <Frame tone="paper" className="p-10 cer-glow-hover relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 cer-spotlight" />
                <div className="font-serif text-[13px] tracking-[0.3em] text-bronze-dark">
                  实时通道
                </div>
                <h3 className="mt-2 font-serif text-2xl tracking-[0.12em] text-ink">
                  Doubao-Seed Pro 多模态
                </h3>
                <p className="mt-4 font-sans text-[14px] leading-[1.9] text-ink-soft">
                  豆包原生多模态主力，thinking 关闭以优化延迟。负责现场拍照上传后的实时鉴定回应，返回种属、骨位、置信度与六维度评分。
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <span className="cer-badge">Latency ~ 10s</span>
                  <span className="cer-badge">6-Dim Score</span>
                </div>
              </Frame>
              <Frame tone="paper" className="p-10 cer-glow-hover relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 cer-spotlight" />
                <div className="font-serif text-[13px] tracking-[0.3em] text-vermilion">
                  精推通道
                </div>
                <h3 className="mt-2 font-serif text-2xl tracking-[0.12em] text-ink">
                  Doubao-Seed Pro · Thinking
                </h3>
                <p className="mt-4 font-sans text-[14px] leading-[1.9] text-ink-soft">
                  同一模型开启 thinking 深度推理，用于低置信度样本、疑似跨物种相似样本与争议结果。输出可审计的思维链与多步证据（按需启用）。
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <span className="cer-badge">思维链可审计</span>
                  <span className="cer-badge">证据回溯</span>
                </div>
              </Frame>
            </div>
          </section>
        </Reveal>

        {/* ===== TRUST BAR ===== */}
        <Reveal>
          <section className="relative border-t border-bronze/30 bg-paper-warm/40 overflow-hidden">
            <div className="absolute inset-0 cer-grid-bg opacity-20" />
            <div className="relative mx-auto max-w-[1240px] px-8 py-12">
              <div className="text-center font-serif text-[13px] tracking-[0.32em] text-bronze-dark">
                技术支持与合作 · Technology & Partnership
              </div>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                {TRUST_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className="cer-paper cer-corners p-5 text-center cer-glow-hover"
                  >
                    <div className="font-serif text-[14px] font-semibold tracking-[0.1em] text-ink leading-tight">
                      {item.label}
                    </div>
                    <div className="mt-2 font-sans text-[10px] tracking-[0.2em] text-ink-muted uppercase">
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}

function PipelineIcon({ name }: { name: string }) {
  const common = {
    className: "h-8 w-8 mx-auto text-vermilion",
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };
  switch (name) {
    case "photo":
      return (
        <svg viewBox="0 0 32 32" stroke="currentColor" strokeWidth="1.5" {...common}>
          <rect x="4" y="8" width="24" height="18" rx="1" />
          <path d="M12 8l2-3h4l2 3" />
          <circle cx="16" cy="17" r="5" />
          <circle cx="16" cy="17" r="2" />
        </svg>
      );
    case "cut":
      return (
        <svg viewBox="0 0 32 32" stroke="currentColor" strokeWidth="1.5" {...common}>
          <path d="M8 4v20M24 4v20" />
          <path d="M6 8h4M22 8h4M6 14h4M22 14h4M6 20h4M22 20h4" opacity="0.5" />
          <path d="M12 16h8" strokeDasharray="2 2" />
        </svg>
      );
    case "cube":
      return (
        <svg viewBox="0 0 32 32" stroke="currentColor" strokeWidth="1.5" {...common}>
          <path d="M16 4l10 6v12l-10 6-10-6V10z" />
          <path d="M16 4v24M6 10l10 6 10-6" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 32 32" stroke="currentColor" strokeWidth="1.5" {...common}>
          <circle cx="14" cy="14" r="8" />
          <path d="M20 20l6 6" />
          <path d="M10 14h8M14 10v8" opacity="0.4" />
        </svg>
      );
    case "brain":
      return (
        <svg viewBox="0 0 32 32" stroke="currentColor" strokeWidth="1.5" {...common}>
          <rect x="6" y="6" width="20" height="20" rx="2" />
          <circle cx="12" cy="13" r="1.5" />
          <circle cx="20" cy="13" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
          <circle cx="20" cy="19" r="1.5" />
          <path d="M12 13h8M12 19h8M12 13v6M20 13v6" opacity="0.4" />
        </svg>
      );
    case "doc":
      return (
        <svg viewBox="0 0 32 32" stroke="currentColor" strokeWidth="1.5" {...common}>
          <path d="M8 4h12l6 6v18H8z" />
          <path d="M20 4v6h6" />
          <path d="M12 16h8M12 20h8M12 24h5" />
        </svg>
      );
    default:
      return null;
  }
}
