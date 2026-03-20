import { createFileRoute } from "@tanstack/react-router";

import { HistoryPage } from "../features/sync-console";

export const Route = createFileRoute("/integration/$integrationId/history")({
  component: IntegrationHistoryRoute,
});

function IntegrationHistoryRoute() {
  const { integrationId } = Route.useParams();
  return <HistoryPage integrationId={integrationId} />;
}