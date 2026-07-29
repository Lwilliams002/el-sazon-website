import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const secret = Deno.env.get('PAYANYWHERE_WEBHOOK_SECRET');
  const provided = req.headers.get('x-webhook-secret');
  if (!secret || provided !== secret) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
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
