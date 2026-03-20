import { http, HttpResponse } from 'msw'
import { mockSyncChanges } from '../data/sync-changes'
import { mockIntegrations } from '../data/integrations'

const BASE_URL = 'https://portier-takehometest.onrender.com'

export const syncHandlers = [
  http.get(`${BASE_URL}/api/v1/data/sync`, ({ request }) => {
    const url = new URL(request.url)
    const applicationId = url.searchParams.get('application_id') ?? ''

    // Validate the slug against the integrations list to keep mock data in sync
    const integration = mockIntegrations.find((i) => i.slug === applicationId)
    if (!integration) {
      return HttpResponse.json(
        { error: 'Not found', code: 'invalid_application_id', message: `No integration found for application_id: ${applicationId}` },
        { status: 400 }
      )
    }

    const mockData = mockSyncChanges[applicationId]
    if (!mockData) {
      return HttpResponse.json(
        { error: 'Not found', code: 'invalid_application_id', message: `No sync data for: ${applicationId}` },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      code: 'SUCCESS',
      message: `Sync preview ready for ${mockData.applicationName}`,
      data: {
        sync_approval: {
          application_name: mockData.applicationName,
          changes: mockData.changes,
        },
        metadata: {},
      },
    })
  }),
]