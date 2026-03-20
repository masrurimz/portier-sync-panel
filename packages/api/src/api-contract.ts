import { z } from 'zod';
import {
  ApiSuccessResponseSchema,
  ApiErrorResponseSchema,
  IntegrationSchema,
  SyncHistoryEntrySchema,
  SyncDataSchema,
} from './schema/index';

/**
 * Clean API contract object for the Portier sync API.
 * Each endpoint defines path, method, and relevant schemas.
 * This is the source of truth for both fetch-schema and documentation.
 */
export const apiContract = {
  integrations: {
    list: {
      path: '/api/v1/integrations',
      method: 'GET',
      output: ApiSuccessResponseSchema(z.array(IntegrationSchema)),
      errors: {
        500: ApiErrorResponseSchema,
      },
    },
    get: {
      path: '/api/v1/integrations/:id',
      method: 'GET',
      params: z.object({ id: z.string() }),
      output: ApiSuccessResponseSchema(IntegrationSchema),
      errors: {
        404: ApiErrorResponseSchema,
        500: ApiErrorResponseSchema,
      },
    },
  },
  history: {
    list: {
      path: '/api/v1/integrations/:id/history',
      method: 'GET',
      params: z.object({ id: z.string() }),
      output: ApiSuccessResponseSchema(z.array(SyncHistoryEntrySchema)),
      errors: {
        404: ApiErrorResponseSchema,
        500: ApiErrorResponseSchema,
      },
    },
  },
  sync: {
    preview: {
      path: '/api/v1/data/sync',
      method: 'GET',
      query: z.object({ application_id: z.string() }),
      output: ApiSuccessResponseSchema(SyncDataSchema),
      errors: {
        400: ApiErrorResponseSchema,
        500: ApiErrorResponseSchema,
        502: ApiErrorResponseSchema,
      },
    },
  },
} as const;

export type ApiContract = typeof apiContract;