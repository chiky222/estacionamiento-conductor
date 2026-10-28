import { cn } from "@/lib/utils";
import { CommonIcon } from "@/components/common/CommonIcon";

/** Referencias del plano: forma y color, nunca solo color. */
export function LeyendaPlano() {
  const item = (muestra: React.ReactNode, texto: string) => (
    <span className="inline-flex items-center gap-1.5">
      {muestra}
      {texto}
    </span>
  );
  const caja = "grid size-5 place-items-center rounded-[5px] border-[1.5px] text-[10px] font-bold";
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-ink-muted">
      {item(<span className={cn(caja, "border-brand bg-brand-soft font-display text-brand-strong")}>E</span>, "Libre: tocalo para elegirlo")}
      {item(<span className={cn(caja, "border-brand-strong bg-brand text-on-brand")}><CommonIcon name="check" size={12} strokeWidth={3} /></span>, "Tu lugar")}
      {item(<span className={cn(caja, "border-line-strong bg-surface-sunken")} />, "Ocupado")}
      {item(<span className={cn(caja, "border-blocked bg-[repeating-linear-gradient(45deg,var(--surface-sunken)_0_3px,var(--line)_3px_6px)]")} />, "No disponible")}
      {item(<span className={cn(caja, "border-dashed border-line-strong bg-surface-sunken opacity-60")} />, "No entra tu vehículo")}
      {item(
        <span className="grid size-5 place-items-center rounded-full bg-amber text-on-amber">
          <CommonIcon name="abono" size={12} strokeWidth={2.5} />
        </span>,
        "Lugar de un abonado, libre en tu horario",
      )}
    </div>
  );
}
