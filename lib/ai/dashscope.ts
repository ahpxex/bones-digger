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
} from "@/lib/types";
import type { AnalyzeInput, Provider } from "./provider";

const speciesEnum = z.enum([
  "马",
  "黄牛",
  "水牛",
  "鹿",
  "羊",
  "猪",
  "狗",
]);
const positionEnum = z.enum([
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
]);

const analysisSchema = z.object({
  verdict: z.object({
    species: speciesEnum,
    position: positionEnum,
    confidence: z.number().min(0).max(1),
  }),
  ranking: z
    .array(
      z.object({
        species: speciesEnum,
        position: positionEnum,
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
      }),
    )
    .min(2)
    .max(6),
  reasoning: z.string().min(40),
});

function knowledgeToPrompt(cards: KnowledgeCard[]): string {
  return cards
    .map(
      (c, i) =>
        `${i + 1}. ${c.species}·${c.position}：${c.features.join("；")}`,
    )
    .join("\n");
}

export const dashScopeProvider: Provider = {
  name: "dashscope",
  async analyze(input: AnalyzeInput, retrieved: KnowledgeCard[]) {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "DASHSCOPE_API_KEY is not set. Set it in .env.local or switch AI_PROVIDER=mock.",
      );
    }

    const baseURL =
      process.env.DASHSCOPE_BASE_URL ??
      "https://dashscope.aliyuncs.com/compatible-mode/v1";
    const modelId = process.env.DASHSCOPE_VLM_MODEL ?? "qwen3-vl-plus";

    const openai = createOpenAI({
      apiKey,
      baseURL,
    });

    const knowledgeBlock = knowledgeToPrompt(retrieved);

    const system = [
      "你是中国社会科学院考古研究所的动物考古学专家，擅长通过骨骼照片进行种属与骨位鉴定。",
      "你将收到一张田野出土动物骨骼照片，以及从专家知识库检索得到的相关鉴定特征条目。",
      "请严格依据以下专家鉴定特征进行分析，不要编造特征。若图像信息不足，请在 reasoning 中明确说明，并降低置信度。",
      "",
      "【专家鉴定特征（RAG 检索结果）】",
      knowledgeBlock,
      "",
      "输出一个严格的 JSON，包含：",
      "- verdict: 最终判定（species / position / confidence 0-1）",
      "- ranking: 前 3-5 个候选，每项含 species/position/confidence，按置信度降序",
      "- dimensions: 6 个维度打分 0-1（整体形态/关键结构/截面断面/表面纹理/表面痕迹/尺寸比例）",
      "- evidence: 2-6 条证据，每条含 key（一个短语）、observation（图像观察）、referenceFeature（对照的专家特征原文）、weight（0-1）",
      "- reasoning: 一段推理链中文文本，交代从分割到判定的完整思路",
    ].join("\n");

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
    });

    const top = object.verdict;
    const ranking = object.ranking
      .slice()
      .sort((a, b) => b.confidence - a.confidence);

    const cards: KnowledgeCard[] = [];
    const topCard = cardFor(
      top.species as Species,
      top.position as BonePosition,
    );
    if (topCard) cards.push(topCard);
    const alt = retrieved
      .filter((c) => !(c.species === top.species && c.position === top.position))
      .slice(0, 2);
    cards.push(...alt);

    const evidence = object.evidence.map((e, idx) => ({
      id: `ev-${idx + 1}`,
      key: e.key,
      observation: e.observation,
      referenceFeature: e.referenceFeature,
      sourceSpecies: top.species as Species,
      sourcePosition: top.position as BonePosition,
      weight: e.weight,
    }));

    return {
      verdict: {
        species: top.species as Species,
        speciesLatin: speciesLatin(top.species as Species),
        position: top.position as BonePosition,
        positionLatin: positionLatin(top.position as BonePosition),
        confidence: top.confidence,
        ranking: ranking.map((r) => ({
          species: r.species as Species,
          position: r.position as BonePosition,
          confidence: r.confidence,
        })),
      },
      dimensions: object.dimensions as Record<AnalysisDimension, number>,
      evidence,
      reasoning: object.reasoning,
      knowledgeCards: cards,
      heatmapPath: undefined,
    } satisfies Omit<
      AnalysisResult,
      "id" | "imagePath" | "segmentedPath" | "timestamp" | "provider" | "processingMs"
    >;
  },
};
