import { createFileRoute } from "@tanstack/react-router";

import { OverviewScreen } from "../features/sync-console/overview/screens/overview-screen";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return <OverviewScreen />;
}
