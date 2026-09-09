import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Mail, Smartphone, Monitor, Download, ArrowRight, CheckCircle2, Check,
  ShoppingCart, Sparkles, Home, Package, LayoutGrid, Wand2, Megaphone,
  Rocket, Users, TrendingUp, Wallet, BarChart3, UserCircle, Settings,
  LogOut, Share2, Search, Bell, Link2, Loader2, Menu, X, Plus,
} from "lucide-react";
import { CHECKOUT_PLANS } from "@/lib/checkout-links";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, useCatalogs, saveCatalog, slugify, coverOf } from "@/lib/catalog-store";
import { usePlan, PLAN_LABEL } from "@/lib/plan";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [
    { title: "Painel — Vende Fácil Pro" },
    { name: "description", content: "Painel principal do Vende Fácil Pro: acompanhe seu catálogo, produtos e desempenho." },
    { property: "og:title", content: "Painel — Vende Fácil Pro" },
    { property: "og:description", content: "Painel principal do Vende Fácil Pro: acompanhe seu catálogo, produtos e desempenho." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ]}),
  component: AppEntry,
});

function AppEntry() {
  const [session, setSession] = useState<"loading" | "out" | "in">("loading");
  const [email, setEmail] = useState<string>("");
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) { setEmail(data.session.user.email ?? ""); setSession("in"); }
      else setSession("out");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!active) return;
      if (s) { setEmail(s.user.email ?? ""); setSession("in"); }
      else setSession("out");
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);
  if (session === "loading") return <div className="flex min-h-screen items-center justify-center bg-[#0B0814] text-white"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>;
  if (session === "in") return <Dashboard email={email} />;
  return <WebAppEntry />;
}

const MENU = [
  { icon: Home, label: "Início", active: true },
  { icon: Package, label: "Produtos", to: "/painel/produtos" as const },
  { icon: LayoutGrid, label: "Meus Catálogos", to: "/painel/catalogo" as const },
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
  const { plan, catalogLimit, productLimit } = usePlan();
  const [newCatalogOpen, setNewCatalogOpen] = useState(false);
  const [newCatalogName, setNewCatalogName] = useState("");

  function handleCreateCatalog() {
    const name = newCatalogName.trim();
    if (!name) return;
    if (catalogs.length >= catalogLimit) {
      window.alert(
        plan === "free"
          ? `O Plano Grátis permite ${catalogLimit} catálogo. Conheça o PRO para criar até 5.`
          : `Seu plano permite até ${catalogLimit} catálogos.`,
      );
      return;
    }
    const base = slugify(name) || `catalogo-${Date.now()}`;
    let slug = base;
    let n = 2;
    while (catalogs.some((c) => c.slug === slug)) slug = `${base}-${n++}`;
    saveCatalog({ id: `cat-${Date.now()}`, name, slug });
    setNewCatalogName(""); setNewCatalogOpen(false);
  }

  const firstName = useMemo(() => {
    const raw = email.split("@")[0] || "Administrador";
    const clean = raw.replace(/[._-]+/g, " ").trim().split(" ")[0] || "Administrador";
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }, [email]);
  const published = products.filter((p) => p.published !== false);
  const categories = new Set(products.map((p) => p.category)).size;
  const filtered = products.filter((p) => p.title.toLowerCase().includes(query.trim().toLowerCase()));

  const handleShare = async () => {
    const url = `${window.location.origin}/catalogo?public=1`;
    try {
      if (navigator.share) await navigator.share({ title: "Meu Catálogo — Vende Fácil Pro", url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2500); }
    } catch { /* usuário cancelou */ }
  };
  const handleSignOut = async () => { await supabase.auth.signOut(); navigate({ to: "/app", replace: true }); };

  return (
    <div className="flex min-h-screen bg-[#070B18] text-white">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/5 bg-[#0A0F22] px-4 py-6 md:flex">
        <p className="mb-8 px-2 text-sm font-bold tracking-[0.25em] text-cyan-400">VENDE FÁCIL PRO</p>
        <nav className="flex-1 space-y-1">{MENU.map((item) => { const Icon = item.icon; const cls = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${item.active ? "bg-cyan-500/10 font-semibold text-cyan-300" : "text-slate-300 hover:bg-white/5 hover:text-white"}`; if (item.to) return <Link key={item.label} to={item.to} className={cls}><Icon className="h-4 w-4" /> {item.label}</Link>; return <button key={item.label} type="button" title="Em breve" className={`${cls} w-full cursor-default opacity-70`}><Icon className="h-4 w-4" /> {item.label}</button>; })}</nav>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-3"><button type="button" onClick={() => setMobileMenuOpen(true)} className="rounded-full border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/5 md:hidden"><Menu className="h-5 w-5" /></button><div><p className="text-sm text-slate-400">Bem-vindo de volta,</p><p className="font-semibold">{firstName}</p></div></div>
          <div className="flex items-center gap-2"><button type="button" onClick={handleShare} className="hidden items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5 sm:flex">{shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}{shared ? "Link copiado" : "Compartilhar catálogo"}</button><button type="button" className="rounded-full border border-white/10 p-2.5 text-slate-300 hover:bg-white/5"><Bell className="h-4 w-4" /></button><button type="button" onClick={handleSignOut} className="rounded-full border border-white/10 p-2.5 text-slate-300 hover:bg-white/5" title="Sair"><LogOut className="h-4 w-4" /></button></div>
        </header>
        <div className="mx-auto max-w-7xl space-y-7 p-6 lg:p-8">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-white/5 bg-[#0A0F22] p-5"><p className="text-sm text-slate-400">Produtos</p><p className="mt-2 text-3xl font-bold">{products.length}{productLimit !== null && <span className="text-base font-semibold text-slate-500"> / {productLimit}</span>}</p><p className="mt-1 text-xs text-slate-500">{PLAN_LABEL[plan]}</p></div><div className="rounded-2xl border border-white/5 bg-[#0A0F22] p-5"><p className="text-sm text-slate-400">Publicados</p><p className="mt-2 text-3xl font-bold">{published.length}</p></div><div className="rounded-2xl border border-white/5 bg-[#0A0F22] p-5"><p className="text-sm text-slate-400">Categorias</p><p className="mt-2 text-3xl font-bold">{categories}</p></div><div className="rounded-2xl border border-white/5 bg-[#0A0F22] p-5"><p className="text-sm text-slate-400">Catálogos</p><p className="mt-2 text-3xl font-bold">{catalogs.length}</p></div></section>
          <section className="rounded-2xl border border-white/5 bg-[#0A0F22] p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold">Seus produtos</h2><p className="mt-1 text-sm text-slate-400">Gerencie e organize os produtos do seu catálogo.</p></div><Link to="/painel/produtos" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-[#06101A] hover:opacity-90"><Plus className="h-4 w-4" /> Adicionar produto</Link></div><div className="relative mt-5"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto..." className="h-11 w-full rounded-xl border border-white/10 bg-[#070B18] pl-10 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400/50" /></div><div className="mt-5 space-y-2">{filtered.slice(0, 8).map((p) => <div key={p.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#070B18] p-3"><div className="flex min-w-0 items-center gap-3"><img src={coverOf(p)} alt="" className="h-12 w-16 rounded-lg object-cover" /><div className="min-w-0"><p className="truncate font-semibold">{p.title}</p><p className="text-xs text-slate-500">{p.category}</p></div></div><span className="shrink-0 text-sm font-semibold">R$ {p.price.toFixed(0)}</span></div>)}{filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Nenhum produto encontrado.</p>}</div></section>
        </div>
      </main>
      {mobileMenuOpen && <div className="fixed inset-0 z-50 bg-black/70 md:hidden" onClick={() => setMobileMenuOpen(false)}><aside className="h-full w-72 bg-[#0A0F22] p-5" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><p className="text-sm font-bold tracking-[0.25em] text-cyan-400">VENDE FÁCIL PRO</p><button type="button" onClick={() => setMobileMenuOpen(false)}><X className="h-5 w-5" /></button></div><nav className="mt-8 space-y-1">{MENU.map((item) => { const Icon = item.icon; if (item.to) return <Link key={item.label} to={item.to} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"><Icon className="h-4 w-4" />{item.label}</Link>; return <button key={item.label} type="button" className="flex w-full cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-500"><Icon className="h-4 w-4" />{item.label}</button>; })}</nav></aside></div>}
    </div>
  );
}

function WebAppEntry() {
  return <div className="min-h-screen bg-[#070B18] text-white flex items-center justify-center p-6"><div className="max-w-md text-center"><Sparkles className="mx-auto h-10 w-10 text-cyan-400" /><h1 className="mt-5 text-2xl font-bold">Acesso ao Vende Fácil Pro</h1><p className="mt-2 text-slate-400">Faça login para acessar seu painel.</p><Link to="/acesso" search={{ email: undefined }} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-[#06101A]">Entrar <ArrowRight className="h-4 w-4" /></Link></div></div>;
}
