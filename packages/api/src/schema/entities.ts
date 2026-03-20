import { z } from 'zod';

export const EntityTypeSchema = z.enum(['user', 'door', 'key']);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const UserStatusSchema = z.enum(['active', 'suspended']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const DoorStatusSchema = z.enum(['online', 'offline']);
export type DoorStatus = z.infer<typeof DoorStatusSchema>;

export const KeyStatusSchema = z.enum(['active', 'revoked']);
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
