export { syncHandlers } from './handlers/sync-handlers'
export { integrationHandlers } from './handlers/integration-handlers'
export { historyHandlers } from './handlers/history-handlers'
export { error502Handler, error400Handler, errorHandlers } from './handlers/error-handlers'
export { localHandlers } from './handlers/local-handlers'
export { mockSyncChanges } from './data/sync-changes'
export { mockIntegrations } from './data/integrations'
export { mockHistory } from './data/history'
export { localSnapshotStore, type LocalSnapshotRecord } from './data/local-snapshots'
export { localAuditLog } from './data/local-history'

export { draftHandlers, providerHandlers } from './handlers/draft-handlers'
export {
  integrationStore,
  findIntegrationById,
  findIntegrationBySlug,
  updateIntegrationStatus,
  resetIntegrationStore,
  recoverProvider,
  degradeProvider,
  type IntegrationState,
} from './data/integration-store'
export {
  draftSessionStore,
  getDraftSession,
  setDraftSession,
  setItemResolution,
  clearDraftSession,
  resetDraftSessionStore,
  type DraftSession,
  type DraftStatus,
  type ReviewItem,
} from './data/draft-session-store'
// Note: browser.ts is NOT re-exported from index because it imports 'msw/browser'
// which is browser-only. Import browser.ts directly when needed.