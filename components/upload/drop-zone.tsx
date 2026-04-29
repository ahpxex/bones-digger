"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { analyzeBoneAction } from "@/app/actions/analyze";
import { cn } from "@/lib/utils";

const MAX_SOURCE_BYTES = 16 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 3.6 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_CANVAS_EDGE = 1600;
const MIN_CANVAS_EDGE = 900;

export function DropZone() {
  const [fileInfo, setFileInfo] = useState<{
    originalName: string;
    uploadName: string;
    originalSize: number;
    uploadSize: number;
    compressed: boolean;
  } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function pickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件（JPEG / PNG / WebP）。");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError("图片超过 16MB，请压缩后重试。");
      return;
    }

    setError(null);
    setIsPreparing(true);
    try {
      const prepared = await prepareImageForUpload(file);
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(prepared.file);
        fileInputRef.current.files = dt.files;
      }
      setFileInfo({
        originalName: file.name,
        uploadName: prepared.file.name,
        originalSize: file.size,
        uploadSize: prepared.file.size,
        compressed: prepared.compressed,
      });
      const url = URL.createObjectURL(prepared.file);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFileInfo(null);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setError(err instanceof Error ? err.message : "图片处理失败，请换一张图片。");
    } finally {
      setIsPreparing(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    void pickFile(e.target.files?.[0]);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files?.[0];
    void pickFile(file);
  }

  return (
    <form
      action={analyzeBoneAction}
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        if (isPreparing) {
          e.preventDefault();
          setError("图片仍在压缩处理中，请稍后提交。");
          return;
        }
        if (!fileInputRef.current?.files?.[0]) {
          e.preventDefault();
          setError("请先上传一张骨骼照片。");
          return;
        }
        if (fileInputRef.current.files[0]!.size > MAX_UPLOAD_BYTES) {
          e.preventDefault();
          setError("图片超过云端处理上限，请重新选择或压缩后再试。");
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
              alt={fileInfo?.originalName ?? "已选骨骼照片"}
              className="max-h-[260px] cer-hairline object-contain"
            />
            <div className="text-[13px] text-ink-soft">
              <span className="font-serif tracking-[0.14em]">
                {fileInfo?.originalName}
              </span>
              <span className="mx-3 text-bronze">·</span>
              <span className="tracking-[0.18em]">
                {fileInfo?.compressed
                  ? `${formatBytes(fileInfo.originalSize)} → ${formatBytes(fileInfo.uploadSize)}`
                  : "点击或拖拽可替换"}
              </span>
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
              {isPreparing ? "正在预处理照片" : "手机用户可直接调用摄像头拍摄"}
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

      <SubmitRow disabled={isPreparing} />
    </form>
  );
}

function SubmitRow({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="font-sans text-[12px] tracking-[0.22em] text-ink-muted">
        {disabled
          ? "图片预处理中：压缩 → 校验 → 提交准备 …"
          : pending
            ? "鉴定中：SAM 分割 → RAG 检索 → Qwen 推理 …"
            : "系统将依次进行分割、检索、鉴定三阶段"}
      </div>
      <button type="submit" className="cer-btn" disabled={pending || disabled}>
        {disabled ? "处理中 …" : pending ? "鉴定中 …" : "开始鉴定"}
      </button>
    </div>
  );
}

async function prepareImageForUpload(
  file: File,
): Promise<{ file: File; compressed: boolean }> {
  if (file.size <= TARGET_UPLOAD_BYTES && file.type === "image/jpeg") {
    return { file, compressed: false };
  }

  const image = await loadImage(file);
  let edge = MAX_CANVAS_EDGE;
  let lastBlob: Blob | null = null;
  while (edge >= MIN_CANVAS_EDGE) {
    const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("浏览器无法处理这张图片，请换一张图片。");
    ctx.drawImage(image, 0, 0, width, height);

    for (const quality of [0.86, 0.78, 0.7, 0.62, 0.54]) {
      const blob = await canvasToBlob(canvas, "image/jpeg", quality);
      lastBlob = blob;
      if (blob.size <= TARGET_UPLOAD_BYTES) {
        return {
          file: blobToUploadFile(blob, file),
          compressed: blob.size < file.size || file.type !== "image/jpeg",
        };
      }
    }
    edge = Math.floor(edge * 0.82);
  }

  if (lastBlob && lastBlob.size <= MAX_UPLOAD_BYTES) {
    return {
      file: blobToUploadFile(lastBlob, file),
      compressed: true,
    };
  }

  throw new Error("图片压缩后仍超过云端处理上限，请换一张更小的图片。");
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败，请换一张 JPEG / PNG / WebP。"));
    };
    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("图片压缩失败，请换一张图片。"));
      },
      type,
      quality,
    );
  });
}

function blobToUploadFile(blob: Blob, source: File): File {
  const base = source.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${base}-upload.jpg`, {
    type: "image/jpeg",
    lastModified: source.lastModified,
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
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
