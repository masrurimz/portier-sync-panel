import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | null = null;

/**
 * Single QueryClient instance shared across router setup and feature stores.
 * This keeps cache reads/writes consistent for optimistic UI updates.
 */
export function getAppQueryClient() {
  if (queryClient) {
    return queryClient;
  }

  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return queryClient;
}
