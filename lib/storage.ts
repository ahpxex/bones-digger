import { promises as fs } from "node:fs";
import path from "node:path";
import type { AnalysisResult, AnalysisSummary } from "@/lib/types";

const ROOT = path.join(process.cwd(), "data", "analyses");
const PUBLIC_ROOT = path.join(process.cwd(), "public", "analyses");

async function ensureDirs() {
  await fs.mkdir(ROOT, { recursive: true });
  await fs.mkdir(PUBLIC_ROOT, { recursive: true });
}

export async function saveImageBuffer(
  id: string,
  suffix: "original" | "segmented" | "heatmap",
  buf: Buffer,
  ext: string,
): Promise<string> {
  await ensureDirs();
  const filename = `${id}-${suffix}.${ext}`;
  const abs = path.join(PUBLIC_ROOT, filename);
  await fs.writeFile(abs, buf);
  return `/analyses/${filename}`;
}

export async function saveModelBuffer(
  id: string,
  buf: Buffer,
): Promise<string> {
  await ensureDirs();
  const filename = `${id}.glb`;
  const abs = path.join(PUBLIC_ROOT, filename);
  await fs.writeFile(abs, buf);
  return `/analyses/${filename}`;
}

export async function saveAnalysis(result: AnalysisResult): Promise<void> {
  await ensureDirs();
  const abs = path.join(ROOT, `${result.id}.json`);
  await fs.writeFile(abs, JSON.stringify(result, null, 2), "utf8");
}

export async function readAnalysis(
  id: string,
): Promise<AnalysisResult | null> {
  const abs = path.join(ROOT, `${id}.json`);
  try {
    const raw = await fs.readFile(abs, "utf8");
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}

export async function listAnalyses(): Promise<AnalysisSummary[]> {
  await ensureDirs();
  const entries = await fs.readdir(ROOT);
  const items: AnalysisSummary[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(ROOT, entry), "utf8");
      const parsed = JSON.parse(raw) as AnalysisResult;
      items.push({
        id: parsed.id,
        timestamp: parsed.timestamp,
        imagePath: parsed.imagePath,
        species: parsed.verdict.species,
        position: parsed.verdict.position,
        confidence: parsed.verdict.confidence,
      });
    } catch {
      // ignore malformed entries
    }
  }
  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
