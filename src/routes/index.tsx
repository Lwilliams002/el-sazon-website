import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowRight, MapPin, Phone, Clock, Instagram, ShoppingBag, Menu as MenuIcon, X, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImg from '@/assets/hero.jpg';
import dishImg from '@/assets/IMG_9676.jpeg';
import menuImg from '@/assets/IMG_9680.jpeg';
import empanadaImg from '@/assets/IMG_9681.jpeg';
import logoImg from '@/assets/logo.png';

export const Route = createFileRoute('/')({ component: Home });
const PHONE = '281-932-7408';
const ADDRESS = '1520 S Mason Rd, Katy, TX 77450';
const links = [{ href: '#especialidades', label: 'Especialidades' }, { href: '#menu', label: 'Menú' }, { href: '#catering', label: 'Catering' }, { href: '#visitanos', label: 'Visítanos' }];

function Home() {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-2 md:px-8">
          <a href="#top" aria-label="El Sazón de las Mercedes, inicio"><img src={logoImg} alt="El Sazón de las Mercedes" className="h-20 w-32 object-contain md:h-24 md:w-40" /></a>
          <nav aria-label="Navegación principal" className="hidden items-center gap-7 font-semibold md:flex">{links.map(l => <a key={l.href} href={l.href} className="transition-colors hover:text-primary">{l.label}</a>)}</nav>
          <div className="flex items-center gap-2">
            <Button asChild className="h-11 px-4"><Link to="/menu"><ShoppingBag /> Ordenar</Link></Button>
            <Button variant="ghost" size="icon" className="h-11 w-11 md:hidden" aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}>{navOpen ? <X /> : <MenuIcon />}</Button>
          </div>
        </div>
        {navOpen && <nav aria-label="Navegación móvil" className="grid border-t border-border px-5 py-3 md:hidden">{links.map(l => <a key={l.href} href={l.href} onClick={() => setNavOpen(false)} className="py-3 font-semibold">{l.label}</a>)}</nav>}
      </header>

      <section id="top" className="hero-contrast relative isolate overflow-hidden">
        <img src={heroImg} alt="Platos venezolanos con arepas, empanadas y pabellón criollo" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" fetchPriority="high" />
        <div className="hero-overlay absolute inset-0 -z-10" />
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="max-w-2xl">
            <p className="mb-5 flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-gold" /> COCINA VENEZOLANA · KATY, TEXAS</p>
            <h1 className="text-4xl leading-tight md:text-6xl">El Sazón de<br />las Mercedes</h1>
            <p className="mt-4 font-script text-3xl text-gold md:text-4xl">Como hecho en casa.</p>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">Arepas calientitas, empanadas doraditas y tus favoritos venezolanos. El sabor de casa, aquí en Katy.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 bg-accent px-6 text-accent-foreground hover:bg-accent/90"><Link to="/menu"><ShoppingBag /> Ordenar en línea <ArrowRight /></Link></Button>
              <Button asChild variant="outline" size="lg" className="h-12 border-foreground/50 bg-transparent px-5 text-foreground hover:bg-foreground/10 hover:text-foreground"><a href="tel:2819327408"><Phone /> {PHONE}</a></Button>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-border bg-muted">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 text-sm font-medium sm:grid-cols-3 md:px-8">
          <a href="#visitanos" className="flex items-center gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" /> {ADDRESS}</a>
          <p className="flex items-center gap-3"><Clock className="h-5 w-5 shrink-0 text-primary" /> Lun – Sáb · 8:30 AM – 6:00 PM</p>
          <p className="flex items-center gap-3"><UtensilsCrossed className="h-5 w-5 shrink-0 text-primary" /> Recogida y entrega</p>
        </div>
      </div>

      <section id="especialidades" className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 font-semibold text-secondary">EL SABOR DE VENEZUELA</p><h2 className="text-3xl md:text-4xl">Favoritos de la casa</h2></div><Button asChild variant="link" className="px-0"><Link to="/menu">Ver todo el menú <ArrowRight /></Link></Button></div>
        <div className="mt-8 grid gap-7 md:grid-cols-3">{[
          { img: dishImg, title: 'Pabellón Criollo', desc: 'Un clásico de la cocina venezolana.' },
          { img: menuImg, title: 'Menú del Día', desc: 'Cachapa, desayuno criollo y arepa reina pepiada.' },
          { img: empanadaImg, title: 'Empanadas', desc: 'Doraditas, con guasacaca de la casa.' },
        ].map(item => <article key={item.title}><Link to="/menu" className="group block"><div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted"><img src={item.img} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /></div><h3 className="mt-5 flex items-center justify-between gap-3 text-2xl">{item.title}<ArrowRight className="h-5 w-5 text-primary" /></h3><p className="mt-2 text-muted-foreground">{item.desc}</p></Link></article>)}</div>
      </section>

      <section id="menu" className="border-y border-border bg-muted py-14 md:py-16"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 px-5 md:flex-row md:items-center md:px-8"><div><p className="mb-2 font-semibold text-secondary">A TU GUSTO</p><h2 className="text-3xl md:text-4xl">¿Qué se te antoja hoy?</h2><p className="mt-3 text-lg text-muted-foreground">Arepas, desayunos, platos principales, pasapalos y más.</p></div><Button asChild size="lg" className="h-12 self-start md:self-auto"><Link to="/menu">Ver menú y ordenar <ArrowRight /></Link></Button></div></section>

      <section id="catering" className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:grid-cols-2 md:items-center md:gap-16 md:px-8 md:py-20"><img src={empanadaImg} alt="Empanadas venezolanas para compartir" loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" /><div><p className="mb-2 font-semibold text-secondary">PARA COMPARTIR</p><h2 className="text-3xl md:text-4xl">Tu evento, con nuestro sazón.</h2><p className="mt-4 text-lg text-muted-foreground">Bandejas de tequeños, empanadas, pasticho, arroz con pollo, carne mechada y más. Catering para tus mejores momentos.</p><div className="mt-7 flex flex-wrap gap-3"><Button asChild className="h-12"><a href="tel:2819327408"><Phone /> Llamar para cotizar</a></Button><Button asChild variant="outline" className="h-12"><a href="https://wa.me/12819327408" target="_blank" rel="noreferrer">WhatsApp <ArrowRight /></a></Button></div></div></section>

      <section id="visitanos" className="border-t border-border bg-muted py-14 md:py-20"><div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2 md:px-8"><div><p className="mb-2 font-semibold text-secondary">TE ESPERAMOS</p><h2 className="text-3xl md:text-4xl">Visítanos en Katy</h2><div className="mt-7 space-y-5"><Info icon={MapPin} label="Dirección" value={ADDRESS} href="https://maps.google.com/?q=1520+S+Mason+Rd+Katy+TX+77450" /><Info icon={Clock} label="Horario" value="Lun – Sáb · 8:30 AM – 6:00 PM" /><Info icon={Phone} label="Teléfono" value={PHONE} href="tel:2819327408" /><Info icon={Instagram} label="Instagram" value="@elsazondelasmercedes" href="https://www.instagram.com/elsazondelasmercedes" /></div></div><iframe title="Mapa El Sazón de las Mercedes" src="https://www.google.com/maps?q=1520+S+Mason+Rd+Katy+TX+77450&output=embed" className="h-96 w-full rounded-lg border border-border" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div></section>
      <footer className="border-t border-border py-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 md:px-8"><p className="font-semibold">El Sazón de las Mercedes <span className="font-normal text-muted-foreground">· Mateo 4:4</span></p><p className="text-sm text-muted-foreground">© {new Date().getFullYear()} · Katy, TX</p></div></footer>
    </div>
  );
}
function Info({ icon: Icon, label, value, href }: { icon: typeof MapPin; label: string; value: string; href?: string }) {
  const content = <div className="flex items-start gap-3"><Icon className="mt-1 h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm text-muted-foreground">{label}</p><p className="break-words font-medium">{value}</p></div></div>;
  return href ? <a href={href} className="block hover:text-primary" target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{content}</a> : content;
}
