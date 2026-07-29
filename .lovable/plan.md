
# Online Ordering System — El Sazón de las Mercedes

Adds a full customer-facing ordering flow on top of the current landing page. The landing page and its design stay exactly as they are — only the existing "Ordenar" button is rewired to point to the new `/menu` route, and a matching "Order Now" CTA is added.

## Scope

New routes (TanStack file routes under `src/routes/`):

- `/menu` — browsable menu grouped by category with Add-to-Cart and a floating cart summary
- `/checkout` — cart review + customer form + PayAnywhere hosted-checkout redirect
- `/order-confirmation` — thank-you page with order number, summary, and ETA

New backend (Lovable Cloud / Supabase):

- `menu_items` table (seeded from your uploaded Payments Hub CSV so the menu matches the POS)
- `orders` table
- Edge function `submit-order` — validates, inserts the order, calls Fresh KDS, returns order id
- Edge function `payanywhere-webhook` — verifies + submits the order if the browser redirect didn't

Explicitly out of scope for this build (per your note): POS, admin dashboard, menu editor UI, delivery routing/fees, order status tracking screen.

## User flow

```text
Landing page ──[Ordenar / Order Now]──▶ /menu
   /menu  ──[Add items → View cart]──▶ /checkout
   /checkout ──[Pay with PayAnywhere]──▶ hosted checkout
   hosted checkout ──[return_url]──▶ /order-confirmation?order=<id>
                                          │
                                          └── submit-order edge fn → Fresh KDS
```

Cart lives in `localStorage` (Zustand) so refreshes and the payment redirect don't lose it.

## Data model

```sql
menu_items (
  id uuid pk, name text, description text, price numeric(8,2),
  category text, available boolean default true,
  sort_order int default 0, created_at timestamptz default now()
)

orders (
  id uuid pk, order_number text unique,          -- short human code, e.g. ELS-4821
  created_at timestamptz default now(),
  customer_name text, customer_phone text,
  order_type text check (order_type in ('pickup','delivery')),
  items jsonb,                                    -- [{id,name,qty,price}]
  subtotal numeric(8,2), tax numeric(8,2), total numeric(8,2),
  notes text,
  status text default 'pending',                  -- pending|paid|sent_to_kitchen|failed
  payment_ref text,                               -- PayAnywhere reference
  fresh_kds_sent boolean default false
)
```

RLS: `menu_items` publicly readable (available=true). `orders` — no direct client access; all writes/reads go through the edge function using the service role. Order confirmation page fetches its own order via the edge function using the `order_number` from the URL.

Seed: the `Payments_Hub_Items_Jul_29_2026.csv` you uploaded is parsed into the initial `menu_items` rows (name, price, category), skipping items without a category or marked unavailable.

## Edge functions

`submit-order` (POST, public, no JWT):
1. Zod-validate payload (items, customer, totals).
2. Recompute totals server-side from `menu_items` to prevent price tampering.
3. Insert row with `status='paid'`, generate `order_number`.
4. Call Fresh KDS:
   ```
   POST https://api.fresh.technology/v1/orders
   Authorization: Bearer FRESH_KDS_TOKEN
   { location_id: FRESH_KDS_LOCATION_ID,
     device_ids: [FRESH_KDS_DEVICE_ID],
     order_name, order_type, notes,
     items: [{ name, quantity, modifiers: [] }] }
   ```
5. Flip `fresh_kds_sent=true` / `status='sent_to_kitchen'`; on Fresh failure, keep order paid and log — kitchen is called manually as fallback.
6. Return `{ order_number, total, eta_minutes }`.

`payanywhere-webhook` (POST, public): verifies a shared-secret header, looks up the pending order by `payment_ref`, and calls the same internal submit path if it wasn't already submitted (idempotent on `payment_ref`).

## Payment integration

PayAnywhere doesn't have a public JS SDK, so we use their **hosted payment link**:
1. Checkout page POSTs a "pending" order to `submit-order` in a `pending_payment` mode → gets `order_number` + `payment_ref`.
2. Redirects the customer to `PAYANYWHERE_CHECKOUT_URL?reference={order_number}&amount={total}` (exact param names depend on your PayAnywhere link — I'll wire the ones your dashboard exposes).
3. PayAnywhere `return_url` points to `/order-confirmation?order={order_number}`; on load, we poll `submit-order` (or a small `get-order` fn) until `status='paid'`.
4. Webhook is the source of truth if the redirect is interrupted.

If your PayAnywhere account doesn't support pass-through reference params, we fall back to: customer completes payment, is redirected back with a session id, then confirms — and the webhook finalizes.

## Secrets required

I will request these via the secure secret form after you approve the plan:

- `FRESH_KDS_TOKEN`
- `FRESH_KDS_LOCATION_ID`
- `FRESH_KDS_DEVICE_ID`
- `PAYANYWHERE_CHECKOUT_URL`
- `PAYANYWHERE_WEBHOOK_SECRET` (shared secret you'll paste into PayAnywhere's webhook settings)

`SUPABASE_URL` / `SUPABASE_ANON_KEY` are already provided by Lovable Cloud — no action needed.

## Landing-page changes (minimal)

- Header "Ordenar" button → `<Link to="/menu">` instead of DoorDash.
- Hero "Ordenar en DoorDash" → "Ordenar en línea" → `/menu` (keeps the DoorDash link as a secondary text link, or removes it — your call; default: replace).
- No visual/design changes.

## Build order

1. Enable Lovable Cloud.
2. Create tables + RLS + grants; seed `menu_items` from your CSV.
3. Add secrets.
4. Ship `/menu`, cart store, floating cart.
5. Ship `/checkout` + `submit-order` edge fn (pending mode + PayAnywhere redirect).
6. Ship `/order-confirmation` + Fresh KDS call + `payanywhere-webhook`.
7. Rewire landing-page "Ordenar" buttons.
8. Mobile QA via Playwright.

## Open questions

1. **PayAnywhere link format** — can you paste the exact hosted checkout URL from your PayAnywhere dashboard? I need to see whether it accepts `?amount=` and `?reference=` query params, or whether the amount is fixed per link.
2. **Delivery** — you listed pickup/delivery as an order type. Is delivery actually offered by you directly (not DoorDash)? If yes, do you need a delivery address field + fee? Default assumption: address field, no fee calc.
3. **Tax** — Katy TX sales tax on prepared food. Apply 8.25% at checkout, or are your CSV prices tax-inclusive? Default: add 8.25% on top.
4. **Menu source of truth** — seed from the CSV once and edit in the DB going forward, or should the CSV be re-importable later? Default: one-time seed.
