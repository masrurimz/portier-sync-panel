import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    // When true, browser MSW intercepts production API endpoints for local development.
    // When false (default), the app keeps mocked scaffolding but lets Sync Now call the real API.
    VITE_MOCK_API: z.enum(["true", "false"]).optional().transform((value) => value === "true"),
  },
  runtimeEnv: (import.meta as any).env,
  emptyStringAsUndefined: true,
});