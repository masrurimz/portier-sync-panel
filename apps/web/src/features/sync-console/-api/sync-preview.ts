import type { ApiErrorResponse } from "@portier-sync/api";

export interface SyncFetchError {
  code: string;
  title: string;
  message: string;
  retryable: boolean;
}

export function normalizeApiError(status: number | null, payload?: Partial<ApiErrorResponse>): SyncFetchError {
  if (status === 400) {
    return {
      code: payload?.code ?? "missing_configuration",
      title: "Configuration required",
      message: payload?.message ?? "This integration is missing required configuration. No changes were applied.",
      retryable: false,
    };
  }

  if (status === 502) {
    return {
      code: payload?.code ?? "internal_error",
      title: "Provider unavailable",
      message: payload?.message ?? "The provider is temporarily unavailable. Your local data has not changed.",
      retryable: true,
    };
  }

  return {
    code: payload?.code ?? "internal_error",
    title: "Sync preview failed",
    message: payload?.message ?? "Portier could not prepare a sync preview right now. No changes were applied.",
    retryable: true,
  };
}

export function normalizeThrownError(error: unknown): SyncFetchError {
  if (typeof error === "object" && error !== null && "title" in error && "message" in error) {
    return error as SyncFetchError;
  }

  return {
    code: "network_error",
    title: "Network error",
    message: "The sync preview request could not be completed. Your local data has not changed.",
    retryable: true,
  };
}
