import { promises as fs } from "node:fs";
import path from "node:path";
import { del, list, put } from "@vercel/blob";
import type { AnalysisResult, AnalysisSummary } from "@/lib/types";

const LOCAL_ROOT = path.join(process.cwd(), "data", "analyses");
const LOCAL_PUBLIC_ROOT = path.join(process.cwd(), "public", "analyses");
const BLOB_ROOT = "bones-digger";
const BLOB_ANALYSIS_PREFIX = `${BLOB_ROOT}/analyses`;
const BLOB_ASSET_PREFIX = `${BLOB_ROOT}/assets`;

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}

function assertStorageConfiguredForWrite(): void {
  if (isVercelRuntime() && !hasBlobStorage()) {
    throw new Error(
      "Production storage is not configured. Connect a Vercel Blob store and set BLOB_READ_WRITE_TOKEN before accepting uploads.",
    );
  }
}

async function ensureLocalDirs() {
  await fs.mkdir(LOCAL_ROOT, { recursive: true });
  await fs.mkdir(LOCAL_PUBLIC_ROOT, { recursive: true });
}

function contentTypeForExt(ext: string): string {
  switch (ext.toLowerCase().replace(/^\./, "")) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "glb":
      return "model/gltf-binary";
    case "json":
      return "application/json; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function analysisBlobPath(id: string): string {
  return `${BLOB_ANALYSIS_PREFIX}/${id}.json`;
}

function assetBlobPath(filename: string): string {
  return `${BLOB_ASSET_PREFIX}/${filename}`;
}

export async function saveImageBuffer(
  id: string,
  suffix: "original" | "segmented" | "heatmap",
  buf: Buffer,
  ext: string,
): Promise<string> {
  const filename = `${id}-${suffix}.${ext}`;
  assertStorageConfiguredForWrite();

  if (hasBlobStorage()) {
    const blob = await put(assetBlobPath(filename), buf, {
      access: "public",
      allowOverwrite: true,
      contentType: contentTypeForExt(ext),
    });
    return blob.url;
  }

  await ensureLocalDirs();
  const abs = path.join(LOCAL_PUBLIC_ROOT, filename);
  await fs.writeFile(abs, buf);
  return `/analyses/${filename}`;
}

export async function saveModelBuffer(
  id: string,
  buf: Buffer,
): Promise<string> {
  const filename = `${id}.glb`;
  assertStorageConfiguredForWrite();

  if (hasBlobStorage()) {
    const blob = await put(assetBlobPath(filename), buf, {
      access: "public",
      allowOverwrite: true,
      contentType: contentTypeForExt("glb"),
    });
    return blob.url;
  }

  await ensureLocalDirs();
  const abs = path.join(LOCAL_PUBLIC_ROOT, filename);
  await fs.writeFile(abs, buf);
  return `/analyses/${filename}`;
}

export async function saveAnalysis(result: AnalysisResult): Promise<void> {
  assertStorageConfiguredForWrite();

  if (hasBlobStorage()) {
    await put(analysisBlobPath(result.id), JSON.stringify(result, null, 2), {
      access: "public",
      allowOverwrite: true,
      contentType: contentTypeForExt("json"),
      cacheControlMaxAge: 60,
    });
    return;
  }

  await ensureLocalDirs();
  const abs = path.join(LOCAL_ROOT, `${result.id}.json`);
  await fs.writeFile(abs, JSON.stringify(result, null, 2), "utf8");
}

export async function readAnalysis(
  id: string,
): Promise<AnalysisResult | null> {
  if (hasBlobStorage()) {
    return await readBlobAnalysis(id);
  }

  if (isVercelRuntime()) return null;

  const abs = path.join(LOCAL_ROOT, `${id}.json`);
  try {
    const raw = await fs.readFile(abs, "utf8");
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}

export async function listAnalyses(): Promise<AnalysisSummary[]> {
  const items: AnalysisSummary[] = [];

  if (hasBlobStorage()) {
    let cursor: string | undefined;
    do {
      const page = await list({
        prefix: `${BLOB_ANALYSIS_PREFIX}/`,
        cursor,
        limit: 1000,
      });
      cursor = page.cursor;
      for (const blob of page.blobs) {
        if (!blob.pathname.endsWith(".json")) continue;
        try {
          const raw = await fetchPublicBlobText(blob.url);
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

  if (isVercelRuntime()) return [];

  await ensureLocalDirs();
  const entries = await fs.readdir(LOCAL_ROOT);
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(LOCAL_ROOT, entry), "utf8");
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

export async function deleteAnalysis(id: string): Promise<void> {
  assertStorageConfiguredForWrite();

  if (hasBlobStorage()) {
    const targets = [analysisBlobPath(id)];
    const page = await list({
      prefix: `${BLOB_ASSET_PREFIX}/${id}`,
      limit: 100,
    });
    targets.push(...page.blobs.map((blob) => blob.pathname));
    await del(targets);
    return;
  }

  await fs.rm(path.join(LOCAL_ROOT, `${id}.json`), { force: true });
  for (const suffix of ["original", "segmented", "heatmap"]) {
    for (const ext of ["jpg", "png", "webp"]) {
      await fs.rm(path.join(LOCAL_PUBLIC_ROOT, `${id}-${suffix}.${ext}`), {
        force: true,
      });
    }
  }
  await fs.rm(path.join(LOCAL_PUBLIC_ROOT, `${id}.glb`), { force: true });
}

async function readBlobAnalysis(id: string): Promise<AnalysisResult | null> {
  const target = analysisBlobPath(id);
  const page = await list({
    prefix: target,
    limit: 1,
  });
  const blob = page.blobs.find((item) => item.pathname === target);
  if (!blob) return null;
  const raw = await fetchPublicBlobText(blob.url);
  return JSON.parse(raw) as AnalysisResult;
}

async function fetchPublicBlobText(url: string): Promise<string> {
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) {
    throw new Error(`Blob fetch failed: ${resp.status} ${resp.statusText}`);
  }
  return await resp.text();
}
