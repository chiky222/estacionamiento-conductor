import { CommonSpinner } from "@/components/common/CommonSpinner";

export function CommonLoading({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center gap-2 text-ink-muted">
      <CommonSpinner className="size-5 text-brand" />
      {texto}
    </div>
  );
}
