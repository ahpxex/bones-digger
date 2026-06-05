import type { KnowledgeCard } from "@/lib/types";
import { speciesLatin } from "@/lib/knowledge/bones";

export function KnowledgeCardGrid({ cards }: { cards: KnowledgeCard[] }) {
  if (cards.length === 0) {
    return (
      <div className="text-[13px] text-ink-muted tracking-[0.18em]">
        暂无关联知识卡片。
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {cards.map((card) => (
        <article
          key={card.id}
          className="cer-paper cer-corners p-6 flex flex-col gap-3"
        >
          <header className="flex items-baseline justify-between">
            <div>
              <h3 className="font-serif text-xl font-semibold tracking-[0.12em] text-ink">
                {card.species}·{card.position}
              </h3>
              <div className="mt-1 font-sans text-[11px] tracking-[0.2em] text-ink-muted italic">
                {speciesLatin(card.species)}
              </div>
            </div>
          </header>
          <div className="cer-rule" />
          <ul className="flex flex-col gap-2 font-sans text-[13px] leading-[1.85] text-ink-soft list-none">
            {card.features.map((feat, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-bronze font-serif pt-0.5">·</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
