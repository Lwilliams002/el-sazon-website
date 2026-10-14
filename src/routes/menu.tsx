import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Search, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/lib/cart';
import { FloatingCart } from '@/components/FloatingCart';
import logoImg from '@/assets/logo.png';

export const Route = createFileRoute('/menu')({ component: MenuPage });
type MenuItem = { id: string; name: string; description: string | null; price: number; category: string };
function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCat, setActiveCat] = useState('all');
  const [query, setQuery] = useState('');
  const add = useCart(s => s.add);
  const cartItems = useCart(s => s.items);
  const count = cartItems.reduce((n, i) => n + i.quantity, 0);
  async function loadMenu() {
    setLoading(true); setError(false);
    const { data, error: err } = await supabase.from('menu_items').select('id, name, description, price, category').eq('available', true).order('category').order('name');
    setItems((data as MenuItem[]) ?? []); setError(Boolean(err)); setLoading(false);
  }
  useEffect(() => { void loadMenu(); }, []);
  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category))).sort(), [items]);
  const grouped = useMemo(() => {
    const g: Record<string, MenuItem[]> = {};
    const term = query.toLocaleLowerCase().trim();
    for (const i of items) if ((activeCat === 'all' || i.category === activeCat) && (!term || `${i.name} ${i.description ?? ''}`.toLocaleLowerCase().includes(term))) (g[i.category] ||= []).push(i);
    return g;
  }, [items, activeCat, query]);
  return <div className="min-h-screen bg-background pb-32 text-foreground">
    <header className="border-b border-border bg-background"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-2"><Button asChild variant="ghost" className="px-0"><Link to="/"><ArrowLeft /> Inicio</Link></Button><Link to="/" aria-label="El Sazón de las Mercedes"><img src={logoImg} alt="El Sazón de las Mercedes" className="h-20 w-32 object-contain" /></Link><Button asChild variant="outline"><Link to="/checkout" aria-label={`Carrito, ${count} artículos`}><ShoppingBag /><span>{count}</span></Link></Button></div></header>
    <main className="mx-auto max-w-6xl px-5 py-8 md:py-12"><p className="mb-2 text-sm font-semibold text-secondary">EL SAZÓN DE LAS MERCEDES</p><h1 className="text-3xl md:text-4xl">Menú para ordenar</h1>
      <div className="relative mt-6 max-w-xl"><Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" /><input aria-label="Buscar en el menú" type="search" placeholder="Buscar un plato…" value={query} onChange={e => setQuery(e.target.value)} className="h-12 w-full rounded-md border border-input bg-background pl-11 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
      <nav aria-label="Categorías del menú" className="sticky top-0 z-30 -mx-5 mt-6 overflow-x-auto border-y border-border bg-background px-5"><div className="flex w-max gap-1 py-2"><Button variant={activeCat === 'all' ? 'default' : 'ghost'} onClick={() => setActiveCat('all')} aria-pressed={activeCat === 'all'}>Todos</Button>{categories.map(c => <Button key={c} variant={activeCat === c ? 'default' : 'ghost'} onClick={() => setActiveCat(c)} aria-pressed={activeCat === c}>{c}</Button>)}</div></nav>
      {loading && <p role="status" className="py-12 text-muted-foreground">Cargando menú…</p>}
      {error && <div role="alert" className="py-12"><p>No pudimos cargar el menú.</p><Button onClick={() => void loadMenu()} variant="outline" className="mt-4">Intentar de nuevo</Button></div>}
      {!loading && !error && Object.keys(grouped).length === 0 && <p role="status" className="py-12 text-muted-foreground">No encontramos platos para esta búsqueda.</p>}
      <div className="mt-8 space-y-10">{Object.entries(grouped).map(([cat, list]) => <section key={cat}><h2 className="border-b border-border pb-4 text-2xl">{cat} <span className="ml-2 text-base font-normal text-muted-foreground">{list.length}</span></h2><ul className="mt-4 grid gap-4 md:grid-cols-2">{list.map(item => {
        const qty = cartItems.find(c => c.id === item.id)?.quantity ?? 0;
        return <li key={item.id} className="flex min-w-0 flex-col justify-between rounded-lg border border-border bg-background p-5"><div><h3 className="break-words text-lg font-semibold">{item.name}</h3>{item.description && <p className="mt-2 text-muted-foreground">{item.description}</p>}</div><div className="mt-5 flex items-center justify-between gap-3"><p className="text-lg font-semibold tabular-nums">${Number(item.price).toFixed(2)}</p><Button variant="outline" onClick={() => add({ id: item.id, name: item.name, price: Number(item.price) })} aria-label={`Añadir ${item.name}`} className="border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"><Plus /> Añadir{qty > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground" aria-live="polite">{qty}</span>}</Button></div></li>;
      })}</ul></section>)}</div>
    </main><FloatingCart />
  </div>;
}
