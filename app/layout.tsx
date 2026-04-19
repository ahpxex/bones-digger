import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "骨鉴 · 动物骨骼智能鉴定系统",
  description:
    "基于 Qwen3.5 原生多模态与 RAG 专家知识库的田野考古动物骨骼种属鉴定平台。",
};

export const viewport: Viewport = {
  themeColor: "#9d2b33",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
