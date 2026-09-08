import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { useCustomers, saveCustomer, deleteCustomer, newId, type Customer } from "@/lib/crm-store";

export const Route = createFileRoute("/_authenticated/painel/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Vende Fácil Pro" },
      { name: "description", content: "Cadastre e organize os contatos dos seus clientes e leads." },
      { property: "og:title", content: "Clientes — Vende Fácil Pro" },
      { property: "og:description", content: "Sua lista de clientes e leads em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClientesPage,
});

const EMPTY = { name: "", email: "", phone: "", note: "" };

function ClientesPage() {
  const customers = useCustomers();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const customer: Customer = {
      id: editingId ?? newId("cli"),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      note: form.note.trim(),
      createdAt: Date.now(),
    };
    saveCustomer(customer);
    setForm(EMPTY);
    setEditingId(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <Users className="h-7 w-7 text-primary" /> Clientes
      </h1>
      <p className="mt-2 text-muted-foreground">Guarde os contatos de quem compra ou demonstra interesse.</p>

      <form onSubmit={submit} className="mt-8 grid gap-3 rounded-2xl border border-border/50 bg-card p-5 sm:grid-cols-2">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nome"
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="E-mail"
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="WhatsApp / telefone"
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <input
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Observação"
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:col-span-2"
        >
          <Plus className="h-4 w-4" /> {editingId ? "Salvar alterações" : "Adicionar cliente"}
        </button>
      </form>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border/50">
        {customers.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">Contato</th>
                <th className="p-3">Observação</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t border-border/50">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {c.email}
                    {c.email && c.phone ? " · " : ""}
                    {c.phone}
                  </td>
                  <td className="p-3 text-muted-foreground">{c.note}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setForm({ name: c.name, email: c.email, phone: c.phone, note: c.note });
                        setEditingId(c.id);
                      }}
                      className="mr-3 text-xs text-primary hover:underline"
                    >
                      Editar
                    </button>
                    <button onClick={() => deleteCustomer(c.id)} className="text-muted-foreground hover:text-destructive">
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
