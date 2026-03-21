import { http, HttpResponse, delay } from 'msw'
import { mockSyncChanges } from '../data/sync-changes'
import {
  findIntegrationBySlug,
  updateIntegrationStatus,
} from '../data/integration-store'
import { createDraftSession } from '../data/draft-session-store'

const BASE_URL = 'https://portier-takehometest.onrender.com'

/**
 * Simulate a version increment for a new sync
 */
function generateNewVersion(currentVersion: string): string {
  const parts = currentVersion.split('.').map(Number)
  if (parts.length >= 3) {
    parts[2] = (parts[2] || 0) + 1
  }
  return parts.join('.')
}

/**
 * Simulate realistic sync behavior:
 * - Healthy providers return changes successfully
 * - Degraded providers return 502 Bad Gateway
 * - Unreachable providers return timeout (simulated as 504)
 */
export const syncHandlers = [
  http.get(`${BASE_URL}/api/v1/data/sync`, async ({ request }) => {
    const url = new URL(request.url)
    const applicationId = url.searchParams.get('application_id') ?? ''

    // Validate the slug against the integrations list
    const integration = findIntegrationBySlug(applicationId)
    if (!integration) {
      return HttpResponse.json(
        { error: 'Not found', code: 'invalid_application_id', message: `No integration found for application_id: ${applicationId}` },
        { status: 400 }
      )
    }

    // Simulate network delay for realistic UX testing
    await delay(500)

    // Check provider health and simulate appropriate error
    if (integration.providerHealth === 'degraded') {
      // Update status to error
      updateIntegrationStatus(integration.id, {
        status: 'error',
        statusReason: 'Provider API returning errors',
      })

      return HttpResponse.json(
        { 
          error: 'Bad Gateway', 
          code: 'provider_degraded', 
          message: `${integration.name} API is currently experiencing issues. Please try again later.` 
        },
        { status: 502 }
      )
    }

    if (integration.providerHealth === 'unreachable') {
      // Update status to error
      updateIntegrationStatus(integration.id, {
        status: 'error',
        statusReason: 'Connection timeout',
      })

      return HttpResponse.json(
        { 
          error: 'Gateway Timeout', 
          code: 'provider_timeout', 
          message: `Could not reach ${integration.name}. The server is not responding.` 
        },
        { status: 504 }
      )
    }

    // Get mock changes for this integration
    const mockData = mockSyncChanges[applicationId]
    if (!mockData) {
      return HttpResponse.json(
        { error: 'Not found', code: 'invalid_application_id', message: `No sync data for: ${applicationId}` },
        { status: 400 }
      )
    }

    // Generate a new proposed version
    const proposedVersion = generateNewVersion(integration.version)

    // Create draft session in the store
    const draftSession = createDraftSession(integration, mockData.changes, proposedVersion)

    // Update integration status based on changes
    const hasPendingDecisions = mockData.changes.length > 0
    updateIntegrationStatus(integration.id, {
      status: hasPendingDecisions ? 'conflict' : 'synced',
      statusReason: hasPendingDecisions ? `${mockData.changes.length} changes pending review` : 'Up to date',
    })

    return HttpResponse.json({
      code: 'SUCCESS',
      message: `Sync preview ready for ${mockData.applicationName}`,
      data: {
        sync_approval: {
          application_name: mockData.applicationName,
          changes: mockData.changes,
          proposed_version: proposedVersion,
        },
        metadata: {
          fetched_at: draftSession.fetchedAt,
          base_version: integration.version,
        },
      },
    })
  }),
]