import { SiteFooter, SiteHeader } from "@/components/ui/site-chrome";
import { Divider } from "@/components/ui/frame";
import { SectionTitle } from "@/components/ui/section-title";
import {
  KNOWLEDGE_CARDS,
  POSITION_LIST,
  SPECIES_LIST,
  speciesLatin,
} from "@/lib/knowledge/bones";
import type { BonePosition, Species } from "@/lib/types";

export default function KnowledgePage() {
  const grid = buildGrid();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-8 py-12">
          <div className="font-serif text-[13px] tracking-[0.34em] text-vermilion">
            专家鉴定知识 · 动物考古参考
          </div>
          <h1 className="mt-4 font-serif text-5xl font-semibold tracking-[0.1em] text-ink">
            知识图典
          </h1>
          <p className="mt-4 max-w-3xl font-sans text-[14px] leading-[1.9] text-ink-soft">
            以下特征对照表来自动物考古学专家鉴定要点，覆盖七大物种、十八骨位。本平台在鉴定时通过
            Qwen3-Embedding
            检索对应条目，作为视觉大模型判断的硬约束证据，不依赖凭空生成。
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-[12px] tracking-[0.22em] text-ink-muted">
            <div>
              <span className="text-bronze">物种</span>
              {SPECIES_LIST.join(" · ")}
            </div>
            <div>
              <span className="text-bronze">条目数</span>
              {KNOWLEDGE_CARDS.length}
            </div>
          </div>
          <Divider label="物种 × 骨位对照" />

          <div className="space-y-16">
            {POSITION_LIST.map((position) => {
              const row = grid[position];
              if (!row) return null;
              const hasAny = Object.values(row).some(Boolean);
              if (!hasAny) return null;
              return (
                <section key={position}>
                  <SectionTitle subtitle={`Reference entries for ${position}`}>
                    {position}
                  </SectionTitle>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {SPECIES_LIST.map((species) => {
                      const features = row[species];
                      if (!features) return null;
                      return (
                        <article
                          key={`${species}-${position}`}
                          className="cer-paper cer-corners p-6"
                        >
                          <header className="flex items-baseline justify-between mb-3">
                            <h3 className="font-serif text-lg font-semibold tracking-[0.12em] text-ink">
                              {species}
                            </h3>
                            <span className="font-sans text-[11px] italic tracking-[0.14em] text-ink-muted">
                              {speciesLatin(species)}
                            </span>
                          </header>
                          <div className="cer-rule" />
                          <ul className="mt-3 space-y-2 text-[13px] leading-[1.85] text-ink-soft">
                            {features.map((f, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="font-serif text-bronze pt-0.5">
                                  ·
                                </span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function buildGrid(): Record<BonePosition, Partial<Record<Species, string[]>>> {
  const grid = {} as Record<BonePosition, Partial<Record<Species, string[]>>>;
  for (const card of KNOWLEDGE_CARDS) {
    if (!grid[card.position]) grid[card.position] = {};
    grid[card.position]![card.species] = card.features;
  }
  return grid;
}
