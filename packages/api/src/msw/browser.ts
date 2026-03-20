import { setupWorker } from 'msw/browser'
import { syncHandlers } from './handlers/sync-handlers.js'

// Service worker for browser-based development mocking.
// Import this only in browser environments.
export const worker = setupWorker(...syncHandlers)