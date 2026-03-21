// Local snapshot record shape for the MSW in-memory local DB.
// Matches LocalSnapshot in the feature domain but lives here to avoid cross-package deps.
export interface LocalSnapshotRecord {
  integrationId: string;
  localVersion: string;
  recordCount: number;
  updatedAt: string; // ISO string
}

// In-memory local DB — resets on every app start (module reload).
// Seed versions match remote integration versions to represent "currently in sync" baseline.
export const localSnapshotStore: Record<string, LocalSnapshotRecord> = {
  '1': { integrationId: '1', localVersion: '2.4.1', recordCount: 12453, updatedAt: new Date('2026-03-02T08:30:00Z').toISOString() },
  '2': { integrationId: '2', localVersion: '1.8.3', recordCount: 8521, updatedAt: new Date('2026-03-02T08:10:00Z').toISOString() },
  '3': { integrationId: '3', localVersion: '3.1.0', recordCount: 3200, updatedAt: new Date('2026-03-01T18:00:00Z').toISOString() },
  '4': { integrationId: '4', localVersion: '1.2.5', recordCount: 450, updatedAt: new Date('2026-03-02T08:50:00Z').toISOString() },
  '5': { integrationId: '5', localVersion: '2.0.8', recordCount: 7234, updatedAt: new Date('2026-03-01T13:15:00Z').toISOString() },
  '6': { integrationId: '6', localVersion: '1.5.2', recordCount: 2890, updatedAt: new Date('2026-03-02T07:55:00Z').toISOString() },
};