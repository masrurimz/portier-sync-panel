import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import { cn } from "@portier-sync/ui/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-input bg-background/65 px-3 py-2 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-[background-color,border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-primary/55 focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/40 disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/20 dark:disabled:bg-input/55",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
