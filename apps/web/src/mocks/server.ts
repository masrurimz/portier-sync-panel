import { server } from "@portier-sync/api/msw/server";

declare global {
  // eslint-disable-next-line no-var
  var __PORTIER_SERVER_MSW_STARTED__: boolean | undefined;
}

export function ensureServerMsw(): void {
  if (globalThis.__PORTIER_SERVER_MSW_STARTED__) return;
  server.listen({ onUnhandledRequest: "bypass" });
  globalThis.__PORTIER_SERVER_MSW_STARTED__ = true;
}