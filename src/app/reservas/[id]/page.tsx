import { ReservaView } from "@/components/reservas/ReservaView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReservaView id={id} />;
}
