import { Badge } from "@portier-sync/ui/components/badge";
import { Separator } from "@portier-sync/ui/components/separator";
import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="border-b border-border/80 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-medium tracking-[0.35em] text-muted-foreground uppercase">Portier / Design Preview</div>
            <div className="flex items-center gap-3">
              <Link className="text-sm font-semibold tracking-tight hover:text-foreground/80" to="/">
                Sync console pages
              </Link>
              <Badge variant="outline">Static mockup</Badge>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link className="rounded-none border border-border/70 px-3 py-1.5 hover:bg-muted hover:text-foreground" to="/">
              Overview
            </Link>
            <Link
              className="rounded-none border border-border/70 px-3 py-1.5 hover:bg-muted hover:text-foreground"
              to="/integration/$integrationId"
              params={{ integrationId: "salesforce" }}
            >
              Detail
            </Link>
            <Link
              className="rounded-none border border-border/70 px-3 py-1.5 hover:bg-muted hover:text-foreground"
              to="/integration/$integrationId/review"
              params={{ integrationId: "hubspot" }}
            >
              Review
            </Link>
            <Link
              className="rounded-none border border-border/70 px-3 py-1.5 hover:bg-muted hover:text-foreground"
              to="/integration/$integrationId/history"
              params={{ integrationId: "salesforce" }}
            >
              History
            </Link>
          </nav>
        </div>
        <Separator />
      </div>
    </header>
  );
}
