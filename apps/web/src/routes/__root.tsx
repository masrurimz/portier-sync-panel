import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { TooltipProvider } from "@portier-sync/ui/components/tooltip";
import { Toaster } from "@portier-sync/ui/components/sonner";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import Header from "../components/header";

import appCss from "../index.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Portier Sync Console",
      },
      {
        name: "description",
        content: "Interactive sync console for reviewing and applying integration changes.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        <div className="relative min-h-svh overflow-x-hidden bg-background">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.07]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_top,rgba(86,150,214,0.22),transparent_48%)]" />
          <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 bg-[radial-gradient(circle,rgba(214,166,86,0.12),transparent_62%)]" />
          <TooltipProvider>
            <div className="relative grid min-h-svh grid-rows-[auto_1fr]">
              <Header />
              {children}
            </div>
          </TooltipProvider>
        </div>
        <Toaster richColors />
        <TanStackRouterDevtools position="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}