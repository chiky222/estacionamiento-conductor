/**
 * Tipos de la app del conductor (quien busca dónde estacionar).
 * Reflejan lo que devuelve la API pública (ver docs/CONTRATO.md). Los tipos del plano
 * (Galpon, Piso, Sector, Objeto…) son los mismos del tablero del gestor y viven en lib/types.ts.
 */
import type { ClaseVehiculo, Galpon, Objeto, Piso, Sector, TipoPlaza } from "@/lib/types";

export interface Ubicacion {
  lat: number;
  lng: number;
}

/** Estado del estacionamiento para el vehículo buscado. "pocos" = 10 % o menos de lugares libres. */
export type EstadoDisponibilidad = "disponible" | "pocos" | "sold_out";

export type Servicio = "techado" | "24h" | "pmr" | "ev" | "seguridad" | "lavado";

export interface DisponibilidadClase {
  libres: number;
  total: number;
}

/** Lo que muestra el mapa y la lista: sin el plano, para que la búsqueda sea liviana. */
export interface EstacionamientoResumen {
  id: string;
  nombre: string;
  direccion: string;
  barrio: string;
  ubicacion: Ubicacion;
  /** Texto del horario ("Abierto 24 h", "07:00 a 23:00"). */
  horario: string;
  abierto: boolean;
  /** Precio vigente más bajo entre los sectores donde entra el vehículo buscado. */
  precioDesde: { modo: "hora" | "unica"; valor: number };
  /** Lugares libres ahora por clase de vehículo (un auto entra también en plazas de camioneta). */
  disponibilidad: Record<ClaseVehiculo, DisponibilidadClase>;
  /** Estado para el vehículo buscado (el del filtro `vehiculo`). */
  estado: EstadoDisponibilidad;
  /** % de seña que definió el gestor (0 = se reserva sin seña). */
  senaPct: number;
  servicios: Servicio[];
  calificacion?: number;
  /** Evento que está cambiando el precio ahora (ej. "Show en el estadio"). */
  evento?: string;
  /** Metros hasta el punto de búsqueda, si se mandó lat/lng. */
  distancia?: number;
}

/** Una plaza vista por el conductor: sin patente, cliente ni horarios de nadie. */
export interface PlazaPublica {
  id: string;
  sectorId: string;
  fila: number;
  columna: number;
  /** "no_disponible" = reservada o fuera de servicio (el conductor no necesita saber cuál). */
  estado: "libre" | "ocupada" | "no_disponible";
  tipo: TipoPlaza;
  /** Solo si está ocupada, para dibujar el vehículo en el plano. */
  vehiculo?: ClaseVehiculo;
}

/** Precio vigente de un sector, ya con reglas y eventos aplicados. */
export interface TarifaSector {
  sectorId: string;
  nombre: string;
  modo: "hora" | "unica";
  valor: number;
  /** Precio por hora sin reglas (para mostrar tachado si hay recargo o descuento). */
  base: number;
  /** Minutos de cada fracción. */
  fraccion: number;
  /** Tope diario en $ (0 = sin tope). */
  tope: number;
  /** Nombres de las reglas o eventos aplicados. */
  reglas: string[];
}

export interface PlanoPublico {
  galpon: Galpon;
  pisos: Piso[];
  sectores: Sector[];
  objetos: Objeto[];
  plazas: Record<string, PlazaPublica>;
  tarifas: TarifaSector[];
}

export interface EstacionamientoDetalle extends EstacionamientoResumen {
  telefono?: string;
  /** Minutos que se guarda el lugar después de la hora de llegada. */
  toleranciaMin: number;
  /** Máximo de horas que se pueden reservar de una vez. */
  reservaMaxHoras: number;
  plano: PlanoPublico;
}

/** Cómo se paga: la seña al reservar (el resto al salir) o todo por adelantado. */
export type ModalidadPago = "sena" | "total";

export interface Cotizacion {
  plazaId: string;
  /** ISO 8601. */
  desde: string;
  hasta: string;
  minutos: number;
  precio: { modo: "hora" | "unica"; valor: number };
  reglas: string[];
  /** Costo de la estadía reservada. */
  total: number;
  senaPct: number;
  /** Seña a pagar si reserva (redondeada a $10). */
  sena: number;
  /** Lo que queda para pagar al salir si paga solo la seña. */
  saldo: number;
}

/** Cómo se completa el pago con cada medio. */
export type FlujoPago = "redireccion" | "tarjeta" | "qr";

/** Un medio de pago que ofrece el back. Cada uno lo resuelve una pasarela del factory (mercadopago, payway, modo…). */
export interface MedioPago {
  id: string;
  pasarela: string;
  nombre: string;
  descripcion: string;
  flujo: FlujoPago;
  /** Marcas aceptadas, para los medios con tarjeta. */
  marcas?: string[];
}

export type EstadoPago = "pendiente" | "aprobado" | "rechazado";

export interface Pago {
  id: string;
  reservaId: string;
  medioId: string;
  pasarela: string;
  estado: EstadoPago;
  monto: number;
  /** Adónde mandar al conductor para pagar (Checkout Pro de Mercado Pago, MODO…). */
  redirectUrl?: string;
}

export type EstadoReserva = "pendiente_pago" | "confirmada" | "en_curso" | "finalizada" | "cancelada" | "vencida";

export interface Reserva {
  id: string;
  /** Código corto que se muestra en la entrada (y va en el QR). */
  codigo: string;
  estacionamiento: Pick<EstacionamientoResumen, "id" | "nombre" | "direccion" | "ubicacion">;
  plazaId: string;
  /** "B-03". */
  plazaEtiqueta: string;
  sectorNombre: string;
  pisoNombre: string;
  vehiculo: ClaseVehiculo;
  patente: string;
  desde: string;
  hasta: string;
  toleranciaMin: number;
  modalidad: ModalidadPago;
  total: number;
  /** Seña de la reserva según el % del gestor (con "total" igual se calcula: es lo que no se devuelve si cancela). */
  sena: number;
  /** Lo que ya pagó online. */
  pagado: number;
  /** Si se canceló: lo que se devuelve (lo pagado menos la seña, que no se devuelve). */
  reembolso?: number;
  /** Lo que falta pagar al salir (sin contar tiempo extra). */
  saldo: number;
  estado: EstadoReserva;
  pago?: Pago;
  /** Mientras el pago está pendiente, el lugar se retiene hasta esta hora (ISO). */
  retenidaHasta?: string;
  creadaEn: string;
}

export interface NuevaReserva {
  estacionamientoId: string;
  plazaId: string;
  vehiculo: ClaseVehiculo;
  patente: string;
  desde: string;
  hasta: string;
  modalidad: ModalidadPago;
  /** Sin medio cuando no hay nada que pagar (seña 0). */
  medioPagoId?: string;
  /** Token de la tarjeta que devuelve el SDK de la pasarela: los datos de la tarjeta nunca pasan por nuestro back. */
  tokenTarjeta?: string;
  cuotas?: number;
}

export interface UsuarioSesion {
  id: string;
  nombre: string;
  email: string;
  rol: "conductor";
  /** Última patente usada, para completar el checkout. */
  patente?: string;
}
