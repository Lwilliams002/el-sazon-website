import { Link } from '@tanstack/react-router';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart';

export function FloatingCart() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const subtotal = useCart((s) => s.items.reduce((n, i) => n + i.price * i.quantity, 0));
  if (count === 0) return null;
  return (
    <Button asChild className="fixed bottom-5 left-1/2 z-50 h-auto w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 rounded-lg py-4 shadow-flame">
    <Link
      to="/checkout"
      className="flex items-center justify-between gap-3"
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
        <ShoppingBag className="h-4 w-4" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-[11px] font-bold text-primary">
          {count}
        </span>
      </span>
      <span className="flex-1 text-left font-semibold">Ver carrito</span>
      <span className="font-display">${subtotal.toFixed(2)}</span>
    </Link>
    </Button>
  );
}
