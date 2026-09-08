import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { useSales, formatBRL } from "@/lib/crm-store";

export const Route = createFileRoute("/_authenticated/painel/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Vende Fácil Pro" },
      { name: "description", content: "Acompanhe recebimentos, comissões e valores pendentes das suas vendas." },
      { property: "og:title", content: "Financeiro — Vende Fácil Pro" },
      { property: "og:description", content: "Recebimentos, comissões e pendências do seu negócio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const sales = useSales();

  const pagos = sales.filter((s) => s.status === "pago");
  const pendentes = sales.filter((s) => s.status === "pendente");
  const reembolsos = sales.filter((s) => s.status === "reembolsado");

  const recebido = pagos.reduce((t, s) => t + s.amount, 0);
  const comissoes = pagos.reduce((t, s) => t + s.commission, 0);
  const aReceber = pendentes.reduce((t, s) => t + s.amount, 0);
  const devolvido = reembolsos.reduce((t, s) => t + s.amount, 0);
  const liquido = recebido - comissoes - devolvido;

  const cards = [
    { label: "Recebido", value: formatBRL(recebido), tone: "text-emerald-400" },
    { label: "A receber", value: formatBRL(aReceber), tone: "text-amber-400" },
    { label: "Comissões", value: formatBRL(comissoes), tone: "text-muted-foreground" },
    { label: "Reembolsos", value: formatBRL(devolvido), tone: "text-red-400" },
  ];

  // Agrupamento por mês
  const porMes = new Map<string, number>();
  for (const s of pagos) {
    const mes = s.date.slice(0, 7);
    porMes.set(mes, (porMes.get(mes) ?? 0) + s.amount);
  }
  const meses = Array.from(porMes.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const maior = Math.max(1, ...meses.map(([, v]) => v));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <Wallet className="h-7 w-7 text-primary" /> Financeiro
      </h1>
      <p className="mt-2 text-muted-foreground">Resultado calculado a partir das vendas registradas.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/50 bg-card p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className={`mt-2 text-2xl font-bold ${c.tone}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-5">
        <p className="text-sm text-muted-foreground">Saldo líquido</p>
        <p className="mt-1 text-3xl font-bold">{formatBRL(liquido)}</p>
      </div>

      <h2 className="mt-12 text-xl font-semibold">Recebimentos por mês</h2>
      <div className="mt-4 space-y-3 rounded-2xl border border-border/50 bg-card p-5">
        {meses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum recebimento registrado ainda.</p>
        ) : (
          meses.map(([mes, valor]) => (
            <div key={mes}>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{mes.split("-").reverse().join("/")}</span>
                <span className="font-medium">{formatBRL(valor)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${(valor / maior) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
