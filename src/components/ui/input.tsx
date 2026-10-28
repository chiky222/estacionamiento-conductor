import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[10px] border-[1.5px] border-line-strong bg-surface-raised px-3 text-[15px] text-ink outline-none placeholder:text-ink-muted focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_var(--brand-soft)] disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
