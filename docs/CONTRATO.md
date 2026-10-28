# Contrato de la API · app del conductor

Lo que necesita del back la app de quien busca dónde estacionar (`Estacionamiento-conductor`, puerto 3002). Complementa el contrato del tablero del gestor (`estacionamiento-front/docs/CONTRATO.md`): mismas entidades de plano (galpón, pisos, sectores, plazas, tarifas, reglas) y mismas reglas de precio (`src/lib/tarifas.ts`, copiado tal cual del tablero).

Base: `/api`. JSON en ambos sentidos. Autenticación por cookie httpOnly firmada (el front manda `credentials: "include"`).

**Éxito:** `{ "data": <payload> }`. **Error:** `{ "code": "PLAZA_NO_DISPONIBLE", "message": "...", "requestId": "..." }` con el status HTTP correspondiente. El front traduce por `code` (`src/lib/errors.ts`), nunca por `message`.

Fechas y horas: **ISO 8601** (a diferencia del tablero, que usa minuto del día por su reloj de simulación). El back convierte cuando toca el tablero (ver "Relación con el tablero del gestor").

Tipos: `src/lib/conductor.types.ts` (los de esta app) y `src/lib/types.ts` (los del plano, compartidos con el tablero).

## Multi-estacionamiento

El tablero del gestor hoy maneja un solo galpón. La app del conductor ve **todos** los estacionamientos que usan la plataforma, así que el back necesita la entidad `Estacionamiento` como dueña de todo lo demás:

| Campo | Qué es |
| --- | --- |
| `id` | UUID propio (o slug), nunca `_id` |
| `nombre`, `direccion`, `barrio` | Datos públicos |
| `ubicacion` | `{ lat, lng }`. Índice `2dsphere` para buscar por cercanía |
| `abre`, `cierra` | Minuto del día; sin valores = 24 h |
| `servicios` | `techado`, `24h`, `pmr`, `ev`, `seguridad`, `lavado` |
| `toleranciaMin` | Minutos que se guarda el lugar después de la hora de llegada |
| `reservaMaxHoras` | Máximo de horas por reserva |
| `mediosPago` | Ids de los medios que habilitó el gestor (`mercadopago`, `tarjeta`, `modo`…) |
| `configuracion.senaPct` | El mismo % de seña del tablero (`PATCH /api/configuracion`) |
| `calificacion`, `telefono` | Opcionales |

Galpón, pisos, sectores, objetos, plazas, tarifas, reglas y movimientos pasan a tener `estacionamientoId`. Los endpoints del tablero quedan igual, scopeados al estacionamiento del gestor logueado.

## Públicos (sin login)

### GET `/api/publico/estacionamientos`

Búsqueda para el mapa y la lista.

| Query | Qué es |
| --- | --- |
| `vehiculo` | `auto` (por defecto), `camioneta` o `moto` |
| `lat`, `lng` | Punto de búsqueda (si falta, el centro por defecto) |
| `radio` | Metros (por defecto 5000) |
| `conLugar` | `1` = sacar los que están en Sold-out |

Respuesta: `EstacionamientoResumen[]`, ordenados por distancia **con los Sold-out al final**. No se devuelven los que no tienen plazas para ese vehículo (una guardería de motos cuando se busca auto).

```jsonc
{
  "id": "galpon-central",
  "nombre": "Galpón Central",
  "direccion": "Av. Córdoba 5230",
  "barrio": "Palermo",
  "ubicacion": { "lat": -34.5912, "lng": -58.4347 },
  "horario": "Abierto 24 h",
  "abierto": true,
  "precioDesde": { "modo": "hora", "valor": 2000 },   // el más barato vigente donde entra el vehículo
  "disponibilidad": {                                  // libres ahora por clase
    "auto": { "libres": 29, "total": 58 },
    "camioneta": { "libres": 3, "total": 8 },
    "moto": { "libres": 8, "total": 20 }
  },
  "estado": "disponible",                              // para el vehículo pedido
  "senaPct": 20,
  "servicios": ["techado", "24h", "pmr", "ev", "seguridad"],
  "calificacion": 4.7,
  "evento": "Show en el estadio · general",           // opcional: evento que cambia el precio ahora
  "distancia": 500                                     // metros al punto de búsqueda
}
```

Reglas:

- **Disponibilidad por clase:** un vehículo entra en plazas de su clase o de una más grande (moto < auto < camioneta), igual que `VEHICULO_NO_ENTRA` del tablero. Las plazas `bloqueada` no cuentan en `total`; `reservada` y `ocupada` cuentan en `total` pero no en `libres`.
- **`estado`:** `sold_out` si no hay libres (o está cerrado ahora), `pocos` si quedan 10 % o menos (mismo umbral que la alerta del tablero), si no `disponible`.
- **`precioDesde`:** `tarifaEn(...)` de cada sector apto en el momento actual; el menor.

### GET `/api/publico/estacionamientos/:id`

Detalle con el plano para elegir lugar.

| Query | Qué es |
| --- | --- |
| `vehiculo` | Para calcular `estado` y `precioDesde` |
| `desde` | ISO de llegada: las tarifas del plano se calculan para ese momento (reglas horarias y eventos). Sin valor, ahora |

Respuesta: `EstacionamientoDetalle` = `EstacionamientoResumen` + `telefono`, `toleranciaMin`, `reservaMaxHoras` y `plano`:

```jsonc
"plano": {
  "galpon": { ... },            // igual que en el tablero
  "pisos": [ ... ],
  "sectores": [ ... ],          // igual que en el tablero (geometría, vehiculo, tarifaId…)
  "objetos": [ ... ],
  "plazas": {                   // PlazaPublica por id
    "B-1-2": { "id": "B-1-2", "sectorId": "B", "fila": 1, "columna": 2, "tipo": "std", "estado": "libre" },
    "B-0-1": { "id": "B-0-1", "sectorId": "B", "fila": 0, "columna": 1, "tipo": "std", "estado": "ocupada", "vehiculo": "auto" }
  },
  "tarifas": [                  // TarifaSector: precio vigente por sector
    { "sectorId": "B", "nombre": "Rotativo sur", "modo": "unica", "valor": 9000, "base": 2000, "fraccion": 30, "tope": 14000, "reglas": ["Show en el estadio · general"] }
  ]
}
```

**Privacidad:** `PlazaPublica` no lleva patente, cliente, `desde`, `hasta`, abono, cobro ni seña. `estado` se reduce a `libre`, `ocupada` o `no_disponible` (reservada o bloqueada). Tampoco se mandan movimientos, turno ni caja.

### POST `/api/publico/estacionamientos/:id/cotizacion`

Precio de una reserva antes de pagar. **El precio lo calcula siempre el back**; el front solo lo muestra.

Body: `{ plazaId, vehiculo, desde, hasta }`.

Respuesta `Cotizacion`:

```jsonc
{
  "plazaId": "B-1-0",
  "desde": "2026-10-28T18:15:00.000Z",
  "hasta": "2026-10-28T21:15:00.000Z",
  "minutos": 180,
  "precio": { "modo": "hora", "valor": 2000 },
  "reglas": [],
  "total": 6000,        // costoEntre(tarifa, tarifaEn(llegada), llegada, llegada + minutos)
  "senaPct": 20,
  "sena": 1200,         // senaDeReserva(...) redondeada a $10
  "saldo": 4800         // total − seña
}
```

Cálculo (igual que el tablero): precio vigente **a la hora de llegada** (`tarifaEn`), por fracciones con tope diario (`costoEstadia`), seña = `senaPct` % redondeado a $10 (`senaDeReserva`).

Errores: 400 `HORARIO_INVALIDO` (menos de 30 min, más de `reservaMaxHoras`, llegada pasada o a más de 24 h), 409 `ESTACIONAMIENTO_CERRADO`, 409 `VEHICULO_NO_ENTRA`, 404 `NOT_FOUND`.

## Sesión del conductor

Passport local + Google, JWT en cookie httpOnly firmada, rol `conductor` (distinto del rol del gestor). En development sin cookie, `DEV_USER_EMAIL` como en el resto del back.

| Método | Ruta | Body | Respuesta |
| --- | --- | --- | --- |
| GET | `/api/sesion/actual` | — | `UsuarioSesion` o `null` (200, **no** 401: la app se usa sin login) |
| POST | `/api/sesion/login` | `{ email, password }` | `UsuarioSesion`. 401 `UNAUTHENTICATED` si no coincide |
| POST | `/api/sesion/registro` | `{ nombre, email, password }` | `UsuarioSesion`. 409 si el email existe |
| GET | `/api/sesion/google?volver=/checkout` | — | Redirige a Google y, al volver, a `volver` (solo rutas internas) |
| POST | `/api/sesion/logout` | — | `{ ok: true }` |

`UsuarioSesion = { id, nombre, email, rol: "conductor", patente? }`. `patente` = la última que usó (para completar el checkout). Nunca devolver hash de contraseña ni tokens.

## Reservas (`onlyLogged`, rol conductor)

### POST `/api/reservas`

Crea la reserva **y** su pago en una transacción (`withTransaction`): o quedan las dos cosas o ninguna.

Header obligatorio: `Idempotency-Key: <uuid>` (el front genera uno por intento de compra). Si llega una clave que ya existe para ese usuario, se devuelve la misma reserva y el mismo pago, sin crear otros. Así un doble toque o un corte de red no reservan dos veces.

Body `NuevaReserva`:

```jsonc
{
  "estacionamientoId": "galpon-central",
  "plazaId": "B-1-0",
  "vehiculo": "auto",
  "patente": "AE 482 KD",
  "desde": "2026-10-28T18:15:00.000Z",
  "hasta": "2026-10-28T21:15:00.000Z",
  "modalidad": "sena",          // "sena" = paga la seña ahora y el resto al salir; "total" = todo ahora
  "medioPagoId": "mercadopago", // obligatorio si hay algo que pagar ahora
  "tokenTarjeta": "…"           // solo con medios de flujo "tarjeta"
}
```

Qué hace:

1. Recalcula la cotización (no confía en montos del front).
2. Verifica que la plaza siga libre y que el vehículo entre. Si no: 409 `PLAZA_NO_DISPONIBLE` o `VEHICULO_NO_ENTRA`.
3. Crea la `Reserva` en `pendiente_pago` y **retiene** la plaza 10 minutos (`retenidaHasta`): en el tablero queda `reservada`.
4. Monto a cobrar = `total` si `modalidad: "total"`, si no `sena`.
   - Si es 0 (gestor con `senaPct = 0` y modalidad seña): la reserva queda `confirmada` sin pago.
   - Si no, pide el pago a la pasarela del medio elegido (ver "Pagos").
5. Responde `{ reserva: Reserva, pago?: Pago }`.

El front, según la respuesta:

- `pago.redirectUrl` → manda al conductor a la pasarela (Checkout Pro de Mercado Pago, MODO…), que después vuelve a `/reservas/:id`.
- `pago.estado: "aprobado"` → muestra el comprobante.
- `pago.estado: "rechazado"` → muestra la reserva con "Completá el pago" para reintentar mientras dure la retención.

Errores: 400 `PATENTE_INVALIDA`, 400 `MEDIO_PAGO_INVALIDO`, 400 `HORARIO_INVALIDO`, 409 `PLAZA_NO_DISPONIBLE`, 409 `VEHICULO_NO_ENTRA`, 409 `ESTACIONAMIENTO_CERRADO`, 401 `UNAUTHENTICATED`.

### Otras rutas

| Método | Ruta | Body | Respuesta / errores |
| --- | --- | --- | --- |
| GET | `/api/reservas/mias` | — | `Reserva[]` del usuario, más nuevas primero |
| GET | `/api/reservas/:id` | — | `Reserva` (404 si es de otro usuario: permiso por recurso) |
| POST | `/api/reservas/:id/pago` | `{ medioPagoId, tokenTarjeta? }` | Reintento de pago mientras está `pendiente_pago`. `{ reserva, pago }`. 409 `RESERVA_VENCIDA`, 409 `PAGO_YA_PROCESADO` |
| POST | `/api/reservas/:id/cancelar` | — | `Reserva` cancelada con `reembolso`. Solo `pendiente_pago`, o `confirmada` antes de la hora de llegada; si no, 409 `RESERVA_NO_CANCELABLE` |

`Reserva`:

```jsonc
{
  "id": "…",
  "codigo": "BDRLKW",            // 6 caracteres sin ambiguos (sin 0/O, 1/I): se muestra y va en el QR
  "estacionamiento": { "id", "nombre", "direccion", "ubicacion" },
  "plazaId": "B-1-0", "plazaEtiqueta": "B-09", "sectorNombre": "Rotativo sur", "pisoNombre": "Planta baja",
  "vehiculo": "auto", "patente": "AE 482 KD",
  "desde": "…", "hasta": "…", "toleranciaMin": 15,
  "modalidad": "sena",
  "total": 6000,                 // estadía cotizada
  "sena": 1200,                  // seña según el % (aunque pague total: es lo que no se devuelve)
  "pagado": 1200,                // lo pagado online
  "saldo": 4800,                 // lo que falta pagar al salir (sin tiempo extra)
  "estado": "confirmada",        // pendiente_pago | confirmada | en_curso | finalizada | cancelada | vencida
  "pago": { "id", "reservaId", "medioId", "pasarela", "estado", "monto", "redirectUrl?" },
  "retenidaHasta": "…",          // solo en pendiente_pago
  "reembolso": 0,                // solo si se canceló
  "creadaEn": "…"
}
```

Estados (los mueve el back; el front solo los muestra):

```
pendiente_pago ──pago aprobado──▶ confirmada ──llegada en el tablero──▶ en_curso ──cobro de salida──▶ finalizada
pendiente_pago ──pasa retenidaHasta (cron)──▶ vencida (libera la plaza)
pendiente_pago | confirmada (antes de llegar) ──cancelar──▶ cancelada (libera la plaza)
confirmada ──pasa desde + toleranciaMin sin llegada (cron)──▶ vencida (libera la plaza; la seña no se devuelve)
```

Los vencimientos los corre `node-cron`/Agenda cada minuto.

**Cancelación:** se devuelve lo pagado menos la seña (`reembolso = pagado − sena`, mínimo 0). Con modalidad seña no se devuelve nada; con total, se devuelve el total menos la seña. Es la misma regla del tablero ("si se libera la reserva sin que llegue el vehículo, la seña no se devuelve"). Si el gestor quiere otra política, se agrega a su configuración.

## Pagos: factory de pasarelas

### GET `/api/pagos/medios?estacionamientoId=`

Medios habilitados para ese estacionamiento. Cada uno lo resuelve una pasarela del factory.

```jsonc
[
  { "id": "mercadopago", "pasarela": "mercadopago", "nombre": "Mercado Pago", "descripcion": "Dinero en cuenta, tarjetas guardadas o cuotas", "flujo": "redireccion" },
  { "id": "tarjeta", "pasarela": "mercadopago", "nombre": "Tarjeta de crédito o débito", "descripcion": "Visa, Mastercard…", "flujo": "tarjeta", "marcas": ["Visa", "Mastercard", "Amex", "Naranja", "Cabal"] },
  { "id": "modo", "pasarela": "modo", "nombre": "MODO", "descripcion": "Pagá con QR desde la app de tu banco", "flujo": "qr" }
]
```

`flujo`:

- `redireccion`: el back crea la preferencia (Checkout Pro) y devuelve `redirectUrl`. `back_urls` → `${FRONT_URL}/reservas/:id`.
- `tarjeta`: el front tokeniza con el SDK de la pasarela (MercadoPago.js `createCardToken` con la **public key**) y manda `tokenTarjeta`. El back paga con la access token. **Los datos de la tarjeta nunca llegan al back.**
- `qr`: el back devuelve `redirectUrl` (o una URL/imagen de QR) y el front espera la confirmación.

Sugerencia de estructura en el back (siguiendo las capas de las directivas):

```
services/pagos/
  pasarela.factory.js        // getPasarela("mercadopago") → instancia
  pasarelas/mercadopago.pasarela.js
  pasarelas/modo.pasarela.js
```

Cada pasarela implementa la misma interfaz:

```js
crearPago({ reserva, monto, medio, tokenTarjeta, idempotencia }) // → { idExterno, estado, redirectUrl? }
consultarPago(idExterno)                                          // → { estado, monto }
procesarWebhook(req)                                              // → { idExterno, estado } (valida la firma)
reembolsar({ idExterno, monto })                                  // → { ok }
```

La clave de idempotencia de la reserva se pasa también a la pasarela (`X-Idempotency-Key` en Mercado Pago).

### GET `/api/pagos/:id`

`Pago` (para consultar mientras se espera un QR o la vuelta de la pasarela). Solo el dueño de la reserva.

### POST `/api/pagos/webhook/:pasarela` (sin login, lo llama la pasarela)

1. Valida la firma de la pasarela (`x-signature` en Mercado Pago). Sin firma válida, 401.
2. Consulta el pago real a la pasarela (no confiar en el body).
3. Idempotente: si el pago ya estaba en ese estado, no hace nada.
4. Aprobado → reserva `confirmada`, `pagado = monto`, `saldo = total − pagado` y se aplica en el tablero (ver abajo). Rechazado → `pago.estado = "rechazado"`, la reserva sigue `pendiente_pago` hasta que venza la retención.
5. Emite el evento de Socket.io `reserva:actualizada`.

### Solo en la API simulada

| Método | Ruta | Qué hace |
| --- | --- | --- |
| POST | `/api/demo/pagos/:id` | `{ aprobar }`: hace de pasarela + webhook (lo usa la pantalla `/pago/simulado`) |
| POST | `/api/demo/reset` | Vuelve a los datos de ejemplo |

En la simulación, la tarjeta `4000 0000 0000 0002` se rechaza y cualquier otra se aprueba.

## Relación con el tablero del gestor

Una reserva de la app **es** una reserva del tablero:

- Al retener: la plaza pasa a `reservada` con `cliente: "App · <patente>"`, `patente`, `hasta` (minuto del día de `reserva.hasta`) y `reservaId`.
- Al aprobarse el pago: `plaza.sena = reserva.pagado` y se registra un movimiento `cobro` "Seña online · AE 482 KD · B-09" (o "Pago online" si pagó el total). Así el cobro de salida del tablero (`POST /api/plazas/:id/cobro`) ya descuenta lo pagado online sin cambios: `a pagar = máx(0, total − seña)`.
- Al llegar (`POST /api/plazas/:id/llegada`): la reserva pasa a `en_curso`. Al cobrar la salida: `finalizada`.
- Si el gestor libera la plaza (`POST /api/plazas/:id/liberar`) o vence: la reserva pasa a `cancelada` o `vencida`.
- El scanner de la entrada (`Estacionamiento-scanner`) lee el QR con `reserva.codigo` y llama a la llegada.

## Tiempo real (Socket.io)

Hoy el front refresca cada 20-30 s (`useCarga` con `cadaMs`). Con Socket.io:

| Evento | Sala | Payload | Lo usa |
| --- | --- | --- | --- |
| `disponibilidad:actualizada` | `estacionamiento:<id>` y `mapa` | `{ estacionamientoId, disponibilidad, estado, plazas: PlazaPublica[] }` (solo las que cambiaron) | Mapa y plano |
| `reserva:actualizada` | `usuario:<id>` | `Reserva` | Comprobante y "pago pendiente" |

## Códigos de error nuevos

`PLAZA_NO_DISPONIBLE` 409 · `SOLD_OUT` 409 · `ESTACIONAMIENTO_CERRADO` 409 · `HORARIO_INVALIDO` 400 · `MEDIO_PAGO_INVALIDO` 400 · `PAGO_RECHAZADO` 409 · `PAGO_YA_PROCESADO` 409 · `RESERVA_NO_CANCELABLE` 409 · `RESERVA_VENCIDA` 409. Más los del tablero que también se usan acá: `INVALID_ARGUMENT`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `PATENTE_INVALIDA`, `VEHICULO_NO_ENTRA`, `INTERNAL_ERROR`.

## Variables de entorno nuevas del back

`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MODO_CLIENT_ID`, `MODO_CLIENT_SECRET`, `FRONT_CONDUCTOR_URL` (para `back_urls` y CORS), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (si no estaban). Solo en `config/config.js` y `.env.example`; `startup.check.js` avisa si faltan.
