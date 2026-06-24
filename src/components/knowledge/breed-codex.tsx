import { useMemo, useState } from "react";
import {
  ANCIENT_BREEDS,
  BREED_DIMENSION_LABELS,
  type AncientBreed,
  type BreedTaxa,
} from "@/lib/knowledge/ancient-breeds";
import { HexRadar } from "./hex-radar";

type Filter = "all" | BreedTaxa;

const TABS: Array<{ key: Filter; zh: string; en: string }> = [
  { key: "all", zh: "全部", en: "All" },
  { key: "Bovidae", zh: "牛科", en: "Bovidae" },
  { key: "Equidae", zh: "马科", en: "Equidae" },
];

export function BreedCodex() {
  const [filter, setFilter] = useState<Filter>("all");

  // Global ceiling so every radar shares the same scale → comparable shapes.
  const maxDim = useMemo(
    () =>
      Math.max(
        ...ANCIENT_BREEDS.flatMap((b) =>
          BREED_DIMENSION_LABELS.map((d) => b.dimensions[d.key].length),
        ),
      ),
    [],
  );

  const breeds = useMemo(
    () =>
      filter === "all"
        ? ANCIENT_BREEDS
        : ANCIENT_BREEDS.filter((b) => b.taxa === filter),
    [filter],
  );

  return (
    <div>
      {/* taxa tabs */}
      <div className="flex items-center gap-1 border-b border-bronze/30">
        {TABS.map((t) => {
          const on = t.key === filter;
          const count =
            t.key === "all"
              ? ANCIENT_BREEDS.length
              : ANCIENT_BREEDS.filter((b) => b.taxa === t.key).length;
          return (
            <button
              key={t.key}
              data-on={on}
              onClick={() => setFilter(t.key)}
              className={`cer-tab px-5 py-3 font-serif text-[15px] tracking-[0.14em] ${
                on ? "text-vermilion" : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.zh}
              <span className="ml-1.5 font-sans text-[11px] tracking-normal text-ink-muted">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div key={filter} className="cer-panel-in mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {breeds.map((breed) => (
          <BreedCard key={breed.id} breed={breed} maxDim={maxDim} />
        ))}
      </div>
    </div>
  );
}

function BreedCard({ breed, maxDim }: { breed: AncientBreed; maxDim: number }) {
  const values = BREED_DIMENSION_LABELS.map(
    (d) => breed.dimensions[d.key].length,
  );
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <article className="cer-paper cer-corners cer-glow-hover relative overflow-hidden p-7">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 cer-spotlight" />

      <header className="relative flex items-start justify-between gap-4">
        <div>
          <div className="font-serif text-[11px] tracking-[0.3em] text-bronze">
            {breed.taxaZh} · {breed.group}
          </div>
          <h3 className="mt-2 font-serif text-[24px] font-semibold tracking-[0.1em] text-ink">
            {breed.name}
          </h3>
          <div className="mt-1 font-sans text-[12px] tracking-[0.16em] text-ink-muted">
            {breed.nameEn}
            {breed.latin && <span className="ml-2 italic">· {breed.latin}</span>}
          </div>
        </div>

        {/* dimension-density radar */}
        <div className="relative shrink-0 text-center">
          <HexRadar values={values} max={maxDim} size={116} />
          <div className="-mt-1 font-sans text-[10px] tracking-[0.18em] text-ink-muted">
            档案密度 · <span className="text-vermilion">{total}</span> 条
          </div>
        </div>
      </header>

      <div className="cer-rule my-4" />

      <dl className="grid grid-cols-1 gap-x-7 gap-y-5 md:grid-cols-2">
        {BREED_DIMENSION_LABELS.map(({ key, zh, en }) => (
          <div key={key}>
            <dt className="flex items-center gap-2.5">
              <span className="text-vermilion">
                <DimensionIcon name={key} />
              </span>
              <span className="font-serif text-[14px] font-semibold tracking-[0.1em] text-ink">
                {zh}
              </span>
              <span className="font-sans text-[10px] tracking-[0.16em] text-ink-muted">
                {en}
              </span>
            </dt>
            <dd className="mt-2">
              <ul className="space-y-1.5 text-[12px] leading-[1.8] text-ink-soft">
                {breed.dimensions[key].map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-[3px] inline-block h-1 w-1 shrink-0 rounded-full bg-bronze" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function DimensionIcon({ name }: { name: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "origin": // lineage tree
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="2" />
          <circle cx="6" cy="19" r="2" />
          <circle cx="18" cy="19" r="2" />
          <path d="M12 7v4M12 11H6v6M12 11h6v6" />
        </svg>
      );
    case "sites": // excavation pin
      return (
        <svg {...common}>
          <path d="M12 21s7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "diet": // grain
      return (
        <svg {...common}>
          <path d="M12 3v18" />
          <path d="M12 7c-2-1.5-4-1-4-1s.5 2.5 2.5 3.5M12 7c2-1.5 4-1 4-1s-.5 2.5-2.5 3.5" />
          <path d="M12 12c-2-1.5-4-1-4-1s.5 2.5 2.5 3.5M12 12c2-1.5 4-1 4-1s-.5 2.5-2.5 3.5" />
        </svg>
      );
    case "occupation": // cart / labour
      return (
        <svg {...common}>
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
          <path d="M4 6h3l2 10h8l2-7H8" />
        </svg>
      );
    case "pathology": // bone
      return (
        <svg {...common}>
          <path d="M8 8a2.2 2.2 0 1 0-2.2 2.2L10 14l-3.8 3.8A2.2 2.2 0 1 0 8.4 20l3.6-3.6L15.6 20a2.2 2.2 0 1 0 2.2-2.2L14 14l3.8-3.8A2.2 2.2 0 1 0 15.6 8L12 11.6 8 8Z" />
        </svg>
      );
    case "culture": // ritual ding vessel
      return (
        <svg {...common}>
          <path d="M5 8h14l-1.5 7a3 3 0 0 1-3 2.5H9.5a3 3 0 0 1-3-2.5L5 8Z" />
          <path d="M8 8V5M16 8V5M9 17.5v2M15 17.5v2" />
        </svg>
      );
    default:
      return null;
  }
}
