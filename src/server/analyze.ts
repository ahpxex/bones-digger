import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { selectProvider } from "@/lib/ai/provider";
import { retrieveKnowledge } from "@/lib/ai/rag";
import { segmentBoneSubject } from "@/lib/ai/sam";
import { reconstruct3D } from "@/lib/ai/sam3d";
import { readDemoFile } from "@/lib/demo";
import {
  deleteAnalysis,
  saveAnalysis,
  saveImageBuffer,
  saveModelBuffer,
} from "@/lib/storage";
import type { AnalysisResult } from "@/lib/types";
import { shortId } from "@/lib/utils";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const RETRIEVAL_HINT = "动物骨骼种属 形态 结构 尺寸 表面 截面 痕迹 鉴定";

function extForMime(mime: string): "jpg" | "png" | "webp" {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/**
 * Shared identification pipeline: store original → segment → retrieve → VLM →
 * optional SAM 3D → persist. Returns the new analysis id.
 */
async function runPipeline(
  originalBytes: Uint8Array,
  mime: string,
  hints: string | undefined,
): Promise<string> {
  const id = shortId();
  const ext = extForMime(mime);
  const imagePath = await saveImageBuffer(id, "original", originalBytes, ext);

  const segment = await segmentBoneSubject(originalBytes, mime);
  let segmentedPath = imagePath;
  if (segment.usedProvider !== "stub") {
    segmentedPath = await saveImageBuffer(
      id,
      "segmented",
      segment.buffer,
      segment.ext,
    );
  }

  const provider = selectProvider();
  const retrieved = await retrieveKnowledge(
    [hints ?? "", RETRIEVAL_HINT].join(" "),
    10,
  );

  const started = Date.now();
  const partial = await provider.analyze(
    {
      id,
      imagePath,
      segmentedPath,
      imageBase64: Buffer.from(segment.buffer).toString("base64"),
      mime: segment.ext === "png" ? "image/png" : "image/jpeg",
      hints,
    },
    retrieved.cards,
  );
  const processingMs = Date.now() - started;

  let glbPath: string | undefined;
  try {
    const reconstruction = await reconstruct3D(
      Buffer.from(segment.buffer),
      "image/jpeg",
    );
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
  return id;
}

export const analyzeBone = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error("Expected FormData");
    }
    const file = data.get("image");
    const hints = (data.get("hints") ?? "").toString().trim() || undefined;
    if (!(file instanceof File)) {
      throw new Error("未收到图片。请重新选择一张骨骼照片。");
    }
    if (!ACCEPTED.has(file.type)) {
      throw new Error(
        `不支持的图片格式：${file.type}。请上传 JPEG / PNG / WebP。`,
      );
    }
    if (file.size > MAX_BYTES) {
      throw new Error("图片超过云端处理上限。请压缩后重试。");
    }
    return { file, hints };
  })
  .handler(async ({ data }) => {
    const bytes = new Uint8Array(await data.file.arrayBuffer());
    const id = await runPipeline(bytes, data.file.type, data.hints);
    return { id };
  });

export const analyzeDemo = createServerFn({ method: "POST" })
  .inputValidator((data: { demoId: string }) => {
    if (!data || typeof data.demoId !== "string" || !/^demo-\d+$/.test(data.demoId)) {
      throw new Error("无效的 demo 标本编号。");
    }
    return { demoId: data.demoId };
  })
  .handler(async ({ data }) => {
    const origin = new URL(getRequest().url).origin;
    const bytes = await readDemoFile(data.demoId, origin);
    if (!bytes) {
      throw new Error(`未找到 demo 标本：${data.demoId}`);
    }
    const id = await runPipeline(
      bytes,
      "image/jpeg",
      `来自示例样本库：${data.demoId}`,
    );
    return { id };
  });

export const deleteAnalysisFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => {
    if (!data || typeof data.id !== "string" || !/^[a-z0-9]+$/.test(data.id)) {
      throw new Error("Invalid analysis id");
    }
    return { id: data.id };
  })
  .handler(async ({ data }) => {
    await deleteAnalysis(data.id);
    return { ok: true };
  });
