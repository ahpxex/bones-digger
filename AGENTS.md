# bones-digger (骨鉴) — agent notes

Animal-bone (horse/cattle) identification app. **TanStack Start (Vite) on Cloudflare Workers.** Migrated off Next.js 16 / Vercel after the Vercel Blob store was suspended.

## Stack
- TanStack Start + TanStack Router (file-based routes in `src/routes/`), React 19, Vite 8, Tailwind v4 (`@tailwindcss/vite`).
- Cloudflare Workers runtime (`nodejs_compat`). `process.env` is populated from `vars` + secrets at runtime.
- Storage: **Cloudflare KV** (binding `BONES`). Keys: `analyses/{id}.json`, `assets/{id}-*.jpg`, `demo/{id}.jpg`. Binary assets are streamed via the `/r/$` route. Access bindings server-side with `import { env } from "cloudflare:workers"`.
- AI: DashScope (Qwen3.5 VLM + text-embedding-v4) over `@ai-sdk/openai` / `fetch` in `src/lib/ai/`. `AI_PROVIDER=dashscope` (else `mock`).

## Layout
- `src/routes/` — pages (`index`, `analyze.$id`, `history`, `knowledge`) + server routes (`api.report.$id`, `r.$`).
- `src/server/` — `createServerFn` server functions (`analyzeBone`, `analyzeDemo`, `deleteAnalysisFn`, `getAnalysis`, `listHistory`).
- `src/lib/` — `storage.ts` (KV), `demo.ts`, `ai/*`, `knowledge/*`, `3d/*`, `types.ts`, `utils.ts`.
- `src/components/` — UI. Browser-only libs (three.js, echarts) are gated with `ClientOnly`.
- No `sharp` — the segmentation preview is a CSS effect in `ImageTriptych` (Workers can't run native modules).

## Dev / deploy
- Dev: `bun run dev` (Vite + local KV emulation; reads `.dev.vars`).
- Build: `bun run build`. Deploy: `bun run deploy` (needs `CLOUDFLARE_ACCOUNT_ID` set; Cloudflare API via proxy `127.0.0.1:7890`).
- CI: push to `main` deploys via `.github/workflows/deploy.yml` (needs the `CLOUDFLARE_API_TOKEN` GitHub secret).
- Live: https://bones-digger.ctxflow.workers.dev (custom domain gujian.contextudio.com once its old Vercel DNS record is removed).
- Secrets via `wrangler secret put` persist across deploys; non-secret config lives in `wrangler.jsonc` `vars`.
