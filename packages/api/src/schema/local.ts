import { z } from 'zod';
import { IntegrationIdSchema } from './integration';
import { AuditEntrySchema } from './history';

// Authoritative local DB record per integration.
// revision is a monotonic CAS token — never reflects remote version.
export const LocalSnapshotSchema = z.object({
  integrationId: IntegrationIdSchema,
  revision: z.number().int().min(1),
  recordCount: z.number().int().min(0),
  updatedAt: z.string(), // ISO 8601
});
export type LocalSnapshot = z.infer<typeof LocalSnapshotSchema>;

// Request body for apply-review.
export const ApplyReviewBodySchema = z.object({
  expectedRevision: z.number().int(), // CAS token
  selectedCount: z.number().int(),
  conflictResolutionCount: z.number().int(),
  applicationName: z.string(),
});
export type ApplyReviewBody = z.infer<typeof ApplyReviewBodySchema>;

// Response payload for apply-review — snapshot post-apply + the audit entry created.
export const ApplyReviewResultSchema = z.object({
  snapshot: LocalSnapshotSchema,
  auditEntry: AuditEntrySchema,
});
export type ApplyReviewResult = z.infer<typeof ApplyReviewResultSchema>;