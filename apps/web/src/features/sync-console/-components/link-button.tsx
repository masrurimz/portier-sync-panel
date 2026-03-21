import * as React from "react";

import { buttonVariants } from "@portier-sync/ui/components/button";
import { cn } from "@portier-sync/ui/lib/utils";
import { Link } from "@tanstack/react-router";

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
