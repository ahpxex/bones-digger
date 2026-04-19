import type { EvidenceItem } from "@/lib/types";
import { toChineseNumeral } from "@/lib/utils";

export function EvidenceChain({ evidence }: { evidence: EvidenceItem[] }) {
  return (
    <ol className="flex flex-col gap-6">
      {evidence.map((item, i) => (
        <li
          key={item.id}
          className="cer-entry grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-6 gap-y-2"
        >
          <div className="md:col-span-2 flex items-baseline gap-4">
            <span className="font-serif text-[14px] tracking-[0.3em] text-vermilion">
              第 {toChineseNumeral(i + 1)} 条
            </span>
            <span className="font-serif text-[17px] font-semibold tracking-[0.1em] text-ink">
              {item.key}
            </span>
            <span className="ml-auto font-mono text-[12px] tracking-[0.06em] text-bronze-dark">
              权重 {(item.weight * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-serif text-[11px] tracking-[0.28em] text-ink-muted">
              图像观察
            </span>
            <p className="font-sans text-[14px] leading-[1.9] text-ink-soft">
              {item.observation}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-serif text-[11px] tracking-[0.28em] text-ink-muted">
              专家特征
            </span>
            <p className="font-sans text-[14px] leading-[1.9] text-ink-soft">
              {item.referenceFeature}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
