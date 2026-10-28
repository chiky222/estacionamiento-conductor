import { cn } from "@/lib/utils";

const TAMANOS = {
  sm: { banda: "text-[5px] leading-[7px]", num: "px-[7px] pb-px text-[13px] leading-[17px]" },
  md: { banda: "text-[7px] leading-[10px]", num: "px-2.5 pb-0.5 text-[17px] leading-[22px]" },
  lg: { banda: "text-[9px] leading-[13px]", num: "px-4 pt-0.5 pb-1 text-[26px] leading-[34px]" },
};

/** Patente física (igual en claro y oscuro): franja azul y caracteres en mono. Llega ya normalizada ("AE 482 KD"). */
export function CommonLicensePlate({ value, size = "md", className }: { value: string; size?: keyof typeof TAMANOS; className?: string }) {
  const t = TAMANOS[size];
  return (
    <span
      aria-label={`Patente ${value}`}
      className={cn("inline-flex flex-none flex-col overflow-hidden rounded-[6px] border-[1.5px] shadow-[0_1px_0_rgba(0,0,0,.08)]", className)}
      style={{ background: "var(--plate-bg)", borderColor: "var(--plate-ink)" }}
    >
      <span className={cn("px-1.5 pt-px text-center font-bold tracking-[.18em] text-white", t.banda)} style={{ background: "var(--plate-band)" }}>
        ARGENTINA
      </span>
      <span className={cn("text-center font-mono font-semibold tracking-[.06em] whitespace-nowrap", t.num)} style={{ color: "var(--plate-ink)" }}>
        {value.toUpperCase()}
      </span>
    </span>
  );
}

