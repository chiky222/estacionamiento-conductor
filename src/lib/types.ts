/**
 * Tipos del dominio del estacionamiento.
 * Reflejan lo que devuelve la API (ver docs/CONTRATO.md). El front nunca ve _id de Mongo,
 * solo el `id` propio de cada entidad.
 */

export type EstadoPlaza = "libre" | "ocupada" | "reservada" | "bloqueada";
export type TipoPlaza = "std" | "pmr" | "ev" | "moto";
export type TipoSector = "abonados" | "mixto" | "rotativo";
/** Clase de vehículo: define el tamaño de las plazas de un sector y qué puede entrar en cada una. */
export type ClaseVehiculo = "auto" | "camioneta" | "moto";
export type LadoPuerta = "izq" | "der" | "arr" | "aba";
export type ClavePuerta = "ent" | "sal";
/** "zona" = espacio del terreno donde no se puede estacionar (cedido, en obra…). */
export type TipoObjeto = "oficina" | "banos" | "rampa" | "carga" | "columna" | "zona";
export type ModoRegla = "pct" | "hora" | "unica";
export type TipoRegla = "horario" | "evento";
export type TipoMovimiento = "ingreso" | "cobro" | "egreso";

export interface Abono {
  /** Fecha ISO (YYYY-MM-DD) en que vence el abono. */
  vence: string;
  precio: number;
}

/** Precio que quedó fijado al momento del ingreso: si después cambia la tarifa, no afecta. */
export interface CobroFijado {
  modo: "hora" | "unica";
  valor: number;
  base: number;
  regla: string;
}

export interface Plaza {
  /** `<sector>-<fila>-<columna>`, ej. "B-1-2". */
  id: string;
  sectorId: string;
  fila: number;
  columna: number;
  estado: EstadoPlaza;
  tipo: TipoPlaza;
  /** Vehículo que está ocupando la plaza (se elige al ingresar). */
  vehiculo?: ClaseVehiculo;
  patente?: string;
  cliente?: string;
  /** Minuto del día (0-1439) en que ingresó el vehículo. */
  desde?: number;
  /** Minuto del día hasta el que se mantiene la reserva. */
  hasta?: number;
  motivo?: string;
  /** Marcada cuando el bloqueo vino de "cerrar sector", para poder reabrir solo esas. */
  cerradaPorSector?: boolean;
  abono?: Abono;
  cobro?: CobroFijado;
  /** Seña cobrada al reservar (en $). Se descuenta al cobrar la salida y no se devuelve si se libera. */
  sena?: number;
}

/** Nivel del edificio (planta baja, piso 1, subsuelo…). Todos comparten las medidas del galpón. */
export interface Piso {
  id: string;
  nombre: string;
  /** Orden de abajo hacia arriba (0 = el más bajo); define el orden de las pestañas. */
  orden: number;
}

export interface Sector {
  id: string;
  /** Piso donde está el sector. */
  pisoId: string;
  nombre: string;
  x: number;
  y: number;
  cols: number;
  rows: number;
  /** Ancho de plaza en metros. */
  bw: number;
  /** Largo de plaza en metros. */
  bl: number;
  /** true = plazas horizontales (autos acostados); false = verticales. */
  rot: boolean;
  /** Giro del sector entero en grados sobre su centro (0 = sin girar). */
  angulo?: number;
  /**
   * Inclinación de cada plaza dentro del sector, en grados (-85 a 85; 0 = sin inclinar): estacionamiento
   * en espiga. El sector queda derecho y su tamaño se calcula con la inclinación (ver geometriaSector).
   */
  espiga?: number;
  /** Separación libre entre plazas vecinas, en metros (0 a 2), entre columnas y entre filas. Sin valor = 0. */
  sep?: number;
  /** Para qué vehículo son las plazas. Sin valor: se deduce del tamaño (ver claseSector). */
  vehiculo?: ClaseVehiculo;
  tarifaId: string;
  tipo: TipoSector;
  color: number;
}

export interface Objeto {
  id: string;
  /** Piso donde está el objeto. */
  pisoId: string;
  tipo: TipoObjeto;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Puerta {
  lado: LadoPuerta;
  pos: number;
  /** Piso por el que se entra o sale. Si falta, el primero (el de menor `orden`). */
  pisoId?: string;
}

export interface Galpon {
  ancho: number;
  largo: number;
  puertas: Record<ClavePuerta, Puerta>;
}

export interface Tarifa {
  id: string;
  nombre: string;
  hora: number;
  fraccion: number;
  tope: number;
  mensual: number;
}

export interface Regla {
  id: string;
  tipo: TipoRegla;
  nombre: string;
  activa: boolean;
  sectores: string[];
  /** Solo reglas horarias. Vacío = todos los días. 0 = domingo. */
  dias: number[];
  /** Solo eventos: fecha ISO. */
  fecha?: string;
  desde: string;
  hasta: string;
  modo: ModoRegla;
  valor: number;
}

export interface Movimiento {
  id: string;
  minuto: number;
  tipo: TipoMovimiento;
  detalle: string;
  monto: number;
}

/** Configuración del estacionamiento que define el gestor. */
export interface Configuracion {
  /** % de la estadía reservada que se cobra como seña al reservar (0 a 100; 0 = sin seña). */
  senaPct: number;
}

export interface Turno {
  nombre: string;
  sede: string;
  cajaBase: number;
}

/** Todo lo que necesita el tablero en memoria. */
export interface DatosTablero {
  turno: Turno;
  galpon: Galpon;
  configuracion: Configuracion;
  /** Siempre hay al menos uno. */
  pisos: Piso[];
  sectores: Sector[];
  objetos: Objeto[];
  plazas: Record<string, Plaza>;
  tarifas: Tarifa[];
  reglas: Regla[];
  movimientos: Movimiento[];
}

/** Momento simulado: fecha y minuto del día. */
export interface Momento {
  fecha: string;
  dow: number;
  minuto: number;
}

export type Seleccion =
  | { tipo: "plaza"; id: string }
  | { tipo: "sector"; id: string }
  | { tipo: "objeto"; id: string }
  | { tipo: "puerta"; id: ClavePuerta };

export type Capa = "estado" | "tarifa" | "contrato" | "permanencia";
export type Vista = "plano" | "tarifas";
