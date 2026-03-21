import type { AuditEntry } from '../../schema/index';

// In-memory local audit log — resets on every app start.
// Only contains local-origin events (apply-local, preview-fetched).
// Remote history is served by the remote history endpoint.
export const localAuditLog: AuditEntry[] = [];