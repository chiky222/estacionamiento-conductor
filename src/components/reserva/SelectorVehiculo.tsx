"use client";

import type { ClaseVehiculo } from "@/lib/types";
import { CommonSegmented } from "@/components/common/CommonSegmented";
import { useReserva } from "@/contexts/ReservaContext";

const OPCIONES: { value: ClaseVehiculo; label: string; icon: "auto" | "camioneta" | "moto" }[] = [
  { value: "auto", label: "Auto", icon: "auto" },
  { value: "camioneta", label: "Camioneta", icon: "camioneta" },
  { value: "moto", label: "Moto", icon: "moto" },
];

/** Qué vehículo lleva: define en qué plazas entra y qué disponibilidad se muestra. */
export function SelectorVehiculo() {
  const { vehiculo, setVehiculo } = useReserva();
  return <CommonSegmented ariaLabel="Vehículo" options={OPCIONES} value={vehiculo} onChange={setVehiculo} />;
}
