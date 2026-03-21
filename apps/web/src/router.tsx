import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import Loader from "./components/loader";

import "./index.css";
import { routeTree } from "./routeTree.gen";

import { env } from "@portier-sync/env/web";

// Determine which browser MSW worker to start based on VITE_MOCK_API.
// - true: fully mocked app, including sync preview responses
// - false (default): mocked scaffolding only; Sync Now calls the real backend
const mswReady =
  typeof window !== "undefined"
    ? import("./mocks/browser").then(({ worker, localWorker }) => {
      if (env.VITE_MOCK_API) {
        return worker.start({ onUnhandledRequest: "bypass" });
      }

      return localWorker.start({ onUnhandledRequest: "bypass" });
    })
    : Promise.resolve();

export async function getRouter() {
  await mswReady;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

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
