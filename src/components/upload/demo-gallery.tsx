import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { analyzeDemo } from "@/server/analyze";
import manifest from "@/lib/demo-manifest.json";
import type { DemoEntry } from "@/lib/demo";

const entries = manifest as DemoEntry[];

export function DemoGallery() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (entries.length === 0) return null;

  async function run(demoId: string) {
    if (loadingId) return;
    setError(null);
    setLoadingId(demoId);
    try {
      const { id } = await analyzeDemo({ data: { demoId } });
      await router.navigate({ to: "/analyze/$id", params: { id } });
    } catch (err) {
      setLoadingId(null);
      setError(err instanceof Error ? err.message : "鉴定失败，请稍后重试。");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <div>
          <div className="font-serif text-[13px] tracking-[0.28em] text-vermilion">
            贰 · 试用现有标本
          </div>
          <div className="mt-1 font-sans text-[12px] tracking-[0.22em] text-ink-muted">
            精选 {entries.length} 件马 / 黄牛标本，点击任意一张即刻鉴定
          </div>
        </div>
      </div>
      {error && (
        <div className="mb-4 border-l-2 border-vermilion bg-paper-warm px-4 py-3 text-[13px] text-vermilion-deep">
          {error}
        </div>
      )}
      <ul className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => run(entry.id)}
              disabled={loadingId !== null}
              className="group relative block w-full overflow-hidden cer-hairline aspect-square bg-paper-warm hover:border-vermilion transition-all disabled:cursor-not-allowed"
              title={`${entry.label} · 提示：${entry.hintSpecies}`}
            >
              <img
                src={entry.thumb}
                alt={entry.label}
                className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-1.5 py-1 flex items-center justify-between text-[10px] tracking-[0.16em] text-paper opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="font-mono">{entry.id.replace("demo-", "№")}</span>
                <span>鉴定</span>
              </div>
              {loadingId === entry.id && (
                <div className="absolute inset-0 grid place-items-center bg-ink/70 text-paper text-[10px] tracking-[0.2em]">
                  鉴定中 …
                </div>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
