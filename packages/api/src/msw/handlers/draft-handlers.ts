import { http, HttpResponse } from 'msw'
import {
  getDraftSession,
  setItemResolution,
  clearDraftSession,
} from '../data/draft-session-store'
import {
  findIntegrationById,
  updateIntegrationStatus,
  recoverProvider as recoverProviderStore,
  integrationStore,
} from '../data/integration-store'

const BASE_URL = 'https://portier-takehometest.onrender.com'

/**
 * Draft session handlers - manage the review workflow state.
 * These endpoints are part of the mock API to simulate real backend behavior.
 */
export const draftHandlers = [
  // GET /api/v1/integrations/:id/draft - get current draft session
  http.get(`${BASE_URL}/api/v1/integrations/:id/draft`, ({ params }) => {
    const { id } = params as { id: string }
    const session = getDraftSession(id)

    if (!session) {
      return HttpResponse.json(
        { error: 'Not found', code: 'no_draft', message: `No draft session for integration ${id}` },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      code: 'SUCCESS',
      data: session,
    })
  }),

  // PUT /api/v1/integrations/:id/draft/resolution - set item resolution
  http.put(`${BASE_URL}/api/v1/integrations/:id/draft/resolution`, async ({ params, request }) => {
    const { id } = params as { id: string }
    const body = (await request.json()) as { itemId: string; resolution: 'remote' | 'local' }

    const session = setItemResolution(id, body.itemId, body.resolution)
    if (!session) {
      return HttpResponse.json(
        { error: 'Not found', code: 'no_draft', message: `No draft session for integration ${id}` },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      code: 'SUCCESS',
      data: session,
    })
  }),

  // DELETE /api/v1/integrations/:id/draft - clear draft session
  http.delete(`${BASE_URL}/api/v1/integrations/:id/draft`, ({ params }) => {
    const { id } = params as { id: string }
    clearDraftSession(id)
    return HttpResponse.json({ code: 'SUCCESS', message: 'Draft session cleared' })
  }),
]

/**
 * Provider management handlers - simulate provider recovery/degradation.
 * These are mock-specific endpoints for testing different states.
 */
export const providerHandlers = [
  // POST /api/v1/integrations/:id/recover - simulate provider recovery
  http.post(`${BASE_URL}/api/v1/integrations/:id/recover`, ({ params }) => {
    const { id } = params as { id: string }
    const integration = recoverProviderStore(id)

    if (!integration) {
      return HttpResponse.json(
        { error: 'Not found', code: 'invalid_integration', message: `No integration found with id: ${id}` },
        { status: 404 }
      )
    }

    // Update status to synced if it was error
    if (integration.status === 'error') {
      updateIntegrationStatus(id, {
        status: 'synced',
        statusReason: 'Provider recovered',
      })
    }

    return HttpResponse.json({
      code: 'SUCCESS',
      message: `${integration.name} provider is now healthy`,
      data: {
        id: integration.id,
        providerHealth: 'healthy',
        status: 'synced',
      },
    })
  }),

  // POST /api/v1/integrations/:id/degrade - simulate provider degradation
  http.post(`${BASE_URL}/api/v1/integrations/:id/degrade`, async ({ params, request }) => {
    const { id } = params as { id: string }
    const body = (await request.json()) as { reason?: string; type?: 'degraded' | 'unreachable' }

    const integration = findIntegrationById(id)
    if (!integration) {
      return HttpResponse.json(
        { error: 'Not found', code: 'invalid_integration', message: `No integration found with id: ${id}` },
        { status: 404 }
      )
    }

    const providerHealth = body.type ?? 'degraded'
    updateIntegrationStatus(id, {
      providerHealth,
      status: 'error',
      statusReason: body.reason ?? 'Simulated degradation',
    })

    return HttpResponse.json({
      code: 'SUCCESS',
      message: `${integration.name} provider is now ${providerHealth}`,
      data: {
        id: integration.id,
        providerHealth,
        status: 'error',
      },
    })
  }),

  // GET /api/v1/provider-status - get all provider health status
  http.get(`${BASE_URL}/api/v1/provider-status`, () => {
    const statuses = integrationStore.map((i) => ({
      id: i.id,
      name: i.name,
      status: i.status,
      providerHealth: i.providerHealth,
      statusReason: i.statusReason,
    }))

    return HttpResponse.json({
      code: 'SUCCESS',
      data: statuses,
    })
  }),
]