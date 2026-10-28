import type { Capa, ClaseVehiculo, LadoPuerta, ModoRegla, TipoObjeto, TipoPlaza, TipoSector } from "@/lib/types";

/** Píxeles por metro en el plano y margen alrededor del galpón. */
export const ESCALA = 20;
export const MARGEN = 46;
export const CANT_COLORES = 6;
export const MINUTO_INICIAL = 1170;
/** Letras de sector: con varios pisos hacen falta más que 16. */
export const LETRAS_SECTOR = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const LIMITES_SECTOR = {
  cols: [1, 40],
  rows: [1, 16],
  bw: [0.8, 6],
  bl: [1.5, 8],
  sep: [0, 2],
} as const;

export const LIMITES_GALPON = { ancho: [10, 150], largo: [8, 120] } as const;

export const TIPOS_SECTOR: { value: TipoSector; label: string }[] = [
  { value: "abonados", label: "Solo abonados" },
  { value: "mixto", label: "Mixto" },
  { value: "rotativo", label: "Rotativo" },
];

/**
 * Única definición de las clases de vehículo: medida de plaza que se propone al elegirla (en metros)
 * y `orden` de tamaño. Un vehículo entra en una plaza de su clase o de una más grande (ver vehiculosPermitidos).
 */
export const CLASES_VEHICULO: { value: ClaseVehiculo; label: string; plural: string; bw: number; bl: number; orden: number }[] = [
  { value: "auto", label: "Auto", plural: "Autos", bw: 2.5, bl: 5, orden: 1 },
  { value: "camioneta", label: "Camioneta", plural: "Camionetas", bw: 3, bl: 5.5, orden: 2 },
  { value: "moto", label: "Moto", plural: "Motos", bw: 1.2, bl: 2.5, orden: 0 },
];

/** Datos de una clase de vehículo. */
export const claseVehiculo = (v: ClaseVehiculo) => CLASES_VEHICULO.find((c) => c.value === v) ?? CLASES_VEHICULO[0];

/**
 * Cómo se orientan las plazas de un sector:
 * - vertical / horizontal: grilla derecha con los vehículos parados o acostados.
 * - rotado: el sector entero gira sobre su centro (campo `angulo`).
 * - espiga: el sector queda derecho y cada plaza se inclina adentro (campo `espiga`).
 */
export type Orientacion = "vertical" | "horizontal" | "rotado" | "espiga";
export const ORIENTACIONES: { value: Orientacion; label: string }[] = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
  { value: "rotado", label: "Girado (sector entero)" },
  { value: "espiga", label: "En espiga (plazas inclinadas)" },
];

export const TIPOS_PLAZA: { value: TipoPlaza; label: string; corto: string }[] = [
  { value: "std", label: "Estándar", corto: "plaza estándar" },
  { value: "pmr", label: "Movilidad reducida", corto: "movilidad reducida" },
  { value: "ev", label: "Carga eléctrica", corto: "carga eléctrica" },
  { value: "moto", label: "Moto", corto: "moto" },
];

export const LADOS_PUERTA: { value: LadoPuerta; label: string }[] = [
  { value: "izq", label: "Izquierda" },
  { value: "der", label: "Derecha" },
  { value: "arr", label: "Superior" },
  { value: "aba", label: "Inferior" },
];

export const OBJETOS_DISPONIBLES: Record<TipoObjeto, { label: string; w: number; h: number }> = {
  oficina: { label: "Oficina", w: 6, h: 4 },
  banos: { label: "Baños", w: 4, h: 4 },
  rampa: { label: "Rampa", w: 5, h: 4 },
  carga: { label: "Zona de carga", w: 8, h: 4 },
  columna: { label: "Columna", w: 1, h: 1 },
  zona: { label: "Zona no utilizable", w: 10, h: 8 },
};

export const MODOS_REGLA: { value: ModoRegla; label: string; unidad: string }[] = [
  { value: "pct", label: "Recargo o descuento %", unidad: "%" },
  { value: "hora", label: "Tarifa por hora fija", unidad: "$ por hora" },
  { value: "unica", label: "Precio único por ingreso", unidad: "$ por ingreso" },
];

export const CAPAS: { value: Capa; label: string }[] = [
  { value: "estado", label: "Estado" },
  { value: "tarifa", label: "Tarifa" },
  { value: "contrato", label: "Contrato" },
  { value: "permanencia", label: "Permanencia" },
];

/** Orden lunes a domingo para los chips de días. */
export const DIAS_CHIPS: { dow: number; corto: string }[] = [
  { dow: 1, corto: "L" },
  { dow: 2, corto: "M" },
  { dow: 3, corto: "X" },
  { dow: 4, corto: "J" },
  { dow: 5, corto: "V" },
  { dow: 6, corto: "S" },
  { dow: 0, corto: "D" },
];

/** Token CSS del color de un sector. */
export const colorSector = (c: number) => `var(--sector-${((c % CANT_COLORES) + CANT_COLORES) % CANT_COLORES})`;
