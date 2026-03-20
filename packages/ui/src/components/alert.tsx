import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@portier-sync/ui/lib/utils";

const alertVariants = cva(
  "group/alert relative grid w-full gap-1 rounded-2xl border px-4 py-3 text-left text-xs shadow-[0_12px_28px_rgba(0,0,0,0.16)] has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-20 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:mt-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4.5",
  {
    variants: {
      variant: {
        default: "border-border/80 bg-card/90 text-card-foreground",
        destructive: "border-destructive/35 bg-destructive/10 text-destructive *:data-[slot=alert-description]:text-destructive/85",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-semibold tracking-tight group-has-[>svg]/alert:col-start-2", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-xs/relaxed text-balance text-muted-foreground group-has-[>svg]/alert:col-start-2", className)}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-action" className={cn("absolute top-3 right-3", className)} {...props} />;
}

export { Alert, AlertAction, AlertDescription, AlertTitle };
