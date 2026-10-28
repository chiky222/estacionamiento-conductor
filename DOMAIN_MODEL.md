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
| UsuarioSesion | Conductor logueado | `nombre`, `email`, `rol: conductor`, `patente` (la última usada), `abonado` (tiene abono donde se puede ceder) |
| MiAbono | Abono mensual del conductor | `estacionamiento`, `plazaId`, `plazaEtiqueta`, `vence`, `precio`, `credito`, `pctAbonado`, `cesiones` |
| CesionAbono | Franja en que cede su lugar | `desde`, `hasta` (ISO, mismo día), `estado` (proxima, en_curso, terminada), `reservas`, `cobrado`, `ganado` |

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

## Subalquiler de abonos ("Mi abono")

Lo habilita el gestor (`configuracion.subalquiler` del tablero; ver su DOMAIN_MODEL). Deshabilitado, no aparece nada.

- **Ceder:** el abonado elige día (hoy a 7 días) y horario. Franjas de un solo día, sin pisarse y que no hayan terminado.
- **Quién lo ve libre:** en el plano, un lugar de abonado aparece libre (con una marca chica de abono) solo si una cesión cubre **todo** el horario buscado (`desde`-`hasta`), el abonado no está adentro si la franja ya empezó y no hay otra reserva de la app que se pise. Si cambia el horario y deja de cubrirlo, el lugar se suelta.
- **Reservar:** igual que cualquier lugar. La cotización trae `cedidoHasta` y el resumen avisa que es de un abonado y que hay que salir antes de esa hora. Cotización y `POST /api/reservas` validan la franja (409 `FUERA_DE_CESION`).
- **No toca la plaza del abonado:** la reserva queda en la cesión (`cesionId`), sin cambiar el estado de la plaza ni guardar `plaza.sena`.
- **Crédito del abonado:** `pctAbonado` % de lo efectivamente cobrado. Al aprobar el pago suma su parte de lo pagado; si se cancela con reembolso, queda solo su parte de lo retenido (la seña). El saldo que se cobra al salir lo suma el tablero (ver `cobro`).
- **Quitar una franja:** solo si no tiene reservas ni nada cobrado (409 `CESION_CON_RESERVAS`).

## Estados de una reserva

```
pendiente_pago ──pago aprobado──▶ confirmada ──llegada──▶ en_curso ──salida──▶ finalizada
pendiente_pago ──vence la retención──▶ vencida
pendiente_pago | confirmada ──cancelar (antes de llegar)──▶ cancelada
confirmada ──no llegó dentro de la tolerancia──▶ vencida
```
