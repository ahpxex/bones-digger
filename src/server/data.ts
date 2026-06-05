import { createServerFn } from "@tanstack/react-start";
import { listAnalyses, readAnalysis } from "@/lib/storage";

/** Read a single analysis document from R2 (used by the /analyze/$id loader). */
export const getAnalysis = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    return await readAnalysis(id);
  });

/** List all stored analyses (used by the /history loader). */
export const listHistory = createServerFn({ method: "GET" }).handler(
  async () => {
    return await listAnalyses();
  },
);
