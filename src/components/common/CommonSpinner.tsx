import { cn } from "@/lib/utils";

/** Indicador de carga: un aro que gira con el color del texto. */
export function CommonSpinner({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block size-4 flex-none animate-spin rounded-full border-2 border-current border-t-transparent", className)} />;
}
