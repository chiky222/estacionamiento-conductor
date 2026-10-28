# Modelo de dominio · app del conductor

Tipos en `src/lib/conductor.types.ts`; las entidades del plano (galpón, piso, sector, plaza, tarifa, regla) son las del tablero y están en `src/lib/types.ts` (ver el DOMAIN_MODEL del tablero).

## Entidades

| Entidad | Qué es | Campos clave |
| --- | --- | --- |
| EstacionamientoResumen | Un estacionamiento en el mapa | `ubicacion`, `precioDesde`, `disponibilidad` (libres y total por clase de vehículo), `estado` (disponible, pocos, sold_out), `senaPct`, `servicios`, `evento`, `distancia` |
| EstacionamientoDetalle | Lo anterior + el plano | `plano` (galpón, pisos, sectores, objetos, `PlazaPublica` por id, `TarifaSector`), `toleranciaMin`, `reservaMaxHoras` |
| PlazaPublica | Plaza vista desde afuera | `estado`: libre, ocupada, no_disponible (reservada o bloqueada); `tipo`; `vehiculo` si está ocupada. Sin datos de otras personas |
| TarifaSector | Precio vigente de un sector | `modo` (hora, unica), `valor`, `base`, `fraccion`, `tope`, `reglas` aplicadas |
| Cotizacion | Precio de una reserva | `total`, `senaPct`, `sena`, `saldo`, `precio`, `reglas` |
| Reserva | Lugar reservado por un conductor | `codigo`, `plazaId`, `patente`, `vehiculo`, `desde`, `hasta`, `modalidad` (sena, total), `total`, `sena`, `pagado`, `saldo`, `estado`, `pago`, `retenidaHasta`, `reembolso` |
| MedioPago | Medio habilitado, resuelto por una pasarela | `id`, `pasarela`, `flujo` (redireccion, tarjeta, qr) |
| Pago | Intento de pago de una reserva | `reservaId`, `medioId`, `pasarela`, `estado` (pendiente, aprobado, rechazado), `monto`, `redirectUrl` |
| UsuarioSesion | Conductor logueado | `nombre`, `email`, `rol: conductor`, `patente` (la última usada) |

## Reglas

**Qué plazas puede elegir:** libres y de un sector donde entra su vehículo (moto < auto < camioneta: entra en su clase o una más grande). Las de otro tamaño se ven punteadas y no se pueden tocar.

**"Elegir por mí":** la libre más barata donde entra; a igual precio, una que no sea de movilidad reducida, en el piso más bajo y lo más cerca de la primera fila.

**Precio:** el del momento de llegada (reglas horarias y eventos del tablero), por fracciones con tope diario. Seña = `senaPct` % de esa estadía, redondeada a $10.

**Seña o total:**

| Modalidad | Paga ahora | Paga al salir | Si cancela antes de llegar |
| --- | --- | --- | --- |
| `sena` | la seña | total − seña (+ tiempo extra) | no se devuelve nada |
| `total` | el total | solo el tiempo extra | se devuelve total − seña |
| `sena` con `senaPct = 0` | nada | el total | sin costo |

Lo pagado online queda en `plaza.sena` del tablero, así el cobro de salida lo descuenta.

**Retención:** al crear la reserva la plaza queda reservada 10 minutos mientras paga. Si no se aprueba el pago a tiempo, la reserva vence y la plaza se libera.

**Tolerancia:** el lugar se guarda `toleranciaMin` después de la hora de llegada; después la reserva vence.

## Estados de una reserva

```
pendiente_pago ──pago aprobado──▶ confirmada ──llegada──▶ en_curso ──salida──▶ finalizada
pendiente_pago ──vence la retención──▶ vencida
pendiente_pago | confirmada ──cancelar (antes de llegar)──▶ cancelada
confirmada ──no llegó dentro de la tolerancia──▶ vencida
```
