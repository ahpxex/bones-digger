import { SiteFooter, SiteHeader } from "@/components/ui/site-chrome";
import { Divider, Frame } from "@/components/ui/frame";
import { SectionTitle } from "@/components/ui/section-title";
import { DemoGallery } from "@/components/upload/demo-gallery";
import { DropZone } from "@/components/upload/drop-zone";
import { SplatPreviewViewer } from "@/components/splat/viewer-preview";
import { toChineseNumeral } from "@/lib/utils";

const STEPS = [
  {
    title: "拍摄与上传",
    body: "在田野现场或实验室将骨骼正置于干净背景中，单角度拍摄即可上传。",
  },
  {
    title: "分割与重建",
    body:
      "SAM 3.1 去除泥土 / 手指 / 比例尺干扰；SAM 3D 用同一张图重建为可旋转的 3D 数字标本。",
  },
  {
    title: "检索与比对",
    body:
      "Qwen3-Embedding 在专家知识库中检索相关条目，Qwen3.5 视觉语言模型据此推理。",
  },
  {
    title: "鉴定与著录",
    body:
      "输出种属、骨位、置信度、推理依据链与可导出的鉴定报告，同步入著录。",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] cer-vbar opacity-60" />
          <div className="mx-auto max-w-[1240px] px-8 py-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7">
              <div className="font-serif text-[13px] tracking-[0.34em] text-vermilion">
                中国社会科学院考古研究所 · 合作项目
              </div>
              <h1 className="mt-6 font-serif text-[72px] leading-[1.05] font-semibold tracking-[0.08em] text-ink">
                骨鉴
              </h1>
              <div className="mt-3 font-serif text-xl tracking-[0.2em] text-ink-soft">
                动物骨骼智能鉴定系统
              </div>
              <Divider />
              <p className="max-w-xl font-sans text-[15px] leading-[1.85] text-ink-soft">
                依托
                <span className="mx-1 text-vermilion">Qwen3.5 原生多模态</span>
                与
                <span className="mx-1 text-vermilion">SAM 3.1</span>
                分割能力，结合动物考古学专家知识库，在田野发掘现场快速判断出土骨骼种属与骨位，并以可解释的推理依据链支撑判定结果。
              </p>
              <div className="mt-8 flex items-center gap-6">
                <div className="flex items-center gap-3 text-[12px] tracking-[0.22em] text-ink-muted">
                  <span className="h-px w-8 bg-bronze" />
                  限定马牛二分类
                </div>
                <div className="flex items-center gap-3 text-[12px] tracking-[0.22em] text-ink-muted">
                  <span className="h-px w-8 bg-bronze" />
                  十八骨位鉴定
                </div>
              </div>
            </div>
            <div className="lg:col-span-5">
              <Frame tone="paper">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-serif text-[13px] tracking-[0.28em] text-vermilion">
                    壹 · 提交鉴定
                  </span>
                  <span className="font-sans text-[11px] tracking-[0.22em] text-ink-muted">
                    Evidence Submission
                  </span>
                </div>
                <DropZone />
              </Frame>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-8 py-10">
          <Frame tone="paper" className="p-8">
            <DemoGallery />
          </Frame>
        </section>

        <section className="mx-auto max-w-[1240px] px-8 py-16">
          <SectionTitle
            numeral="叁 · 鉴定流程"
            subtitle="Four-stage protocol · 田野到著录"
          >
            四步著录
          </SectionTitle>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <Frame key={step.title} tone="paper" className="p-7">
                <div className="font-serif text-[14px] tracking-[0.3em] text-vermilion">
                  第 {toChineseNumeral(i + 1)} 步
                </div>
                <h3 className="mt-3 font-serif text-lg font-semibold tracking-[0.12em] text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 font-sans text-[13px] leading-[1.85] text-ink-soft">
                  {step.body}
                </p>
              </Frame>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-8 py-16">
          <SectionTitle
            numeral="肆 · 数字标本"
            subtitle="SAM 3D · 单张照片即重建"
          >
            标本馆预览
          </SectionTitle>
          <Frame tone="paper" className="mt-8 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
              <div className="lg:col-span-3">
                <SplatPreviewViewer />
              </div>
              <div className="lg:col-span-2">
                <p className="font-sans text-[14px] leading-[1.9] text-ink-soft">
                  鉴定上传的同一张骨骼照片，后端自动调用 Meta 2026-03 开源的
                  <span className="mx-1 text-vermilion">SAM 3D Objects</span>
                  完成单图三维重建，5–30 秒内产出标准
                  <code className="font-mono text-[12px] text-bronze-dark">.glb</code>
                  网格。浏览器端通过
                  <span className="mx-1 text-vermilion">@react-three/fiber</span>
                  +
                  <span className="mx-1 text-vermilion">@react-three/drei</span>
                  的 useGLTF 实时渲染，鉴定结论可直接贴在 3D 网格对应骨位。
                </p>
                <div className="mt-6 text-[11px] tracking-[0.22em] text-ink-muted">
                  当前展示为占位几何体；配置 <code className="font-mono">FAL_KEY</code> 或 <code className="font-mono">REPLICATE_API_TOKEN</code> 后即启用真 SAM 3D 重建。
                </div>
              </div>
            </div>
          </Frame>
        </section>

        <section className="mx-auto max-w-[1240px] px-8 py-16">
          <SectionTitle
            numeral="伍 · 技术构成"
            subtitle="Dual-channel VLM · RAG-grounded"
          >
            双通道推理
          </SectionTitle>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Frame tone="paper" className="p-10">
              <div className="font-serif text-[13px] tracking-[0.3em] text-bronze-dark">
                实时通道
              </div>
              <h3 className="mt-2 font-serif text-2xl tracking-[0.12em] text-ink">
                Qwen3.5-27B 稠密
              </h3>
              <p className="mt-4 font-sans text-[14px] leading-[1.9] text-ink-soft">
                2026 年 2 月发布的原生多模态主力，延迟敏感场景优化。负责现场拍照上传后的实时鉴定回应，返回种属、骨位、置信度与六维度评分。
              </p>
              <div className="mt-6 text-[12px] tracking-[0.22em] text-ink-muted">
                Latency ~ 2 秒
              </div>
            </Frame>
            <Frame tone="paper" className="p-10">
              <div className="font-serif text-[13px] tracking-[0.3em] text-vermilion">
                精推通道
              </div>
              <h3 className="mt-2 font-serif text-2xl tracking-[0.12em] text-ink">
                Qwen3.5-397B-A17B Thinking
              </h3>
              <p className="mt-4 font-sans text-[14px] leading-[1.9] text-ink-soft">
                旗舰 MoE，用于低置信度样本、疑似跨物种相似样本与争议结果的深度推理。输出可审计的思维链与多步证据。
              </p>
              <div className="mt-6 text-[12px] tracking-[0.22em] text-ink-muted">
                Precision ~ 97%+ · 可回溯
              </div>
            </Frame>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
