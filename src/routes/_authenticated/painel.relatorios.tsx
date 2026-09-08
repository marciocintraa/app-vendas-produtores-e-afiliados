import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { useProducts, useCatalogs } from "@/lib/catalog-store";
import { useSales, formatBRL } from "@/lib/crm-store";

export const Route = createFileRoute("/_authenticated/painel/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Vende Fácil Pro" },
      { name: "description", content: "Veja os produtos mais vendidos e o desempenho dos seus catálogos." },
      { property: "og:title", content: "Relatórios — Vende Fácil Pro" },
      { property: "og:description", content: "Desempenho dos seus produtos e catálogos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const products = useProducts();
  const catalogs = useCatalogs();
  const sales = useSales();

  const pagos = sales.filter((s) => s.status === "pago");
  const ranking = new Map<string, { qtd: number; total: number }>();
  for (const s of pagos) {
    const atual = ranking.get(s.productTitle) ?? { qtd: 0, total: 0 };
    ranking.set(s.productTitle, { qtd: atual.qtd + 1, total: atual.total + s.amount });
  }
  const top = Array.from(ranking.entries()).sort((a, b) => b[1].total - a[1].total).slice(0, 10);
  const maior = Math.max(1, ...top.map(([, v]) => v.total));

  const publicados = products.filter((p) => p.published !== false).length;
  const ticket = pagos.length ? pagos.reduce((t, s) => t + s.amount, 0) / pagos.length : 0;

  const cards = [
    { label: "Catálogos", value: String(catalogs.length) },
    { label: "Produtos publicados", value: `${publicados}/${products.length}` },
    { label: "Vendas pagas", value: String(pagos.length) },
    { label: "Ticket médio", value: formatBRL(ticket) },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <BarChart3 className="h-7 w-7 text-primary" /> Relatórios
      </h1>
      <p className="mt-2 text-muted-foreground">Acompanhe o que está funcionando melhor no seu catálogo.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/50 bg-card p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-2 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-semibold">Produtos que mais venderam</h2>
      <div className="mt-4 space-y-3 rounded-2xl border border-border/50 bg-card p-5">
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Registre vendas na tela de Vendas para ver o ranking aqui.
          </p>
        ) : (
          top.map(([nome, v]) => (
            <div key={nome}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{nome}</span>
                <span className="text-muted-foreground">
                  {v.qtd} venda{v.qtd > 1 ? "s" : ""} · {formatBRL(v.total)}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${(v.total / maior) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
