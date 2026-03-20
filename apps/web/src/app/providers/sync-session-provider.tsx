import type { PropsWithChildren } from "react";

import { SyncSessionProvider } from "../../features/sync-console/state/sync-session-provider";

export function AppSyncSessionProvider({ children }: PropsWithChildren) {
  return <SyncSessionProvider>{children}</SyncSessionProvider>;
}
