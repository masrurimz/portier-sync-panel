import * as React from "react";
import { Badge } from "@portier-sync/ui/components/badge";
import { buttonVariants } from "@portier-sync/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portier-sync/ui/components/card";
import { cn } from "@portier-sync/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { AlertTriangleIcon, CheckCircle2Icon, CircleDashedIcon, ShieldAlertIcon } from "lucide-react";

import type { ApplicationId, Integration } from "../../../lib/api-types";
import type { ConsoleMetric } from "../domain/integration";

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 rounded-[1.75rem] border border-border/80 bg-card/70 p-6 backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-3xl flex-col gap-2.5">
            <div className="text-[10px] font-semibold tracking-[0.34em] text-muted-foreground uppercase">{eyebrow}</div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
        <div className="flex flex-col gap-8">{children}</div>
      </div>
    </div>
  );
}

export function SurfaceSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-border/80 bg-card/80 shadow-2xl shadow-black/10">
      <CardHeader className="border-b border-border/80">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {action ? <CardAction>{action}</CardAction> : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-5">{children}</CardContent>
    </Card>
  );
}

export function MetricGrid({ metrics }: { metrics: ConsoleMetric[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} size="sm" className="border border-border/70 bg-card/60">
          <CardHeader>
            <CardDescription className="text-[11px] font-semibold tracking-[0.16em] uppercase">{metric.label}</CardDescription>
            <CardTitle className="text-2xl">{metric.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{metric.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: Integration["status"] }) {
  const Icon =
    status === "synced"
      ? CheckCircle2Icon
      : status === "syncing"
        ? CircleDashedIcon
        : status === "conflict"
          ? ShieldAlertIcon
          : AlertTriangleIcon;

  const label =
    status === "synced"
      ? "Healthy"
      : status === "syncing"
        ? "Syncing"
        : status === "conflict"
          ? "Needs Review"
          : "Failed";

  if (status === "conflict") {
    return (
      <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-500/8">
        <Icon data-icon="inline-start" />
        {label}
      </Badge>
    );
  }

  const variant = status === "error" ? "destructive" : status === "syncing" ? "outline" : "secondary";

  return (
    <Badge variant={variant}>
      <Icon data-icon="inline-start" />
      {label}
    </Badge>
  );
}

export function LinkButton({
  to,
  params,
  children,
  variant = "outline",
  className,
}: {
  to: string;
  params?: Record<string, string>;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  className?: string;
}) {
  return (
    <Link className={cn(buttonVariants({ variant }), className)} to={to} params={params as never}>
      {children}
    </Link>
  );
}

export function IntegrationLinkSet({
  integrationId,
  current,
}: {
  integrationId: ApplicationId;
  current: "overview" | "review" | "history";
}) {
  const links = [
    { key: "overview", label: "Overview", to: "/integration/$integrationId" },
    { key: "review", label: "Review queue", to: "/integration/$integrationId/review" },
    { key: "history", label: "History", to: "/integration/$integrationId/history" },
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.key}
          to={link.to}
          params={{ integrationId }}
          className={buttonVariants({ variant: current === link.key ? "secondary" : "outline" })}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function DataPoint({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/70 bg-muted/15 p-3">
      <span className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{label}</span>
      <span className={cn("text-sm font-medium", emphasis && "text-foreground")}>{value}</span>
    </div>
  );
}