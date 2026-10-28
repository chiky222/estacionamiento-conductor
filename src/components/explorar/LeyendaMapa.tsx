import { cn } from "@/lib/utils";

/** Qué significa el color de cada pin. */
export function LeyendaMapa({ className }: { className?: string }) {
  const item = (clase: string, texto: string) => (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-3 rounded-full border-2 border-surface-raised shadow-e1", clase)} />
      {texto}
    </span>
  );
  return (
    <div className={cn("flex gap-3 rounded-full bg-surface-glass px-3 py-1.5 text-xs font-semibold text-ink shadow-e1 backdrop-blur", className)}>
      {item("bg-brand", "Hay lugar")}
      {item("bg-amber", "Últimos")}
      {item("bg-surface-sunken", "Sold-out")}
    </div>
  );
}
