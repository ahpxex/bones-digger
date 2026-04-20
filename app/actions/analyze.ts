"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { selectProvider } from "@/lib/ai/provider";
import { retrieveKnowledge } from "@/lib/ai/rag";
import { segmentBoneSubject } from "@/lib/ai/sam";
import { reconstruct3D } from "@/lib/ai/sam3d";
import { readDemoFile } from "@/lib/demo";
import {
  saveAnalysis,
  saveImageBuffer,
  saveModelBuffer,
} from "@/lib/storage";
import type { AnalysisResult } from "@/lib/types";
import { shortId } from "@/lib/utils";

const MAX_BYTES = 16 * 1024 * 1024;
const ACCEPTED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export async function analyzeBoneAction(formData: FormData): Promise<void> {
  const file = formData.get("image");
  const hints = (formData.get("hints") ?? "").toString().trim() || undefined;

  if (!(file instanceof File)) {
    throw new Error("未收到图片。请重新选择一张骨骼照片。");
  }
  if (!ACCEPTED.has(file.type)) {
    throw new Error(`不支持的图片格式：${file.type}。请上传 JPEG / PNG / WebP。`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error("图片超过 8MB。请压缩后重试。");
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const normalised = await sharp(rawBuffer)
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

  const provider = selectProvider();

  const retrieved = await retrieveKnowledge(
    [
      hints ?? "",
      "动物骨骼种属 形态 结构 尺寸 表面 截面 痕迹 鉴定",
    ].join(" "),
    10,
  );

  const started = Date.now();
  const partial = await provider.analyze(
    {
      id,
      imagePath,
      segmentedPath,
      imageBase64: segment.buffer.toString("base64"),
      mime: segment.ext === "jpg" ? "image/jpeg" : "image/png",
      hints,
    },
    retrieved.cards,
  );
  const processingMs = Date.now() - started;

  // Optional SAM 3D single-image reconstruction (replaces the old 3DGS path)
  let glbPath: string | undefined;
  try {
    const reconstruction = await reconstruct3D(segment.buffer, "image/jpeg");
    if (reconstruction) {
      glbPath = await saveModelBuffer(id, reconstruction.glb);
    }
  } catch (err) {
    console.warn(
      "[sam3d] reconstruction failed, continuing without GLB:",
      err instanceof Error ? err.message : err,
    );
  }

  const full: AnalysisResult = {
    id,
    timestamp: new Date().toISOString(),
    imagePath,
    segmentedPath,
    heatmapPath: partial.heatmapPath,
    glbPath,
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

  revalidatePath("/history");
  redirect(`/analyze/${id}`);
}

export async function analyzeDemoAction(formData: FormData): Promise<void> {
  const demoId = formData.get("demoId");
  if (typeof demoId !== "string" || !/^demo-\d+$/.test(demoId)) {
    throw new Error("无效的 demo 标本编号。");
  }
  const buf = await readDemoFile(demoId);
  if (!buf) {
    throw new Error(`未找到 demo 标本：${demoId}`);
  }

  const normalised = await sharp(buf)
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

  const provider = selectProvider();
  const retrieved = await retrieveKnowledge(
    [
      `样本 ${demoId}`,
      "动物骨骼种属 形态 结构 尺寸 表面 截面 痕迹 鉴定",
    ].join(" "),
    10,
  );

  const started = Date.now();
  const partial = await provider.analyze(
    {
      id,
      imagePath,
      segmentedPath,
      imageBase64: segment.buffer.toString("base64"),
      mime: segment.ext === "jpg" ? "image/jpeg" : "image/png",
      hints: `来自示例样本库：${demoId}`,
    },
    retrieved.cards,
  );
  const processingMs = Date.now() - started;

  let glbPath: string | undefined;
  try {
    const reconstruction = await reconstruct3D(segment.buffer, "image/jpeg");
    if (reconstruction) {
      glbPath = await saveModelBuffer(id, reconstruction.glb);
    }
  } catch (err) {
    console.warn(
      "[sam3d] reconstruction failed, continuing without GLB:",
      err instanceof Error ? err.message : err,
    );
  }

  const full: AnalysisResult = {
    id,
    timestamp: new Date().toISOString(),
    imagePath,
    segmentedPath,
    heatmapPath: partial.heatmapPath,
    glbPath,
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
  revalidatePath("/history");
  redirect(`/analyze/${id}`);
}

export async function deleteAnalysisAction(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !/^[a-z0-9]+$/.test(id)) {
    throw new Error("Invalid analysis id");
  }
  const root = path.join(process.cwd(), "data", "analyses");
  const publicRoot = path.join(process.cwd(), "public", "analyses");
  await fs.rm(path.join(root, `${id}.json`), { force: true });
  for (const suffix of ["original", "segmented", "heatmap"]) {
    for (const ext of ["jpg", "png", "webp"]) {
      await fs.rm(path.join(publicRoot, `${id}-${suffix}.${ext}`), {
        force: true,
      });
    }
  }
  await fs.rm(path.join(publicRoot, `${id}.glb`), { force: true });
  revalidatePath("/history");
}
