import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/ui/site-chrome";
import { Divider, Frame } from "@/components/ui/frame";
import { SectionTitle } from "@/components/ui/section-title";
import { listHistory } from "@/server/data";
import { deleteAnalysisFn } from "@/server/analyze";
import { formatTimestamp } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  loader: async () => await listHistory(),
  component: HistoryPage,
});

function HistoryPage() {
  const analyses = Route.useLoaderData();
  const router = useRouter();

  async function handleDelete(id: string) {
    await deleteAnalysisFn({ data: { id } });
    await router.invalidate();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 relative">
        <div className="absolute inset-0 cer-grid-bg opacity-20 pointer-events-none" />
        <div className="relative mx-auto max-w-[1240px] px-8 py-12">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-jade cer-pulse-dot" />
            <div className="font-serif text-[13px] tracking-[0.34em] text-vermilion">
              历次鉴定 · 鉴定著录
            </div>
          </div>
          <h1 className="mt-4 font-serif text-5xl font-bold tracking-[0.1em] cer-gradient-text cer-text-glow">
            著录堂
          </h1>
          <p className="mt-4 max-w-3xl font-sans text-[14px] leading-[1.9] text-ink-soft">
            本地保存的历次鉴定记录。文件按遗址、探方、层位组织时可在未来版本接入。
          </p>
          <Divider />

          {analyses.length === 0 ? (
            <Frame tone="paper" className="p-16 text-center">
              <div className="font-serif text-xl tracking-[0.16em] text-ink-soft">
                尚无著录
              </div>
              <p className="mt-3 font-sans text-[13px] tracking-[0.18em] text-ink-muted">
                返回首页开始第一次鉴定。
              </p>
              <Link to="/" className="cer-btn mt-8 inline-flex">
                前往鉴定
              </Link>
            </Frame>
          ) : (
            <section>
              <SectionTitle subtitle={`共 ${analyses.length} 条著录`}>
                鉴定名册
              </SectionTitle>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analyses.map((item) => (
                  <article
                    key={item.id}
                    className="cer-paper cer-corners p-5 flex flex-col gap-4 cer-glow-hover"
                  >
                    <Link
                      to="/analyze/$id"
                      params={{ id: item.id }}
                      className="group flex flex-col gap-4"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-paper-warm cer-hairline">
                        <img
                          src={item.imagePath}
                          alt={`${item.species}·${item.position}`}
                          className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="font-serif text-xl font-semibold tracking-[0.12em] text-ink group-hover:text-vermilion transition-colors">
                            {item.species}·{item.position}
                          </div>
                          <div className="mt-1 font-mono text-[12px] tracking-[0.12em] text-ink-muted">
                            {formatTimestamp(item.timestamp)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-serif text-[10px] tracking-[0.24em] text-bronze-dark">
                            confidence
                          </div>
                          <div className="font-mono text-[18px] text-vermilion tabular-nums">
                            {(item.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center justify-between border-t border-bronze/30 pt-3 text-[11px] tracking-[0.2em] text-ink-muted">
                      <span className="font-mono">{item.id}</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-ink-muted hover:text-vermilion transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
