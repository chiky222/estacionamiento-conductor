# Estacionamiento · app del conductor

La app de quien busca dónde estacionar (ESTACIONARTE). En tres pasos:

1. **Mapa** (`/`): los estacionamientos que usan la plataforma, con el precio vigente en cada pin y si hay lugar, quedan los últimos o están en **Sold-out**. Filtros por vehículo (auto, camioneta, moto), hora de llegada, cuánto se queda y "solo con lugar".
2. **Plano** (`/estacionamientos/:id`): el mismo plano del tablero del gestor (pisos, sectores, espiga, objetos, entrada y salida) para tocar el lugar que quiere, con la tarifa de cada sector, las reglas y eventos aplicados y un botón "Elegir por mí".
3. **Checkout** (`/checkout`): patente, **seña** (el % que define el gestor; el resto se paga al salir) o **total**, y medio de pago: Mercado Pago, tarjeta o MODO. Después, el comprobante con QR y código (`/reservas/:id`) y "Mis reservas".

Hoy funciona **sin back**: los services pegan a una API simulada que vive en el navegador (localStorage) con 8 estacionamientos de ejemplo en Palermo. Cuando el back esté listo, se cambia una variable de entorno y no se toca ningún componente.

## Cómo levantarlo

Requiere Node 20 o superior.

```bash
npm install
cp .env.example .env.local   # opcional: por defecto usa la API simulada y el mapa de muestra
npm run dev                  # http://localhost:3002
```

Otros scripts: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck` (`tsc --noEmit`).

Puertos del proyecto: back 8080, tablero del gestor 3000, scanner 3001, esta app 3002.

### Mapa de Google

Sin `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` se ve un **mapa de muestra** (Palermo dibujado, con zoom y arrastre) y el SDK de Google ni se descarga. Con la key se usa Google Maps (`@vis.gl/react-google-maps`) con los mismos pines. Hace falta un Map ID (`NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`; `DEMO_MAP_ID` sirve para desarrollo) y restringir la key por dominio en Google Cloud.

### Probar pagos en la simulación

- **Mercado Pago** y **MODO** abren `/pago/simulado`, que hace de pasarela: "Aprobar" o "Rechazar".
- **Tarjeta**: cualquier número de 16 dígitos se aprueba; `4000 0000 0000 0002` se rechaza (para ver el reintento).
- "Continuar con Google" entra con un usuario de prueba.
- Para volver a los datos de ejemplo: borrar `conductor-mock-v1` del localStorage.

## Stack

Next.js 15 (App Router) + React 19 + TypeScript · Tailwind 4 con tokens de shadcn/ui · design system ESTACIONARTE (mismos tokens, tipografías, íconos y vehículos que el tablero) · react-hook-form + zod · sonner · next-themes · `@vis.gl/react-google-maps` · `qrcode`.

## Estructura

```
src/
├── app/                  # rutas: / · /estacionamientos/[id] · /checkout · /reservas · /reservas/[id] · /login · /pago/simulado
├── components/
│   ├── ui/               # primitivas shadcn
│   ├── common/           # CommonButton, CommonPill, CommonSegmented, CommonChip… (las mismas del tablero)
│   ├── layout/           # cabecera y tema
│   ├── mapa/             # MapaEstacionamientos (elige Google o muestra), pines de precio, controles
│   ├── explorar/         # pantalla del mapa: filtros, lista, tarjeta de estacionamiento
│   ├── plano/            # plano para elegir lugar (misma geometría que el tablero)
│   ├── reserva/          # pantalla del plano: cabecera, vehículo, horario, tarifas, resumen
│   ├── checkout/         # seña o total, medios de pago, tarjeta, resumen
│   ├── reservas/         # comprobante con QR, pago pendiente, mis reservas, pasarela simulada
│   └── sesion/           # ingreso con Google o email
├── contexts/             # UserSessionContext (useUserSession) y ReservaContext (useReserva: vehículo, horario y lugar elegido)
├── hooks/                # useCarga (pedir y refrescar), useCotizacion
├── services/             # httpClient.ts + estacionamientos, reservas, pagos, sesion, tarjeta
└── lib/                  # tipos, helpers del conductor, config (única lectura de env)
    └── mock/             # API simulada y estacionamientos de ejemplo
```

Reglas que sigue el código (directivas del proyecto):

- Ningún componente hace `fetch`: todo pasa por `services/*.service.ts` y un único `httpClient.ts` (`credentials: "include"`, 401 → `/login?volver=…`, errores traducidos por `code` en `lib/errors.ts`).
- El precio lo calcula siempre el back (`POST …/cotizacion`); el front no inventa montos.
- Los datos de la tarjeta no pasan por el back: se tokenizan con el SDK de la pasarela (`services/tarjeta.service.ts`).
- Cada pago lleva `Idempotency-Key` para no reservar dos veces.
- Estilos solo con tokens de `app/globals.css` (modo claro y oscuro).

### Código compartido con el tablero

Estos archivos son **copias** de `estacionamiento-front` y conviene mantenerlos iguales (o pasarlos a un paquete compartido más adelante): `lib/types.ts`, `lib/plano.ts`, `lib/plano-svg.ts`, `lib/tarifas.ts`, `lib/constants.ts`, `lib/format.ts`, `lib/vehiculos.ts`, `lib/patente.ts`, `app/globals.css` (más los tokens del mapa al final), `components/ui/*`, `components/common/*`, `components/plano/PlanoDefs.tsx` y `CarShape.tsx`. `lib/iconos.ts` suma algunos íconos nuevos al final.

## Conectar el back real

1. Implementar los endpoints de [docs/CONTRATO.md](docs/CONTRATO.md) en `Estacionamiento-back`.
2. En `.env.local`: `NEXT_PUBLIC_API_MODE=api`, la URL del back y `NEXT_PUBLIC_MP_PUBLIC_KEY`.

Entidades, estados y reglas: [DOMAIN_MODEL.md](DOMAIN_MODEL.md).
