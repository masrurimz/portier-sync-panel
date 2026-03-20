export { syncHandlers } from './handlers/sync-handlers.js'
export { error502Handler, error400Handler, errorHandlers } from './handlers/error-handlers.js'
export { mockSyncChanges } from './data/sync-changes.js'
// Note: browser.ts is NOT re-exported from index because it imports 'msw/browser'
// which is browser-only. Import browser.ts directly when needed.