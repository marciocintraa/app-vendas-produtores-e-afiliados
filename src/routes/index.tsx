import { createFileRoute } from "@tanstack/react-router";
import { CHECKOUT_PLANS } from "@/lib/checkout-links";
import {
  Package,
  LayoutGrid,
  Megaphone,
  Bot,
  Target,
  Users,
  ShoppingCart,
  Wallet,
  BarChart3,
  Library,
  Link2,
  Bell,
  Palette,
  Check,
  X,
  ArrowRight,
  Smartphone,
  Monitor,
  Menu,
  ChevronDown,
  Store,
  QrCode,
  Share2,
} from "lucide-react";
import { useState } from "react";

const OFFER = CHECKOUT_PLANS[0];
const CHECKOUT_URL = OFFER.url;

const TITLE = "Vende Fácil PRO | Sua plataforma para organizar e vender produtos";
const DESCRIPTION =
  "Organize seus produtos, crie catálogos profissionais, divulgue suas ofertas e acompanhe seus resultados em um só lugar.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://vendefacillapp.com.br/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://vendefacillapp.com.br/" }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <BenefitStrip />
        <Features />
        <Differential />
        <Audience />
        <HowItWorks />
        <AppSection />
        <Offer />
        <FreeAccess />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------- HEADER ------------------------------- */

const NAV = [
  { label: "Início", href: "#inicio" },
  { label: "Recursos", href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Para quem é", href: "#publico" },
  { label: "FAQ", href: "#faq" },
];

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <a href="#inicio" className="flex shrink-0 items-center gap-2 font-display text-base font-bold sm:text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-primary-foreground">
            <Store className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="whitespace-nowrap">
            VENDE FÁCIL <span className="text-gradient">PRO</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/acesso"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            ENTRAR
          </a>
          <a href="#oferta" className="btn-primary !px-4 !py-2.5 text-sm">
            COMEÇAR AGORA
          </a>
        </div>

        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-white/5 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <a href="/acesso" className="btn-ghost text-sm">
                ENTRAR
              </a>
              <a href="#oferta" onClick={() => setOpen(false)} className="btn-primary text-sm">
                COMEÇAR AGORA
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* --------------------------------- HERO -------------------------------- */

function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden">
      <div className="container-page grid gap-14 pt-16 pb-20 md:pt-24 md:pb-28 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Package className="h-3.5 w-3.5 text-accent" />
            Plataforma para produtores e afiliados
          </span>

          <h1 className="mt-6 text-3xl font-bold leading-[1.08] sm:text-4xl md:text-5xl xl:text-[3.4rem]">
            Venda seus produtos de forma mais{" "}
            <span className="text-gradient">simples, profissional e organizada</span>.
          </h1>

          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Tenha em um só lugar as ferramentas para organizar seus produtos, criar catálogos,
            divulgar suas ofertas e acompanhar seus resultados.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href="#oferta" className="btn-primary text-sm sm:text-base">
              QUERO COMEÇAR AGORA
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#recursos" className="btn-ghost text-sm sm:text-base">
              CONHECER A PLATAFORMA
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Monitor className="h-4 w-4 text-accent" /> Acesso pelo navegador
            </span>
            <span className="inline-flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-accent" /> Aplicativo Android
            </span>
          </div>
        </div>

        <AppPreview />
      </div>
    </section>
  );
}

function AppPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand/25 via-transparent to-brand-2/20 blur-2xl"
      />
      <div className="card-glass relative overflow-hidden p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-3 truncate text-xs text-muted-foreground">vendefacillapp.com.br/app</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-[130px_1fr]">
          <div className="hidden flex-col gap-1.5 rounded-xl border border-border bg-background/50 p-3 sm:flex">
            {[
              { icon: LayoutGrid, label: "Painel" },
              { icon: Package, label: "Produtos" },
              { icon: Store, label: "Catálogos" },
              { icon: Megaphone, label: "Divulgação" },
              { icon: Bot, label: "IA VENDE+" },
              { icon: ShoppingCart, label: "Vendas" },
              { icon: BarChart3, label: "Relatórios" },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${
                  i === 0 ? "bg-white/8 text-foreground" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-xs text-muted-foreground">Seu painel</p>
              <p className="mt-1 font-display text-lg font-bold">Bem-vindo de volta</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { k: "Produtos", v: "12" },
                  { k: "Catálogos", v: "3" },
                  { k: "Links", v: "8" },
                ].map((s) => (
                  <div key={s.k} className="rounded-lg bg-white/5 p-2 text-center">
                    <p className="font-display text-base font-bold">{s.v}</p>
                    <p className="text-[10px] text-muted-foreground">{s.k}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold">Meu catálogo</p>
                <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[10px] text-muted-foreground">
                  <Share2 className="h-3 w-3" /> Compartilhar
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="overflow-hidden rounded-lg border border-border">
                    <div className="h-12 bg-gradient-to-br from-brand/35 to-brand-2/25" />
                    <div className="space-y-1 p-1.5">
                      <div className="h-1.5 w-full rounded bg-white/15" />
                      <div className="h-1.5 w-2/3 rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-xs font-semibold">Resultados</p>
              <div className="mt-3 flex h-16 items-end gap-1.5">
                {[35, 55, 40, 70, 60, 85, 75].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="flex-1 rounded-t bg-gradient-to-t from-brand/40 to-brand-2/70"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- BENEFIT STRIP ---------------------------- */

function BenefitStrip() {
  const items = [
    { icon: Package, label: "Seus produtos organizados" },
    { icon: Store, label: "Catálogos profissionais" },
    { icon: Megaphone, label: "Divulgação mais rápida" },
    { icon: BarChart3, label: "Controle dos seus resultados" },
  ];

  return (
    <section className="border-y border-border bg-white/[0.02]">
      <div className="container-page py-12 md:py-16">
        <h2 className="text-center font-display text-xl font-bold sm:text-2xl md:text-3xl">
          Mais organização. Mais praticidade. Mais controle sobre suas vendas.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="card-glass flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand/25 to-brand-2/20 text-accent">
                <item.icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold leading-snug">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- FEATURES ------------------------------ */

type Feature = {
  icon: typeof Package;
  eyebrow: string;
  title: string;
  text: string;
  points?: string[];
  wide?: boolean;
};

const FEATURES: Feature[] = [
  {
    icon: Package,
    eyebrow: "Produtos",
    title: "Organize todos os seus produtos",
    text: "Cadastre, edite e organize seus produtos em um único ambiente. Tenha informações importantes sempre à mão e controle o que está publicado.",
    points: ["Cadastro de produtos", "Categorias", "Preços", "Links de venda", "Status de publicação", "Organização por catálogo"],
    wide: true,
  },
  {
    icon: Store,
    eyebrow: "Meus catálogos",
    title: "Crie catálogos profissionais para cada público",
    text: "Organize seus produtos em diferentes catálogos e compartilhe cada vitrine com seu próprio link.",
    points: ["Até 5 catálogos", "Catálogo principal", "Catálogos por nicho", "Link próprio", "Compartilhamento", "QR Code", "Vitrine pública"],
    wide: true,
  },
  {
    icon: Megaphone,
    eyebrow: "Divulgação",
    title: "Transforme seus produtos em ofertas prontas para divulgar",
    text: "Crie conteúdos de divulgação com mais rapidez e mantenha suas campanhas organizadas.",
    points: ["Anúncios", "Legendas", "Textos para divulgação", "WhatsApp", "E-mail", "Redes sociais"],
  },
  {
    icon: Bot,
    eyebrow: "IA VENDE+",
    title: "IA VENDE+ — seu assistente para criar estratégias de venda",
    text: "Conte com inteligência artificial para analisar produtos, desenvolver ideias de divulgação e ajudar na criação de conteúdos comerciais.",
    points: ["Análise de ofertas", "Ideias de anúncios", "Textos de venda", "Legendas", "Estratégias"],
  },
  {
    icon: Target,
    eyebrow: "Vende Ads",
    title: "Crie campanhas com mais agilidade",
    text: "Tenha ferramentas para estruturar anúncios e campanhas de divulgação sem começar tudo do zero.",
  },
  {
    icon: Users,
    eyebrow: "Clientes",
    title: "Tenha seus clientes organizados",
    text: "Centralize informações importantes dos seus clientes e tenha uma visão mais organizada da sua operação.",
    points: ["Cadastro", "Organização", "Histórico", "Gestão"],
  },
  {
    icon: ShoppingCart,
    eyebrow: "Vendas",
    title: "Acompanhe suas vendas",
    text: "Tenha uma visão clara do que está acontecendo com seus produtos e acompanhe seus resultados.",
  },
  {
    icon: Wallet,
    eyebrow: "Financeiro",
    title: "Entenda seus números",
    text: "Organize suas informações financeiras e tenha uma visão mais clara do desempenho da sua operação.",
  },
  {
    icon: BarChart3,
    eyebrow: "Relatórios",
    title: "Transforme dados em decisões",
    text: "Visualize seus principais indicadores e acompanhe a evolução da sua operação.",
  },
  {
    icon: Library,
    eyebrow: "Biblioteca",
    title: "Tenha seus materiais organizados",
    text: "Centralize conteúdos e materiais importantes para facilitar sua rotina de vendas.",
  },
  {
    icon: Link2,
    eyebrow: "Links",
    title: "Organize seus links de divulgação",
    text: "Tenha seus principais links reunidos e acessíveis quando precisar divulgar seus produtos.",
  },
  {
    icon: Bell,
    eyebrow: "Avisos",
    title: "Não perca informações importantes",
    text: "Receba avisos e informações relevantes para acompanhar sua operação.",
  },
  {
    icon: Palette,
    eyebrow: "Personalização",
    title: "Deixe sua experiência com a sua cara",
    text: "Personalize elementos da sua operação e mantenha sua apresentação profissional.",
  },
];

function Features() {
  return (
    <section id="recursos" className="container-page py-20 md:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-2xl font-bold sm:text-3xl md:text-4xl">
          Tudo o que você precisa para vender melhor, em um só lugar.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Chega de espalhar suas ferramentas entre vários sites, planilhas e aplicativos.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className={`card-glass group p-6 transition-transform duration-300 hover:-translate-y-1 md:p-7 ${
              f.wide ? "md:col-span-2" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand/30 to-brand-2/20 text-accent">
                <f.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {f.eyebrow}
                </p>
                <h3 className="mt-1 text-lg font-bold leading-snug md:text-xl">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>

                {f.points && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {f.points.map((p) => (
                      <li
                        key={p}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        <Check className="h-3 w-3 text-accent" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}

                {f.eyebrow === "Meus catálogos" && <CatalogVisual />}
                {f.eyebrow === "Relatórios" && <ChartVisual />}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CatalogVisual() {
  return (
    <div className="mt-5 rounded-xl border border-border bg-background/50 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {["Catálogo principal", "Finanças", "Marketing"].map((t, i) => (
          <span
            key={t}
            className={`rounded-lg px-2.5 py-1 text-xs ${
              i === 0 ? "bg-white/10 text-foreground" : "text-muted-foreground"
            }`}
          >
            {t}
          </span>
        ))}
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
          <QrCode className="h-3.5 w-3.5" /> QR Code
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-border">
            <div className="h-16 bg-gradient-to-br from-brand/35 to-brand-2/25" />
            <div className="space-y-1 p-2">
              <div className="h-1.5 w-full rounded bg-white/15" />
              <div className="h-1.5 w-1/2 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartVisual() {
  return (
    <div className="mt-5 rounded-xl border border-border bg-background/50 p-4">
      <div className="flex h-20 items-end gap-1.5">
        {[30, 45, 38, 62, 50, 72, 58, 80, 68, 90].map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}%` }}
            className="flex-1 rounded-t bg-gradient-to-t from-brand/40 to-brand-2/70"
          />
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- DIFFERENTIAL ---------------------------- */

function Differential() {
  const before = [
    "Produtos espalhados",
    "Links perdidos",
    "Catálogos improvisados",
    "Planilhas",
    "Ferramentas diferentes",
    "Dificuldade para acompanhar resultados",
  ];
  const after = [
    "Produtos organizados",
    "Catálogos profissionais",
    "Links centralizados",
    "Divulgação mais rápida",
    "Dados organizados",
    "Tudo em um único ambiente",
  ];

  return (
    <section className="border-y border-border bg-white/[0.02]">
      <div className="container-page py-20 md:py-24">
        <h2 className="text-center font-display text-2xl font-bold sm:text-3xl md:text-4xl">
          Menos ferramentas espalhadas. Mais controle.
        </h2>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background/40 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Antes</p>
            <ul className="mt-4 space-y-3">
              {before.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="card-glass p-6">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Depois</p>
            <ul className="mt-4 space-y-3">
              {after.map((a) => (
                <li key={a} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- AUDIENCE ------------------------------ */

function Audience() {
  const profiles = [
    { title: "Produtores", text: "Organize seus produtos e facilite sua operação.", icon: Package },
    { title: "Afiliados", text: "Tenha seus produtos e links de divulgação sempre organizados.", icon: Link2 },
    { title: "Gestores de tráfego", text: "Agilize a criação e organização das campanhas.", icon: Target },
    { title: "Quem está começando", text: "Tenha uma estrutura profissional sem precisar montar tudo do zero.", icon: Store },
  ];

  return (
    <section id="publico" className="container-page py-20 md:py-28">
      <h2 className="text-center font-display text-2xl font-bold sm:text-3xl md:text-4xl">
        Feito para quem vende produtos digitais
      </h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {profiles.map((p) => (
          <div key={p.title} className="card-glass p-6 transition-transform duration-300 hover:-translate-y-1">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand/30 to-brand-2/20 text-accent">
              <p.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-base font-bold uppercase tracking-wide">{p.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- HOW IT WORKS ---------------------------- */

function HowItWorks() {
  const steps = [
    "Entre no Vende Fácil PRO",
    "Cadastre seus produtos",
    "Organize seus catálogos",
    "Divulgue suas ofertas",
    "Acompanhe seus resultados",
  ];

  return (
    <section id="como-funciona" className="border-y border-border bg-white/[0.02]">
      <div className="container-page py-20 md:py-24">
        <h2 className="text-center font-display text-2xl font-bold sm:text-3xl md:text-4xl">
          Comece em poucos passos
        </h2>

        <ol className="relative mx-auto mt-12 max-w-3xl space-y-6 border-l border-border pl-8">
          {steps.map((s, i) => (
            <li key={s} className="relative">
              <span className="absolute -left-[2.65rem] grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 font-display text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div className="card-glass p-4">
                <p className="text-sm font-semibold sm:text-base">{s}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ----------------------------- APP SECTION ----------------------------- */

function AppSection() {
  const items = [
    "Acesso pelo celular",
    "Produtos organizados",
    "Catálogos e vitrines",
    "Ferramentas de divulgação",
    "Acompanhamento de vendas",
  ];

  return (
    <section className="container-page py-20 md:py-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl md:text-4xl">
            Seu negócio na palma da mão
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Use o Vende Fácil PRO direto no navegador, no computador ou no celular. Compradores
            também recebem o aplicativo Android para instalar no aparelho.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {items.map((i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 shrink-0 text-accent" />
                {i}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-white/5 px-4 py-2.5 text-sm">
              <Monitor className="h-4 w-4 text-accent" /> Versão Web
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-white/5 px-4 py-2.5 text-sm">
              <Smartphone className="h-4 w-4 text-accent" /> Aplicativo Android
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[280px]">
          <div className="card-glass overflow-hidden rounded-[2rem] p-3">
            <div className="rounded-[1.5rem] border border-border bg-background/60 p-4">
              <p className="text-xs text-muted-foreground">Vende Fácil PRO</p>
              <p className="mt-1 font-display text-lg font-bold">Meu painel</p>
              <div className="mt-4 space-y-2">
                {[
                  { icon: Package, label: "Meus produtos" },
                  { icon: Store, label: "Meus catálogos" },
                  { icon: Megaphone, label: "Divulgação" },
                  { icon: BarChart3, label: "Resultados" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 rounded-xl border border-border bg-white/5 px-3 py-2.5 text-sm"
                  >
                    <row.icon className="h-4 w-4 text-accent" />
                    {row.label}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-gradient-to-br from-brand/30 to-brand-2/20 p-3">
                <div className="h-1.5 w-2/3 rounded bg-white/25" />
                <div className="mt-2 h-1.5 w-1/2 rounded bg-white/15" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- OFFER -------------------------------- */

function Offer() {
  return (
    <section id="oferta" className="border-y border-border bg-white/[0.02]">
      <div className="container-page py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl md:text-4xl">
            Comece agora com o Vende Fácil PRO
          </h2>
          <p className="mt-4 text-muted-foreground">
            Acesso completo à plataforma com pagamento único.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-lg">
          <div className="card-glass relative overflow-hidden p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/20 blur-3xl"
            />
            <p className="inline-flex rounded-full border border-border bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-accent">
              Acesso vitalício
            </p>
            <h3 className="mt-5 font-display text-xl font-bold">{OFFER.name}</h3>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <span className="font-display text-4xl font-bold sm:text-5xl">{OFFER.price}</span>
              {OFFER.installmentPrice && (
                <span className="pb-1 text-sm text-muted-foreground">{OFFER.installmentPrice}</span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Pagamento único — sem mensalidades.</p>

            <ul className="mt-6 space-y-3">
              {OFFER.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-8 w-full text-sm sm:text-base"
            >
              QUERO MEU ACESSO
              <ArrowRight className="h-4 w-4" />
            </a>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Pagamento processado pela Hotmart.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- FREE ACCESS ----------------------------- */

function FreeAccess() {
  return (
    <section className="container-page py-16 md:py-20">
      <div className="card-glass mx-auto flex max-w-3xl flex-col items-center gap-5 p-8 text-center md:flex-row md:text-left">
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold sm:text-2xl">Quer conhecer antes?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Comece gratuitamente com até 2 produtos e conheça a plataforma.
          </p>
        </div>
        <a href="/app" className="btn-ghost w-full text-sm md:w-auto">
          COMEÇAR GRÁTIS
        </a>
      </div>
    </section>
  );
}

/* --------------------------------- FAQ --------------------------------- */

const FAQ_ITEMS = [
  {
    q: "O que é o Vende Fácil PRO?",
    a: "É uma plataforma onde você organiza seus produtos digitais, cria catálogos profissionais, divulga suas ofertas e acompanha seus resultados em um só lugar.",
  },
  {
    q: "Para quem é a plataforma?",
    a: "Para produtores, afiliados, gestores de tráfego e para quem está começando a vender produtos digitais.",
  },
  {
    q: "Posso cadastrar meus próprios produtos?",
    a: "Sim. Você cadastra seus produtos com nome, descrição, imagem, preço e o seu próprio link de venda ou de afiliado.",
  },
  {
    q: "Posso criar mais de um catálogo?",
    a: "Sim. Você pode criar até 5 catálogos e organizar seus produtos por público ou por nicho.",
  },
  {
    q: "Posso compartilhar meu catálogo?",
    a: "Sim. Cada catálogo tem um link próprio de vitrine pública, que qualquer pessoa abre sem precisar de login.",
  },
  {
    q: "Preciso saber tecnologia para usar?",
    a: "Não. Você cadastra os produtos por formulário e o catálogo é montado automaticamente.",
  },
  {
    q: "Existe acesso gratuito?",
    a: "Sim. Você pode conhecer a plataforma gratuitamente com até 2 produtos cadastrados.",
  },
  {
    q: "Como funciona o pagamento?",
    a: `O acesso completo é um pagamento único de ${OFFER.price}, ${OFFER.installmentPrice ?? ""} processado pela Hotmart. Não há mensalidade.`.replace(
      " ,",
      ","
    ),
  },
  {
    q: "Posso acessar pelo celular?",
    a: "Sim. A plataforma funciona no navegador do celular e do computador, e compradores também recebem o aplicativo Android.",
  },
  {
    q: "Quais plataformas de produtos posso utilizar?",
    a: "Você pode cadastrar produtos de qualquer plataforma, colando o seu link de venda ou de afiliado — como Hotmart, Kiwify, Eduzz, Monetizze e outras.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-border bg-white/[0.02]">
      <div className="container-page py-20 md:py-24">
        <h2 className="text-center font-display text-2xl font-bold sm:text-3xl md:text-4xl">
          Perguntas frequentes
        </h2>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="card-glass overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="text-sm font-semibold sm:text-base">{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FINAL CTA ------------------------------ */

function FinalCTA() {
  return (
    <section className="container-page py-20 md:py-28">
      <div className="card-glass relative overflow-hidden p-8 text-center md:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-56 w-56 rounded-full bg-brand/25 blur-3xl"
        />
        <h2 className="relative font-display text-2xl font-bold sm:text-3xl md:text-4xl">
          Está na hora de organizar sua operação de vendas.
        </h2>
        <p className="relative mx-auto mt-4 max-w-2xl text-muted-foreground">
          Tenha suas ferramentas em um só lugar e transforme sua rotina de vendas em algo mais
          simples, organizado e profissional.
        </p>
        <a href="#oferta" className="btn-primary relative mt-8 text-sm sm:text-base">
          COMEÇAR AGORA
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

/* -------------------------------- FOOTER ------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-primary-foreground">
              <Store className="h-4 w-4" strokeWidth={2.5} />
            </span>
            VENDE FÁCIL <span className="text-gradient">PRO</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Plataforma para produtores e afiliados organizarem produtos, criarem catálogos,
            divulgarem ofertas e acompanharem resultados.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold">Navegação</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="#inicio" className="hover:text-foreground">Início</a></li>
            <li><a href="#recursos" className="hover:text-foreground">Recursos</a></li>
            <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
            <li><a href="/acesso" className="hover:text-foreground">Entrar</a></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">Informações</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="/termos" className="hover:text-foreground">Termos de Uso</a></li>
            <li><a href="/privacidade" className="hover:text-foreground">Política de Privacidade</a></li>
            <li><a href="mailto:contato@vendefacillapp.com.br" className="hover:text-foreground">Contato</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Vende Fácil PRO. Todos os direitos reservados.
      </div>
    </footer>
  );
}
