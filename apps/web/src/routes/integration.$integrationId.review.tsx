import { createFileRoute } from "@tanstack/react-router";

import { ReviewPage } from "../features/sync-console";

export const Route = createFileRoute("/integration/$integrationId/review")({
  component: IntegrationReviewRoute,
});

function IntegrationReviewRoute() {
  const { integrationId } = Route.useParams();
  return <ReviewPage integrationId={integrationId} />;
}