import { createFileRoute } from "@tanstack/react-router";

import { IntegrationReviewScreen } from "../features/sync-console/review/screens/integration-review-screen";
import type { ApplicationId } from "../lib/api-types";

export const Route = createFileRoute("/integration/$integrationId/review")({
  component: IntegrationReviewRoute,
});

function IntegrationReviewRoute() {
  const { integrationId } = Route.useParams();
  return <IntegrationReviewScreen integrationId={integrationId as ApplicationId} />;
}