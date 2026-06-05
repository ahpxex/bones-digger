import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

function contentTypeForKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "glb":
      return "model/gltf-binary";
    default:
      return "application/octet-stream";
  }
}

/**
 * Streams a binary object out of the KV namespace. Stored asset web paths look
 * like `/r/assets/{id}-original.jpg`; the splat captures the KV key.
 */
export const Route = createFileRoute("/r/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params._splat ?? "";
        if (!key || key.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        const buf = await env.BONES.get(key, "arrayBuffer");
        if (!buf) {
          return new Response("Not found", { status: 404 });
        }
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": contentTypeForKey(key),
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
