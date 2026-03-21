import { setupWorker } from 'msw/browser'
import { syncHandlers } from './handlers/sync-handlers'
import { integrationHandlers } from './handlers/integration-handlers'
import { historyHandlers } from './handlers/history-handlers'
import { localHandlers } from './handlers/local-handlers'
import { draftHandlers, providerHandlers } from './handlers/draft-handlers'

// Service worker for browser-based development mocking.
// Import this only in browser environments.
export const worker = setupWorker(
  ...integrationHandlers,
  ...syncHandlers,
  ...draftHandlers,
  ...providerHandlers,
  ...historyHandlers,
  ...localHandlers,
)