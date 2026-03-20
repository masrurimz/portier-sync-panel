import { initContract } from '@ts-rest/core';
import { integrationsContract } from './integrations';
import { historyContract } from './history';
import { syncContract } from './sync';

const c = initContract();

export const apiContract = c.router({
  sync: syncContract,
  integrations: integrationsContract,
  history: historyContract,
});

// Named exports for consumers that import contracts individually
export { syncContract, integrationsContract, historyContract };