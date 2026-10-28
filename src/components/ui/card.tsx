import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"section">) {
  return <section data-slot="card" className={cn("min-w-0 rounded-[24px] border border-line bg-surface-raised p-4 text-ink shadow-e1", className)} {...props} />;
}

export { Card };
