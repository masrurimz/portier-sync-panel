import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import Loader from "./components/loader";

import { getAppQueryClient } from "./app/query-client";
import "./index.css";
import { routeTree } from "./routeTree.gen";

const mswReady =
  import.meta.env.DEV && typeof window !== "undefined"
    ? import("./mocks/browser").then(({ worker }) => worker.start({ onUnhandledRequest: "bypass" }))
    : Promise.resolve();

export async function getRouter() {
  await mswReady;

  const queryClient = getAppQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPendingComponent: () => <Loader />,
    defaultNotFoundComponent: () => <div>Not Found</div>,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: Awaited<ReturnType<typeof getRouter>>;
  }
}
