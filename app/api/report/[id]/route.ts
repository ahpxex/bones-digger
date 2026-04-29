import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readAnalysis } from "@/lib/storage";
import { formatTimestamp } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const result = await readAnalysis(id);
  if (!result) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const host = _req.headers.get("host") ?? "localhost:3000";
  const proto = _req.headers.get("x-forwarded-proto") ?? "http";
  const toAbsoluteUrl = (url: string) =>
    /^https?:\/\//i.test(url) ? url : `${proto}://${host}${url}`;
  const imgUrl = toAbsoluteUrl(result.imagePath);
  const segUrl = toAbsoluteUrl(result.segmentedPath ?? result.imagePath);

  const evidenceRows = result.evidence
    .map(
      (e, i) => `
        <tr>
          <td class="numeral">第 ${toChinese(i + 1)} 条</td>
          <td class="key">${escape(e.key)}</td>
          <td class="obs">${escape(e.observation)}</td>
          <td class="ref">${escape(e.referenceFeature)}</td>
          <td class="weight">${(e.weight * 100).toFixed(0)}%</td>
        </tr>`,
    )
    .join("");

  const rankingRows = result.verdict.ranking
    .map(
      (r, i) => `
        <tr${i === 0 ? ' class="top"' : ""}>
          <td>${String.fromCharCode(0x2160 + i)}</td>
          <td>${r.species}</td>
          <td>${r.position}</td>
          <td class="conf">${(r.confidence * 100).toFixed(1)}%</td>
        </tr>`,
    )
    .join("");

  const dimRows = Object.entries(result.dimensions)
    .map(
      ([k, v]) =>
        `<tr><td>${k}</td><td class="val">${(v * 100).toFixed(1)}%</td><td class="bar"><div style="width:${v * 100}%"></div></td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="zh-Hans">
<head>
<meta charset="utf-8" />
<title>骨鉴 · 鉴定报告 · ${result.id}</title>
<style>
  @page { size: A4; margin: 18mm 18mm 22mm 18mm; }
  html, body { background:#f5f1e8; color:#1a1a1a; margin:0; padding:0;
    font-family: "Songti SC", "STSong", "SimSun", serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  body { padding: 24px 36px; }
  .masthead { display:flex; align-items:flex-end; justify-content:space-between;
    border-bottom: 1px solid #b89766; padding-bottom: 18px; }
  .masthead .title { font-size:34px; letter-spacing:0.3em; color:#1a1a1a; font-weight:700; }
  .masthead .sub { margin-top:4px; font-size:11px; letter-spacing:0.32em; color:#6b655e; text-transform:uppercase; font-family: sans-serif; }
  .masthead .meta { text-align:right; font-size:12px; color:#6b655e; letter-spacing:0.18em; font-family: sans-serif; }
  .meta b { color:#1a1a1a; font-weight:500; }
  .section { margin-top: 26px; }
  .section-title { font-size: 15px; letter-spacing: 0.28em; color:#9d2b33;
    border-bottom: 1px solid #b89766; padding-bottom:6px; margin-bottom:14px; }
  .verdict-box { border: 1px solid #9d2b33; padding: 16px 20px; display:flex; justify-content:space-between; align-items:center; background:#faf4e8; }
  .verdict-main { display:flex; gap:20px; align-items:baseline; }
  .verdict-species { font-size: 48px; letter-spacing: 0.1em; font-weight:700; color:#1a1a1a; }
  .verdict-position { font-size: 22px; letter-spacing: 0.2em; color:#3a3632; }
  .verdict-latin { font-size: 11px; color:#6b655e; font-style:italic; letter-spacing: 0.1em; font-family: sans-serif; margin-top:4px; }
  .verdict-conf { text-align:right; }
  .verdict-conf .lbl { font-size:10px; letter-spacing:0.32em; color:#6b655e; text-transform:uppercase; font-family: sans-serif; }
  .verdict-conf .val { font-size: 42px; color: #9d2b33; font-family: 'Menlo','Consolas', monospace; font-weight:600; }
  .images { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
  .images figure { border: 1px solid #b89766; padding:6px; margin:0; background:#fff8eb; }
  .images figure img { width:100%; height:auto; display:block; }
  .images figcaption { font-size: 11px; letter-spacing:0.22em; color:#3a3632; margin-top:4px; text-align:center; }
  table { width:100%; border-collapse: collapse; font-size: 12px; }
  table th, table td { border-bottom: 1px solid #d9cfb4; padding:8px 10px; text-align:left; vertical-align: top; }
  table th { background:#ebe4d2; font-weight:500; letter-spacing:0.12em; color:#3a3632; }
  .numeral { color:#9d2b33; letter-spacing:0.28em; font-size: 11px; white-space: nowrap; width:70px; }
  .key { font-weight:600; letter-spacing:0.1em; width:130px; }
  .weight { text-align:right; font-family:'Menlo','Consolas', monospace; width:60px; }
  .conf { text-align:right; font-family:'Menlo','Consolas', monospace; }
  tr.top { background:#faecd7; }
  tr.top td { font-weight:600; color:#9d2b33; }
  .dimtable td.val { font-family:'Menlo','Consolas', monospace; width:70px; text-align:right; }
  .dimtable td.bar { width: 45%; padding-right:0; }
  .dimtable td.bar > div { height: 8px; background:#9d2b33; }
  .reasoning { white-space: pre-wrap; line-height: 2.0; font-size: 13px; border-left: 2px solid #9d2b33; padding-left: 14px; }
  .stamp-footer { margin-top: 36px; display:flex; justify-content:space-between; align-items:flex-end; border-top: 1px solid #b89766; padding-top: 14px; font-size: 11px; color: #6b655e; letter-spacing: 0.22em; font-family: sans-serif; }
  .stamp { width: 90px; height: 90px; border: 2px solid #9d2b33;
    color:#9d2b33; display:grid; place-items:center; font-weight:700;
    letter-spacing:0.1em; transform: rotate(-4deg); }
  .print-hint { position: fixed; top: 8px; right: 12px; padding: 6px 12px;
    background:#9d2b33; color:#f5f1e8; font-family: sans-serif; font-size:11px;
    letter-spacing:0.22em; }
  @media print { .print-hint { display:none; } }
</style>
</head>
<body>
  <div class="print-hint">按 Ctrl / ⌘ + P 另存为 PDF</div>
  <header class="masthead">
    <div>
      <div class="title">骨 鉴</div>
      <div class="sub">OSTEOGNOSIS · IDENTIFICATION REPORT</div>
    </div>
    <div class="meta">
      <div><b>编号</b>　${result.id}</div>
      <div><b>鉴定时间</b>　${formatTimestamp(result.timestamp)}</div>
      <div><b>鉴定耗时</b>　${(result.processingMs / 1000).toFixed(2)} 秒</div>
      <div><b>推理通道</b>　${result.provider.toUpperCase()}</div>
    </div>
  </header>

  <section class="section">
    <div class="section-title">壹 · 鉴定结论</div>
    <div class="verdict-box">
      <div>
        <div class="verdict-main">
          <div>
            <div class="verdict-species">${result.verdict.species}</div>
            ${result.verdict.speciesLatin ? `<div class="verdict-latin">${result.verdict.speciesLatin}</div>` : ""}
          </div>
          <div>
            <div class="verdict-position">${result.verdict.position}</div>
            ${result.verdict.positionLatin ? `<div class="verdict-latin">${result.verdict.positionLatin}</div>` : ""}
          </div>
        </div>
      </div>
      <div class="verdict-conf">
        <div class="lbl">Confidence</div>
        <div class="val">${(result.verdict.confidence * 100).toFixed(1)}%</div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-title">贰 · 鉴定影像</div>
    <div class="images">
      <figure>
        <img src="${imgUrl}" alt="原片" />
        <figcaption>原片 · ORIGINAL</figcaption>
      </figure>
      <figure>
        <img src="${segUrl}" alt="分割" />
        <figcaption>分割 · SAM 3.1 SUBJECT</figcaption>
      </figure>
    </div>
  </section>

  <section class="section">
    <div class="section-title">叁 · 候选排序</div>
    <table>
      <thead><tr><th>序</th><th>物种</th><th>骨位</th><th>置信度</th></tr></thead>
      <tbody>${rankingRows}</tbody>
    </table>
  </section>

  <section class="section">
    <div class="section-title">肆 · 六维度评分</div>
    <table class="dimtable">
      <thead><tr><th>维度</th><th>评分</th><th></th></tr></thead>
      <tbody>${dimRows}</tbody>
    </table>
  </section>

  <section class="section">
    <div class="section-title">伍 · 推理依据链</div>
    <table>
      <thead><tr><th>序</th><th>要点</th><th>图像观察</th><th>专家特征</th><th>权重</th></tr></thead>
      <tbody>${evidenceRows}</tbody>
    </table>
  </section>

  <section class="section">
    <div class="section-title">陆 · 思维推理链</div>
    <div class="reasoning">${escape(result.reasoning)}</div>
  </section>

  <footer class="stamp-footer">
    <div>
      <div>骨鉴 · OSTEOGNOSIS</div>
      <div>本报告由人工智能多模态系统出具，仅供学术参考。</div>
    </div>
    <div class="stamp">骨 鉴</div>
  </footer>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toChinese(n: number): string {
  const d = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (n < 10) return d[n]!;
  if (n < 20) return `十${n === 10 ? "" : d[n - 10]}`;
  if (n < 100)
    return `${d[Math.floor(n / 10)]}十${n % 10 === 0 ? "" : d[n % 10]}`;
  return String(n);
}
