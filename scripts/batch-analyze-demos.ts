/**
 * Batch-run all demo specimens through the real Qwen3.5 + Qwen3-Embedding
 * pipeline so /history is richly pre-populated for PPT screenshots & demo.
 *
 * Usage:
 *   bun run scripts/batch-analyze-demos.ts
 *
 * Requires .env.local with AI_PROVIDER=dashscope and DASHSCOPE_API_KEY.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { selectProvider } from "@/lib/ai/provider";
import { retrieveKnowledge } from "@/lib/ai/rag";
import { segmentBoneSubject } from "@/lib/ai/sam";
import { loadDemoManifest } from "@/lib/demo";
import {
  saveAnalysis,
  saveImageBuffer,
} from "@/lib/storage";
import type { AnalysisResult } from "@/lib/types";
import { shortId } from "@/lib/utils";

async function main() {
  const manifest = await loadDemoManifest();
  if (manifest.length === 0) {
    console.error("No demo manifest found. Run prepare-demo.ts first.");
    process.exit(1);
  }

  console.log(`[batch] analyzing ${manifest.length} demo specimens`);
  console.log(`[batch] provider = ${process.env.AI_PROVIDER ?? "(default)"}`);

  const provider = selectProvider();
  const successes: AnalysisResult[] = [];
  const failures: { id: string; error: string }[] = [];

  for (const entry of manifest) {
    const label = `[${entry.id}] (${entry.hintSpecies})`;
    const started = Date.now();
    try {
      const abs = path.join(process.cwd(), "public", "demo", `${entry.id}.jpg`);
      const raw = await fs.readFile(abs);

      const normalised = await sharp(raw)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true, fit: "inside" })
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();

      const id = shortId();
      const imagePath = await saveImageBuffer(id, "original", normalised, "jpg");

      const segment = await segmentBoneSubject(normalised, "image/jpeg");
      const segmentedPath = await saveImageBuffer(
        id,
        "segmented",
        segment.buffer,
        segment.ext,
      );

      const retrieved = await retrieveKnowledge(
        [
          `样本 ${entry.id}`,
          `提示物种 ${entry.hintSpecies}`,
          "动物骨骼种属 形态 结构 尺寸 表面 截面 痕迹 鉴定",
        ].join(" "),
        10,
      );

      const partial = await provider.analyze(
        {
          id,
          imagePath,
          segmentedPath,
          imageBase64: segment.buffer.toString("base64"),
          mime: segment.ext === "jpg" ? "image/jpeg" : "image/png",
          hints: `批处理 demo 标本 ${entry.id}`,
        },
        retrieved.cards,
      );

      const processingMs = Date.now() - started;
      const full: AnalysisResult = {
        id,
        timestamp: new Date().toISOString(),
        imagePath,
        segmentedPath,
        heatmapPath: partial.heatmapPath,
        glbPath: undefined,
        subjectBox: partial.subjectBox,
        featureRegions: partial.featureRegions,
        verdict: partial.verdict,
        dimensions: partial.dimensions,
        evidence: partial.evidence,
        reasoning: partial.reasoning,
        thinkingReasoning: partial.thinkingReasoning,
        outOfDistribution: partial.outOfDistribution,
        channelVerdicts: partial.channelVerdicts,
        knowledgeCards: partial.knowledgeCards,
        provider: provider.name,
        retrievalMode: retrieved.mode,
        processingMs,
      };

      await saveAnalysis(full);
      successes.push(full);
      console.log(
        `${label} → ${full.verdict.species}·${full.verdict.position} @ ${(full.verdict.confidence * 100).toFixed(1)}% (${(processingMs / 1000).toFixed(1)}s, ${retrieved.mode})`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push({ id: entry.id, error: msg });
      console.error(`${label} ✗ ${msg.slice(0, 240)}`);
    }
  }

  console.log("\n===== Batch summary =====");
  console.log(`  ✓ Success: ${successes.length}/${manifest.length}`);
  console.log(`  ✗ Failed:  ${failures.length}`);
  if (failures.length > 0) {
    for (const f of failures) {
      console.log(`    - ${f.id}: ${f.error.slice(0, 200)}`);
    }
  }

  const tally: Record<string, number> = {};
  for (const r of successes) {
    const k = `${r.verdict.species}·${r.verdict.position}`;
    tally[k] = (tally[k] ?? 0) + 1;
  }
  console.log("\n  Verdict distribution:");
  for (const [k, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${n.toString().padStart(2)}  ${k}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
