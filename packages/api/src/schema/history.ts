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
