import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Star,
  AlertTriangle,
} from "lucide-react";
import { type Product } from "@/lib/catalog-data";
import {
  useProducts,
  saveProduct,
  deleteProduct,
  slugify,
  makeCoverPlaceholder,
} from "@/lib/catalog-store";

export const Route = createFileRoute("/painel/produtos")({
  head: () => ({
    meta: [
      { title: "Meus produtos — Digital Store Pro" },
      {
        name: "description",
        content: "Crie, edite e publique produtos do seu catálogo digital.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminProductsPage,
});

type Draft = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  platform: Product["platform"];
  price: string;
  originalPrice: string;
  affiliateUrl: string;
  cover: string;
  gallery: string[];
  highlights: string;
  published: boolean;
};

const PLATFORMS: Product["platform"][] = ["Hotmart", "Kiwify", "Eduzz", "Monetizze"];
const MAX_GALLERY = 8;

function emptyDraft(): Draft {
  return {
    id: "",
    title: "",
    tagline: "",
    description: "",
    category: "",
    platform: "Hotmart",
    price: "",
    originalPrice: "",
    affiliateUrl: "",
    cover: "",
    gallery: [],
    highlights: "",
    published: true,
  };
}

function productToDraft(p: Product): Draft {
  return {
    id: p.id,
    title: p.title,
    tagline: p.tagline,
    description: p.description,
    category: p.category,
    platform: p.platform,
    price: String(p.price ?? ""),
    originalPrice: p.originalPrice ? String(p.originalPrice) : "",
    affiliateUrl: p.affiliateUrl,
    cover: p.cover,
    gallery: p.gallery ?? [],
    highlights: p.highlights.join("\n"),
    published: p.published !== false,
  };
}

type ConfirmState = {
  open: boolean;
  title: string;
  description: string;
  actionLabel: string;
  nextCover?: string;
  onConfirm: () => void;
};

function AdminProductsPage() {
  const products = useProducts();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: "",
    description: "",
    actionLabel: "",
    onConfirm: () => {},
  });

  function openConfirm(opts: Omit<ConfirmState, "open">) {
    setConfirm({ open: true, ...opts });
  }

  function closeConfirm() {
    setConfirm((prev) => ({ ...prev, open: false }));
  }

  function reorderGallery(from: number, to: number) {
    if (from === to) return;
    setEditing((prev) => {
      if (!prev) return prev;
      const next = [...prev.gallery];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...prev, gallery: next };
    });
  }

  const sorted = useMemo(
    () => [...products].sort((a, b) => a.title.localeCompare(b.title, "pt-BR")),
    [products],
  );

  useEffect(() => {
    if (!editing) setError(null);
  }, [editing]);

  function startCreate() {
    setEditing(emptyDraft());
  }

  function startEdit(p: Product) {
    setEditing(productToDraft(p));
  }

  function handleDelete(p: Product) {
    if (typeof window === "undefined") return;
    if (window.confirm(`Remover "${p.title}" do catálogo?`)) {
      deleteProduct(p.id);
    }
  }

  function togglePublish(p: Product) {
    saveProduct({ ...p, published: !(p.published !== false) });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const title = editing.title.trim();
    const category = editing.category.trim();
    const priceNum = Number(editing.price.replace(",", "."));
    const originalNum = editing.originalPrice
      ? Number(editing.originalPrice.replace(",", "."))
      : undefined;
    const affiliateUrl = editing.affiliateUrl.trim();

    if (!title) return setError("Informe o título do produto.");
    if (!category) return setError("Informe a categoria.");
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError("Preço inválido.");
    if (originalNum !== undefined && (!Number.isFinite(originalNum) || originalNum < 0))
      return setError("Preço original inválido.");
    if (!affiliateUrl) return setError("Informe o link de compra.");
    try {
      // eslint-disable-next-line no-new
      new URL(affiliateUrl);
    } catch {
      return setError("O link de compra deve ser uma URL válida (https://…).");
    }

    const id = editing.id || slugify(title) || `produto-${Date.now()}`;
    const existing = products.find((p) => p.id === id);
    const highlights = editing.highlights
      .split("\n")
      .map((h) => h.trim())
      .filter(Boolean);

    const product: Product = {
      id,
      title,
      tagline: editing.tagline.trim() || title,
      description: editing.description.trim(),
      price: priceNum,
      originalPrice: originalNum,
      category,
      platform: editing.platform,
      rating: existing?.rating ?? 5,
      reviews: existing?.reviews ?? 0,
      affiliateUrl,
      cover: editing.cover.trim() || existing?.cover || makeCoverPlaceholder(title),
      gallery: editing.gallery.filter(Boolean),
      highlights: highlights.length ? highlights : existing?.highlights ?? [],
      modules: existing?.modules ?? [],
      published: editing.published,
    };

    saveProduct(product);
    setEditing(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-surface/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            Digital Store Pro
          </Link>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Painel do assinante
            </span>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Meus produtos
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Cadastre novos produtos, edite os existentes e controle o que fica publicado no
              seu catálogo.
            </p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4" /> Novo produto
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
          <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto] gap-4 border-b border-border/60 bg-surface/60 px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground">
            <div>Produto</div>
            <div>Categoria</div>
            <div>Preço</div>
            <div>Status</div>
            <div className="text-right">Ações</div>
          </div>
          {sorted.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              Nenhum produto cadastrado ainda. Clique em <b>Novo produto</b> para começar.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {sorted.map((p) => {
                const isPublished = p.published !== false;
                return (
                  <li
                    key={p.id}
                    className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto] items-center gap-4 px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.cover}
                        alt=""
                        className="h-12 w-16 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{p.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {p.platform} · /{p.id}
                        </div>
                      </div>
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{p.category}</div>
                    <div className="font-display text-sm font-semibold">
                      R$ {p.price.toFixed(2).replace(".", ",")}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => togglePublish(p)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                          isPublished
                            ? "border-accent/40 bg-accent/10 text-accent"
                            : "border-border bg-surface text-muted-foreground"
                        }`}
                        title={isPublished ? "Publicado" : "Rascunho"}
                      >
                        {isPublished ? (
                          <>
                            <Eye className="h-3.5 w-3.5" /> Publicado
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5" /> Rascunho
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/catalogo/$productId"
                        params={{ productId: p.id }}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                        title="Ver página"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="my-8 w-full max-w-2xl rounded-2xl border border-border/70 bg-card p-6 shadow-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold">
                  {editing.id ? "Editar produto" : "Novo produto"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Preencha os campos abaixo e salve para atualizar o catálogo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Título" className="sm:col-span-2">
                <input
                  required
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="input"
                  placeholder="Ex: Renda Extra Digital"
                />
              </Field>
              <Field label="Subtítulo" className="sm:col-span-2">
                <input
                  value={editing.tagline}
                  onChange={(e) => setEditing({ ...editing, tagline: e.target.value })}
                  className="input"
                  placeholder="Uma frase curta que resume a promessa"
                />
              </Field>
              <Field label="Categoria">
                <input
                  required
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="input"
                  placeholder="Ex: Marketing Digital"
                  list="dsp-categories"
                />
                <datalist id="dsp-categories">
                  {Array.from(new Set(products.map((p) => p.category))).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label="Plataforma">
                <select
                  value={editing.platform}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      platform: e.target.value as Product["platform"],
                    })
                  }
                  className="input"
                >
                  {PLATFORMS.map((pl) => (
                    <option key={pl} value={pl}>
                      {pl}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Preço (R$)">
                <input
                  required
                  inputMode="decimal"
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                  className="input"
                  placeholder="197"
                />
              </Field>
              <Field label="Preço original (opcional)">
                <input
                  inputMode="decimal"
                  value={editing.originalPrice}
                  onChange={(e) =>
                    setEditing({ ...editing, originalPrice: e.target.value })
                  }
                  className="input"
                  placeholder="497"
                />
              </Field>
              <Field label="Link de compra" className="sm:col-span-2">
                <input
                  required
                  type="url"
                  value={editing.affiliateUrl}
                  onChange={(e) =>
                    setEditing({ ...editing, affiliateUrl: e.target.value })
                  }
                  className="input"
                  placeholder="https://hotmart.com/…"
                />
              </Field>
              <Field
                label="Imagem de capa"
                className="sm:col-span-2"
                hint="Envie um arquivo (JPG, PNG ou WebP até 3 MB) ou cole uma URL. Em branco = capa gerada automaticamente."
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex h-28 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-surface/60">
                    {editing.cover ? (
                      <img
                        src={editing.cover}
                        alt="Prévia da capa"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="px-2 text-center text-[11px] text-muted-foreground">
                        Sem imagem
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-2">
                        <Plus className="h-4 w-4" />
                        {editing.cover ? "Trocar imagem" : "Enviar imagem"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            if (file.size > 3 * 1024 * 1024) {
                              setError("A imagem deve ter no máximo 3 MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result;
                              if (typeof result === "string") {
                                setError(null);
                                setEditing((prev) =>
                                  prev ? { ...prev, cover: result } : prev,
                                );
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {editing.cover && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = editing.gallery.find((g) => g !== editing.cover) ?? "";
                            if (!next) {
                              setError(null);
                              setEditing({ ...editing, cover: "" });
                              return;
                            }
                            openConfirm({
                              title: "Trocar capa principal?",
                              description:
                                "A imagem atual é a capa do produto. Removê-la promoverá automaticamente a próxima imagem da galeria como nova capa.",
                              actionLabel: "Sim, trocar capa",
                              nextCover: next,
                              onConfirm: () => {
                                setError(null);
                                setEditing({ ...editing, cover: next });
                                closeConfirm();
                              },
                            });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title={
                            editing.gallery.some((g) => g !== editing.cover)
                              ? "A próxima imagem da galeria será usada como capa."
                              : "Remove a capa."
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remover
                        </button>
                      )}
                    </div>
                    <input
                      value={editing.cover.startsWith("data:") ? "" : editing.cover}
                      onChange={(e) => setEditing({ ...editing, cover: e.target.value })}
                      className="input"
                      placeholder="ou cole uma URL: https://…/capa.jpg"
                    />
                  </div>
                </div>
              </Field>
              <Field
                label={`Galeria de imagens (${editing.gallery.length}/${MAX_GALLERY})`}
                className="sm:col-span-2"
                hint="Imagens extras que aparecem na página do produto e como miniaturas no card do catálogo. Arraste para reordenar."
              >
                <div className="space-y-3">
                  {editing.gallery.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {editing.gallery.map((src, i) => {
                        const isDragging = dragIndex === i;
                        const isOver = dragOverIndex === i && dragIndex !== null && dragIndex !== i;
                        return (
                          <div
                            key={`${i}-${src.slice(0, 24)}`}
                            draggable
                            onDragStart={(e) => {
                              setDragIndex(i);
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", String(i));
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                              if (dragOverIndex !== i) setDragOverIndex(i);
                            }}
                            onDragLeave={() => {
                              if (dragOverIndex === i) setDragOverIndex(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const from = dragIndex ?? Number(e.dataTransfer.getData("text/plain"));
                              if (Number.isFinite(from)) reorderGallery(from, i);
                              setDragIndex(null);
                              setDragOverIndex(null);
                            }}
                            onDragEnd={() => {
                              setDragIndex(null);
                              setDragOverIndex(null);
                            }}
                            className={`group relative aspect-[4/3] cursor-move overflow-hidden rounded-lg border bg-surface/60 transition-all ${
                              isOver
                                ? "border-primary ring-2 ring-primary/40"
                                : "border-border/60"
                            } ${isDragging ? "opacity-40" : ""}`}
                            title="Arraste para reordenar"
                          >
                            <img src={src} alt="" className="h-full w-full object-cover pointer-events-none" />
                            <div className="pointer-events-none absolute left-1 top-1 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
                              {i + 1}
                            </div>
                            <div className="pointer-events-none absolute bottom-1 left-1 rounded-md bg-background/80 p-1 text-muted-foreground backdrop-blur">
                              <GripVertical className="h-3.5 w-3.5" />
                            </div>
                            <div className="absolute right-1 top-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditing((prev) =>
                                    prev ? { ...prev, cover: src } : prev,
                                  )
                                }
                                disabled={editing.cover === src}
                                className={`rounded-md p-1 backdrop-blur transition-colors ${
                                  editing.cover === src
                                    ? "bg-primary/90 text-primary-foreground"
                                    : "bg-background/80 text-muted-foreground hover:text-primary"
                                }`}
                                aria-label={
                                  editing.cover === src
                                    ? "Capa atual"
                                    : "Definir como capa"
                                }
                                title={
                                  editing.cover === src
                                    ? "Capa atual"
                                    : "Definir como capa"
                                }
                              >
                                <Star
                                  className={`h-3.5 w-3.5 ${
                                    editing.cover === src ? "fill-current" : ""
                                  }`}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (editing.cover !== src) {
                                    setError(null);
                                    setEditing((prev) =>
                                      prev
                                        ? { ...prev, gallery: prev.gallery.filter((_, j) => j !== i) }
                                        : prev,
                                    );
                                    return;
                                  }
                                  openConfirm({
                                    title: "Trocar capa principal?",
                                    description:
                                      "Esta imagem é a capa atual do produto. Removê-la promoverá automaticamente a próxima imagem da galeria como nova capa.",
                                    actionLabel: "Sim, trocar capa",
                                    onConfirm: () => {
                                      setError(null);
                                      setEditing((prev) => {
                                        if (!prev) return prev;
                                        const nextGallery = prev.gallery.filter((_, j) => j !== i);
                                        return {
                                          ...prev,
                                          gallery: nextGallery,
                                          cover: nextGallery[0] ?? "",
                                        };
                                      });
                                      closeConfirm();
                                    },
                                  });
                                }}
                                className="rounded-md bg-background/80 p-1 text-muted-foreground backdrop-blur transition-colors hover:text-destructive"
                                aria-label="Remover imagem"
                                title={
                                  editing.cover === src
                                    ? "Remover — a próxima imagem da galeria vira capa."
                                    : "Remover imagem"
                                }
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {editing.cover === src && (
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-primary/90 px-2 py-0.5 text-center text-[10px] font-semibold text-primary-foreground">
                                CAPA
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <label
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-2 ${
                      editing.gallery.length >= MAX_GALLERY
                        ? "pointer-events-none opacity-50"
                        : ""
                    }`}
                  >
                    <Plus className="h-4 w-4" /> Adicionar imagens
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        e.target.value = "";
                        if (!files.length) return;
                        const slots = MAX_GALLERY - editing.gallery.length;
                        const accepted = files.slice(0, slots).filter((f) => {
                          if (f.size > 3 * 1024 * 1024) {
                            setError("Cada imagem deve ter no máximo 3 MB.");
                            return false;
                          }
                          return true;
                        });
                        Promise.all(
                          accepted.map(
                            (f) =>
                              new Promise<string | null>((resolve) => {
                                const r = new FileReader();
                                r.onload = () =>
                                  resolve(
                                    typeof r.result === "string" ? r.result : null,
                                  );
                                r.onerror = () => resolve(null);
                                r.readAsDataURL(f);
                              }),
                          ),
                        ).then((results) => {
                          const urls = results.filter(
                            (x): x is string => typeof x === "string",
                          );
                          if (!urls.length) return;
                          setEditing((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  gallery: [...prev.gallery, ...urls].slice(0, MAX_GALLERY),
                                }
                              : prev,
                          );
                        });
                      }}
                    />
                  </label>
                </div>
              </Field>
              <Field label="Descrição" className="sm:col-span-2">
                <textarea
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  className="input min-h-[110px] resize-y"
                  placeholder="Descreva o que o aluno vai aprender e para quem é o produto."
                />
              </Field>
              <Field
                label="Destaques (um por linha)"
                className="sm:col-span-2"
                hint="Aparecem na página do produto como itens inclusos."
              >
                <textarea
                  value={editing.highlights}
                  onChange={(e) =>
                    setEditing({ ...editing, highlights: e.target.value })
                  }
                  className="input min-h-[90px] resize-y"
                  placeholder={"Acesso vitalício\nComunidade privada\nCertificado"}
                />
              </Field>

              <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-border/60 bg-surface/60 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={editing.published}
                  onChange={(e) =>
                    setEditing({ ...editing, published: e.target.checked })
                  }
                  className="h-4 w-4 accent-[color:var(--color-primary)]"
                />
                <span>
                  <span className="font-medium">Publicar no catálogo</span>
                  <span className="ml-2 text-muted-foreground">
                    Desmarque para salvar como rascunho.
                  </span>
                </span>
              </label>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01]"
              >
                <Save className="h-4 w-4" />
                {editing.id ? "Salvar alterações" : "Criar produto"}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirm.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-card">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{confirm.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {confirm.description}
              </p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirm.onConfirm}
                className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-transform hover:scale-[1.01]"
              >
                {confirm.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground/80">{hint}</span>}
    </label>
  );
}
