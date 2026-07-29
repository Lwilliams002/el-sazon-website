import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const TAX_RATE = 0.0825;

const ItemSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
});

const PendingSchema = z.object({
  mode: z.literal('pending_payment'),
  customer_name: z.string().trim().min(1).max(120),
  customer_phone: z.string().trim().min(7).max(30),
  order_type: z.enum(['pickup', 'delivery']),
  notes: z.string().trim().max(500).optional().default(''),
  items: z.array(ItemSchema).min(1).max(100),
});
const FinalizeSchema = z.object({
  mode: z.literal('finalize'),
  order_number: z.string().min(1),
});
const OrderSchema = z.discriminatedUnion('mode', [PendingSchema, FinalizeSchema]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function makeOrderNumber() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `ELS-${Date.now().toString(36).slice(-4).toUpperCase()}${n}`;
}

async function sendToFreshKds(order: any) {
  const token = Deno.env.get('FRESH_KDS_TOKEN');
  const locationId = Deno.env.get('FRESH_KDS_LOCATION_ID');
  const deviceId = Deno.env.get('FRESH_KDS_DEVICE_ID');
  if (!token || !locationId || !deviceId) {
    console.warn('Fresh KDS env vars missing, skipping kitchen dispatch');
    return false;
  }
  try {
    const res = await fetch('https://api.fresh.technology/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
    if (!res.ok) {
      console.error('Fresh KDS failed', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Fresh KDS error', err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // GET /submit-order?order_number=... -> lookup for confirmation page
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const orderNumber = url.searchParams.get('order_number');
    if (!orderNumber) return json({ error: 'order_number required' }, 400);
    const { data, error } = await supabase
      .from('orders')
      .select('order_number, customer_name, order_type, items, subtotal, tax, total, status, created_at, notes')
      .eq('order_number', orderNumber)
      .maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: 'Not found' }, 404);
    return json(data);
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const parsed = OrderSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const input = parsed.data;

  if (input.mode === 'pending_payment') {
    // Server-authoritative pricing
    const ids = input.items.map((i) => i.id);
    const { data: menuRows, error: menuErr } = await supabase
      .from('menu_items')
      .select('id, name, price, available')
      .in('id', ids);
    if (menuErr) return json({ error: menuErr.message }, 500);

    const priceMap = new Map((menuRows ?? []).map((r) => [r.id, r]));
    const orderItems: any[] = [];
    let subtotal = 0;
    for (const it of input.items) {
      const row = priceMap.get(it.id);
      if (!row || !row.available) return json({ error: `Item unavailable: ${it.id}` }, 400);
      subtotal += Number(row.price) * it.quantity;
      orderItems.push({ id: row.id, name: row.name, price: Number(row.price), quantity: it.quantity });
    }
    subtotal = Math.round(subtotal * 100) / 100;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const order_number = makeOrderNumber();
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        order_type: input.order_type,
        notes: input.notes,
        items: orderItems,
        subtotal,
        tax,
        total,
        status: 'pending',
        payment_ref: order_number,
      })
      .select()
      .single();
    if (error) return json({ error: error.message }, 500);

    const payBase = Deno.env.get('PAYANYWHERE_CHECKOUT_URL') ?? '';
    const payment_url = payBase
      ? `${payBase}${payBase.includes('?') ? '&' : '?'}reference=${encodeURIComponent(order_number)}&amount=${total}`
      : null;

    return json({ order_number, total, payment_url, order: data });
  }

  // finalize: mark paid + dispatch to KDS
  if (!input.order_number) return json({ error: 'order_number required' }, 400);
  const { data: existing, error: findErr } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', input.order_number)
    .maybeSingle();
  if (findErr) return json({ error: findErr.message }, 500);
  if (!existing) return json({ error: 'Order not found' }, 404);

  if (!existing.fresh_kds_sent) {
    const ok = await sendToFreshKds(existing);
    await supabase
      .from('orders')
      .update({
        status: ok ? 'sent_to_kitchen' : 'paid',
        fresh_kds_sent: ok,
      })
      .eq('id', existing.id);
  }
  return json({ order_number: existing.order_number, status: 'paid' });
});
