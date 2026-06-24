import { useEffect, useState } from "react";

const STAGES = [
  { label: "主体分割", en: "SAM Segmentation" },
  { label: "知识检索", en: "RAG Retrieval" },
  { label: "豆包推理", en: "Doubao VLM" },
  { label: "三维标本", en: "3D Specimen" },
  { label: "著录归档", en: "Cataloguing" },
];

/**
 * Full-screen ceremonial progress overlay shown while an analysis is running.
 * The server function is opaque (no streamed progress), so stages advance on a
 * timer tuned to the ~realtime-channel latency, holding on the last step until
 * navigation unmounts the overlay.
 */
export function AnalysisOverlay({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    setStep(0);
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, STAGES.length - 1)),
      2600,
    );
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 backdrop-blur-sm">
      <div className="cer-corners w-[min(92vw,540px)] border-2 border-bronze bg-paper px-10 py-12">
        {/* pulsing seal */}
        <div className="mx-auto grid h-20 w-20 place-items-center">
          <div className="absolute h-20 w-20 animate-ping rounded-full border border-vermilion/40" />
          <div className="grid h-16 w-16 animate-pulse place-items-center border-2 border-vermilion bg-vermilion/5 font-serif text-2xl text-vermilion">
            骨
          </div>
        </div>
        <div className="mt-6 text-center font-serif text-xl tracking-[0.24em] text-ink">
          鉴定进行中
        </div>
        <div className="mt-1 text-center font-sans text-[11px] tracking-[0.3em] text-ink-muted">
          OSTEOGNOSIS · IN PROGRESS
        </div>

        <ul className="mt-8 space-y-3">
          {STAGES.map((st, i) => {
            const done = i < step;
            const activeStep = i === step;
            return (
              <li key={st.label} className="flex items-center gap-3">
                <span className="grid h-5 w-5 place-items-center">
                  {done ? (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-vermilion text-[11px] text-paper">
                      ✓
                    </span>
                  ) : activeStep ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-bronze/30 border-t-vermilion" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-bronze/40" />
                  )}
                </span>
                <span
                  className={`font-serif text-[15px] tracking-[0.18em] transition-colors ${
                    done || activeStep ? "text-ink" : "text-ink-muted"
                  }`}
                >
                  {st.label}
                </span>
                <span className="ml-auto font-sans text-[10px] tracking-[0.22em] text-ink-muted">
                  {st.en}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 h-[2px] w-full bg-bronze/25">
          <div
            className="h-full bg-vermilion transition-all duration-700 ease-out"
            style={{ width: `${((step + 1) / STAGES.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
