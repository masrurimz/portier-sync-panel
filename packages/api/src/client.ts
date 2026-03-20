import { createFetch, type BetterFetchError } from '@better-fetch/fetch';
import { fetchSchema } from './fetch-schema';

export const API_BASE_URL = 'https://portier-takehometest.onrender.com';

export const $fetch = createFetch({
  baseURL: API_BASE_URL,
  schema: fetchSchema,
  throw: true,
});

export type ApiError = BetterFetchError;