import { useState } from "react";
import type { BonePosition, Species } from "@/lib/types";
import { SplatPreviewViewer, specimenModelFor } from "./viewer-preview";

type Specimen = { label: string; species: Species; position: BonePosition };

// Curated browse set for the homepage showcase — each maps to a real bone scan.
const SPECIMENS: Specimen[] = [
  { label: "马 · 头骨", species: "马", position: "头骨" },
  { label: "黄牛 · 头骨", species: "黄牛", position: "头骨" },
  { label: "股骨", species: "马", position: "股骨" },
  { label: "胫骨", species: "马", position: "胫骨" },
  { label: "肱骨", species: "马", position: "肱骨" },
  { label: "距骨", species: "马", position: "距骨" },
  { label: "掌骨", species: "马", position: "掌骨" },
  { label: "跖骨", species: "马", position: "跖骨" },
  { label: "下颌", species: "马", position: "下颌" },
  { label: "肩胛骨", species: "马", position: "肩胛骨" },
  { label: "寰椎", species: "马", position: "寰椎" },
];

export function SpecimenShowcase() {
  const [active, setActive] = useState(0);
  const cur = SPECIMENS[active]!;
  return (
    <div>
      <SplatPreviewViewer
        glbUrl={specimenModelFor(cur.species, cur.position)}
        species={cur.species}
        position={cur.position}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {SPECIMENS.map((sp, i) => {
          const on = i === active;
          return (
            <button
              key={sp.label}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={on}
              className={`px-3 py-1.5 font-sans text-[12px] tracking-[0.14em] border transition-all ${
                on
                  ? "border-vermilion bg-vermilion text-paper"
                  : "cer-hairline text-ink-soft hover:border-vermilion hover:text-vermilion"
              }`}
            >
              {sp.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
