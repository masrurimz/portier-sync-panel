import { z } from 'zod';

export const ChangeTypeSchema = z.enum(['UPDATE', 'ADD', 'DELETE']);
export type ChangeType = z.infer<typeof ChangeTypeSchema>;

export const SyncChangeSchema = z.object({
  id: z.string(),
  field_name: z.string(),
  change_type: ChangeTypeSchema,
  current_value: z.string().optional(),
  new_value: z.string().optional(),
});
export type SyncChange = z.infer<typeof SyncChangeSchema>;

export const SyncApprovalSchema = z.object({
  application_name: z.string(),
  changes: z.array(SyncChangeSchema),
});
export type SyncApproval = z.infer<typeof SyncApprovalSchema>;

export const SyncDataSchema = z.object({
  sync_approval: SyncApprovalSchema,
  metadata: z.record(z.string(), z.unknown()),
});
export type SyncData = z.infer<typeof SyncDataSchema>;
