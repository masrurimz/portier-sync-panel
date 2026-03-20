import { z } from "zod";

export const ChangeTypeSchema = z.enum(["UPDATE", "ADD", "DELETE"]);
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

export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
) =>
  z.object({
    code: z.literal("SUCCESS"),
    message: z.string(),
    data: dataSchema,
  });

export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  code: z.enum(["missing_parameter", "invalid_application_id", "internal_error"]),
  message: z.string(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// ============================================================
// Integration identity
// ============================================================

// Opaque numeric string ID used for routing (e.g. /integration/4).
// Separate from `slug` which is the API application_id param.
export const IntegrationIdSchema = z.string().min(1);
export type IntegrationId = z.infer<typeof IntegrationIdSchema>;

export const SyncStatusSchema = z.enum(["synced", "syncing", "conflict", "error"]);
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

// ============================================================
// Sync history
// ============================================================

export const SyncSourceSchema = z.enum(["user", "system"]);
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

// ============================================================
// Entity schemas (User / Door / Key)
// ============================================================

export const EntityTypeSchema = z.enum(["user", "door", "key"]);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const UserStatusSchema = z.enum(["active", "suspended"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const DoorStatusSchema = z.enum(["online", "offline"]);
export type DoorStatus = z.infer<typeof DoorStatusSchema>;

export const KeyStatusSchema = z.enum(["active", "revoked"]);
export type KeyStatus = z.infer<typeof KeyStatusSchema>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.string(),
  status: UserStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const DoorSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  device_id: z.string(),
  status: DoorStatusSchema,
  battery_level: z.number(),
  last_seen: z.string(),
  created_at: z.string(),
});
export type Door = z.infer<typeof DoorSchema>;

export const KeySchema = z.object({
  id: z.string(),
  user_id: z.string(),
  door_id: z.string(),
  key_type: z.string(),
  access_start: z.string(),
  access_end: z.string(),
  status: KeyStatusSchema,
  created_at: z.string(),
});
export type Key = z.infer<typeof KeySchema>;