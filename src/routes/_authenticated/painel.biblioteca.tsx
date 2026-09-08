import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Plus, Trash2, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  useContentItems,
  saveContentItem,
  deleteContentItem,
  newId,
  type ContentItem,
} from "@/lib/app-extras-store";

export const Route = createFileRoute("/_authenticated/painel/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca de Conteúdo — Vende Fácil Pro" },
      { name: "description", content: "Guarde posts, stories, vídeos e e-mails prontos para divulgar seus produtos." },
      { property: "og:title", content: "Biblioteca de Conteúdo — Vende Fácil Pro" },
      { property: "og:description", content: "Todo o seu material de divulgação salvo em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BibliotecaPage,
});

const TYPES: { value: ContentItem["type"]; label: string }[] = [
  { value: "post", label: "Post" },
  { value: "story", label: "Story" },
  { value: "video", label: "Roteiro de vídeo" },
  { value: "email", label: "E-mail" },
  { value: "pdf", label: "Material / PDF" },
];

const empty = (): ContentItem => ({
  id: newId(),
  title: "",
  type: "post",
  body: "",
  link: "",
  createdAt: Date.now(),
});

function BibliotecaPage() {
  const items = useContentItems();
  const [form, setForm] = useState<ContentItem | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.title.trim()) return toast.error("Dê um nome ao material.");
    saveContentItem({ ...form, title: form.title.trim() });
    setForm(null);
    toast.success("Material salvo.");
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <BookOpen className="h-7 w-7 text-primary" /> Biblioteca de Conteúdo
          </h1>
          <p className="mt-2 text-muted-foreground">Salve textos e materiais prontos para divulgar quando quiser.</p>
        </div>
        <button
          onClick={() => setForm(empty())}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Novo material
        </button>
      </div>

      {form && (
        <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border border-border/50 bg-card p-5">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Nome do material"
            className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as ContentItem["type"] })}
            className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={5}
            placeholder="Conteúdo (texto do post, roteiro, e-mail...)"
            className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
          />
          <input
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="Link relacionado (opcional)"
            className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Salvar</button>
            <button type="button" onClick={() => setForm(null)} className="rounded-lg border border-border/50 px-4 py-2 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 space-y-3">
        {items.length === 0 && !form && (
          <p className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            Nenhum material salvo ainda. Crie o primeiro ou gere um texto na IA VENDE+.
          </p>
        )}
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs uppercase tracking-wide text-primary">
                  {TYPES.find((t) => t.value === item.type)?.label}
                </p>
              </div>
              <div className="flex gap-2 text-muted-foreground">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(item.body);
                    toast.success("Conteúdo copiado.");
                  }}
                  aria-label="Copiar"
                  className="rounded-lg border border-border/50 p-2 hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setForm(item)}
                  aria-label="Editar"
                  className="rounded-lg border border-border/50 p-2 hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    deleteContentItem(item.id);
                    toast.success("Material removido.");
                  }}
                  aria-label="Excluir"
                  className="rounded-lg border border-border/50 p-2 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {item.body && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{item.body}</p>
            )}
            {item.link && (
              <a href={item.link} target="_blank" rel="noreferrer" className="mt-3 block truncate text-sm text-primary hover:underline">
                {item.link}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
