import { createFileRoute } from "@tanstack/react-router";

import { DetailPage } from "../features/sync-console";
import type { ApplicationId } from "../lib/api-types";

export const Route = createFileRoute("/integration/$integrationId/")({
  component: IntegrationDetailRoute,
});

function IntegrationDetailRoute() {
  const { integrationId } = Route.useParams();
  return <DetailPage integrationId={integrationId as ApplicationId} />;
}
