import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ApiErrorResponseSchema, ApiSuccessResponseSchema, IntegrationSchema } from '../types.js';

const c = initContract();

export const integrationsContract = c.router({
  list: {
    method: 'GET',
    path: '/api/v1/integrations',
    responses: {
      200: ApiSuccessResponseSchema(z.array(IntegrationSchema)),
      500: ApiErrorResponseSchema,
    },
    summary: 'List all integrations',
  },
  get: {
    method: 'GET',
    path: '/api/v1/integrations/:id',
    pathParams: z.object({ id: z.string() }),
    responses: {
      200: ApiSuccessResponseSchema(IntegrationSchema),
      404: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
    summary: 'Get a single integration by ID',
  },
});