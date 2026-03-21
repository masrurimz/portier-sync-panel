import * as React from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portier-sync/ui/components/card";

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
