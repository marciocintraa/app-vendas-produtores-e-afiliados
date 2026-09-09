import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Smartphone,
  Monitor,
  Download,
  ArrowRight,
  CheckCircle2,
  Check,
  ShoppingCart,
  Sparkles,
  Home,
  Package,
  LayoutGrid,
  Wand2,
  Megaphone,
  Rocket,
  Users,
  TrendingUp,
  Wallet,
  BarChart3,
  UserCircle,
  Settings,
  LogOut,
  Share2,
  Search,
  Bell,
  Link2,
  Loader2,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { CHECKOUT_PLANS } from "@/lib/checkout-links";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, useCatalogs, saveCatalog, slugify } from "@/lib/catalog-store";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Painel — Vende Fácil Pro" },
      {
        name: "description",
        content:
          "Painel principal do Vende Fácil Pro: acompanhe seu catálogo, produtos e desempenho.",
      },
      { property: "og:title", content: "Painel — Vende Fácil Pro" },
      {
        property: "og:description",
        content:
          "Painel principal do Vende Fácil Pro: acompanhe seu catálogo, produtos e desempenho.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AppEntry,
});

function AppEntry() {
  const [session, setSession] = useState<"loading" | "out" | "in">("loading");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setEmail(data.session.user.email ?? "");
        setSession("in");
      } else {
        setSession("out");
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!active) return;
      if (s) {
        setEmail(s.user.email ?? "");
        setSession("in");
      } else {
        setSession("out");
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (session === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0814] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (session === "in") return <Dashboard email={email} />;
  return <WebAppEntry />;
}

// ===================== DASHBOARD (tela principal após a compra) =====================

const MENU = [
  { icon: Home, label: "Início", active: true },
  { icon: Package, label: "Produtos", to: "/painel/produtos" as const },
  { icon: LayoutGrid, label: "Meus Catálogos", to: "/catalogo" as const },
  { icon: Wand2, label: "IA VENDE+" },
  { icon: Megaphone, label: "VENDE ADS IA" },
  { icon: Rocket, label: "Prompt Master IA" },
  { icon: Users, label: "Clientes" },
  { icon: TrendingUp, label: "Vendas" },
  { icon: Wallet, label: "Financeiro" },
  { icon: BarChart3, label: "Relatórios" },
  { icon: UserCircle, label: "Perfil" },
  { icon: Settings, label: "Configurações" },
];

function Dashboard({ email }: { email: string }) {
  const navigate = useNavigate();
  const products = useProducts();
  const [query, setQuery] = useState("");
  const [shared, setShared] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const catalogs = useCatalogs();
  const [newCatalogOpen, setNewCatalogOpen] = useState(false);
  const [newCatalogName, setNewCatalogName] = useState("");

  function handleCreateCatalog() {
    const name = newCatalogName.trim();
    if (!name) return;
    const base = slugify(name) || `catalogo-${Date.now()}`;
    let slug = base;
    let n = 2;
    while (catalogs.some((c) => c.slug === slug)) slug = `${base}-${n++}`;
    saveCatalog({ id: `cat-${Date.now()}`, name, slug });
    setNewCatalogName("");
    setNewCatalogOpen(false);
  }


  const firstName = useMemo(() => {
    const raw = email.split("@")[0] || "Administrador";
    const clean = raw.replace(/[._-]+/g, " ").trim().split(" ")[0] || "Administrador";
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }, [email]);

  const published = products.filter((p) => p.published !== false);
  const categories = new Set(products.map((p) => p.category)).size;
  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const handleShare = async () => {
    const url = `${window.location.origin}/catalogo`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Meu Catálogo — Vende Fácil Pro", url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
    } catch {
      /* usuário cancelou */
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/app", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[#070B18] text-white">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/5 bg-[#0A0F22] px-4 py-6 md:flex">
        <p className="mb-8 px-2 text-sm font-bold tracking-[0.25em] text-cyan-400">
          VENDE FÁCIL PRO
        </p>
        <nav className="flex-1 space-y-1">
          {MENU.map((item) => {
            const Icon = item.icon;
            const cls = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              item.active
                ? "bg-cyan-500/10 font-semibold text-cyan-300"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`;
            if (item.to) {
              return (
                <Link key={item.label} to={item.to} className={cls}>
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                title="Em breve"
                className={`${cls} w-full cursor-default opacity-70`}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-4 border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-full border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/5 md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-bold tracking-widest text-cyan-400">VENDE FÁCIL PRO</p>
              <p className="text-sm text-slate-400">{email}</p>
              <p className="mt-1 text-xs font-semibold tracking-wide text-cyan-300">
                ADMINISTRADOR · PREMIUM · PRODUTOS ILIMITADOS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/painel/produtos"
              className="rounded-full border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/5"
              title="Configurações"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/5"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 border-r border-white/10 bg-[#0A0F22] p-5 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm font-bold tracking-[0.25em] text-cyan-400">MENU</p>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full p-2 text-slate-300 transition hover:bg-white/5"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {MENU.map((item) => {
                  const Icon = item.icon;
                  const cls = `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                    item.active
                      ? "bg-cyan-500/10 font-semibold text-cyan-300"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`;
                  if (item.to) {
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cls}
                      >
                        <Icon className="h-4 w-4" /> {item.label}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={item.label}
                      type="button"
                      title="Em breve"
                      className={`${cls} w-full cursor-default opacity-70`}
                    >
                      <Icon className="h-4 w-4" /> {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-5xl px-6 py-8">
          <h1 className="text-3xl font-bold">Olá, {firstName} 👋</h1>
          <p className="mt-1 text-slate-400">Acompanhe o desempenho do seu catálogo.</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-7 py-3.5 font-bold tracking-wide text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90"
            >
              {shared ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
              {shared ? "LINK COPIADO!" : "COMPARTILHAR MEU CATÁLOGO"}
            </button>
            <button
              onClick={() => {
                setNewCatalogName("");
                setNewCatalogOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-7 py-3.5 font-bold tracking-wide text-cyan-300 transition hover:bg-cyan-400/20"
            >
              <Plus className="h-5 w-5" /> NOVO CATÁLOGO
            </button>
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-7 py-3.5 font-bold tracking-wide text-slate-200 transition hover:bg-white/5"
            >
              <LayoutGrid className="h-5 w-5" /> VER CATÁLOGO
            </Link>
          </div>

          {/* Meus catálogos */}
          {catalogs.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {catalogs.map((cat) => (
                <Link
                  key={cat.id}
                  to="/catalogo"
                  search={{ c: cat.slug }}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {newCatalogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setNewCatalogOpen(false)}
              />
              <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0D1330] p-6 shadow-2xl">
                <h3 className="text-lg font-bold">Novo catálogo</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Dê um nome para organizar seus produtos.
                </p>
                <input
                  autoFocus
                  value={newCatalogName}
                  onChange={(e) => setNewCatalogName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateCatalog();
                  }}
                  placeholder="Ex.: Emagrecimento"
                  className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setNewCatalogOpen(false)}
                    className="rounded-full px-5 py-2.5 text-sm text-slate-300 transition hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateCatalog}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    Criar catálogo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Busca */}
          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produto no catálogo"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Ações rápidas */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { icon: LayoutGrid, label: "Catálogo", sub: "Seus produtos", to: "/catalogo" as const },
              { icon: BarChart3, label: "Análises", sub: "Desempenho" },
              { icon: Wand2, label: "IA", sub: "Textos e ideias" },
              { icon: Bell, label: "Avisos", sub: "Notificações" },
            ].map((c) => {
              const Icon = c.icon;
              const inner = (
                <>
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400">
                    <Icon className="h-5 w-5 text-white" />
                  </span>
                  <p className="mt-3 font-semibold">{c.label}</p>
                  <p className="text-xs text-slate-400">{c.sub}</p>
                </>
              );
              const cls =
                "rounded-2xl border border-white/5 bg-[#0D1330] p-5 text-center transition hover:border-cyan-400/30";
              return c.to ? (
                <Link key={c.label} to={c.to} className={cls}>
                  {inner}
                </Link>
              ) : (
                <div key={c.label} className={`${cls} opacity-70`} title="Em breve">
                  {inner}
                </div>
              );
            })}
          </div>

          {/* Resumo + Produtos */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/5 bg-[#0D1330] p-6">
              <h2 className="text-sm font-bold tracking-widest text-slate-300">RESUMO DE HOJE</h2>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/5 p-4 text-center">
                  <p className="text-2xl font-extrabold">{products.length}</p>
                  <p className="mt-1 text-xs text-slate-400">Produtos no catálogo</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4 text-center">
                  <p className="text-2xl font-extrabold">{published.length}</p>
                  <p className="mt-1 text-xs text-slate-400">Produtos ativos</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4 text-center">
                  <p className="text-2xl font-extrabold">{categories}</p>
                  <p className="mt-1 text-xs text-slate-400">Categorias</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/5 bg-[#0D1330] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-widest text-slate-300">MEUS PRODUTOS</h2>
                <Link to="/painel/produtos" className="text-sm font-medium text-cyan-400 hover:underline">
                  Ver tudo
                </Link>
              </div>
              <div className="mt-4 space-y-2">
                {filtered.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-500">
                    Nenhum produto encontrado.
                  </p>
                )}
                {filtered.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                        <Link2 className="h-4 w-4 text-cyan-400" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.title}</p>
                        <p className="text-xs text-slate-400">{p.platform}</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-cyan-300">
                      R$ {p.price.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

// ===================== TELA DE ACESSO (quem ainda não entrou) =====================

function WebAppEntry() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform("ios");
    else if (/android/.test(ua)) setPlatform("android");
    else setPlatform("desktop");

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    setIsStandalone(standalone);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) return;
    navigate({ to: "/acesso", search: { email: clean } as never });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0814] via-[#150922] to-[#0B0814] text-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-200">
            <Monitor className="h-4 w-4" />
            Versão Web — funciona em qualquer dispositivo
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Bem-vindo ao{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Vende Fácil Pro
            </span>
          </h1>
          <p className="text-lg text-slate-300">
            Acesse seu painel pelo navegador. Basta informar o e-mail usado na compra.
          </p>
        </div>

        {/* Access form */}
        <form
          id="form-acesso"
          onSubmit={handleSubmit}
          className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
        >
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
            E-mail da compra
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-white/10 bg-black/30 py-3 pl-10 pr-3 text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Entrar <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Enviamos um link mágico automaticamente. Não precisa de senha.
          </p>
        </form>

        {/* Oferta imperdível — pagamento único */}
        {CHECKOUT_PLANS.map((plan) => (
          <div
            key={plan.id}
            className="relative mb-10 overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 p-6 text-center shadow-2xl backdrop-blur"
          >
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 px-4 py-1 text-xs font-bold uppercase tracking-widest text-black">
              <Sparkles className="h-4 w-4" />
              Oferta Imperdível
            </span>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Acesso{" "}
              <span className="bg-gradient-to-r from-amber-300 to-pink-300 bg-clip-text text-transparent">
                vitalício
              </span>{" "}
              com produtos ilimitados
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-200">
              Pague uma única vez e use para sempre — sem mensalidades, sem taxas escondidas.
            </p>

            <div className="mt-5">
              <p className="text-sm text-slate-300 line-through">De R$ 497,00 por apenas</p>
              <p className="text-5xl font-extrabold tracking-tight">{plan.price}</p>
              {plan.installmentPrice && (
                <p className="mt-1 text-sm font-medium text-amber-300">{plan.installmentPrice}</p>
              )}
            </div>

            <ul className="mx-auto mb-6 mt-5 max-w-xs space-y-2 text-left text-sm text-slate-200">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <a
              href={plan.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-pink-500 px-8 py-3 font-bold text-black transition hover:opacity-90"
            >
              <ShoppingCart className="h-4 w-4" />
              Quero meu acesso agora <ArrowRight className="h-4 w-4" />
            </a>
            <p className="mt-3 text-xs text-slate-400">
              Pagamento seguro pela Hotmart — cartão (à vista ou parcelado), PIX ou boleto. Após a
              confirmação você recebe o acesso no e-mail informado na compra.
            </p>
          </div>
        ))}

        {/* Acesso de quem já comprou */}
        <div className="mb-10 text-center">
          <p className="text-sm text-slate-400">
            Já comprou? Informe seu e-mail no formulário acima para entrar no painel.
          </p>
        </div>

        {/* Install as app section */}
        {!isStandalone && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-purple-300" />
              <h2 className="text-lg font-semibold">Fixar como app na tela inicial</h2>
            </div>
            <p className="mb-4 text-sm text-slate-300">
              Opcional: adicione um ícone na sua tela inicial para abrir o Vende Fácil Pro como se
              fosse um aplicativo — sem baixar nada.
            </p>

            <div className="space-y-3 text-sm text-slate-200">
              {platform === "ios" && (
                <ol className="list-inside list-decimal space-y-1.5">
                  <li>
                    Toque no botão <strong>Compartilhar</strong> do Safari
                  </li>
                  <li>
                    Escolha <strong>"Adicionar à Tela de Início"</strong>
                  </li>
                  <li>
                    Toque em <strong>Adicionar</strong> no canto superior direito
                  </li>
                </ol>
              )}
              {platform === "android" && (
                <ol className="list-inside list-decimal space-y-1.5">
                  <li>
                    Toque no menu <strong>⋮</strong> do Chrome
                  </li>
                  <li>
                    Escolha <strong>"Adicionar à tela inicial"</strong> ou{" "}
                    <strong>"Instalar app"</strong>
                  </li>
                  <li>
                    Confirme tocando em <strong>Instalar</strong>
                  </li>
                </ol>
              )}
              {platform === "desktop" && (
                <ol className="list-inside list-decimal space-y-1.5">
                  <li>
                    Procure o ícone <Smartphone className="inline h-4 w-4" /> na barra de endereço
                  </li>
                  <li>
                    Clique em <strong>Instalar</strong>
                  </li>
                  <li>O app abrirá em uma janela própria, como um programa</li>
                </ol>
              )}
            </div>
          </div>
        )}

        {isStandalone && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm">
              Você já está usando o Vende Fácil Pro como app instalado. 🎉
            </span>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          Prefere o app Android? Após a compra, o link do APK também é enviado no seu e-mail.
        </p>
      </div>
    </div>
  );
}
