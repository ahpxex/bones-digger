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

const RADAR_LABELS = BREED_DIMENSION_LABELS.map((d) => ({ zh: d.zh, en: d.en }));

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

      <div
        key={filter}
        className="cer-panel-in mt-8 flex flex-col gap-7"
      >
        {breeds.map((breed) => (
          <BreedCard key={breed.id} breed={breed} maxDim={maxDim} />
        ))}
      </div>
    </div>
  );
}

function BreedCard({
  breed,
  maxDim,
}: {
  breed: AncientBreed;
  maxDim: number;
}) {
  const [active, setActive] = useState(0);
  const values = BREED_DIMENSION_LABELS.map(
    (d) => breed.dimensions[d.key].length,
  );
  const total = values.reduce((a, b) => a + b, 0);
  const dim = BREED_DIMENSION_LABELS[active]!;
  const items = breed.dimensions[dim.key];

  return (
    <article className="cer-paper cer-corners cer-glow-hover relative overflow-hidden p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 cer-spotlight" />
      <div className="pointer-events-none absolute inset-0 cer-grid-bg opacity-[0.18]" />

      {/* header */}
      <header className="relative flex items-start justify-between gap-4">
        <div>
          <div className="font-serif text-[11px] tracking-[0.3em] text-bronze">
            {breed.taxaZh} · {breed.group}
          </div>
          <h3 className="mt-2 font-serif text-[26px] font-semibold tracking-[0.08em] text-ink cer-heading-underline">
            {breed.name}
          </h3>
          <div className="mt-3 font-sans text-[12px] tracking-[0.16em] text-ink-muted">
            {breed.nameEn}
            {breed.latin && <span className="ml-2 italic">· {breed.latin}</span>}
          </div>
        </div>
        <div className="relative shrink-0 text-right">
          <div className="cer-stat-num text-[34px] leading-none">{total}</div>
          <div className="mt-1.5 font-sans text-[9px] tracking-[0.22em] text-ink-muted uppercase">
            Archive facts
          </div>
          <div className="mt-0.5 font-serif text-[10.5px] tracking-[0.2em] text-bronze-dark">
            档案总条目
          </div>
        </div>
      </header>

      <div className="cer-rule my-6" />

      {/* body: radar + linked detail panel */}
      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-10">
        {/* radar stage */}
        <div className="relative flex items-center justify-center">
          <div className="pointer-events-none absolute inset-0 -m-6 cer-conic rounded-full opacity-40" />
          <div className="relative">
            <HexRadar
              values={values}
              labels={RADAR_LABELS}
              max={maxDim}
              size={380}
              activeIndex={active}
              onChange={setActive}
            />
            <div className="pointer-events-none mt-1 text-center font-sans text-[10px] tracking-[0.24em] text-ink-muted uppercase">
              Hover a vertex · 六维档案
            </div>
          </div>
        </div>

        {/* detail panel — keyed on active so it re-animates per switch */}
        <div
          key={active}
          className="cer-panel-in relative flex flex-col rounded-sm border border-bronze/30 bg-paper-warm/40 p-5 sm:p-6"
        >
          <div className="pointer-events-none absolute -left-px top-0 h-full w-[3px] bg-vermilion/70" />
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-vermilion/40 bg-vermilion/8 text-vermilion">
              <DimensionIcon name={dim.key} />
            </span>
            <div>
              <div className="font-serif text-[20px] font-semibold tracking-[0.1em] text-ink">
                {dim.zh}
              </div>
              <div className="font-sans text-[10.5px] tracking-[0.2em] text-ink-muted uppercase">
                {dim.en}
              </div>
            </div>
            <span className="cer-badge ml-auto !text-vermilion !border-vermilion/40 !bg-vermilion/5">
              {items.length} 条档案
            </span>
          </div>

          <div className="cer-rule my-4 opacity-60" />

          <ul className="flex flex-col gap-3">
            {items.map((item, i) => (
              <li
                key={i}
                className="flex gap-3 text-[13px] leading-[1.85] text-ink-soft"
              >
                <span className="mt-[6px] inline-block h-[18px] w-[18px] shrink-0 rounded-full border border-bronze/50 bg-paper-warm text-center font-serif text-[10px] leading-[17px] text-bronze-dark">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* dimension switcher chips */}
          <div className="mt-5 flex flex-wrap gap-1.5 border-t border-bronze/20 pt-4">
            {BREED_DIMENSION_LABELS.map((d, i) => {
              const on = i === active;
              return (
                <button
                  key={d.key}
                  data-on={on}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  className={`cer-rail-item rounded-full border px-3 py-1.5 font-serif text-[12px] tracking-[0.1em] transition-colors ${
                    on
                      ? "border-vermilion/50 bg-vermilion/10 text-vermilion"
                      : "border-bronze/30 text-ink-muted hover:text-ink"
                  }`}
                >
                  {d.zh}
                  <span className="ml-1 font-sans text-[10px] text-bronze-dark">
                    {values[i]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}

function DimensionIcon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
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
