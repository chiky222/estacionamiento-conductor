/**
 * Errores de la API. El back responde siempre con `code` estable y `requestId`;
 * acá se traduce el `code` a un mensaje en español (nunca se usa el texto del back).
 */

export const MENSAJES_ERROR: Record<string, string> = {
  INVALID_ARGUMENT: "Revisá los datos ingresados.",
  UNAUTHENTICATED: "Tu sesión expiró. Volvé a ingresar.",
  FORBIDDEN: "No tenés permiso para hacer esto.",
  NOT_FOUND: "No encontramos lo que buscabas.",
  NETWORK_ERROR: "No pudimos conectar con el servidor.",
  PATENTE_INVALIDA: "Ingresá una patente válida.",
  VEHICULO_NO_ENTRA: "Ese vehículo no entra en esta plaza: elegí un sector para vehículos más grandes.",
  PLAZA_NO_LIBRE: "La plaza ya no está libre.",
  PLAZA_NO_OCUPADA: "La plaza no tiene un vehículo adentro.",
  PLAZA_NO_RESERVADA: "La plaza no está reservada.",
  PLAZA_SIN_ABONO: "La plaza no tiene un abono asignado.",
  ABONO_INCOMPLETO: "Completá patente y cliente para asignar el abono.",
  EMAIL_INVALIDO: "Ingresá un email válido para el abonado.",
  INVITACION_VENCIDA: "La invitación venció. Pedile al estacionamiento que te la reenvíe.",
  ABONO_VINCULADO: "El abonado ya tiene la cuenta vinculada.",
  INHABILITAR_SOLO_LIBRE: "Solo se puede inhabilitar una plaza libre.",
  LIMITE_SECTORES: "Llegaste al máximo de sectores.",
  ULTIMO_PISO: "Tiene que quedar al menos un piso.",
  PISO_NO_VACIO: "Para eliminar el piso, primero sacá sus sectores y objetos.",
  TARIFA_EN_USO: "El tarifario está en uso por un sector.",
  ULTIMA_TARIFA: "Tiene que quedar al menos un tarifario.",
  // App del conductor
  PLAZA_NO_DISPONIBLE: "Ese lugar se acaba de ocupar. Elegí otro en el plano.",
  SOLD_OUT: "El estacionamiento se llenó. Probá con otro cercano.",
  ESTACIONAMIENTO_CERRADO: "El estacionamiento está cerrado en ese horario.",
  HORARIO_INVALIDO: "Revisá la hora de llegada y la duración.",
  MEDIO_PAGO_INVALIDO: "Elegí un medio de pago.",
  PAGO_RECHAZADO: "El pago fue rechazado. Probá con otro medio.",
  PAGO_YA_PROCESADO: "Este pago ya se procesó.",
  RESERVA_NO_CANCELABLE: "Esta reserva ya no se puede cancelar.",
  RESERVA_VENCIDA: "El tiempo para pagar venció y el lugar se liberó.",
  // Subalquiler de abonos
  SUBALQUILER_DESHABILITADO: "Este estacionamiento no permite ceder el lugar del abono.",
  CESION_INVALIDA: "Revisá el día y el horario: el fin tiene que ser después del inicio y en el mismo día.",
  CESION_SUPERPUESTA: "Ya cediste tu lugar en parte de ese horario.",
  CESION_CON_RESERVAS: "Alguien ya reservó tu lugar en ese horario: no se puede quitar.",
  PLAZA_CEDIDA: "Tu lugar lo está usando otro vehículo durante la cesión.",
  FUERA_DE_CESION: "Ese lugar es de un abonado y está libre en otro horario: acortá la estadía o elegí otro lugar.",
  INTERNAL_ERROR: "Algo salió mal. Probá de nuevo.",
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public requestId?: string,
  ) {
    super(MENSAJES_ERROR[code] ?? MENSAJES_ERROR.INTERNAL_ERROR);
    this.name = "ApiError";
  }
}

export const mensajeDeError = (e: unknown) =>
  e instanceof ApiError ? e.message : MENSAJES_ERROR.INTERNAL_ERROR;
