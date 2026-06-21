import { createFileRoute } from "@tanstack/react-router";
import { Flame, MapPin, Phone, Clock, Instagram, UtensilsCrossed, ShoppingBag } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import dishImg from "@/assets/IMG_9676.jpeg";
import menuImg from "@/assets/IMG_9680.jpeg";
import empanadaImg from "@/assets/IMG_9681.jpeg";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  component: Home,
});

const DOORDASH_URL = "https://www.doordash.com/en/store/el-saz%C3%B3n-de-nere-katy-34548993/108361599/";
const PHONE = "281-932-7408";
const ADDRESS = "1520 S Mason Rd, Katy, TX 77450";

const platosFuertes = [
  { name: "Pollo Guisado", desc: "Estofado de pollo en salsa criolla, con arroz y caraotas.", price: "16" },
  { name: "Bollos Pelones", desc: "Bolitas de masa rellenas de carne en salsa.", price: "15" },
  { name: "Chivo en Coco", desc: "Chivo guisado en leche de coco — especialidad de la casa.", price: "23" },
  { name: "Sierra Frita", desc: "Pescado sierra frito, dorado y crujiente.", price: "20" },
  { name: "Picada El Sazón", desc: "Tabla surtida para compartir — la mejor de Katy.", price: "24" },
  { name: "Pabellón Criollo", desc: "Carne mechada, arroz, caraotas y plátano frito.", price: "18" },
  { name: "Sopa de Res", desc: "Sopa casera con verduras y carne tierna.", price: "12.50" },
  { name: "Lomo Negro", desc: "Lomo en salsa oscura, con guarnición.", price: "19" },
];

const desayunos = [
  { name: "Desayuno Criollo", desc: "Carne mechada, perico, queso y arepa." },
  { name: "Arepa Reina Pepiada", desc: "Pollo con aguacate cremoso." },
  { name: "Cachapa con Queso", desc: "Tortilla dulce de maíz con queso de mano." },
  { name: "Empanadas", desc: "Queso, pollo, carne mechada, caraotas o carne molida." },
];

const pasapalos = ["Tequeños", "Empanadas", "Mandocas", "Pinchos de Pollo", "Alitas", "Mini Hamburguesas"];

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <About />
      <Specialties />
      <Menu />
      <Catering />
      <Visit />
      <Footer />
    </div>
  );
}

function Header() {
  const links = [
    { href: "#menu", label: "Menú" },
    { href: "#especialidades", label: "Especialidades" },
    { href: "#catering", label: "Catering" },
    { href: "#visitanos", label: "Visítanos" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <a href="#top" className="flex items-center">
          <img
            src={logoImg}
            alt="El Sazón De Las Mercedes"
            width={240}
            height={96}
            className="h-20 w-auto object-contain"
          />
        </a>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
          {links.map(l => (
            <a key={l.href} href={l.href} className="transition hover:text-foreground">{l.label}</a>
          ))}
        </nav>
        <a
          href={DOORDASH_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <ShoppingBag className="h-4 w-4" /> Ordenar
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-hero-gradient">
      <div className="absolute inset-0 opacity-50">
        <img src={heroImg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
      </div>
      <div className="relative mx-auto max-w-7xl px-5 pt-20 pb-28 md:pt-32 md:pb-40">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-background/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-secondary backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Katy, Texas · Venezolano
          </span>
          <h1 className="mt-6 font-display text-6xl leading-[0.9] md:text-8xl">
            Como hecho
            <br />
            <span className="text-flame-gradient">en casa.</span>
          </h1>
          <p className="mt-3 font-script text-3xl text-secondary md:text-4xl">El sazón que extrañabas</p>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
            Arepas calientitas, empanadas doraditas y los platos venezolanos que te transportan a casa.
            Hecho con cariño en el corazón de Katy.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={DOORDASH_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-flame-gradient px-6 py-3.5 text-base font-semibold text-charcoal shadow-flame transition hover:scale-[1.02]"
            >
              <ShoppingBag className="h-5 w-5" /> Ordenar en DoorDash
            </a>
            <a
              href={`tel:${PHONE.replace(/-/g, "")}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3.5 text-base font-semibold text-foreground backdrop-blur transition hover:bg-card"
            >
              <Phone className="h-5 w-5" /> {PHONE}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="border-y border-border/60 bg-card/40 py-16 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-3">
        {[
          { icon: Flame, title: "Recetas Familiares", text: "Cada plato lleva el sazón de tres generaciones de cocina venezolana." },
          { icon: UtensilsCrossed, title: "Ingredientes Frescos", text: "Cocinamos a diario con ingredientes seleccionados — sin atajos." },
          { icon: ShoppingBag, title: "Pickup & Delivery", text: "Pide en el local, por teléfono o a domicilio con DoorDash." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-flame-gradient text-charcoal shadow-flame">
              <Icon className="h-6 w-6" strokeWidth={2.2} />
            </span>
            <div>
              <h3 className="text-2xl">{title}</h3>
              <p className="mt-1 text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Specialties() {
  const items = [
    { img: dishImg, title: "Pabellón Criollo", tag: "Plato nacional" },
    { img: menuImg, title: "Menú del Día", tag: "Cachapa · Arepa · Desayuno" },
    { img: empanadaImg, title: "Empanadas Recién Hechas", tag: "Con guasacaca de la casa" },
  ];
  return (
    <section id="especialidades" className="mx-auto max-w-7xl px-5 py-20 md:py-28">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="font-script text-2xl text-secondary">Lo que nos hace famosos</p>
          <h2 className="mt-1 text-5xl md:text-6xl">Especialidades</h2>
        </div>
        <span className="hidden h-1 flex-1 bg-flame-gradient md:block" />
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {items.map((it) => (
          <article key={it.title} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-secondary/60">
            <div className="aspect-[4/5] overflow-hidden">
              <img src={it.img} alt={it.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-secondary">{it.tag}</p>
              <h3 className="mt-1 text-2xl">{it.title}</h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Menu() {
  return (
    <section id="menu" className="border-y border-border/60 bg-card/30 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="font-script text-2xl text-secondary">Carta</p>
          <h2 className="mt-1 text-5xl md:text-6xl">Nuestro Menú</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Una selección de favoritos. El menú completo y precios actualizados están en DoorDash.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="flex items-baseline gap-3 text-3xl">
              Platos Principales
              <span className="h-px flex-1 bg-border" />
            </h3>
            <ul className="mt-6 space-y-5">
              {platosFuertes.map((p) => (
                <li key={p.name} className="flex items-baseline gap-4">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h4 className="font-display text-xl tracking-wide">{p.name}</h4>
                      <span className="flex-1 border-b border-dashed border-border/70" />
                      <span className="font-display text-xl text-secondary">${p.price}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{p.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-10">
            <div>
              <h3 className="flex items-baseline gap-3 text-3xl">
                Desayunos & Arepas
                <span className="h-px flex-1 bg-border" />
              </h3>
              <ul className="mt-6 space-y-5">
                {desayunos.map((p) => (
                  <li key={p.name}>
                    <h4 className="font-display text-xl tracking-wide">{p.name}</h4>
                    <p className="mt-0.5 text-sm text-muted-foreground">{p.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="flex items-baseline gap-3 text-3xl">
                Pasapalos
                <span className="h-px flex-1 bg-border" />
              </h3>
              <div className="mt-6 flex flex-wrap gap-2">
                {pasapalos.map((t) => (
                  <span key={t} className="rounded-full border border-secondary/40 bg-background/50 px-4 py-1.5 text-sm text-secondary">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 text-center">
          <a
            href={DOORDASH_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-flame-gradient px-6 py-3.5 font-semibold text-charcoal shadow-flame transition hover:scale-[1.02]"
          >
            Ver menú completo en DoorDash
          </a>
        </div>
      </div>
    </section>
  );
}

function Catering() {
  return (
    <section id="catering" className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 -z-10 opacity-30">
        <img src={heroImg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
      </div>
      <div className="mx-auto max-w-7xl px-5">
        <div className="max-w-2xl">
          <p className="font-script text-2xl text-secondary">Eventos & Pedidos Grandes</p>
          <h2 className="mt-1 text-5xl md:text-6xl">Catering para tus mejores eventos</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Bandejas de tequeños, empanadas, pasticho, arroz con pollo, pollo al grill, carne mechada,
            lomo negro, fajitas y más. Hacemos que tu evento sepa a casa.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={`tel:${PHONE.replace(/-/g, "")}`}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <Phone className="h-4 w-4" /> Llamar para cotizar
            </a>
            <a
              href={`https://wa.me/12819327408`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-secondary/60 px-5 py-3 font-semibold text-secondary transition hover:bg-secondary/10"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Visit() {
  return (
    <section id="visitanos" className="border-t border-border/60 bg-card/40 py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2">
        <div>
          <p className="font-script text-2xl text-secondary">Te esperamos</p>
          <h2 className="mt-1 text-5xl md:text-6xl">Visítanos</h2>
          <div className="mt-8 space-y-5">
            <InfoRow icon={MapPin} label="Dirección" value={ADDRESS} href="https://maps.google.com/?q=1520+S+Mason+Rd+Katy+TX+77450" />
            <InfoRow icon={Phone} label="Teléfono" value={PHONE} href={`tel:${PHONE.replace(/-/g, "")}`} />
            <InfoRow icon={Clock} label="Horario" value={"Lun – Sáb · 8:30 AM – 6:00 PM"} />
            <InfoRow icon={Instagram} label="Instagram" value="@elsazondelasmercedes" href="https://www.instagram.com/elsazondelasmercedes" />
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border shadow-flame">
          <iframe
            title="Mapa El Sazón de las Mercedes"
            src="https://www.google.com/maps?q=1520+S+Mason+Rd+Katy+TX+77450&output=embed"
            className="h-full min-h-[360px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon: Icon, label, value, href }: { icon: typeof MapPin; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-flame-gradient text-charcoal shadow-flame">
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-lg text-foreground">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="block transition hover:opacity-80">
      {content}
    </a>
  ) : content;
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-sm text-muted-foreground md:flex-row">
        <p className="font-display text-lg tracking-wide text-foreground">
          El Sazón <span className="text-flame-gradient">De Las Mercedes</span> · Mateo 4:4
        </p>
        <p>© {new Date().getFullYear()} — Como hecho en casa. Katy, TX.</p>
      </div>
    </footer>
  );
}
