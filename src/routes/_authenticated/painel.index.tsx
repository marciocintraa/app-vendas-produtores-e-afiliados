import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  Store,
  Sparkles,
  Users,
  ShoppingCart,
  Wallet,
  BarChart3,
  BookOpen,
  Link2,
  Bell,
  Palette,
  Crown,
} from "lucide-react";
import { useProducts, useCatalogs } from "@/lib/catalog-store";
import { useCustomers, useSales, formatBRL } from "@/lib/crm-store";

export const Route = createFileRoute("/_authenticated/painel/")({
  head: () => ({
    meta: [
      { title: "Início — Painel Vende Fácil Pro" },
      { name: "description", content: "Resumo do seu negócio: catálogos, produtos, clientes e vendas." },
      { property: "og:title", content: "Início — Painel Vende Fácil Pro" },
      { property: "og:description", content: "Resumo do seu negócio no Vende Fácil Pro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PainelHome,
});

const ATALHOS = [
  { to: "/painel/produtos", label: "Produtos", desc: "Cadastre e edite seus produtos", icon: Package },
  { to: "/painel/catalogo", label: "Meu Catálogo", desc: "Link público, QR Code e compartilhamento", icon: Store },
  { to: "/painel/ia", label: "IA VENDE+", desc: "Textos de venda prontos em segundos", icon: Sparkles },
  { to: "/painel/clientes", label: "Clientes", desc: "Sua lista de contatos", icon: Users },
  { to: "/painel/vendas", label: "Vendas", desc: "Registre e acompanhe cada venda", icon: ShoppingCart },
  { to: "/painel/financeiro", label: "Financeiro", desc: "Recebimentos e comissões", icon: Wallet },
  { to: "/painel/relatorios", label: "Relatórios", desc: "Desempenho do seu catálogo", icon: BarChart3 },
] as const;

function PainelHome() {
  const products = useProducts();
  const catalogs = useCatalogs();
  const customers = useCustomers();
  const sales = useSales();

  const faturamento = sales.filter((s) => s.status === "pago").reduce((t, s) => t + s.amount, 0);

  const cards = [
    { label: "Catálogos", value: String(catalogs.length) },
    { label: "Produtos", value: String(products.length) },
    { label: "Clientes", value: String(customers.length) },
    { label: "Faturamento", value: formatBRL(faturamento) },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Início</h1>
      <p className="mt-2 text-muted-foreground">Tudo o que acontece no seu negócio, em um só lugar.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/50 bg-card p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-2 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-semibold">Atalhos</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ATALHOS.map(({ to, label, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-2xl border border-border/50 bg-card p-5 transition hover:border-primary/40"
          >
            <Icon className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold group-hover:text-primary">{label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
