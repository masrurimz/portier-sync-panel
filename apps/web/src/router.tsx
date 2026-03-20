import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import { AppQueryProvider } from "./app/providers/query-provider";
import { AppSyncSessionProvider } from "./app/providers/sync-session-provider";
import Loader from "./components/loader";

import "./index.css";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: {},
    defaultPendingComponent: () => <Loader />,
    defaultNotFoundComponent: () => <div>Not Found</div>,
    Wrap: ({ children }) => (
      <AppQueryProvider>
        <AppSyncSessionProvider>{children}</AppSyncSessionProvider>
      </AppQueryProvider>
    ),
  });
  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
