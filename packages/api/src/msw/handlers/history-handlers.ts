import { http, HttpResponse } from 'msw'
import { mockHistory } from '../data/history.js'
import { mockIntegrations } from '../data/integrations.js'

const BASE_URL = 'https://portier-takehometest.onrender.com'

export const historyHandlers = [
  // GET /api/v1/integrations/:id/history - get sync history for an integration
  http.get(`${BASE_URL}/api/v1/integrations/:id/history`, ({ params }) => {
    const { id } = params

    // Check if the integration exists
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

    const history = mockHistory[id as string] ?? []

    return HttpResponse.json({
      code: 'SUCCESS',
      message: `Sync history retrieved for ${integration.name}`,
      data: history,
    })
  }),
]