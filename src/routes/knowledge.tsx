import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/ui/site-chrome";
import { SectionTitle } from "@/components/ui/section-title";
import { Reveal } from "@/components/ui/reveal";
import { Counter } from "@/components/ui/counter";
import { KnowledgeGraph } from "@/components/knowledge/knowledge-graph";
import { MorphologyExplorer } from "@/components/knowledge/morphology-explorer";
import { BreedCodex } from "@/components/knowledge/breed-codex";
import {
  KNOWLEDGE_CARDS,
  POSITION_LIST,
  SPECIES_LIST,
} from "@/lib/knowledge/bones";
import {
  ANCIENT_BREEDS,
  BREED_DIMENSION_LABELS,
} from "@/lib/knowledge/ancient-breeds";

export const Route = createFileRoute("/knowledge")({ component: KnowledgePage });

const FEATURE_TOTAL = KNOWLEDGE_CARDS.reduce(
  (n, c) => n + c.features.length,
  0,
);
const BREED_FACTS = ANCIENT_BREEDS.reduce(
  (n, b) => n + BREED_DIMENSION_LABELS.reduce((m, d) => m + b.dimensions[d.key].length, 0),
  0,
);

const STATS = [
  { to: SPECIES_LIST.length, suffix: "", label: "覆盖物种", en: "Species" },
  { to: POSITION_LIST.length, suffix: "", label: "鉴定骨位", en: "Bone positions" },
  { to: FEATURE_TOTAL, suffix: "", label: "形态特征", en: "Morphological traits" },
  { to: KNOWLEDGE_CARDS.length, suffix: "", label: "知识关联", en: "Graph edges" },
  { to: ANCIENT_BREEDS.length, suffix: "", label: "古代品种", en: "Ancient breeds" },
  { to: BREED_FACTS, suffix: "", label: "档案条目", en: "Archive facts" },
];

const SECTIONS = [
  { id: "graph", numeral: "壹", label: "知识图谱" },
  { id: "morphology", numeral: "贰", label: "形态对照" },
  { id: "breeds", numeral: "叁", label: "古代品种志" },
];

function KnowledgePage() {
  const [active, setActive] = useState(SECTIONS[0]!.id);

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
      { rootMargin: "-12% 0px -70% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function jump(e: React.MouseEvent, id: string) {
    e.preventDefault();
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex-1">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden border-b border-bronze/30">
          <div className="absolute inset-0 cer-grid-bg opacity-40" />
          <div className="absolute inset-0 cer-spotlight" />
          <div className="absolute left-0 top-0 bottom-0 w-[3px] cer-vbar opacity-70" />
          <div className="relative mx-auto max-w-[1400px] px-8 pt-12 pb-10">
            <div className="flex items-center gap-3">
              <span className="inline-block h-2 w-2 rounded-full bg-jade cer-pulse-dot" />
              <div className="font-serif text-[13px] tracking-[0.34em] text-vermilion">
                专家鉴定知识库 · 动物考古学图谱
              </div>
            </div>
            <h1 className="mt-5 font-serif text-[72px] leading-[0.95] font-bold tracking-[0.08em] cer-gradient-text cer-text-glow">
              知识图典
            </h1>
            <div className="mt-2 font-sans text-[12px] tracking-[0.42em] text-bronze-dark uppercase">
              Osteological Knowledge Codex · Graph · Morphology · Breeds
            </div>
            <p className="mt-6 max-w-3xl font-sans text-[14px] leading-[1.9] text-ink-soft">
              本图典将
              <span className="mx-1 text-vermilion">物种 × 骨位 × 形态特征</span>
              组织为可视化知识图谱，并以
              <span className="mx-1 text-vermilion">六维档案</span>
              描绘中国古代主要马牛生态型的身世、遗址、食谱、职业、病理与礼制——既是鉴定环节的硬约束证据库，也为鉴定结果提供文化语境。
            </p>

            {/* stats band */}
            <div className="mt-9 grid grid-cols-3 gap-6 md:grid-cols-6">
              {STATS.map((s, i) => (
                <Reveal key={s.label} delay={i * 80}>
                  <div className="text-center">
                    <div className="cer-stat-num text-[40px] leading-none">
                      <Counter to={s.to} suffix={s.suffix} />
                    </div>
                    <div className="mt-2 font-serif text-[12.5px] tracking-[0.18em] text-ink">
                      {s.label}
                    </div>
                    <div className="mt-0.5 font-sans text-[9px] tracking-[0.18em] text-ink-muted uppercase">
                      {s.en}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== BODY ===== */}
        <div className="relative mx-auto max-w-[1400px] px-8 py-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* sticky 目录 */}
            <aside className="hidden lg:col-span-2 lg:block">
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

            {/* content */}
            <div className="flex flex-col gap-20 lg:col-span-10">
              {/* 壹 知识图谱 */}
              <section id="graph" className="scroll-mt-8">
                <SectionTitle
                  numeral="壹 · 知识图谱"
                  subtitle="Knowledge graph · 物种与骨位的专家关联网络"
                >
                  物种 × 骨位 知识图谱
                </SectionTitle>
                <Reveal className="mt-6">
                  <div className="cer-paper cer-corners relative overflow-hidden p-4 sm:p-6">
                    <KnowledgeGraph />
                  </div>
                </Reveal>
                <p className="mt-4 font-sans text-[12.5px] leading-[1.8] text-ink-muted">
                  每一条连线代表一份专家形态特征记录。节点越大，说明其在知识库中的关联越密集——
                  这正是模型在鉴定时所检索与比对的底层结构。
                </p>
              </section>

              {/* 贰 形态对照 */}
              <section id="morphology" className="scroll-mt-8">
                <SectionTitle
                  numeral="贰 · 形态对照"
                  subtitle="Comparative morphology · 按骨位逐物种比对"
                >
                  形态对照鉴定台
                </SectionTitle>
                <Reveal className="mt-8">
                  <MorphologyExplorer />
                </Reveal>
              </section>

              {/* 叁 古代品种志 */}
              <section id="breeds" className="scroll-mt-8">
                <SectionTitle
                  numeral="叁 · 古代品种志"
                  subtitle="Ancient breeds · 六维档案 · 身世 / 遗址 / 食谱 / 职业 / 病理 / 礼制"
                >
                  古代品种 · 六维档案
                </SectionTitle>
                <Reveal className="mt-8">
                  <BreedCodex />
                </Reveal>
              </section>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
