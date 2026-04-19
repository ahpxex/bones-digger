import type { RankingEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ConfidenceRanking({
  ranking,
}: {
  ranking: RankingEntry[];
}) {
  const max = Math.max(...ranking.map((r) => r.confidence));
  return (
    <ul className="flex flex-col gap-4">
      {ranking.map((entry, i) => {
        const isTop = i === 0;
        const width = `${(entry.confidence / max) * 100}%`;
        return (
          <li key={`${entry.species}-${entry.position}-${i}`}>
            <div className="flex items-baseline justify-between gap-4 mb-1.5">
              <div className="flex items-baseline gap-3">
                <span
                  className={cn(
                    "font-serif text-[11px] tracking-[0.32em]",
                    isTop ? "text-vermilion" : "text-ink-muted",
                  )}
                >
                  {String.fromCharCode(0x2160 + i)}
                </span>
                <span
                  className={cn(
                    "font-serif tracking-[0.12em]",
                    isTop
                      ? "text-[18px] font-semibold text-ink"
                      : "text-[15px] text-ink-soft",
                  )}
                >
                  {entry.species}
                </span>
                <span
                  className={cn(
                    "font-serif tracking-[0.1em] text-ink-muted",
                    isTop ? "text-[14px]" : "text-[12px]",
                  )}
                >
                  {entry.position}
                </span>
              </div>
              <span
                className={cn(
                  "font-mono tabular-nums tracking-[0.06em]",
                  isTop
                    ? "text-[18px] font-medium text-vermilion"
                    : "text-[13px] text-ink-soft",
                )}
              >
                {(entry.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-[3px] bg-paper-deep/40 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  isTop ? "bg-vermilion" : "bg-bronze/70",
                )}
                style={{ width }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
