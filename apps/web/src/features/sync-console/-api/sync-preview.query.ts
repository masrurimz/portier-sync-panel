import { $fetch } from "@portier-sync/api";
import type { ApiErrorResponse, SyncData } from "@portier-sync/api";

// Success response type for the sync preview endpoint (status 200)
export type SyncPreviewSuccessResponse = {
  code: "SUCCESS";
  message: string;
  data: SyncData;
};

// Union response type for all possible statuses
export type SyncPreviewResponse =
  | { status: 200; body: SyncPreviewSuccessResponse }
  | { status: 400 | 500 | 502; body: ApiErrorResponse };

// Client wrapper that keeps a `{ status, body }` shape until sync preview fully migrates to
// a TanStack Query mutation hook. $fetch throws on HTTP errors, so we normalize into
// an explicit response union the store can handle deterministically.
export const syncClient = {
  preview: async (args: { query: { application_id: string } }): Promise<SyncPreviewResponse> => {
    try {
      const result = await $fetch("@get/api/v1/data/sync", {
        query: { application_id: args.query.application_id },
      });
      // $fetch returns the full response body: { code, message, data }
      // The provider expects result.body to be this shape when status is 200.
      return { status: 200, body: result };
    } catch (error) {
      // $fetch throws with response info attached. We need to map to expected shape.
      // The error from better-fetch includes status and the parsed body.
      const err = error as { status?: number; body?: ApiErrorResponse };
      const status = err.status ?? 500;
      const body = err.body ?? {
        error: "Unknown error",
        code: "internal_error" as const,
        message: "An unexpected error occurred",
      };
      return { status: status as 400 | 500 | 502, body };
    }
  },
};