import { Link, useRouterState } from "@tanstack/react-router";

export function SiteHeader() {
  const location = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (path: string) =>
    path === "/" ? location === "/" : location.startsWith(path);
  const navLink = (path: string, label: string) =>
    `transition-colors relative ${
      isActive(path)
        ? "text-vermilion"
        : "hover:text-vermilion"
    }`;
  return (
    <header className="border-b border-bronze/40 bg-paper/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-[1240px] px-8 py-5 flex items-center justify-between gap-8">
        <Link
          to="/"
          className="flex items-center gap-4 text-ink hover:text-vermilion transition-colors"
        >
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-[28px] font-semibold tracking-[0.22em]">
              骨鉴
            </span>
            <span className="font-sans text-[11px] tracking-[0.32em] text-ink-muted uppercase">
              OSTEOGNOSIS
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-10 font-serif text-[15px] tracking-[0.2em]">
          <Link to="/" className={navLink("/", "鉴定")}>
            鉴定
          </Link>
          <Link
            to="/knowledge"
            className={navLink("/knowledge", "知识")}
          >
            知识
          </Link>
          <Link
            to="/history"
            className={navLink("/history", "著录")}
          >
            著录
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-bronze/40 bg-paper-warm/60 relative overflow-hidden">
      <div className="absolute inset-0 cer-grid-bg opacity-15 pointer-events-none" />
      <div className="relative mx-auto max-w-[1240px] px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-[13px] text-ink-soft">
        <div>
          <div className="font-serif text-lg tracking-[0.2em] text-ink">
            骨鉴
          </div>
          <p className="mt-3 leading-relaxed">
            中国社会科学院考古研究所合作项目。以豆包（Doubao）
            原生多模态与专家知识库为底座，服务田野考古现场的动物骨骼种属鉴定。
          </p>
        </div>
        <div>
          <div className="font-serif text-sm tracking-[0.2em] text-ink-soft">
            技术构成
          </div>
          <ul className="mt-3 space-y-1.5 leading-relaxed">
            <li className="flex items-center gap-2">
              <span className="inline-block h-1 w-1 rounded-full bg-vermilion" />
              Doubao-Seed Pro 多模态 (实时 / Thinking)
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-1 w-1 rounded-full bg-vermilion" />
              SAM 3.1 Object Multiplex · SAM 3D Objects
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-1 w-1 rounded-full bg-vermilion" />
              Doubao-Embedding · RAG
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-1 w-1 rounded-full bg-vermilion" />
              TanStack Start · React 19 · Cloudflare Workers
            </li>
          </ul>
        </div>
        <div>
          <div className="font-serif text-sm tracking-[0.2em] text-ink-soft">
            覆盖范围
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="cer-badge">马 / 黄牛 / 水牛 / 驴 / 骡 / 骆驼 / 羊驼</span>
            <span className="cer-badge">18 骨位</span>
            <span className="cer-badge">264+ 专家特征</span>
            <span className="cer-badge">15 古代品种</span>
          </div>
        </div>
      </div>
      <div className="relative border-t border-bronze/30 bg-paper-deep/40">
        <div className="mx-auto max-w-[1240px] px-8 py-4 text-[11px] tracking-[0.24em] text-ink-muted flex justify-between items-center">
          <span>骨鉴 · OSTEOGNOSIS · 2026</span>
          <span className="hidden md:inline">Powered by Volcengine ARK · Cloudflare Edge</span>
        </div>
      </div>
    </footer>
  );
}
