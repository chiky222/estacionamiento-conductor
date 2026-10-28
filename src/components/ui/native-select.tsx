import * as React from "react";
import { cn } from "@/lib/utils";

/** Select nativo con el estilo de los campos: accesible y liviano para formularios densos. */
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-10 w-full min-w-0 rounded-[10px] border-[1.5px] border-line-strong bg-surface-raised px-2.5 text-[15px] text-ink outline-none focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_var(--brand-soft)] disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
