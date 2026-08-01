import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { z } from 'zod';
import { useCart } from '@/lib/cart';
import logoImg from '@/assets/logo.png';

const search = z.object({ order: z.string().optional() });

export const Route = createFileRoute('/order-confirmation')({
  validateSearch: search.parse,
  component: Confirmation,
});

type OrderData = {
  order_number: string;
  customer_name: string;
  order_type: 'pickup' | 'delivery';
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  notes: string | null;
};

function Confirmation() {
  const searchParams = Route.useSearch();
  const clear = useCart((s) => s.clear);
  const [data, setData] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let order = searchParams.order;
    if (!order) {
      try {
        order = localStorage.getItem('last_order_number') ?? undefined;
      } catch {
        /* ignore */
      }
    }
    if (!order) {
      setError('Falta el número de orden');
      return;
    }
    // Clear cart once we land on confirmation
    clear();

    let cancelled = false;
    const base = import.meta.env.VITE_SUPABASE_URL as string;
    const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

    // Fire-and-forget: finalize order (mark paid, send to kitchen)
    fetch(`${base}/functions/v1/submit-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey },
      body: JSON.stringify({ mode: 'finalize', order_number: order }),
    }).catch(() => {});

    // Fetch order details for display
    (async () => {
      try {
        const res = await fetch(
          `${base}/functions/v1/submit-order?order_number=${encodeURIComponent(order!)}`,
          { headers: { apikey } },
        );
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as OrderData;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [order, clear]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <img src={logoImg} alt="El Sazón de las Mercedes" className="mx-auto h-20 w-auto" />
        <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-flame-gradient text-charcoal shadow-flame">
          <CheckCircle2 className="h-8 w-8" strokeWidth={2.2} />
        </div>
        <h1 className="mt-6 text-4xl md:text-5xl">¡Gracias!</h1>
        <p className="mt-2 text-muted-foreground">
          Tu orden fue recibida. Te avisaremos cuando esté lista.
        </p>

        {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

        {data && (
          <div className="mt-8 rounded-2xl border border-border bg-card/40 p-6 text-left">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Orden</p>
                <p className="font-display text-2xl text-secondary">{data.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tipo</p>
                <p className="font-display text-lg">
                  {data.order_type === 'pickup' ? 'Recoger' : 'Entrega'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm">
              <Clock className="h-4 w-4 text-secondary" />
              <span>
                Tiempo estimado:{' '}
                <strong>{data.order_type === 'pickup' ? '20–30 min' : '35–50 min'}</strong>
              </span>
            </div>

            <ul className="mt-5 space-y-2 text-sm">
              {data.items.map((it, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>
                    {it.quantity}× {it.name}
                  </span>
                  <span>${(it.price * it.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
              <Row label="Subtotal" v={data.subtotal} />
              <Row label="Impuesto" v={data.tax} />
              <Row label="Total" v={data.total} bold />
            </div>

            {data.notes && (
              <p className="mt-4 rounded-lg bg-background/60 p-3 text-sm text-muted-foreground">
                <strong>Notas:</strong> {data.notes}
              </p>
            )}
          </div>
        )}

        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex rounded-full border border-border bg-card/40 px-5 py-3 font-semibold text-foreground"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, v, bold }: { label: string; v: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-display text-base text-secondary' : ''}`}>
      <span className={bold ? '' : 'text-muted-foreground'}>{label}</span>
      <span>${v.toFixed(2)}</span>
    </div>
  );
}
