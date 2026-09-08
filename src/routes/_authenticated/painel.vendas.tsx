import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { useSales, saveSale, deleteSale, newId, formatBRL, type Sale } from "@/lib/crm-store";

export const Route = createFileRoute("/_authenticated/painel/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas — Vende Fácil Pro" },
      { name: "description", content: "Registre cada venda do seu catálogo e acompanhe o status do pagamento." },
      { property: "og:title", content: "Vendas — Vende Fácil Pro" },
      { property: "og:description", content: "Controle das vendas e comissões do seu catálogo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VendasPage,
});

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { customerName: "", productTitle: "", amount: "", commission: "", status: "pago", date: today() };

const STATUS_STYLE: Record<Sale["status"], string> = {
  pago: "bg-emerald-500/15 text-emerald-400",
  pendente: "bg-amber-500/15 text-amber-400",
  reembolsado: "bg-red-500/15 text-red-400",
};

function VendasPage() {
  const sales = useSales();
  const [form, setForm] = useState(EMPTY);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productTitle.trim()) return;
    saveSale({
      id: newId("venda"),
      customerName: form.customerName.trim(),
      productTitle: form.productTitle.trim(),
      amount: Number(form.amount.replace(",", ".")) || 0,
      commission: Number(form.commission.replace(",", ".")) || 0,
      status: form.status as Sale["status"],
      date: form.date || today(),
      createdAt: Date.now(),
    });
    setForm({ ...EMPTY, date: form.date });
  };

  const total = sales.filter((s) => s.status === "pago").reduce((t, s) => t + s.amount, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <ShoppingCart className="h-7 w-7 text-primary" /> Vendas
      </h1>
      <p className="mt-2 text-muted-foreground">
        Total recebido: <strong className="text-foreground">{formatBRL(total)}</strong>
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-3 rounded-2xl border border-border/50 bg-card p-5 sm:grid-cols-3">
        <input
          value={form.productTitle}
          onChange={(e) => setForm({ ...form, productTitle: e.target.value })}
          placeholder="Produto"
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <input
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          placeholder="Cliente"
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <input
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          placeholder="Valor (R$)"
          inputMode="decimal"
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <input
          value={form.commission}
          onChange={(e) => setForm({ ...form, commission: e.target.value })}
          placeholder="Comissão (R$)"
          inputMode="decimal"
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        >
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
          <option value="reembolsado">Reembolsado</option>
        </select>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:col-span-3"
        >
          <Plus className="h-4 w-4" /> Registrar venda
        </button>
      </form>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border/50">
        {sales.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma venda registrada ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Produto</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Comissão</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-t border-border/50">
                  <td className="p-3 text-muted-foreground">{s.date.split("-").reverse().join("/")}</td>
                  <td className="p-3 font-medium">{s.productTitle}</td>
                  <td className="p-3 text-muted-foreground">{s.customerName}</td>
                  <td className="p-3">{formatBRL(s.amount)}</td>
                  <td className="p-3 text-muted-foreground">{formatBRL(s.commission)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLE[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => deleteSale(s.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
