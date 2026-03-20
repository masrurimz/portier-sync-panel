import { createFileRoute } from "@tanstack/react-router";

import { DetailPage } from "../features/sync-console";

export const Route = createFileRoute("/integration/$integrationId/")({
  component: IntegrationDetailRoute,
});

function IntegrationDetailRoute() {
  const { integrationId } = Route.useParams();
  return <DetailPage integrationId={integrationId} />;
}