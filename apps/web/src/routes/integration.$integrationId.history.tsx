import { createFileRoute, notFound } from "@tanstack/react-router";

import { IntegrationHistoryScreen } from "../features/sync-console/history/screens/integration-history-screen";
import type { ApplicationId } from "../lib/api-types";
import { getIntegrationById } from "../lib/api-types";

export const Route = createFileRoute("/integration/$integrationId/history")({
  component: IntegrationHistoryRoute,
});

function IntegrationHistoryRoute() {
  const { integrationId } = Route.useParams();

  if (!getIntegrationById(integrationId as ApplicationId)) {
    throw notFound();
  }

  return <IntegrationHistoryScreen integrationId={integrationId as ApplicationId} />;
}
