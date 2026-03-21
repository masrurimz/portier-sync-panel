import { setupServer } from 'msw/node'
import { syncHandlers } from './handlers/sync-handlers'
import { integrationHandlers } from './handlers/integration-handlers'
import { historyHandlers } from './handlers/history-handlers'
import { localHandlers } from './handlers/local-handlers'

// Node server for server-side development mocking.
// Import this only in server environments.
export const server = setupServer(
  ...syncHandlers,
  ...integrationHandlers,
  ...historyHandlers,
  ...localHandlers,
)