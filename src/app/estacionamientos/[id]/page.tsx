import { EstacionamientoView } from "@/components/reserva/EstacionamientoView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EstacionamientoView id={id} />;
}
