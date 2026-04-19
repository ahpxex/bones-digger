"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { analyzeBoneAction } from "@/app/actions/analyze";
import { cn } from "@/lib/utils";

export function DropZone() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件（JPEG / PNG / WebP）。");
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      setError("图片超过 16MB，请压缩后重试。");
      return;
    }
    setError(null);
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0]);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
    }
    pickFile(file);
  }

  return (
    <form
      action={analyzeBoneAction}
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        if (!fileInputRef.current?.files?.[0]) {
          e.preventDefault();
          setError("请先上传一张骨骼照片。");
        }
      }}
    >
      <div
        className={cn(
          "cer-corners relative grid min-h-[340px] cursor-pointer place-items-center border-2 border-dashed p-10 transition-all",
          isHovering
            ? "border-vermilion bg-paper-warm"
            : "border-bronze bg-paper",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsHovering(true);
        }}
        onDragLeave={() => setIsHovering(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
          capture="environment"
        />
        {preview ? (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={fileName ?? "已选骨骼照片"}
              className="max-h-[260px] cer-hairline object-contain"
            />
            <div className="text-[13px] text-ink-soft">
              <span className="font-serif tracking-[0.14em]">{fileName}</span>
              <span className="mx-3 text-bronze">·</span>
              <span className="tracking-[0.18em]">点击或拖拽可替换</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <CameraGlyph className="h-14 w-14 text-bronze" />
            <div className="font-serif text-xl tracking-[0.16em] text-ink">
              拖入骨骼照片，或点击选择
            </div>
            <div className="font-sans text-[13px] tracking-[0.18em] text-ink-muted">
              支持 JPEG · PNG · WebP ，上限 16MB
            </div>
            <div className="mt-2 text-[11px] tracking-[0.24em] text-bronze-dark">
              手机用户可直接调用摄像头拍摄
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="hints"
          className="font-serif text-[13px] tracking-[0.22em] text-ink-soft"
        >
          补充信息（可选）
        </label>
        <textarea
          id="hints"
          name="hints"
          rows={2}
          placeholder="例：疑似掌骨 / 远端残缺 / 出土于 H23 第 3 层 / 比例尺每格 1cm"
          className="cer-hairline bg-paper px-4 py-3 text-[14px] font-sans placeholder:text-ink-muted/60 focus:border-vermilion focus:outline-none"
        />
      </div>

      {error && (
        <div className="border-l-2 border-vermilion bg-paper-warm px-4 py-3 text-[13px] text-vermilion-deep">
          {error}
        </div>
      )}

      <SubmitRow />
    </form>
  );
}

function SubmitRow() {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="font-sans text-[12px] tracking-[0.22em] text-ink-muted">
        {pending
          ? "鉴定中：SAM 分割 → RAG 检索 → Qwen 推理 …"
          : "系统将依次进行分割、检索、鉴定三阶段"}
      </div>
      <button type="submit" className="cer-btn" disabled={pending}>
        {pending ? "鉴定中 …" : "开始鉴定"}
      </button>
    </div>
  );
}

function CameraGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="6"
        y="16"
        width="52"
        height="36"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="20"
        y="10"
        width="16"
        height="8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="32"
        cy="34"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="32"
        cy="34"
        r="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
