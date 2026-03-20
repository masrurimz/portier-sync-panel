import { z } from 'zod';

// Opaque numeric string ID used for routing (e.g. /integration/4).
// Separate from `slug` which is the API application_id param.
export const IntegrationIdSchema = z.string().min(1);
export type IntegrationId = z.infer<typeof IntegrationIdSchema>;

export const SyncStatusSchema = z.enum(['synced', 'syncing', 'conflict', 'error']);
export type SyncStatus = z.infer<typeof SyncStatusSchema>;

export const IntegrationSchema = z.object({
  id: IntegrationIdSchema,
  // slug maps to the external API's application_id param (e.g. "salesforce")
  slug: z.string(),
  name: z.string(),
  icon: z.string(),
  status: SyncStatusSchema,
  lastSynced: z.coerce.date().nullable(),
  version: z.string(),
  totalRecords: z.number().optional(),
  lastSyncDuration: z.number().optional(),
});
export type Integration = z.infer<typeof IntegrationSchema>;
