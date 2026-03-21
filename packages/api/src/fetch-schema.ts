import { createSchema } from '@better-fetch/fetch';
import { apiContract } from './api-contract';

/**
 * Thin adapter that maps apiContract endpoint definitions to better-fetch schema.
 * Uses @get prefix for GET methods as required by better-fetch.
 */
export const fetchSchema = createSchema({
  // Integrations
  '@get/api/v1/integrations': {
    output: apiContract.integrations.list.output,
  },
  '@get/api/v1/integrations/:id': {
    params: apiContract.integrations.get.params,
    output: apiContract.integrations.get.output,
  },
  '@get/api/v1/integrations/:id/status': {
    params: apiContract.integrations.status.params,
    output: apiContract.integrations.status.output,
  },
  // History
  '@get/api/v1/integrations/:id/history': {
    params: apiContract.history.list.params,
    output: apiContract.history.list.output,
  },
  // Sync
  '@get/api/v1/data/sync': {
    query: apiContract.sync.preview.query,
    output: apiContract.sync.preview.output,
  },
  // Local DB
  '@get/api/v1/integrations/:id/snapshot': {
    params: apiContract.local.snapshot.params,
    output: apiContract.local.snapshot.output,
  },
  '@put/api/v1/integrations/:id/apply-review': {
    params: apiContract.local.applyReview.params,
    body: apiContract.local.applyReview.body,
    output: apiContract.local.applyReview.output,
  },
  '@get/api/v1/integrations/:id/audit': {
    params: apiContract.local.audit.params,
    output: apiContract.local.audit.output,
  },
});