import { http, HttpResponse } from 'msw'
import { mockIntegrations } from '../data/integrations'

const BASE_URL = 'https://portier-takehometest.onrender.com'

export const integrationHandlers = [
  // GET /api/v1/integrations - list all integrations
  http.get(`${BASE_URL}/api/v1/integrations`, () => {
    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'Integrations retrieved successfully',
      data: mockIntegrations,
    })
  }),

  // GET /api/v1/integrations/:id - get integration by ID
  http.get(`${BASE_URL}/api/v1/integrations/:id`, ({ params }) => {
    const { id } = params
    const integration = mockIntegrations.find((i) => i.id === id)

    if (!integration) {
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
      message: 'Integration retrieved successfully',
      data: integration,
    })
  }),
]