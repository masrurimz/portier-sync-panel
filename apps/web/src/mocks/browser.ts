// Re-export MSW workers from @portier-sync/api/msw/browser.
// - `worker`: full mock mode, including sync preview responses
// - `localWorker`: default take-home mode, keeps local scaffolding but lets Sync Now hit the real API
export { worker, localWorker } from '@portier-sync/api/msw/browser'