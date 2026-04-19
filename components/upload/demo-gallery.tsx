import { analyzeDemoAction } from "@/app/actions/analyze";
import { loadDemoManifest } from "@/lib/demo";

export async function DemoGallery() {
  const entries = await loadDemoManifest();
  if (entries.length === 0) {
    return null;
  }
  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <div>
          <div className="font-serif text-[13px] tracking-[0.28em] text-vermilion">
            贰 · 试用现有标本
          </div>
          <div className="mt-1 font-sans text-[12px] tracking-[0.22em] text-ink-muted">
            自馆藏 300 张马牛标本库中抽取 {entries.length} 张作为示例，点击任意一张即刻鉴定
          </div>
        </div>
      </div>
      <ul className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <form action={analyzeDemoAction} className="contents">
              <input type="hidden" name="demoId" value={entry.id} />
              <button
                type="submit"
                className="group relative block w-full overflow-hidden cer-hairline aspect-square bg-paper-warm hover:border-vermilion transition-all"
                title={`${entry.label} · 提示：${entry.hintSpecies}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.thumb}
                  alt={entry.label}
                  className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-1.5 py-1 flex items-center justify-between text-[10px] tracking-[0.16em] text-paper opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-mono">{entry.id.replace("demo-", "№")}</span>
                  <span>鉴定</span>
                </div>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
