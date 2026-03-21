import { setupWorker } from 'msw/browser'
import { syncHandlers } from './handlers/sync-handlers'
import { integrationHandlers } from './handlers/integration-handlers'
import { historyHandlers } from './handlers/history-handlers'
import { localDbHandlers } from './handlers/local-handlers'
import { draftHandlers, providerHandlers } from './handlers/draft-handlers'

// Handlers for mocked scaffolding that the take-home app still models locally.
// These stay enabled in the default browser mode because the external backend only
// exposes the sync preview endpoint, not integrations/history/local-review endpoints.
const scaffoldingHandlers = [
  ...integrationHandlers,
  ...draftHandlers,
  ...providerHandlers,
  ...historyHandlers,
  ...localDbHandlers,
 ]

// Sync preview handlers for fully mocked development mode only.
// These intercept requests to https://portier-takehometest.onrender.com/api/v1/data/sync.
const syncPreviewHandlers = [
  ...syncHandlers,
 ]

/**
 * Full mock worker - intercepts mocked scaffolding plus sync preview responses.
 * Use ONLY when VITE_MOCK_API=true for local development/testing.
 */
export const worker = setupWorker(...scaffoldingHandlers, ...syncPreviewHandlers)

/**
 * Default browser worker - keeps local scaffolding alive but lets Sync Now hit the
 * real Portier preview endpoint. This is the truthful take-home mode.
 */
export const localWorker = setupWorker(...scaffoldingHandlers)