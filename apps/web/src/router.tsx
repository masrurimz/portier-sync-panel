import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import Loader from "./components/loader";

import "./index.css";
import { routeTree } from "./routeTree.gen";

const enableMsw = import.meta.env.DEV || import.meta.env.VITE_DEMO_MSW === "1";

const mswReady = (async () => {
  if (!enableMsw) return;
  if (typeof window !== "undefined") {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
    return;
  }

  const serverMockModule = "./mocks/server";
  const { ensureServerMsw } = await import(/* @vite-ignore */ serverMockModule);
  ensureServerMsw();
})();

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
