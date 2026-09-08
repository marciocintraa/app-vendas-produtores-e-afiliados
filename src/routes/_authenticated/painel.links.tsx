import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LinkIcon, Plus, Copy, Trash2, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { useTrackedLinks, saveTrackedLink, deleteTrackedLink, newId, type TrackedLink } from "@/lib/app-extras-store";

export const Route = createFileRoute("/_authenticated/painel/links")({
  head: () => ({
    meta: [
      { title: "Links de Divulgação — Vende Fácil Pro" },
      { name: "description", content: "Crie e organize links de divulgação com origem identificada para saber o que mais vende." },
      { property: "og:title", content: "Links de Divulgação — Vende Fácil Pro" },
      { property: "og:description", content: "Organize seus links por canal e acompanhe os cliques." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LinksPage,
});

const SOURCES = ["Instagram", "WhatsApp", "TikTok", "Facebook", "YouTube", "E-mail", "Outro"];

function buildUrl(url: string, source: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", source.toLowerCase());
    u.searchParams.set("utm_medium", "catalogo");
    return u.toString();
  } catch {
    return url;
  }
}

function LinksPage() {
  const links = useTrackedLinks();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [source, setSource] = useState(SOURCES[0]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return toast.error("Preencha o nome e o link.");
    const item: TrackedLink = {
      id: newId(),
      label: label.trim(),
      url: buildUrl(url.trim(), source),
      source,
      clicks: 0,
      createdAt: Date.now(),
    };
    saveTrackedLink(item);
    setLabel("");
    setUrl("");
    toast.success("Link criado.");
  };

  const copy = async (item: TrackedLink) => {
    await navigator.clipboard.writeText(item.url);
    saveTrackedLink({ ...item, clicks: item.clicks + 1 });
    toast.success("Link copiado.");
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <LinkIcon className="h-7 w-7 text-primary" /> Links de Divulgação
      </h1>
      <p className="mt-2 text-muted-foreground">
        Gere um link por canal para saber de onde vêm seus cliques e suas vendas.
      </p>

      <form onSubmit={add} className="mt-6 grid gap-3 rounded-2xl border border-border/50 bg-card p-5 sm:grid-cols-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nome (ex.: Catálogo no Stories)"
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        >
          {SOURCES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://... (link do catálogo ou do produto)"
          className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm sm:col-span-2"
        />
        <button className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-primary-foreground sm:col-span-2">
          <Plus className="h-4 w-4" /> Criar link
        </button>
      </form>

      <div className="mt-8 space-y-3">
        {links.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            Nenhum link criado ainda.
          </p>
        )}
        {links.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card p-4">
            <div className="min-w-0">
              <p className="font-semibold">{item.label}</p>
              <p className="truncate text-xs text-muted-foreground">{item.url}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                <MousePointerClick className="h-3 w-3" /> {item.source} · {item.clicks} cópias
              </p>
            </div>
            <div className="flex gap-2 text-muted-foreground">
              <button onClick={() => copy(item)} aria-label="Copiar" className="rounded-lg border border-border/50 p-2 hover:text-foreground">
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  deleteTrackedLink(item.id);
                  toast.success("Link removido.");
                }}
                aria-label="Excluir"
                className="rounded-lg border border-border/50 p-2 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
