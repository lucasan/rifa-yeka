# Rifa de Yeka — Diseño técnico

**Fecha:** 2026-05-28
**Autor:** Lucas Torres (con Claude)
**Estado:** En revisión

## Resumen

Landing web para una rifa benéfica ("Rifa de Yeka") con 100 números (00–99), 20 cupos máximos a 5 números por persona y $20.000 por boleta. El sorteo se realiza el 8 de junio con el Chontico (1pm). Los compradores apartan números en línea sin necesidad de cuenta; Yeka tiene un panel admin protegido por contraseña donde confirma pagos, resetea reservas y cierra la rifa al final del día ingresando el número ganador.

El pago se hace offline por Nequi al número 3164959139 (a nombre de Lucas Torres). La verificación es manual: el comprador da clic en "Ya pagué" que abre WhatsApp a Yeka (+573244255786) con un mensaje pre-llenado, ella ve el comprobante y confirma desde el admin.

## Objetivos

- Reemplazar el flujo manual (mensajes sueltos por WhatsApp) con un tablero único donde se ve qué números están disponibles.
- Evitar que dos personas reclamen el mismo número.
- Dar prueba social: ver el nombre de quien ya apartó números genera confianza.
- Anunciar el ganador en la misma página tras el sorteo.

## No objetivos

- No es plataforma multi-rifa: la app vive para esta rifa puntual.
- No automatiza el sorteo (el sorteo es offline con Chontico).
- No procesa pagos en línea (Nequi se hace fuera de la app).
- No tiene auto-consulta para compradores (sin login de usuario); Yeka avisa por WhatsApp manualmente.
- No envía SMS ni emails automatizados.

## Decisiones de producto

| Decisión | Valor |
|---|---|
| Modelo de reserva | Bloqueo manual: la reserva queda activa hasta que Yeka la confirme o resetee. Sin expiración automática. |
| Visibilidad pública | Estado libre/ocupado + nombre del comprador en los ocupados. "Pendiente" y "Confirmado" se ven igual al público. |
| Confirmación de pago | Botón "Ya pagué" abre WhatsApp a Yeka con mensaje pre-llenado. Ella confirma manualmente desde el admin. |
| Auto-consulta del comprador | No hay sesión de usuario. El comprador puede volver a la URL `/pago/[id]` (token UUID en el link) para reverlas, pero no puede consultar por teléfono ni ver cambios de estado; Yeka le avisa por WhatsApp cuando confirma el pago. |
| WhatsApp Yeka | +573244255786 |
| Datos Nequi | Número: 3164959139, titular: Lucas Torres |
| Stack | Next.js 15 (App Router) + Supabase (Postgres + Realtime). Deploy en Vercel. |

## Flujos

### Flujo del comprador (3 pantallas)

1. **Landing (`/`)** — Muestra el flyer y un tablero 10×10 con los 100 números. Los ocupados muestran el nombre al hacer hover. Dos botones de acción:
   - "Escoger 5 manualmente" → habilita selección en la cuadrícula.
   - "Sorpréndeme" → asigna 5 números aleatorios entre los libres.
2. **Formulario (`/apartar?nums=…`)** — Pide nombre y teléfono. Submit hace `POST /api/reserve`. Si algún número fue tomado en paralelo, devuelve los conflictivos y la UI pide reintentar.
3. **Pago (`/pago/[id]`)** — Muestra el QR de Nequi (`img/nequi.jpeg`), los datos textuales (3164959139, Lucas Torres), los 5 números asignados y el botón **"Ya pagué"** que abre WhatsApp a +573244255786 con mensaje pre-llenado:

   > Hola Yeka! Ya pagué la rifa. Mis números son 23, 47, 88, 12, 91. Nombre: <nombre>. Adjunto comprobante.

### Flujo de Yeka (admin)

- **`/admin/login`** — Form con contraseña única (env `ADMIN_PASSWORD`). Setea cookie httpOnly firmada.
- **`/admin`** — Dashboard con:
  - Tabla de compras: nombre, teléfono, 5 números, estado (Pendiente / Confirmado), fecha.
  - Botones por fila: **Confirmar** (cambia a confirmado), **Resetear** (libera los 5 números, elimina la compra). Reset pide doble confirmación.
  - Tablero de números (mismo componente que el público) para referencia visual.
  - Sección "Cerrar rifa" con input para el número ganador (0–99) y doble confirmación. Tras cerrar, el mismo input queda visible como "Número ganador: NN — editar" para corregir el dato si fuera necesario (también con doble confirmación).

### Post-sorteo (público)

- El tablero se "congela" — la UI deshabilita los botones de apartar.
- En la parte superior aparece un banner: **"¡Ganó <nombre>! Número NN"**.
- Si el número ganador no fue vendido: **"El número ganador fue NN — no fue vendido."**

## Arquitectura técnica

### Stack

- **Frontend + backend:** Next.js 15 (App Router), TypeScript, Tailwind CSS.
- **Base de datos + realtime + storage:** Supabase (Postgres con RLS, Realtime).
- **Deploy:** Vercel (gratis para este tamaño).
- **Testing:** Vitest (unit + integration), Playwright (E2E).

### Modelo de datos

Tres tablas en Supabase:

```sql
-- Una fila por persona que apartó
create table purchases (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text not null,
  status        text not null default 'pending' check (status in ('pending', 'confirmed')),
  created_at    timestamptz not null default now(),
  confirmed_at  timestamptz
);

-- 100 filas pre-sembradas (n = 0..99). Fuente de verdad del tablero.
create table numbers (
  n            int primary key check (n between 0 and 99),
  purchase_id  uuid references purchases(id) on delete set null
);

-- Fila única con el estado global de la rifa
create table raffle_state (
  id              int primary key check (id = 1),
  winning_number  int check (winning_number between 0 and 99),
  closed_at       timestamptz
);

-- Seed inicial
insert into numbers (n) select generate_series(0, 99);
insert into raffle_state (id) values (1);
```

### Lógica de reserva atómica

Endpoint `POST /api/reserve`:

```typescript
// pseudocode
async function reserve({ name, phone, numbers }) {
  if (numbers.length !== 5) return error('Debes escoger exactamente 5');
  validateName(name); validatePhone(phone);

  return supabase.rpc('reserve_numbers', { p_name: name, p_phone: phone, p_numbers: numbers });
}
```

Función Postgres `reserve_numbers(p_name, p_phone, p_numbers[])`:

1. Verifica que `raffle_state.winning_number IS NULL` (rifa abierta). Si está cerrada → error.
2. Inserta en `purchases` → obtiene `purchase_id`.
3. `UPDATE numbers SET purchase_id = $1 WHERE n = ANY($2) AND purchase_id IS NULL RETURNING n`.
4. Si `rowCount < 5`: rollback completo, devuelve `{ error: 'taken', takenNumbers: [...] }` con los que ya estaban tomados.
5. Si éxito: devuelve `{ purchaseId }`.

La transacción es atómica por estar en una función Postgres.

### Realtime

El cliente browser se suscribe a `numbers` y `raffle_state` con Supabase Realtime. Cuando alguien aparta o Yeka cierra la rifa, el tablero se actualiza en vivo en todas las pestañas abiertas. No hay polling.

### Auth admin

Una sola cuenta (Yeka). No usamos Supabase Auth — overkill para un solo usuario.

- `POST /admin/login` valida `password === process.env.ADMIN_PASSWORD`.
- En éxito, setea cookie httpOnly firmada con `ADMIN_SESSION_SECRET` (formato: `HMAC(timestamp + 'admin')`).
- `middleware.ts` valida la cookie en cualquier ruta `/admin/*` excepto `/admin/login`.
- Logout = borrar la cookie.

### Row-Level Security (RLS)

- `numbers`: lectura pública (SELECT). Escritura solo con service role.
- `purchases`: SELECT público pero excluye `phone` (vista o RLS por columna). Escritura solo service role.
- `raffle_state`: lectura pública. Escritura solo service role.

El browser nunca usa la service role key; solo la anon key. Toda mutación pasa por API routes o Server Actions que corren server-side con la service role.

### Estructura de archivos

```
rifa/
├── img/
│   ├── flyer_rifa_yeka.png
│   └── nequi_qr.png              # pendiente que Lucas suba
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing
│   │   ├── apartar/page.tsx      # Formulario
│   │   ├── pago/[id]/page.tsx    # QR + botón WhatsApp
│   │   ├── admin/
│   │   │   ├── login/page.tsx
│   │   │   ├── page.tsx
│   │   │   └── actions.ts        # Server Actions: confirm, reset, closeRaffle
│   │   └── api/reserve/route.ts
│   ├── components/
│   │   ├── NumberGrid.tsx
│   │   ├── Flyer.tsx
│   │   ├── WinnerBanner.tsx
│   │   └── AdminTable.tsx
│   ├── lib/
│   │   ├── supabase/{server,client,types}.ts
│   │   ├── reserve.ts
│   │   └── constants.ts
│   └── middleware.ts
├── supabase/migrations/0001_init.sql
├── .env.example
└── package.json
```

## Edge cases y manejo de errores

| Caso | Manejo |
|---|---|
| Dos personas apartan los mismos números a la vez | Transacción atómica detecta el `rowCount < 5`, rollback, devuelve `takenNumbers`. UI muestra: "Estos números acaban de ser apartados: 23, 47. Por favor escoge otros." |
| Random pick con < 5 libres | Botón "Sorpréndeme" se deshabilita, mensaje: "Solo quedan X números — escógelos manualmente." |
| Comprador refresca tras apartar | `/pago/[id]` es estable. El `id` es UUID no-adivinable; sirve como token. |
| Yeka resetea por error una compra confirmada | `confirm()` JS con nombre y números antes del reset. Sin undo. |
| Yeka cierra con número equivocado | Doble confirmación. Puede actualizar `winning_number` después con un UPDATE desde admin. |
| Número ganador no vendido | Banner: "El número ganador fue NN — no fue vendido." |
| Inputs inválidos | Validación cliente + server. Teléfono: 10 dígitos colombianos opcional +57. Nombre: 2–60 caracteres. |
| Spam sin pagar | Yeka resetea manualmente. Sin rate-limit en MVP. Si se vuelve problema, agregar cookie con TTL o reCAPTCHA. |
| JS deshabilitado | El tablero se renderiza server-side; la interactividad requiere JS. Aceptable para el público objetivo. |
| QR del Nequi | Imagen ya disponible en `img/nequi.jpeg`. Si por alguna razón faltara, mostrar los datos textuales (número + titular) en su lugar. |

## Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
YEKA_WHATSAPP=+573244255786
NEQUI_NUMBER=3164959139
NEQUI_NAME=Lucas Torres
```

## Testing

- **Unit (Vitest):** `lib/reserve.ts` — casos feliz, colisión parcial, colisión total, validación de inputs.
- **Integration (Vitest + Supabase local):** test de `/api/reserve` contra DB efímera; verificar atomicidad con dos llamadas concurrentes simuladas.
- **E2E (Playwright):** 2–3 tests cubriendo flujo comprador completo y flujo admin (login → confirmar → cerrar rifa → ver banner ganador).
- **Manual:** abrir dos navegadores y apartar los mismos números → verificar el manejo de colisión visualmente.

## Definition of Done

- [ ] Tablero con realtime funcional en móvil y desktop.
- [ ] Flujo comprador (escoger → apartar → ver pago) completo.
- [ ] Admin puede confirmar, resetear, cerrar rifa.
- [ ] Banner de ganador aparece tras cerrar.
- [ ] Tests unit + integration + E2E en verde.
- [ ] Deploy en Vercel con variables configuradas.
- [ ] Yeka prueba el panel en su celular antes del 8 de junio.

## Fuera de alcance (posibles iteraciones futuras)

- Botón "Iniciar nueva rifa" en admin (reset completo).
- Múltiples bloques por persona (más de 5 números en una compra).
- Recibo automático al comprador tras confirmación.
- Estadísticas: cuántas reservas pendientes, tiempo promedio para confirmar, etc.
