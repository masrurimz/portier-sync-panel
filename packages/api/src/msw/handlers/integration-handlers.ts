import { http, HttpResponse } from 'msw'
import { integrationStore } from '../data/integration-store'
import { draftSessionStore } from '../data/draft-session-store'

const BASE_URL = 'https://portier-takehometest.onrender.com'

/**
 * Integration handlers - serve integration list and details from mutable store.
 * The store tracks real workflow state changes (sync status, provider health, etc.)
 */
export const integrationHandlers = [
  // GET /api/v1/integrations - list all integrations
  http.get(`${BASE_URL}/api/v1/integrations`, () => {
    // Return the mutable store data, excluding internal fields
    // Include draft metadata from draftSessionStore
    const data = integrationStore.map(({ providerHealth, statusReason, statusChangedAt, ...integration }) => {
      const draft = draftSessionStore[integration.id]
      return {
        ...integration,
        draft: draft ? {
          status: draft.status,
          pendingCount: draft.pendingCount,
          reviewedCount: draft.reviewedCount,
          fetchedAt: draft.fetchedAt,
        } : null,
      }
    })
    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'Integrations retrieved successfully',
      data,
    })
  }),

  // GET /api/v1/integrations/:id - get integration by ID
  http.get(`${BASE_URL}/api/v1/integrations/:id`, ({ params }) => {
    const { id } = params as { id: string }
    const found = integrationStore.find((i) => i.id === id)

    if (!found) {
      return HttpResponse.json(
        {
          error: 'Not found',
          code: 'invalid_application_id',
          message: `No integration found with id: ${id}`,
        },
        { status: 404 }
      )
    }

    // Exclude internal fields from response, include draft metadata
    const { providerHealth, statusReason, statusChangedAt, ...integration } = found
    const draft = draftSessionStore[id]
    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'Integration retrieved successfully',
      data: {
        ...integration,
        draft: draft ? {
          status: draft.status,
          pendingCount: draft.pendingCount,
          reviewedCount: draft.reviewedCount,
          fetchedAt: draft.fetchedAt,
        } : null,
      },
    })
  }),

  // GET /api/v1/integrations/:id/status - get extended status including provider health
  // This is an extended endpoint for the mock to expose providerHealth
  http.get(`${BASE_URL}/api/v1/integrations/:id/status`, ({ params }) => {
    const { id } = params as { id: string }
    const found = integrationStore.find((i) => i.id === id)

    if (!found) {
      return HttpResponse.json(
        {
          error: 'Not found',
          code: 'invalid_application_id',
          message: `No integration found with id: ${id}`,
        },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      code: 'SUCCESS',
      data: {
        id: found.id,
        status: found.status,
        providerHealth: found.providerHealth,
        statusReason: found.statusReason,
        statusChangedAt: found.statusChangedAt,
      },
    })
  }),
]