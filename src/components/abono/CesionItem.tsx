import type { CesionAbono } from "@/lib/conductor.types";
import { ars, plural } from "@/lib/format";
import { ESTADOS_CESION, diaDe, horaDe } from "@/lib/conductor";
import { CommonButton } from "@/components/common/CommonButton";
import { CommonPill } from "@/components/common/CommonPill";

/** Una franja cedida: cuándo, en qué estado está, cuántos la reservaron y cuánto le dejó al abonado. */
export function CesionItem({ cesion: c, quitando, onQuitar }: { cesion: CesionAbono; quitando: boolean; onQuitar: () => void }) {
  const e = ESTADOS_CESION[c.estado];
  return (
    <li className="flex items-center gap-3 rounded-[16px] bg-surface-sunken px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold first-letter:uppercase">
          {diaDe(c.desde)} <span className="font-mono text-sm tabular">{horaDe(c.desde)} a {horaDe(c.hasta)}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted">
          <CommonPill tone={e.tone} icon={e.icon} size="sm">
            {e.label}
          </CommonPill>
          {c.reservas > 0 && <span>{plural(c.reservas, "reserva", "reservas")}</span>}
          {c.ganado > 0 && <span className="font-semibold text-brand-strong tabular">Ganaste {ars(c.ganado)}</span>}
        </div>
      </div>
      {/* Con reservas (o algo ya cobrado) no se puede retirar: alguien pagó por ese horario. */}
      {c.estado === "proxima" && c.reservas === 0 && c.cobrado === 0 && (
        <CommonButton size="sm" color="ghost" icon="borrar" loading={quitando} onClick={onQuitar}>
          Quitar
        </CommonButton>
      )}
    </li>
  );
}
