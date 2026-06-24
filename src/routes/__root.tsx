import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#9d2b33" },
      { title: "骨鉴 · 动物骨骼智能鉴定系统" },
      {
        name: "description",
        content:
          "基于豆包（Doubao）原生多模态与 RAG 专家知识库的田野考古动物骨骼种属鉴定平台。",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "32x32 16x16" },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hans" className="h-full">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
