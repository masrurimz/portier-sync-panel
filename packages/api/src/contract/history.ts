import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ApiErrorResponseSchema, ApiSuccessResponseSchema, SyncHistoryEntrySchema } from '../schema/index';

const c = initContract();

export const historyContract = c.router({
  list: {
    method: 'GET',
    path: '/api/v1/integrations/:id/history',
    pathParams: z.object({ id: z.string() }),
    responses: {
      200: ApiSuccessResponseSchema(z.array(SyncHistoryEntrySchema)),
      404: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
    summary: 'Get sync history for an integration',
  },
});