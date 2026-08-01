import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { useCart } from '@/lib/cart';
import { supabase } from '@/integrations/supabase/client';
import logoImg from '@/assets/logo.png';

// North Embedded Checkout library (loaded at runtime). It attaches a global
// `checkout` object with `mount` and `onPaymentComplete`.
const NORTH_CHECKOUT_JS = 'https://checkout.north.com/checkout.js';

declare global {
  interface Window {
    checkout?: {
      mount: (token: string, containerId: string) => Promise<void> | void;
      onPaymentComplete: (cb: (data: unknown) => void) => (() => void) | void;
    };
  }
}

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
});

const TAX_RATE = 0.0825;

const FormSchema = z.object({
  customer_name: z.string().trim().min(1, 'Nombre requerido').max(120),
  customer_phone: z
    .string()
    .trim()
    .min(7, 'Teléfono requerido')
    .max(30)
    .regex(/^[+()\d\s-]+$/, 'Teléfono inválido'),
  order_type: z.enum(['pickup', 'delivery']),
  notes: z.string().trim().max(500).optional(),
});

function CheckoutPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    order_type: 'pickup' as 'pickup' | 'delivery',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutToken, setCheckoutToken] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  // Load North's checkout.js once.
  useEffect(() => {
    if (window.checkout) {
      setScriptReady(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${NORTH_CHECKOUT_JS}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => setScriptReady(true));
      return;
    }
    const s = document.createElement('script');
    s.src = NORTH_CHECKOUT_JS;
    s.async = true;
    s.onload = () => setScriptReady(true);
    document.head.appendChild(s);
  }, []);

  // Mount the embedded checkout form once we have a session token and the script.
  useEffect(() => {
    if (!checkoutToken || !scriptReady || !window.checkout) return;
    Promise.resolve(window.checkout.mount(checkoutToken, 'north-checkout-container')).catch(
      (e) => {
        console.error('North mount failed', e);
        setError('No se pudo cargar el formulario de pago');
      },
    );
    const unsub = window.checkout.onPaymentComplete(() => {
      // Fulfillment is confirmed server-side via the webhook; just move the
      // customer to the confirmation page.
      navigate({ to: '/order-confirmation', search: { order: orderNumber ?? '' } });
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [checkoutToken, scriptReady, orderNumber, navigate]);

  if (items.length === 0) {
    return (
      <EmptyLayout>
        <h1 className="mt-6 text-3xl">Tu carrito está vacío</h1>
        <p className="mt-2 text-muted-foreground">Añade platos desde el menú para ordenar.</p>
        <Link
          to="/menu"
          className="mt-6 inline-flex rounded-full bg-flame-gradient px-5 py-3 font-semibold text-charcoal shadow-flame"
        >
          Ver menú
        </Link>
      </EmptyLayout>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = FormSchema.safeParse(form);
    if (!parsed.success) {
      setError(Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? 'Datos inválidos');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('submit-order', {
        body: {
          mode: 'pending_payment',
          ...parsed.data,
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        },
      });
      if (fnError) throw fnError;
      const createdOrder = (data as any)?.order_number as string | undefined;
      if (!createdOrder) throw new Error('No se pudo crear la orden');

      try {
        localStorage.setItem('last_order_number', createdOrder);
      } catch {
        /* ignore */
      }

      // Create a North Embedded Checkout session (amount locked server-side).
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
        'create-checkout',
        { body: { order_number: createdOrder } },
      );
      // Surface the real error body from the function (invoke hides it by default).
      if (sessionError) {
        let detail = sessionError.message;
        try {
          const ctx = (sessionError as any)?.context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            detail = body?.error ? JSON.stringify(body.error) : detail;
          }
        } catch {
          /* ignore */
        }
        console.error('create-checkout error:', detail, sessionData);
        throw new Error(detail);
      }
      console.log('create-checkout response:', sessionData);
      const token = (sessionData as any)?.token as string | null;
      if (!token) throw new Error('El pago no devolvió un token (revisa los logs de create-checkout)');

      // Switch the UI to the embedded payment form (mounted by the effect).
      setOrderNumber(createdOrder);
      setCheckoutToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la orden');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <Link to="/menu" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Seguir ordenando
          </Link>
          <img src={logoImg} alt="El Sazón de las Mercedes" className="h-14 w-auto object-contain" />
          <div className="w-32" />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-8">
        <h1 className="text-4xl md:text-5xl">Checkout</h1>

        <div className="mt-8 grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <section>
            <h2 className="text-xl">Tu orden</h2>
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card/40">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 p-4">
                  <div className="flex-1">
                    <p className="font-display tracking-wide">{it.name}</p>
                    <p className="text-sm text-muted-foreground">${it.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-border">
                    <button
                      onClick={() => setQty(it.id, it.quantity - 1)}
                      className="p-2 hover:text-secondary"
                      aria-label="Quitar uno"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm">{it.quantity}</span>
                    <button
                      onClick={() => setQty(it.id, it.quantity + 1)}
                      className="p-2 hover:text-secondary"
                      aria-label="Añadir uno"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="w-16 text-right font-display">${(it.price * it.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => remove(it.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <dl className="mt-6 space-y-2 text-sm">
              <Row label="Subtotal" value={subtotal} />
              <Row label={`Impuesto (${(TAX_RATE * 100).toFixed(2)}%)`} value={tax} />
              <div className="flex justify-between border-t border-border pt-3 text-lg">
                <dt className="font-display">Total</dt>
                <dd className="font-display text-secondary">${total.toFixed(2)}</dd>
              </div>
            </dl>
          </section>

          {checkoutToken ? (
            <section className="space-y-4">
              <h2 className="text-xl">Pago</h2>
              <div
                id="north-checkout-container"
                className="min-h-[600px] rounded-2xl border border-border bg-card/40"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <p className="text-center text-xs text-muted-foreground">
                Pago procesado de forma segura por North. El total no puede modificarse.
              </p>
            </section>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl">Tus datos</h2>
              <Field
                label="Nombre"
                value={form.customer_name}
                onChange={(v) => setForm((f) => ({ ...f, customer_name: v }))}
                required
              />
              <Field
                label="Teléfono"
                value={form.customer_phone}
                onChange={(v) => setForm((f) => ({ ...f, customer_phone: v }))}
                placeholder="281-555-1234"
                inputMode="tel"
                required
              />
              <div>
                <label className="text-sm text-muted-foreground">Tipo de orden</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(['pickup', 'delivery'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, order_type: t }))}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        form.order_type === t
                          ? 'border-secondary bg-secondary/15 text-secondary'
                          : 'border-border bg-card/40 text-muted-foreground'
                      }`}
                    >
                      {t === 'pickup' ? 'Recoger' : 'Entrega'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Notas (opcional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  maxLength={500}
                  className="mt-1 w-full rounded-lg border border-border bg-card/40 p-3 text-sm outline-none focus:border-secondary"
                  placeholder="Alergias, instrucciones, etc."
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-full bg-flame-gradient px-6 py-3.5 font-semibold text-charcoal shadow-flame transition hover:scale-[1.01] disabled:opacity-60"
              >
                {submitting ? 'Procesando…' : `Pagar $${total.toFixed(2)}`}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                Pago seguro con North. El total ya incluye impuestos.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>${value.toFixed(2)}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <div>
      <label className="text-sm text-muted-foreground">{label}</label>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-card/40 p-3 text-sm outline-none focus:border-secondary"
      />
    </div>
  );
}

function EmptyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <img src={logoImg} alt="" className="mx-auto h-20 w-auto" />
        {children}
      </div>
    </div>
  );
}
