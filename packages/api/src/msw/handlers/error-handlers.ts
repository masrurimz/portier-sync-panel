import { http, HttpResponse } from 'msw'

const BASE_URL = 'https://portier-takehometest.onrender.com'

// Handlers that simulate error states for testing.
// Use these to override syncHandlers for error scenario testing.
export const error502Handler = http.get(
  `${BASE_URL}/api/v1/data/sync`,
  () => new HttpResponse(null, { status: 502 }),
)

export const error400Handler = http.get(
  `${BASE_URL}/api/v1/data/sync`,
  () => HttpResponse.json(
    { error: 'Bad request', code: 'missing_parameter', message: 'application_id is required' },
    { status: 400 }
  ),
)

export const errorHandlers = [error502Handler]