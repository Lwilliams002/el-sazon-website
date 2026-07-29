import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/lib/cart';
import { FloatingCart } from '@/components/FloatingCart';
import logoImg from '@/assets/logo.png';

export const Route = createFileRoute('/menu')({
  component: MenuPage,
});

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
};

function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>('all');
  const add = useCart((s) => s.add);
  const cartItems = useCart((s) => s.items);

  useEffect(() => {
    supabase
      .from('menu_items')
      .select('id, name, description, price, category')
      .eq('available', true)
      .order('category')
      .order('name')
      .then(({ data }) => {
        setItems((data as MenuItem[]) ?? []);
        setLoading(false);
      });
  }, []);

  const grouped = useMemo(() => {
    const filtered = activeCat === 'all' ? items : items.filter((i) => i.category === activeCat);
    const g: Record<string, MenuItem[]> = {};
    for (const i of filtered) (g[i.category] ||= []).push(i);
    return g;
  }, [items, activeCat]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items],
  );

  const inCart = (id: string) => cartItems.some((c) => c.id === id);

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Inicio
          </Link>
          <img src={logoImg} alt="El Sazón de las Mercedes" className="h-14 w-auto object-contain" />
          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">
        <p className="font-script text-2xl text-secondary">Ordenar en línea</p>
        <h1 className="mt-1 text-4xl md:text-5xl">Nuestro Menú</h1>
        <p className="mt-2 text-muted-foreground">
          Recogida en el local o entrega. Selecciona lo que quieras y ve al carrito para pagar.
        </p>

        <div className="mt-6 -mx-5 overflow-x-auto px-5">
          <div className="flex gap-2 pb-2">
            <CatChip label="Todos" active={activeCat === 'all'} onClick={() => setActiveCat('all')} />
            {categories.map((c) => (
              <CatChip key={c} label={c} active={activeCat === c} onClick={() => setActiveCat(c)} />
            ))}
          </div>
        </div>

        {loading && <p className="mt-10 text-muted-foreground">Cargando menú…</p>}

        <div className="mt-8 space-y-12">
          {Object.entries(grouped).map(([cat, list]) => (
            <section key={cat}>
              <h2 className="flex items-baseline gap-3 text-2xl">
                {cat}
                <span className="h-px flex-1 bg-border" />
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {list.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card/50 p-4"
                  >
                    <div className="flex-1">
                      <h3 className="font-display text-lg tracking-wide">{item.name}</h3>
                      {item.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                      )}
                      <p className="mt-1 font-display text-lg text-secondary">
                        ${Number(item.price).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        add({ id: item.id, name: item.name, price: Number(item.price) })
                      }
                      className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-flame-gradient text-charcoal shadow-flame transition hover:scale-105"
                      aria-label={`Añadir ${item.name}`}
                    >
                      {inCart(item.id) ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <FloatingCart />
    </div>
  );
}

function CatChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition ${
        active
          ? 'border-secondary bg-secondary/15 text-secondary'
          : 'border-border bg-card/40 text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
