import type { SyncChange } from '../../schema/index'
import type { IntegrationState } from './integration-store'

/**
 * Draft session store - tracks in-progress review workflows.
 * This is the MSW-backed version of the Zustand review-store.
 * It allows the mock API to track real workflow state.
 */

export type DraftStatus = 
  | 'idle'        // No draft fetched
  | 'fetching'    // Fetch in progress
  | 'ready'       // Fetched, ready for review
  | 'failed'      // Fetch failed
  | 'stale'       // Draft is out of date (local version changed)
  | 'applying'    // Apply in progress
  | 'applied'     // Successfully applied

export interface ReviewItem {
  id: string
  fieldName: string
  changeType: 'UPDATE' | 'ADD' | 'DELETE'
  currentValue?: string
  newValue?: string
  /** Resolution: 'remote' = accept remote, 'local' = keep local */
  resolution?: 'remote' | 'local'
}

export interface DraftSession {
  integrationId: string
  /** Local DB version at the time of fetch */
  baseVersion: string
  /** Proposed version after applying changes */
  proposedVersion: string
  status: DraftStatus
  items: ReviewItem[]
  /** Count of items without resolution */
  pendingCount: number
  /** Count of items with resolution */
  reviewedCount: number
  applicationName: string
  fetchedAt: string
  /** Last error if status is 'failed' */
  lastError?: {
    code: string
    title: string
    message: string
  }
}

/**
 * In-memory draft session store.
 * Keyed by integration ID - one draft per integration.
 */
export const draftSessionStore: Record<string, DraftSession> = {}

/**
 * Seed initial draft session for HubSpot (id=2).
 * This represents a previously fetched preview with pending decisions.
 */
const seedHubSpotDraft = () => {
  draftSessionStore['2'] = {
    integrationId: '2',
    baseVersion: '1.8.3',
    proposedVersion: '1.8.4',
    status: 'ready',
    items: [
      { id: 'hs-1', fieldName: 'user.role', changeType: 'UPDATE', currentValue: 'viewer', newValue: 'editor', resolution: undefined },
      { id: 'hs-2', fieldName: 'user.email', changeType: 'UPDATE', currentValue: 'alex@old.com', newValue: 'alex@new.com', resolution: undefined },
      { id: 'hs-3', fieldName: 'door.location', changeType: 'UPDATE', currentValue: 'Floor 2', newValue: 'Floor 3', resolution: undefined },
      { id: 'hs-4', fieldName: 'key.key_type', changeType: 'UPDATE', currentValue: 'standard', newValue: 'master', resolution: undefined },
      { id: 'hs-5', fieldName: 'user.status', changeType: 'UPDATE', currentValue: 'active', newValue: 'suspended', resolution: undefined },
    ],
    pendingCount: 5,
    reviewedCount: 0,
    applicationName: 'HubSpot',
    fetchedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(), // 19 days ago
  }
}
// Initialize seed data on module load
seedHubSpotDraft()
/**
 * Get or create a draft session for an integration
 */
export function getDraftSession(integrationId: string): DraftSession | undefined {
  return draftSessionStore[integrationId]
}

/**
 * Create or update a draft session
 */
export function setDraftSession(integrationId: string, session: DraftSession): DraftSession {
  draftSessionStore[integrationId] = session
  return session
}

/**
 * Update draft status
 */
export function updateDraftStatus(
  integrationId: string,
  status: DraftStatus,
  error?: { code: string; title: string; message: string }
): DraftSession | undefined {
  const session = draftSessionStore[integrationId]
  if (!session) return undefined

  session.status = status
  if (error) {
    session.lastError = error
  } else if (status !== 'failed') {
    session.lastError = undefined
  }
  return session
}

/**
 * Update a review item's resolution
 */
export function setItemResolution(
  integrationId: string,
  itemId: string,
  resolution: 'remote' | 'local'
): DraftSession | undefined {
  const session = draftSessionStore[integrationId]
  if (!session) return undefined

  const item = session.items.find((i) => i.id === itemId)
  if (!item) return undefined

  item.resolution = resolution
  session.pendingCount = session.items.filter((i) => !i.resolution).length
  session.reviewedCount = session.items.filter((i) => i.resolution).length
  return session
}

/**
 * Clear a draft session
 */
export function clearDraftSession(integrationId: string): void {
  delete draftSessionStore[integrationId]
}

/**
 * Reset all draft sessions
 */
export function resetDraftSessionStore(): void {
  Object.keys(draftSessionStore).forEach((key) => {
    delete draftSessionStore[key]
  })
}

/**
 * Build review items from API SyncChange format
 */
export function buildReviewItems(changes: SyncChange[]): ReviewItem[] {
  return changes.map((change) => ({
    id: change.id,
    fieldName: change.field_name,
    changeType: change.change_type as ReviewItem['changeType'],
    currentValue: change.current_value,
    newValue: change.new_value,
    resolution: undefined,
  }))
}

/**
 * Create a new draft session from fetched data
 */
export function createDraftSession(
  integration: IntegrationState,
  changes: SyncChange[],
  proposedVersion: string
): DraftSession {
  const items = buildReviewItems(changes)
  const session: DraftSession = {
    integrationId: integration.id,
    baseVersion: integration.version,
    proposedVersion,
    status: 'ready',
    items,
    pendingCount: items.length,
    reviewedCount: 0,
    applicationName: integration.name,
    fetchedAt: new Date().toISOString(),
  }
  draftSessionStore[integration.id] = session
  return session
}
