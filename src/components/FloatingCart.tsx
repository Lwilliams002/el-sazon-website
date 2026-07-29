import { Link } from '@tanstack/react-router';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart';

export function FloatingCart() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const subtotal = useCart((s) => s.items.reduce((n, i) => n + i.price * i.quantity, 0));
  if (count === 0) return null;
  return (
    <Link
      to="/checkout"
      className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-flame-gradient px-5 py-3 text-charcoal shadow-flame transition hover:scale-[1.02]"
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-charcoal/20">
        <ShoppingBag className="h-4 w-4" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-charcoal text-[11px] font-bold text-primary-foreground">
          {count}
        </span>
      </span>
      <span className="font-semibold">Ver carrito</span>
      <span className="font-display">${subtotal.toFixed(2)}</span>
    </Link>
  );
}
