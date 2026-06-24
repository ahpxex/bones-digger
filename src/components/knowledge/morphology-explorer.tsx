import { useMemo, useState } from "react";
import {
  KNOWLEDGE_CARDS,
  POSITION_LIST,
  SPECIES_LIST,
  isAnalysisSpecies,
  positionLatin,
  speciesLatin,
} from "@/lib/knowledge/bones";
import type { BonePosition, KnowledgeCard, Species } from "@/lib/types";

type PositionGroup = {
  position: BonePosition;
  latin?: string;
  cards: KnowledgeCard[];
};

/**
 * Interactive "鉴定台": pick a bone position on the rail, compare every
 * documented species side-by-side. Built from the full 87-entry expert base.
 */
export function MorphologyExplorer() {
  const groups = useMemo<PositionGroup[]>(() => {
    const order = new Map(SPECIES_LIST.map((s, i) => [s, i] as const));
    return POSITION_LIST.map((position) => {
      const cards = KNOWLEDGE_CARDS.filter((c) => c.position === position).sort(
        (a, b) => (order.get(a.species) ?? 99) - (order.get(b.species) ?? 99),
      );
      return { position, latin: positionLatin(position), cards };
    }).filter((g) => g.cards.length > 0);
  }, []);

  const [active, setActive] = useState<BonePosition>(
    () =>
      groups.slice().sort((a, b) => b.cards.length - a.cards.length)[0]
        ?.position ?? groups[0]!.position,
  );

  const current = groups.find((g) => g.position === active) ?? groups[0]!;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* ===== Rail: bone-position selector ===== */}
      <div className="lg:col-span-3">
        {/* mobile: horizontal chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
          {groups.map((g) => (
            <button
              key={g.position}
              onClick={() => setActive(g.position)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 font-serif text-[13px] tracking-[0.1em] transition-colors ${
                g.position === active
                  ? "border-vermilion bg-vermilion text-paper"
                  : "border-bronze/40 text-ink-soft"
              }`}
            >
              {g.position}
              <span className="ml-1.5 text-[10px] opacity-70">{g.cards.length}</span>
            </button>
          ))}
        </div>

        {/* desktop: vertical rail */}
        <div className="hidden lg:block">
          <div className="mb-3 font-serif text-[12px] tracking-[0.3em] text-ink-muted">
            骨位 · {groups.length} 类
          </div>
          <ul className="cer-paper cer-corners max-h-[640px] overflow-y-auto">
            {groups.map((g) => {
              const on = g.position === active;
              return (
                <li key={g.position}>
                  <button
                    data-on={on}
                    onClick={() => setActive(g.position)}
                    className={`cer-rail-item flex w-full items-center justify-between gap-2 border-l-2 px-4 py-2.5 text-left ${
                      on
                        ? "border-vermilion"
                        : "border-transparent hover:bg-bronze/5"
                    }`}
                  >
                    <span>
                      <span
                        className={`block font-serif text-[15px] tracking-[0.1em] ${
                          on ? "text-vermilion" : "text-ink"
                        }`}
                      >
                        {g.position}
                      </span>
                      {g.latin && (
                        <span className="block font-sans text-[10px] italic tracking-[0.08em] text-ink-muted">
                          {g.latin}
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] tabular-nums ${
                        on
                          ? "bg-vermilion text-paper"
                          : "bg-bronze/15 text-bronze-dark"
                      }`}
                    >
                      {g.cards.length}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ===== Panel: species comparison ===== */}
      <div className="lg:col-span-9">
        <div key={current.position} className="cer-panel-in">
          <div className="flex items-end justify-between gap-4 border-b border-bronze/30 pb-4">
            <div>
              <div className="font-serif text-[12px] tracking-[0.3em] text-vermilion">
                形态对照 · 鉴定台
              </div>
              <h3 className="mt-1.5 font-serif text-[30px] font-semibold tracking-[0.14em] text-ink">
                {current.position}
              </h3>
              {current.latin && (
                <div className="font-sans text-[12px] italic tracking-[0.16em] text-ink-muted">
                  {current.latin}
                </div>
              )}
            </div>
            <div className="hidden text-right font-sans text-[12px] tracking-[0.2em] text-ink-muted sm:block">
              <span className="cer-stat-num text-[34px]">{current.cards.length}</span>
              <div className="-mt-1">物种记录</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {current.cards.map((card) => (
              <SpeciesCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SpeciesCard({ card }: { card: KnowledgeCard }) {
  const isAI = isAnalysisSpecies(card.species);
  return (
    <article
      className={`cer-paper cer-corners cer-glow-hover relative p-5 ${
        isAI ? "ring-1 ring-vermilion/25" : ""
      }`}
    >
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h4 className="font-serif text-[17px] font-semibold tracking-[0.12em] text-ink">
          {card.species}
        </h4>
        <span className="font-sans text-[10.5px] italic tracking-[0.1em] text-ink-muted">
          {speciesLatin(card.species as Species)}
        </span>
      </header>
      {isAI && (
        <span className="absolute -top-2 left-4 rounded-full bg-vermilion px-2 py-0.5 font-sans text-[9px] tracking-[0.18em] text-paper">
          AI 鉴定物种
        </span>
      )}
      <div className="cer-rule" />
      <ul className="mt-3 space-y-2 text-[12.5px] leading-[1.8] text-ink-soft">
        {card.features.map((f, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[3px] inline-block h-1 w-1 shrink-0 rounded-full bg-vermilion/70" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
