import { env } from "cloudflare:workers";
import type { AnalysisResult, AnalysisSummary } from "@/lib/types";

/**
 * Persistence layer backed by a single Workers KV namespace (binding `BONES`).
 *
 * Layout (KV keys):
 *   analyses/{id}.json          → AnalysisResult document (source of truth)
 *   assets/{id}-original.jpg    → normalised original image (binary)
 *   assets/{id}-segmented.jpg   → SAM-style segmentation preview (binary)
 *   assets/{id}.glb             → optional SAM 3D mesh (binary)
 *   demo/{demo-XX}.jpg          → seeded full-size demo specimens (binary)
 *
 * Binary assets are streamed back through the `/r/$` route, which derives the
 * content-type from the key extension. Stored web paths look like
 * `/r/assets/{id}-*.jpg`. KV values are capped at 25 MiB — well above the
 * ≤4 MB images this app produces.
 */

const ASSET_PREFIX = "assets";
const ANALYSIS_PREFIX = "analyses";

type BinaryInput = Uint8Array | ArrayBuffer | Buffer;

function webPathFor(key: string): string {
  return `/r/${key}`;
}

export async function saveImageBuffer(
  id: string,
  suffix: "original" | "segmented" | "heatmap",
  buf: BinaryInput,
  ext: string,
): Promise<string> {
  const key = `${ASSET_PREFIX}/${id}-${suffix}.${ext}`;
  await env.BONES.put(key, buf as ArrayBuffer | ArrayBufferView);
  return webPathFor(key);
}

export async function saveModelBuffer(
  id: string,
  buf: BinaryInput,
): Promise<string> {
  const key = `${ASSET_PREFIX}/${id}.glb`;
  await env.BONES.put(key, buf as ArrayBuffer | ArrayBufferView);
  return webPathFor(key);
}

export async function saveAnalysis(result: AnalysisResult): Promise<void> {
  await env.BONES.put(
    `${ANALYSIS_PREFIX}/${result.id}.json`,
    JSON.stringify(result),
  );
}

export async function readAnalysis(
  id: string,
): Promise<AnalysisResult | null> {
  if (!/^[a-z0-9]+$/.test(id)) return null;
  const raw = await env.BONES.get(`${ANALYSIS_PREFIX}/${id}.json`, "text");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}

export async function listAnalyses(): Promise<AnalysisSummary[]> {
  const items: AnalysisSummary[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.BONES.list({
      prefix: `${ANALYSIS_PREFIX}/`,
      cursor,
      limit: 1000,
    });
    cursor = page.list_complete ? undefined : page.cursor;
    for (const entry of page.keys) {
      if (!entry.name.endsWith(".json")) continue;
      const raw = await env.BONES.get(entry.name, "text");
      if (!raw) continue;
      try {
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
  } while (cursor);
  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function deleteAnalysis(id: string): Promise<void> {
  if (!/^[a-z0-9]+$/.test(id)) return;
  await env.BONES.delete(`${ANALYSIS_PREFIX}/${id}.json`);
  const page = await env.BONES.list({ prefix: `${ASSET_PREFIX}/${id}` });
  for (const entry of page.keys) {
    await env.BONES.delete(entry.name);
  }
}
