import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

// Creates a North Embedded Checkout session for an existing pending order.
//
// SECURITY: the amount is taken from the order row in the database (written by
// submit-order using server-authoritative menu prices), NEVER from the client.
// This is what prevents a customer from paying an arbitrary price.

const BodySchema = z.object({
  order_number: z.string().min(1),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// TEMPORARY sandbox credentials (env-first, hardcoded fallback).
// TODO: before going to production, remove the hardcoded fallbacks, set these
// as Supabase Edge Function secrets, and REGENERATE the keys in North (they were
// committed to git via the Lovable sync).
// ---------------------------------------------------------------------------
const NORTH_CHECKOUT_ID =
  Deno.env.get('NORTH_CHECKOUT_ID') ?? '1509086b-adac-440a-b362-a36a0877e8c9';
const NORTH_API_KEY =
  Deno.env.get('NORTH_API_KEY') ??
  '1fd38358d252825513f303c47f980848a1afa0ceb91cdfe065d8bc731d35ec4a';
// Sandbox merchant profile ("ABC Retail Store"). Swap for the real El Sazon
// merchant profile when publishing to production.
const NORTH_PROFILE_ID =
  Deno.env.get('NORTH_PROFILE_ID') ?? '62c4804d-f3f4-46f6-a15a-023da89d2374';
// North Embedded Checkout session endpoint.
const NORTH_SESSION_URL =
  Deno.env.get('NORTH_SESSION_URL') ?? 'https://checkout.north.com/api/sessions';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 1) Load the order and its authoritative pricing from the DB.
  const { data: order, error } = await supabase
    .from('orders')
    .select('order_number, items, subtotal, tax, total, status')
    .eq('order_number', parsed.data.order_number)
    .maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!order) return json({ error: 'Order not found' }, 404);
  if (order.status !== 'pending') return json({ error: 'Order is not payable' }, 409);

  // 2) Build the North `products` list from the DB order. North sums the product
  // prices to compute the charge, so we include a tax line item to make the total
  // equal order.total (which the webhook amount-guard verifies). The customer
  // cannot influence any of these values — they come straight from the DB.
  const products: { name: string; price: number; quantity: number }[] = (
    order.items as { name: string; price: number; quantity: number }[]
  ).map((it) => ({
    name: it.name,
    price: Number(it.price),
    quantity: it.quantity,
  }));
  if (Number(order.tax) > 0) {
    products.push({ name: 'Impuesto (8.25%)', price: Number(order.tax), quantity: 1 });
  }

  // 3) Create the North Embedded Checkout session server-side (private key never
  // reaches the browser). Returns a short-lived token used to mount the form.
  try {
    const res = await fetch(NORTH_SESSION_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NORTH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkoutId: NORTH_CHECKOUT_ID,
        profileId: NORTH_PROFILE_ID,
        products,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('North create-session failed', res.status, detail);
      return json({ error: 'Could not create checkout session' }, 502);
    }

    const session = await res.json();

    // Store North's session/transaction id on the order so the webhook can map
    // the payment notification back to this order.
    const sessionId = session.id ?? session.sessionId ?? session.token ?? null;
    if (sessionId) {
      await supabase
        .from('orders')
        .update({ payment_ref: String(sessionId) })
        .eq('order_number', order.order_number);
    }

    // The client library needs the session token to mount the form.
    return json({
      order_number: order.order_number,
      token: session.token ?? session.sessionToken ?? null,
      total: Number(order.total),
    });
  } catch (err) {
    console.error('North create-session error', err);
    return json({ error: 'Checkout session error' }, 502);
  }
});







