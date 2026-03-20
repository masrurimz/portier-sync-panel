import { createFileRoute } from "@tanstack/react-router";

import { OverviewPage } from "../features/sync-console";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return <OverviewPage />;
}
