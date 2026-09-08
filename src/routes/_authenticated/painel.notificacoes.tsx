import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Plus, Trash2, Send, Check } from "lucide-react";
import { toast } from "sonner";
import { useNotices, saveNotice, deleteNotice, newId, type Notice } from "@/lib/app-extras-store";

export const Route = createFileRoute("/_authenticated/painel/notificacoes")({
  head: () => ({
    meta: [
      { title: "Avisos e Notificações — Vende Fácil Pro" },
      { name: "description", content: "Programe avisos e mensagens para os seus clientes e leads." },
      { property: "og:title", content: "Avisos e Notificações — Vende Fácil Pro" },
      { property: "og:description", content: "Programe lembretes e campanhas para a sua base." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificacoesPage,
});

const today = () => new Date().toISOString().slice(0, 10);

function NotificacoesPage() {
  const notices = useNotices();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<Notice["audience"]>("todos");
  const [sendAt, setSendAt] = useState(today());

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return toast.error("Preencha o título e a mensagem.");
    saveNotice({
      id: newId(),
      title: title.trim(),
      message: message.trim(),
      audience,
      sendAt,
      sent: false,
      createdAt: Date.now(),
    });
    setTitle("");
    setMessage("");
    toast.success("Aviso programado.");
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <Bell className="h-7 w-7 text-primary" /> Avisos e Notificações
      </h1>
      <p className="mt-2 text-muted-foreground">Programe lembretes, promoções e novidades para enviar à sua base.</p>

      <form onSubmit={add} className="mt-6 grid gap-3 rounded-2xl border border-border/50 bg-card p-5 sm:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do aviso"
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={sendAt}
          onChange={(e) => setSendAt(e.target.value)}
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Mensagem"
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm sm:col-span-2"
        />
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value as Notice["audience"])}
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        >
          <option value="todos">Todos</option>
          <option value="clientes">Somente clientes</option>
          <option value="leads">Somente interessados</option>
        </select>
        <button className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Programar aviso
        </button>
      </form>

      <div className="mt-8 space-y-3">
        {notices.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            Nenhum aviso programado.
          </p>
        )}
        {notices.map((n) => (
          <div key={n.id} className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(`${n.sendAt}T12:00:00`).toLocaleDateString("pt-BR")} · {n.audience}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {n.sent ? (
                  <span className="flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">
                    <Check className="h-3 w-3" /> Enviado
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      saveNotice({ ...n, sent: true });
                      toast.success("Aviso marcado como enviado.");
                    }}
                    className="flex items-center gap-1 rounded-lg border border-border/50 px-3 py-1.5 text-xs hover:text-foreground"
                  >
                    <Send className="h-3 w-3" /> Marcar enviado
                  </button>
                )}
                <button
                  onClick={() => {
                    deleteNotice(n.id);
                    toast.success("Aviso removido.");
                  }}
                  aria-label="Excluir"
                  className="rounded-lg border border-border/50 p-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
