import type { Integration } from '../../schema/index'

/**
 * Mutable integration state store.
 * This replaces the static mockIntegrations array with a mutable store
 * that tracks real workflow state changes.
 */

export interface IntegrationState extends Integration {
  /** Simulated provider health - 'degraded' will fail fetches until recovered */
  providerHealth: 'healthy' | 'degraded' | 'unreachable'
  /** Human-readable reason for current status */
  statusReason?: string
  /** Timestamp when the status was last changed */
  statusChangedAt?: Date
}

// Seed data - initial state matching the original mockIntegrations
// Stripe (id=3) and Zendesk (id=5) start degraded to simulate provider issues
const seedData: IntegrationState[] = [
  {
    id: '1',
    slug: 'salesforce',
    name: 'Salesforce',
    icon: 'cloud',
    status: 'synced',
    lastSynced: new Date('2026-03-02T08:30:00Z'),
    version: '2.4.1',
    lastSyncDuration: 45,
    providerHealth: 'healthy',
  },
  {
    id: '2',
    slug: 'hubspot',
    name: 'HubSpot',
    icon: 'target',
    status: 'conflict', // Has pending review items
    lastSynced: new Date('2026-03-02T08:10:00Z'),
    version: '1.8.3',
    lastSyncDuration: 32,
    providerHealth: 'healthy',
    statusReason: '5 changes pending review',
  },
  {
    id: '3',
    slug: 'stripe',
    name: 'Stripe',
    icon: 'credit-card',
    status: 'error', // Provider degraded
    lastSynced: new Date('2026-03-01T18:00:00Z'),
    version: '3.1.0',
    lastSyncDuration: 28,
    providerHealth: 'degraded',
    statusReason: 'Provider API returning errors',
  },
  {
    id: '4',
    slug: 'slack',
    name: 'Slack',
    icon: 'message-square',
    status: 'synced',
    lastSynced: new Date('2026-03-02T08:50:00Z'),
    version: '1.2.5',
    lastSyncDuration: 12,
    providerHealth: 'healthy',
  },
  {
    id: '5',
    slug: 'zendesk',
    name: 'Zendesk',
    icon: 'ticket',
    status: 'error', // Provider unreachable
    lastSynced: new Date('2026-03-01T13:15:00Z'),
    version: '2.0.8',
    lastSyncDuration: 55,
    providerHealth: 'unreachable',
    statusReason: 'Connection timeout',
  },
  {
    id: '6',
    slug: 'intercom',
    name: 'Intercom',
    icon: 'mail',
    status: 'synced',
    lastSynced: new Date('2026-03-02T07:55:00Z'),
    version: '1.5.2',
    lastSyncDuration: 18,
    providerHealth: 'healthy',
  },
]

// In-memory mutable store - resets on page reload (module reload)
// This is intentional for dev/test isolation
export const integrationStore: IntegrationState[] = [...seedData]

/**
 * Find an integration by ID
 */
export function findIntegrationById(id: string): IntegrationState | undefined {
  return integrationStore.find((i) => i.id === id)
}

/**
 * Find an integration by slug
 */
export function findIntegrationBySlug(slug: string): IntegrationState | undefined {
  return integrationStore.find((i) => i.slug === slug)
}

/**
 * Update integration status
 */
export function updateIntegrationStatus(
  id: string,
  update: Partial<Pick<IntegrationState, 'status' | 'statusReason' | 'lastSynced' | 'version' | 'providerHealth'>>
): IntegrationState | undefined {
  const integration = findIntegrationById(id)
  if (!integration) return undefined

  Object.assign(integration, update, { statusChangedAt: new Date() })
  return integration
}

/**
 * Reset store to initial seed state
 */
export function resetIntegrationStore(): void {
  integrationStore.length = 0
  integrationStore.push(...seedData.map((i) => ({ ...i, statusChangedAt: new Date() })))
}

/**
 * Simulate provider recovery - sets providerHealth to 'healthy'
 */
export function recoverProvider(id: string): IntegrationState | undefined {
  return updateIntegrationStatus(id, {
    providerHealth: 'healthy',
    statusReason: 'Provider recovered',
  })
}

/**
 * Simulate provider degradation
 */
export function degradeProvider(id: string, reason: string): IntegrationState | undefined {
  return updateIntegrationStatus(id, {
    providerHealth: 'degraded',
    statusReason: reason,
  })
}