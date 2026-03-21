import { http, HttpResponse } from 'msw'

const BASE_URL = 'https://portier-takehometest.onrender.com'

/**
 * Deterministic error handlers for testing specific status codes.
 * Use these to override syncHandlers for error scenario testing.
 */

// 400 Bad Request - configuration/client error
export const error400Handler = http.get(
  `${BASE_URL}/api/v1/data/sync`,
  () =>
    HttpResponse.json(
      {
        error: 'Bad Request',
        code: 'missing_parameter',
        message: 'application_id is required',
      },
      { status: 400 }
    ),
)

// 500 Internal Server Error
export const error500Handler = http.get(
  `${BASE_URL}/api/v1/data/sync`,
  () =>
    HttpResponse.json(
      {
        error: 'Internal Server Error',
        code: 'internal_error',
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    ),
)

// 502 Bad Gateway - provider upstream failure
export const error502Handler = http.get(
  `${BASE_URL}/api/v1/data/sync`,
  () =>
    HttpResponse.json(
      {
        error: 'Bad Gateway',
        code: 'provider_unavailable',
        message: 'The provider service is temporarily unavailable.',
      },
      { status: 502 }
    ),
)

/**
 * Default error handlers array for convenience.
 * Includes 502 to test provider outage scenarios.
 */
export const errorHandlers = [error502Handler]