import { z } from 'zod';
import { IntegrationIdSchema } from './integration';

export const SyncSourceSchema = z.enum(['user', 'system']);
export type SyncSource = z.infer<typeof SyncSourceSchema>;

export const SyncHistoryEntrySchema = z.object({
  id: z.string(),
  integrationId: IntegrationIdSchema,
  timestamp: z.coerce.date(),
  source: SyncSourceSchema,
  version: z.string(),
  summary: z.string(),
  details: z.string().optional(),
  changesCount: z.number().optional(),
  addedCount: z.number().optional(),
  updatedCount: z.number().optional(),
  deletedCount: z.number().optional(),
});
export type SyncHistoryEntry = z.infer<typeof SyncHistoryEntrySchema>;


// Provenance-aware audit entry — unified timeline type that represents both
// remote-recorded and local-applied events. Never use SyncHistoryEntry for
// local-origin events; AuditEntry is the canonical history record.
export const AuditEntryOriginSchema = z.enum(['remote', 'local', 'future-push']);
export type AuditEntryOrigin = z.infer<typeof AuditEntryOriginSchema>;

export const AuditEntryEventTypeSchema = z.enum([
  'remote-history',
  'preview-fetched',
  'apply-local',
  'push-remote',
]);
export type AuditEntryEventType = z.infer<typeof AuditEntryEventTypeSchema>;

// Invariant: an AuditEntry with origin 'local' MUST NOT be presented as
// remote-confirmed history in the UI.
export const AuditEntrySchema = z.object({
  id: z.string(),
  integrationId: IntegrationIdSchema,
  origin: AuditEntryOriginSchema,
  eventType: AuditEntryEventTypeSchema,
  summary: z.string(),
  details: z.string().optional(),
  timestamp: z.coerce.date(),
  baseVersion: z.string().optional(),
  resultVersion: z.string().optional(),
  remoteVersion: z.string().optional(),
  localVersion: z.string().optional(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;