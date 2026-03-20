import { createFileRoute } from "@tanstack/react-router";

import { IntegrationHistoryScreen } from "../features/sync-console/history/screens/integration-history-screen";
import type { ApplicationId } from "../lib/api-types";

export const Route = createFileRoute("/integration/$integrationId/history")({
  component: IntegrationHistoryRoute,
});

function IntegrationHistoryRoute() {
  const { integrationId } = Route.useParams();
  return <IntegrationHistoryScreen integrationId={integrationId as ApplicationId} />;
}