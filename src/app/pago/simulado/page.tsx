import { Suspense } from "react";
import { PagoSimuladoView } from "@/components/reservas/PagoSimuladoView";

export default function Page() {
  return (
    <Suspense>
      <PagoSimuladoView />
    </Suspense>
  );
}
