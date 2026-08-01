import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // Optional shared-secret gate. If the secret is unset or "none", the endpoint
  // is unauthenticated (the order_number in the payload is effectively the auth).
  // TEMPORARY: hardcoded sandbox fallback — move to env + regenerate before prod.
  const secret =
    Deno.env.get('NORTH_WEBHOOK_SECRET') ??
    Deno.env.get('PAYANYWHERE_WEBHOOK_SECRET') ??
    'sec_01b23ff856a3cd341d67c46658a4b5b046e1013b6bf9b85cfc06e32062e351ab';
  if (secret && secret.toLowerCase() !== 'none') {
    // TODO(north): North may sign webhooks with an HMAC signature header rather
    //   than a plaintext match. Once the webhook docs are available, replace this
    //   with signature verification (HMAC-SHA256 of the raw body using the secret).
    const provided = req.headers.get('x-webhook-secret') ?? req.headers.get('x-north-signature');
    if (provided !== secret) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad JSON', { status: 400, headers: corsHeaders });
  }

  const reference: string | undefined =
    payload.reference ?? payload.order_number ?? payload.data?.reference;
  if (!reference) return new Response('Missing reference', { status: 400, headers: corsHeaders });

  // Amount actually paid, as reported by PayAnywhere. Try the common field names.
  const rawPaid =
    payload.amount ??
    payload.total ??
    payload.amount_paid ??
    payload.data?.amount ??
    payload.transaction?.amount;
  const paidAmount = rawPaid == null ? null : Number(rawPaid);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', reference)
    .maybeSingle();
  if (!order) return new Response('Not found', { status: 404, headers: corsHeaders });
  if (order.fresh_kds_sent) return new Response('ok', { headers: corsHeaders });

  // Server-side price guard: never send an order to the kitchen unless the amount
  // paid matches the server-authoritative total. This blocks customers from paying
  // an arbitrary (lower) amount on the PayAnywhere page.
  const expected = Number(order.total);
  if (paidAmount == null || Number.isNaN(paidAmount)) {
    console.error('Webhook missing/invalid amount for order', reference, 'payload:', payload);
    await supabase
      .from('orders')
      .update({ status: 'payment_review' })
      .eq('id', order.id);
    return new Response('Missing amount', { status: 400, headers: corsHeaders });
  }
  // Allow a 1-cent tolerance for rounding differences.
  if (Math.abs(paidAmount - expected) > 0.01) {
    console.error(
      `Amount mismatch for order ${reference}: paid ${paidAmount}, expected ${expected}`,
    );
    await supabase
      .from('orders')
      .update({ status: 'amount_mismatch' })
      .eq('id', order.id);
    return new Response('Amount mismatch', { status: 409, headers: corsHeaders });
  }

  const token = Deno.env.get('FRESH_KDS_TOKEN');
  const locationId = Deno.env.get('FRESH_KDS_LOCATION_ID');
  const deviceId = Deno.env.get('FRESH_KDS_DEVICE_ID');
  let ok = false;
  if (token && locationId && deviceId) {
    try {
      const res = await fetch('https://api.fresh.technology/v1/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: locationId,
          device_ids: [deviceId],
          order_name: order.order_number,
          order_type: order.order_type,
          notes: order.notes ?? '',
          items: (order.items as any[]).map((it) => ({
            name: it.name,
            quantity: it.quantity,
            modifiers: [],
          })),
        }),
      });
      ok = res.ok;
      if (!ok) console.error('Fresh KDS non-2xx', res.status, await res.text());
    } catch (err) {
      console.error('Fresh KDS error', err);
    }
  }

  await supabase
    .from('orders')
    .update({ status: ok ? 'sent_to_kitchen' : 'paid', fresh_kds_sent: ok })
    .eq('id', order.id);

  return new Response('ok', { headers: corsHeaders });
});
