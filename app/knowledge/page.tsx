import { SiteFooter, SiteHeader } from "@/components/ui/site-chrome";
import { Divider } from "@/components/ui/frame";
import { SectionTitle } from "@/components/ui/section-title";
import {
  ANALYSIS_KNOWLEDGE_CARDS,
  ANALYSIS_SPECIES_LIST,
  POSITION_LIST,
  speciesLatin,
} from "@/lib/knowledge/bones";
import {
  ANCIENT_BREEDS,
  BREED_DIMENSION_LABELS,
  BREEDS_BY_TAXA,
} from "@/lib/knowledge/ancient-breeds";
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
            本图典由两部知识构成：前者为
            <span className="mx-1 text-vermilion">形态对照</span>
            ——按物种与骨位归纳的专家鉴定要点，用于鉴定环节的硬约束证据；后者为
            <span className="mx-1 text-vermilion">品种志</span>
            ——以六维档案描绘中国古代主要马牛生态型的身世、遗址、食谱、职业、病理与礼制，为鉴定结果提供文化语境。
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-[12px] tracking-[0.22em] text-ink-muted">
            <div>
              <span className="text-bronze">物种</span>
              {ANALYSIS_SPECIES_LIST.join(" · ")}
            </div>
            <div>
              <span className="text-bronze">形态条目</span>
              {ANALYSIS_KNOWLEDGE_CARDS.length}
            </div>
            <div>
              <span className="text-bronze">品种档案</span>
              {ANCIENT_BREEDS.length}
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
                    {ANALYSIS_SPECIES_LIST.map((species) => {
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

          <Divider label="古代品种志 · 六维档案" />

          <div className="space-y-20">
            {BREEDS_BY_TAXA.map((taxaBlock) => (
              <section key={taxaBlock.taxa} className="space-y-12">
                <div className="flex items-end justify-between gap-6 border-b border-bronze/30 pb-4">
                  <div>
                    <div className="font-serif text-[12px] tracking-[0.32em] text-vermilion">
                      {taxaBlock.taxa}
                    </div>
                    <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[0.16em] text-ink">
                      {taxaBlock.taxaZh}
                    </h2>
                  </div>
                  <div className="hidden md:block font-sans text-[12px] tracking-[0.22em] text-ink-muted">
                    {taxaBlock.groups
                      .map((g) => `${g.group}·${g.breeds.length}`)
                      .join("　/　")}
                  </div>
                </div>

                {taxaBlock.groups.map((groupBlock) => (
                  <div key={groupBlock.group}>
                    <SectionTitle
                      subtitle={`${groupBlock.breeds.length} archive${groupBlock.breeds.length > 1 ? "s" : ""}`}
                    >
                      {groupBlock.group}
                    </SectionTitle>
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {groupBlock.breeds.map((breed) => (
                        <article
                          key={breed.id}
                          className="cer-paper cer-corners p-7"
                        >
                          <header className="mb-4">
                            <div className="font-serif text-[11px] tracking-[0.3em] text-bronze">
                              {breed.taxaZh} · {breed.group}
                            </div>
                            <h3 className="mt-2 font-serif text-[22px] font-semibold tracking-[0.1em] text-ink">
                              {breed.name}
                            </h3>
                            <div className="mt-1 font-sans text-[12px] tracking-[0.18em] text-ink-muted">
                              {breed.nameEn}
                              {breed.latin && (
                                <span className="ml-2 italic">
                                  · {breed.latin}
                                </span>
                              )}
                            </div>
                          </header>
                          <div className="cer-rule" />
                          <dl className="mt-4 space-y-4">
                            {BREED_DIMENSION_LABELS.map(
                              ({ key, zh, en }, idx) => (
                                <div key={key}>
                                  <dt className="flex items-baseline gap-3">
                                    <span className="font-serif text-[11px] tracking-[0.24em] text-vermilion">
                                      维度{toRomanNumeral(idx + 1)}
                                    </span>
                                    <span className="font-serif text-[14px] font-semibold tracking-[0.12em] text-ink">
                                      {zh}
                                    </span>
                                    <span className="font-sans text-[10.5px] tracking-[0.18em] text-ink-muted">
                                      {en}
                                    </span>
                                  </dt>
                                  <dd className="mt-2">
                                    <ul className="space-y-1.5 text-[12.5px] leading-[1.85] text-ink-soft">
                                      {breed.dimensions[key].map((item, i) => (
                                        <li key={i} className="flex gap-2">
                                          <span className="font-serif text-bronze pt-0.5">
                                            ·
                                          </span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </dd>
                                </div>
                              ),
                            )}
                          </dl>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function buildGrid(): Record<BonePosition, Partial<Record<Species, string[]>>> {
  const grid = {} as Record<BonePosition, Partial<Record<Species, string[]>>>;
  for (const card of ANALYSIS_KNOWLEDGE_CARDS) {
    if (!grid[card.position]) grid[card.position] = {};
    grid[card.position]![card.species] = card.features;
  }
  return grid;
}

function toRomanNumeral(n: number): string {
  const map = ["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ"];
  return map[n] ?? String(n);
}
