import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-bronze/40 bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto max-w-[1240px] px-8 py-5 flex items-center justify-between gap-8">
        <Link
          href="/"
          className="flex items-center gap-4 text-ink hover:text-vermilion transition-colors"
        >
          <OracleBoneGlyph className="h-10 w-10" />
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
          <Link href="/" className="hover:text-vermilion transition-colors">
            鉴定
          </Link>
          <Link
            href="/knowledge"
            className="hover:text-vermilion transition-colors"
          >
            知识
          </Link>
          <Link
            href="/history"
            className="hover:text-vermilion transition-colors"
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
    <footer className="mt-24 border-t border-bronze/40 bg-paper-warm/60">
      <div className="mx-auto max-w-[1240px] px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-[13px] text-ink-soft">
        <div>
          <div className="font-serif text-lg tracking-[0.2em] text-ink">
            骨鉴
          </div>
          <p className="mt-3 leading-relaxed">
            中国社会科学院考古研究所合作项目。以 Qwen3.5
            原生多模态与专家知识库为底座，服务田野考古现场的动物骨骼种属鉴定。
          </p>
        </div>
        <div>
          <div className="font-serif text-sm tracking-[0.2em] text-ink-soft">
            技术构成
          </div>
          <ul className="mt-3 space-y-1 leading-relaxed">
            <li>Qwen3.5-Flash · Qwen3.5-Plus (Thinking)</li>
            <li>SAM 3.1 Object Multiplex · SAM 3D Objects</li>
            <li>Qwen3-Embedding · RAG</li>
            <li>Next.js 16 · React 19</li>
          </ul>
        </div>
        <div>
          <div className="font-serif text-sm tracking-[0.2em] text-ink-soft">
            协作单位
          </div>
          <ul className="mt-3 space-y-1 leading-relaxed">
            <li>中国社会科学院考古研究所</li>
            <li>动物考古学实验室</li>
            <li>人工智能赛道参赛作品</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-bronze/30 bg-paper-deep/40">
        <div className="mx-auto max-w-[1240px] px-8 py-4 text-[11px] tracking-[0.24em] text-ink-muted flex justify-between">
          <span>骨鉴 · OSTEOGNOSIS</span>
          <span>丙午年·参赛版本</span>
        </div>
      </div>
    </footer>
  );
}

function OracleBoneGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        stroke="#9d2b33"
        strokeWidth="2"
      />
      <rect
        x="6"
        y="6"
        width="52"
        height="52"
        stroke="#b89766"
        strokeWidth="1"
      />
      {/* stylised oracle-bone glyph for "骨" */}
      <path
        d="M22 18 L34 14 L44 20 L42 30 L48 36 L44 44 L32 48 L20 42 L22 32 L18 26 Z"
        stroke="#9d2b33"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M28 28 L36 32 M30 36 L38 32"
        stroke="#9d2b33"
        strokeWidth="1.5"
      />
    </svg>
  );
}
