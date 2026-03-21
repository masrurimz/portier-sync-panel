import { http, HttpResponse } from 'msw';
import { localSnapshotStore } from '../data/local-snapshots';
import { localAuditLog } from '../data/local-history';
import type { AuditEntry, ApplyReviewBody } from '../../schema/index';

const BASE_URL = 'https://portier-takehometest.onrender.com';

// MSW handlers for the managed local DB endpoints.
// These serve the /api/v1/integrations/:id/... paths backed by in-memory stores.
export const localDbHandlers = [
  http.get(`${BASE_URL}/api/v1/integrations/:id/snapshot`, ({ params }) => {
    const { id } = params as { id: string };
    const snapshot = localSnapshotStore[id];

    if (!snapshot) {
      return HttpResponse.json(
        { error: 'Not found', message: `No local snapshot for integration ${id}` },
        { status: 404 },
      );
    }

    return HttpResponse.json({ data: snapshot });
  }),

  http.put(`${BASE_URL}/api/v1/integrations/:id/apply-review`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const snapshot = localSnapshotStore[id];

    if (!snapshot) {
      return HttpResponse.json(
        { error: 'Not found', message: `No local snapshot for integration ${id}` },
        { status: 404 },
      );
    }

    const body = (await request.json()) as ApplyReviewBody;

    // CAS check: reject if the snapshot has changed since the draft was created.
    // This is the authoritative stale-detection boundary; client pre-flight is advisory only.
    if (body.expectedRevision !== snapshot.revision) {
      return HttpResponse.json(
        {
          error: 'Conflict',
          message: 'Local snapshot revision has changed. Fetch the latest preview before applying.',
        },
        { status: 409 },
      );
    }

    // Mutate local DB in place — intentional side effect.
    snapshot.revision = snapshot.revision + 1;
    snapshot.updatedAt = new Date().toISOString();
    snapshot.recordCount = Math.max(0, snapshot.recordCount + body.selectedCount - body.conflictResolutionCount);

    const auditEntry: AuditEntry = {
      id: `local-${id}-${Date.now()}`,
      integrationId: id,
      origin: 'local',
      eventType: 'apply-local',
      summary: `Applied ${body.selectedCount} change${body.selectedCount === 1 ? '' : 's'} from ${body.applicationName} to local DB`,
      details: body.conflictResolutionCount > 0
        ? `${body.conflictResolutionCount} conflict${body.conflictResolutionCount === 1 ? '' : 's'} resolved`
        : undefined,
      timestamp: new Date(),
      localRevision: snapshot.revision,
    };

    localAuditLog.unshift(auditEntry);

    return HttpResponse.json({ data: { snapshot, auditEntry } });
  }),

  http.get(`${BASE_URL}/api/v1/integrations/:id/audit`, ({ params }) => {
    const { id } = params as { id: string };
    const entries = localAuditLog.filter((e) => e.integrationId === id);
    return HttpResponse.json({ data: entries });
  }),
];