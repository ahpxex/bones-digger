import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import {
  cardFor,
  positionLatin,
  speciesLatin,
} from "@/lib/knowledge/bones";
import type {
  AnalysisDimension,
  AnalysisResult,
  BonePosition,
  KnowledgeCard,
  Species,
  Verdict,
} from "@/lib/types";
import type { AnalyzeInput, Provider } from "./provider";

const SPECIES_ENUM = [
  "马",
  "黄牛",
  "水牛",
  "鹿",
  "羊",
  "猪",
  "狗",
  "未知",
] as const;
const POSITION_ENUM = [
  "掌骨",
  "跖骨",
  "趾骨",
  "距骨",
  "跟骨",
  "尺骨",
  "桡骨",
  "股骨",
  "胫骨",
  "头骨",
  "牙齿",
  "上颌",
  "下颌",
  "齿式",
  "寰椎",
  "枢椎",
  "肩胛骨",
  "肱骨",
  "其他",
] as const;

const bboxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
});

const analysisSchema = z.object({
  verdict: z.object({
    species: z.enum(SPECIES_ENUM),
    position: z.enum(POSITION_ENUM),
    confidence: z.number().min(0).max(1),
  }),
  outOfDistribution: z.boolean().optional().default(false),
  ranking: z
    .array(
      z.object({
        species: z.enum(SPECIES_ENUM),
        position: z.enum(POSITION_ENUM),
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(1)
    .max(5),
  dimensions: z.object({
    整体形态: z.number().min(0).max(1),
    关键结构: z.number().min(0).max(1),
    截面断面: z.number().min(0).max(1),
    表面纹理: z.number().min(0).max(1),
    表面痕迹: z.number().min(0).max(1),
    尺寸比例: z.number().min(0).max(1),
  }),
  evidence: z
    .array(
      z.object({
        key: z.string(),
        observation: z.string(),
        referenceFeature: z.string(),
        weight: z.number().min(0).max(1),
        region: bboxSchema.optional(),
      }),
    )
    .min(1)
    .max(6),
  subjectBox: bboxSchema.optional(),
  reasoning: z.string().min(20),
});

type AnalysisResponse = z.infer<typeof analysisSchema>;

function knowledgeToPrompt(cards: KnowledgeCard[]): string {
  return cards
    .map(
      (c, i) =>
        `${i + 1}. ${c.species}·${c.position}：${c.features.join("；")}`,
    )
    .join("\n");
}

const LOW_CONFIDENCE_THRESHOLD = Number(
  process.env.THINKING_CHANNEL_THRESHOLD ?? "0.72",
);

function buildSystemPrompt(
  knowledgeBlock: string,
  thinking: boolean,
): string {
  return [
    "你是中国社会科学院考古研究所的动物考古学专家，擅长通过骨骼照片进行种属与骨位鉴定。",
    "你将收到一张田野出土动物骨骼照片，以及从专家知识库检索到的相关鉴定特征条目。",
    thinking
      ? "请逐步分析：先描述观察到的形态要素，再对照每一条候选专家特征做正反论证，最后在可追溯的证据下给出判定。"
      : "请结合图像与专家特征给出简洁可信的判定，并标出关键证据的观察区域。",
    "",
    "严格规则：",
    "- 证据只能从给定的专家特征表里引用，不得编造新特征。",
    "- 若图像模糊 / 残缺过度 / 对象不属于 7 物种（马/黄牛/水牛/鹿/羊/猪/狗）任何一种，",
    "  应将 verdict.species 设为 \"未知\"，outOfDistribution 设为 true，confidence ≤ 0.3。",
    "- subjectBox / evidence[].region 为归一化坐标 0-1，(x,y) 为左上角，(w,h) 为宽高；若图中骨骼位置不可判定可省略。",
    "- dimensions 六维打分：整体形态 / 关键结构 / 截面断面 / 表面纹理 / 表面痕迹 / 尺寸比例，0-1 浮点。",
    "",
    "【专家鉴定特征（RAG 检索结果）】",
    knowledgeBlock,
  ].join("\n");
}

async function callChannel(
  modelId: string,
  input: AnalyzeInput,
  retrieved: KnowledgeCard[],
  thinking: boolean,
): Promise<AnalysisResponse> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DASHSCOPE_API_KEY is not set. Set it in .env.local or switch AI_PROVIDER=mock.",
    );
  }
  const baseURL =
    process.env.DASHSCOPE_BASE_URL ??
    "https://dashscope.aliyuncs.com/compatible-mode/v1";

  const openai = createOpenAI({
    apiKey,
    baseURL,
  });

  const system = buildSystemPrompt(knowledgeToPrompt(retrieved), thinking);
  const userPrompt = input.hints
    ? `请鉴定以下骨骼照片。用户补充信息：${input.hints}`
    : "请鉴定以下骨骼照片。";

  const { object } = await generateObject({
    model: openai(modelId),
    schema: analysisSchema,
    system,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image",
            image: `data:${input.mime};base64,${input.imageBase64}`,
          },
        ],
      },
    ],
    ...(thinking
      ? {
          providerOptions: {
            openai: {
              // DashScope OpenAI-compat: enable deep-thinking mode via extra_body
              extra_body: { enable_thinking: true },
            },
          },
        }
      : {}),
  });

  return object;
}

function verdictFromResp(resp: AnalysisResponse): Verdict {
  const ranking = resp.ranking
    .slice()
    .sort((a, b) => b.confidence - a.confidence);
  return {
    species: resp.verdict.species as Species,
    speciesLatin: speciesLatin(resp.verdict.species as Species),
    position: resp.verdict.position as BonePosition,
    positionLatin: positionLatin(resp.verdict.position as BonePosition),
    confidence: resp.verdict.confidence,
    ranking: ranking.map((r) => ({
      species: r.species as Species,
      position: r.position as BonePosition,
      confidence: r.confidence,
    })),
  };
}

export const dashScopeProvider: Provider = {
  name: "dashscope",
  async analyze(input: AnalyzeInput, retrieved: KnowledgeCard[]) {
    const realtimeModel =
      process.env.DASHSCOPE_VLM_MODEL_REALTIME ??
      process.env.DASHSCOPE_VLM_MODEL ??
      "qwen3.5-flash";
    const thinkingModel =
      process.env.DASHSCOPE_VLM_MODEL_THINKING ?? "qwen3.5-plus";

    // Step 1 — realtime channel (fast, low latency)
    const realtimeResp = await callChannel(
      realtimeModel,
      input,
      retrieved,
      false,
    );
    const realtimeVerdict = verdictFromResp(realtimeResp);

    // Step 2 — thinking channel runs for low-confidence OR out-of-distribution samples
    const shouldThink =
      realtimeVerdict.confidence < LOW_CONFIDENCE_THRESHOLD ||
      realtimeResp.outOfDistribution;

    let thinkingResp: AnalysisResponse | null = null;
    let thinkingVerdict: Verdict | undefined;
    if (shouldThink) {
      try {
        thinkingResp = await callChannel(
          thinkingModel,
          input,
          retrieved,
          true,
        );
        thinkingVerdict = verdictFromResp(thinkingResp);
      } catch (err) {
        console.warn(
          "[dashscope] thinking channel failed, keeping realtime verdict:",
          err instanceof Error ? err.message : err,
        );
      }
    }

    // Step 3 — fusion: if thinking exists and disagrees, trust thinking but blend confidence
    let finalResp: AnalysisResponse;
    let finalVerdict: Verdict;
    if (thinkingResp && thinkingVerdict) {
      const agree =
        thinkingVerdict.species === realtimeVerdict.species &&
        thinkingVerdict.position === realtimeVerdict.position;
      if (agree) {
        // Both channels agree → boost confidence
        finalResp = thinkingResp;
        finalVerdict = {
          ...thinkingVerdict,
          confidence: Math.min(
            0.99,
            0.5 * (realtimeVerdict.confidence + thinkingVerdict.confidence) +
              0.08,
          ),
        };
      } else {
        // Disagreement → trust thinking but keep its confidence honest
        finalResp = thinkingResp;
        finalVerdict = thinkingVerdict;
      }
    } else {
      finalResp = realtimeResp;
      finalVerdict = realtimeVerdict;
    }

    const cards: KnowledgeCard[] = [];
    const topCard = cardFor(
      finalVerdict.species,
      finalVerdict.position,
    );
    if (topCard) cards.push(topCard);
    const alt = retrieved
      .filter(
        (c) =>
          !(c.species === finalVerdict.species &&
            c.position === finalVerdict.position),
      )
      .slice(0, 2);
    cards.push(...alt);

    const evidence = finalResp.evidence.map((e, idx) => ({
      id: `ev-${idx + 1}`,
      key: e.key,
      observation: e.observation,
      referenceFeature: e.referenceFeature,
      sourceSpecies: finalVerdict.species,
      sourcePosition: finalVerdict.position,
      weight: e.weight,
      region: e.region,
    }));

    return {
      verdict: finalVerdict,
      dimensions: finalResp.dimensions as Record<AnalysisDimension, number>,
      evidence,
      reasoning: finalResp.reasoning,
      thinkingReasoning: thinkingResp?.reasoning,
      outOfDistribution:
        finalResp.outOfDistribution || finalVerdict.species === "未知",
      channelVerdicts: {
        realtime: realtimeVerdict,
        thinking: thinkingVerdict,
      },
      subjectBox: finalResp.subjectBox,
      featureRegions: finalResp.evidence
        .filter((e) => e.region)
        .map((e) => ({ ...(e.region as { x: number; y: number; w: number; h: number }), label: e.key, weight: e.weight })),
      knowledgeCards: cards,
      heatmapPath: undefined,
    } satisfies Omit<
      AnalysisResult,
      "id" | "imagePath" | "segmentedPath" | "timestamp" | "provider" | "processingMs" | "retrievalMode"
    >;
  },
};
