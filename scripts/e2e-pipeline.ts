import { promises as fs } from "node:fs";
import path from "node:path";
import { retrieveKnowledge } from "@/lib/ai/rag";
import { segmentBoneSubject } from "@/lib/ai/sam";
import { selectProvider } from "@/lib/ai/provider";
import { saveAnalysis, saveImageBuffer, readAnalysis, listAnalyses } from "@/lib/storage";
import { shortId } from "@/lib/utils";
import type { AnalysisResult } from "@/lib/types";

async function main() {
  const testImg = process.argv[2] ?? "/tmp/bones-test/mock-bone.jpg";
  const raw = await fs.readFile(testImg);
  console.log(`[1/6] loaded test image: ${raw.length} bytes from ${testImg}`);

  const seg = await segmentBoneSubject(raw, "image/jpeg");
  console.log(
    `[2/6] SAM segmentation stub -> ${seg.buffer.length} bytes (${seg.ext}, provider=${seg.usedProvider})`,
  );

  const id = shortId();
  const origPath = await saveImageBuffer(id, "original", raw, "jpg");
  const segPath = await saveImageBuffer(id, "segmented", seg.buffer, seg.ext);
  console.log(`[3/6] saved images -> ${origPath} / ${segPath}`);

  const retrieved = retrieveKnowledge(
    "骨骼 形态 结构 尺寸 表面 截面 痕迹 鉴定 掌骨 距骨 股骨",
    8,
  );
  console.log(`[4/6] RAG retrieved ${retrieved.length} knowledge cards, top:`);
  for (const c of retrieved.slice(0, 3)) {
    console.log(`      - ${c.species}·${c.position}: ${c.summary}`);
  }

  const provider = selectProvider();
  console.log(`[5/6] using provider: ${provider.name}`);
  const t0 = Date.now();
  const partial = await provider.analyze(
    {
      id,
      imagePath: origPath,
      segmentedPath: segPath,
      imageBase64: seg.buffer.toString("base64"),
      mime: seg.ext === "jpg" ? "image/jpeg" : "image/png",
      hints: "测试输入",
    },
    retrieved,
  );
  const ms = Date.now() - t0;

  const result: AnalysisResult = {
    id,
    timestamp: new Date().toISOString(),
    imagePath: origPath,
    segmentedPath: segPath,
    heatmapPath: partial.heatmapPath,
    verdict: partial.verdict,
    dimensions: partial.dimensions,
    evidence: partial.evidence,
    reasoning: partial.reasoning,
    knowledgeCards: partial.knowledgeCards,
    provider: provider.name,
    processingMs: ms,
  };

  await saveAnalysis(result);
  console.log(`[6/6] saved analysis ${id} (${ms}ms)`);

  console.log("\n=== VERDICT ===");
  console.log(
    `  ${result.verdict.species} · ${result.verdict.position} @ ${(result.verdict.confidence * 100).toFixed(1)}%`,
  );
  console.log("  ranking:");
  for (const r of result.verdict.ranking) {
    console.log(
      `    ${r.species}·${r.position} ${(r.confidence * 100).toFixed(1)}%`,
    );
  }
  console.log(
    "  dimensions:",
    Object.entries(result.dimensions)
      .map(([k, v]) => `${k}=${(v * 100).toFixed(0)}%`)
      .join("  "),
  );
  console.log("  evidence:");
  for (const e of result.evidence) {
    console.log(`    · ${e.key} (w=${(e.weight * 100).toFixed(0)}%)`);
    console.log(`      obs: ${e.observation}`);
    console.log(`      ref: ${e.referenceFeature}`);
  }
  console.log("  reasoning preview:", result.reasoning.slice(0, 120), "…");

  console.log("\n=== READ-BACK ===");
  const reread = await readAnalysis(id);
  console.log(
    `  readAnalysis returns ${reread ? "OK" : "NULL"}, same id=${reread?.id === id}`,
  );

  const all = await listAnalyses();
  console.log(
    `  listAnalyses() returns ${all.length} entries, newest=${all[0]?.id}`,
  );

  // Verify files actually exist
  const imgAbs = path.join(process.cwd(), "public", origPath);
  const segAbs = path.join(process.cwd(), "public", segPath);
  const imgStat = await fs.stat(imgAbs).catch(() => null);
  const segStat = await fs.stat(segAbs).catch(() => null);
  console.log(
    `  original exists: ${!!imgStat} (${imgStat?.size ?? 0} bytes)`,
  );
  console.log(
    `  segmented exists: ${!!segStat} (${segStat?.size ?? 0} bytes)`,
  );

  console.log("\n=== OK ===");
}

main().catch((e) => {
  console.error("e2e failed:", e);
  process.exit(1);
});
