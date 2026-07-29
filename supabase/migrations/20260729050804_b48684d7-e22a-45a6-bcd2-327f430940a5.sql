CREATE TABLE public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(8,2) not null,
  category text not null,
  available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read available" ON public.menu_items FOR SELECT USING (available = true);

CREATE TABLE public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  created_at timestamptz not null default now(),
  customer_name text not null,
  customer_phone text not null,
  order_type text not null check (order_type in ('pickup','delivery')),
  items jsonb not null,
  subtotal numeric(8,2) not null,
  tax numeric(8,2) not null default 0,
  total numeric(8,2) not null,
  notes text,
  status text not null default 'pending',
  payment_ref text unique,
  fresh_kds_sent boolean not null default false
);
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;