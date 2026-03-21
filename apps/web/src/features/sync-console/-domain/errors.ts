// Domain error types for the sync-console fetch and apply flow.
// These are defined in domain (not -api) because they describe product-level
// error semantics, not HTTP transport specifics.
import type { ApiErrorResponse, ApiError } from '@portier-sync/api';

export interface SyncFetchError {
  code: string;
  title: string;
  message: string;
  retryable: boolean;
}

/**
 * Normalizes HTTP status codes and API error payloads into domain errors.
 * Maps transport-level failures to user-actionable messages.
 */
export function normalizeApiError(
  status: number | null,
  payload?: Partial<ApiErrorResponse>,
): SyncFetchError {
  // 4xx: Client/configuration errors - not retryable
  if (status !== null && status >= 400 && status < 500) {
    return {
      code: payload?.code ?? 'missing_configuration',
      title: 'Configuration required',
      message:
        payload?.message ??
        'This integration is missing required configuration. No changes were applied.',
      retryable: false,
    };
  }

  // 502: Provider upstream failure - retryable
  if (status === 502) {
    return {
      code: payload?.code ?? 'provider_unavailable',
      title: 'Provider unavailable',
      message:
        payload?.message ??
        'The provider is temporarily unavailable. Your local data has not changed.',
      retryable: true,
    };
  }

  // 504: Provider timeout - retryable
  if (status === 504) {
    return {
      code: payload?.code ?? 'provider_timeout',
      title: 'Provider timeout',
      message:
        payload?.message ??
        'The provider did not respond in time. Your local data has not changed.',
      retryable: true,
    };
  }

  // 5xx: Server errors - retryable
  if (status !== null && status >= 500) {
    return {
      code: payload?.code ?? 'internal_error',
      title: 'Sync preview failed',
      message:
        payload?.message ??
        'Portier could not prepare a sync preview right now. No changes were applied.',
      retryable: true,
    };
  }

  // Null status or unknown: network-level failure
  return {
    code: payload?.code ?? 'network_error',
    title: 'Network error',
    message:
      'The sync preview request could not be completed. Your local data has not changed.',
    retryable: true,
  };
}

/**
 * Extracts status and payload from better-fetch errors.
 * BetterFetchError has { status, statusText, error } where error is the parsed body.
 */
function extractBetterFetchError(error: unknown): { status: number | null; payload: Partial<ApiErrorResponse> | undefined } {
  if (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    const apiError = error as ApiError;
    const payload =
      apiError.error && typeof apiError.error === 'object'
        ? (apiError.error as Partial<ApiErrorResponse>)
        : undefined;
    return { status: apiError.status, payload };
  }
  return { status: null, payload: undefined };
}

export function normalizeThrownError(error: unknown): SyncFetchError {
  // Already a normalized domain error
  if (
    typeof error === 'object' &&
    error !== null &&
    'title' in error &&
    'message' in error &&
    'retryable' in error
  ) {
    return error as SyncFetchError;
  }

  // BetterFetchError with HTTP status and parsed error body
  const { status, payload } = extractBetterFetchError(error);
  return normalizeApiError(status, payload);
}