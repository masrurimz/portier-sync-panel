import { initContract } from '@ts-rest/core';
import { integrationsContract } from './integrations.js';
import { historyContract } from './history.js';
import { syncContract } from './sync.js';

const c = initContract();

export const apiContract = c.router({
  sync: syncContract,
  integrations: integrationsContract,
  history: historyContract,
});

// Named exports for consumers that import contracts individually
export { syncContract, integrationsContract, historyContract };