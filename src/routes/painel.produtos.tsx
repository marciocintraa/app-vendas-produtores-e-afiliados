import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MIN_DIM = 200;
const MAX_DIM = 4000;

type CoverMeta = { width: number; height: number; mime: string | null; bytes: number | null };

async function validateCoverImage(next: string, signal?: AbortSignal): Promise<CoverMeta> {
  const isDataUrl = next.startsWith("data:");
  const isHttpUrl = /^https?:\/\//i.test(next);
  if (!isDataUrl && !isHttpUrl) {
    throw new Error("Formato de origem inválido. Use um upload local ou uma URL http(s) pública.");
  }
  let detectedBytes: number | null = null;
  let detectedMime: string | null = null;

  if (isDataUrl) {
    const match = /^data:([^;,]+)(;base64)?,(.*)$/i.exec(next);
    if (!match) throw new Error("Data URL malformada.");
    detectedMime = match[1].toLowerCase();
    if (!ALLOWED_MIME.includes(detectedMime)) {
      throw new Error(`Formato "${detectedMime}" não suportado. Use JPEG, PNG, WebP, GIF ou AVIF.`);
    }
    const isB64 = !!match[2];
    const payload = match[3];
    detectedBytes = isB64
      ? Math.floor((payload.length * 3) / 4) -
        (payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0)
      : new Blob([decodeURIComponent(payload)]).size;
    if (detectedBytes > MAX_BYTES) {
      throw new Error(
        `Imagem muito grande (${(detectedBytes / 1024 / 1024).toFixed(2)} MB). Limite: 5 MB.`,
      );
    }
  } else {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      signal?.addEventListener("abort", () => ctrl.abort());
      const res = await fetch(next, { method: "HEAD", signal: ctrl.signal, mode: "cors" });
      clearTimeout(to);
      if (res.ok) {
        const ct = res.headers.get("content-type");
        const cl = res.headers.get("content-length");
        if (ct) {
          detectedMime = ct.split(";")[0].trim().toLowerCase();
          if (!detectedMime.startsWith("image/")) {
            throw new Error(`A URL não retorna uma imagem (content-type: ${detectedMime}).`);
          }
          if (!ALLOWED_MIME.includes(detectedMime)) {
            throw new Error(
              `Formato "${detectedMime}" não suportado. Use JPEG, PNG, WebP, GIF ou AVIF.`,
            );
          }
        }
        if (cl) {
          detectedBytes = parseInt(cl, 10);
          if (Number.isFinite(detectedBytes) && detectedBytes > MAX_BYTES) {
            throw new Error(
              `Imagem muito grande (${(detectedBytes / 1024 / 1024).toFixed(2)} MB). Limite: 5 MB.`,
            );
          }
        }
      } else if (res.status >= 400) {
        throw new Error(`URL inacessível (HTTP ${res.status}).`);
      }
    } catch (headErr) {
      if (
        headErr instanceof Error &&
        /HTTP \d|não retorna|não suportado|muito grande/i.test(headErr.message)
      ) {
        throw headErr;
      }
    }
  }

  const { width, height } = await new Promise<{ width: number; height: number }>(
    (resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => reject(new Error("Tempo esgotado ao carregar a imagem (10s).")), 10000);
      const onAbort = () => {
        clearTimeout(timer);
        reject(new Error("Validação cancelada."));
      };
      signal?.addEventListener("abort", onAbort);
      img.onload = () => {
        clearTimeout(timer);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        clearTimeout(timer);
        reject(
          new Error(
            "A imagem selecionada não pôde ser carregada. Verifique se o arquivo é válido ou se a URL está acessível.",
          ),
        );
      };
      img.src = next;
    },
  );

  if (!width || !height) throw new Error("Não foi possível determinar as dimensões da imagem.");
  if (width < MIN_DIM || height < MIN_DIM) {
    throw new Error(
      `Resolução muito baixa (${width}×${height}). Mínimo recomendado: ${MIN_DIM}×${MIN_DIM}.`,
    );
  }
  if (width > MAX_DIM || height > MAX_DIM) {
    throw new Error(
      `Resolução muito alta (${width}×${height}). Máximo suportado: ${MAX_DIM}×${MAX_DIM}.`,
    );
  }
  return { width, height, mime: detectedMime, bytes: detectedBytes };
}
import {
  ArrowLeft,
  ArrowRight,
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
  Check,
  Loader2,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Undo,
} from "lucide-react";
import { toast } from "sonner";

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
  candidates: string[];
  selectedNext: string;
  preview: {
    title: string;
    tagline: string;
    category: string;
    platform: Product["platform"];
    price: number;
    originalPrice?: number;
    rating: number;
    reviews: number;
    gallery: string[];
  };
  onConfirm: (nextCover: string) => void;
};

function AdminProductsPage() {
  const products = useProducts();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [fullPreview, setFullPreview] = useState(false);
  const [finalConfirm, setFinalConfirm] = useState<{
    open: boolean;
    currentCover: string;
    nextCover: string;
  }>({ open: false, currentCover: "", nextCover: "" });
  const [savingCover, setSavingCover] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [coverValidation, setCoverValidation] = useState<{
    src: string;
    status: "idle" | "validating" | "valid" | "invalid";
    message?: string;
    meta?: CoverMeta;
  }>({ src: "", status: "idle" });
  const validationCtrlRef = useRef<AbortController | null>(null);
  const [coverDropActive, setCoverDropActive] = useState(false);
  const [coverDropError, setCoverDropError] = useState<string | null>(null);
  const coverHistoryRef = useRef<string[]>([]);
  const [canUndoCover, setCanUndoCover] = useState(false);

  function handleCoverFileDrop(files: FileList | File[]) {
    setCoverDropError(null);
    const list = Array.from(files);
    const file = list.find((f) => f.type.startsWith("image/"));
    if (!file) {
      setCoverDropError("Arquivo inválido. Envie uma imagem (JPEG, PNG, WebP, GIF ou AVIF).");
      toast.error("Formato não suportado", { description: "Solte um arquivo de imagem." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverDropError("A imagem excede 5 MB.");
      toast.error("Imagem muito grande", { description: "Tamanho máximo permitido: 5 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => {
      setCoverDropError("Não foi possível ler o arquivo.");
      toast.error("Falha ao ler o arquivo");
    };
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null;
      if (!url) return;
      setEditing((prev) =>
        prev && !prev.gallery.includes(url)
          ? { ...prev, gallery: [url, ...prev.gallery].slice(0, MAX_GALLERY) }
          : prev,
      );
      setConfirm((prev) => ({
        ...prev,
        candidates: prev.candidates.includes(url) ? prev.candidates : [url, ...prev.candidates],
      }));
      selectNextCover(url);
      toast.message("Imagem recebida", { description: "Validando automaticamente…" });
    };
    reader.readAsDataURL(file);
  }

  function requestFinalConfirm() {
    if (coverValidation.status !== "valid" || coverValidation.src !== confirm.selectedNext) {
      toast.error("Aguarde a validação da nova capa", {
        description:
          coverValidation.status === "invalid"
            ? coverValidation.message
            : "A imagem ainda está sendo validada.",
      });
      return;
    }
    setSaveError(null);
    setFinalConfirm({
      open: true,
      currentCover: editing?.cover ?? "",
      nextCover: confirm.selectedNext,
    });
  }

  function pushCoverHistory(value: string) {
    coverHistoryRef.current = [...coverHistoryRef.current, value];
    setCanUndoCover(true);
  }

  function selectNextCover(next: string) {
    if (next === confirm.selectedNext) return;
    pushCoverHistory(confirm.selectedNext);
    setConfirm((prev) => ({ ...prev, selectedNext: next }));
  }

  function undoCoverSelection() {
    const current = editing?.cover;
    if (!current) {
      toast.error("Nenhuma capa atual para restaurar.");
      return;
    }
    if (confirm.selectedNext === current) {
      toast.message("Já está na capa atual.");
      return;
    }
    coverHistoryRef.current = [current];
    setCanUndoCover(true);
    setCoverDropError(null);
    setConfirm((prev) => ({
      ...prev,
      selectedNext: current,
      candidates: prev.candidates.includes(current)
        ? prev.candidates
        : [current, ...prev.candidates],
    }));
    toast.message("Capa atual restaurada", {
      description: "A validação será executada automaticamente.",
    });
  }

  function resetToCurrentCover() {
    const current = editing?.cover;
    if (!current) {
      toast.error("Nenhuma capa atual para restaurar.");
      return;
    }
    if (confirm.selectedNext === current) return;
    setCoverDropError(null);
    pushCoverHistory(confirm.selectedNext);
    setConfirm((prev) => ({
      ...prev,
      selectedNext: current,
      candidates: prev.candidates.includes(current) ? prev.candidates : [current, ...prev.candidates],
    }));
    toast.message("Capa atual restaurada", {
      description: "A validação será executada automaticamente.",
    });
  }

  async function handleSaveCover() {
    const next = finalConfirm.nextCover;
    setSaveError(null);
    if (!next) {
      const msg = "Nenhuma imagem foi selecionada como nova capa.";
      setSaveError(msg);
      toast.error("Não foi possível salvar", { description: msg });
      return;
    }
    setSavingCover(true);
    const toastId = toast.loading("Salvando nova capa…", {
      description: "Atualizando a vitrine.",
    });
    try {
      let meta: CoverMeta;
      if (coverValidation.status === "valid" && coverValidation.src === next && coverValidation.meta) {
        meta = coverValidation.meta;
      } else {
        meta = await validateCoverImage(next);
      }
      await new Promise((r) => setTimeout(r, 400));
      confirm.onConfirm(next);
      setFinalConfirm({ open: false, currentCover: "", nextCover: "" });
      setFullPreview(false);
      const sizeInfo = meta.bytes ? ` · ${(meta.bytes / 1024).toFixed(0)} KB` : "";
      toast.success("Nova capa salva com sucesso", {
        id: toastId,
        description: `${meta.width}×${meta.height}${meta.mime ? ` · ${meta.mime}` : ""}${sizeInfo}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao salvar a capa.";
      setSaveError(message);
      toast.error("Falha ao salvar a nova capa", { id: toastId, description: message });
    } finally {
      setSavingCover(false);
    }
  }


  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: "",
    description: "",
    actionLabel: "",
    candidates: [],
    selectedNext: "",
    preview: {
      title: "",
      tagline: "",
      category: "",
      platform: "Hotmart",
      price: 0,
      originalPrice: undefined,
      rating: 5,
      reviews: 0,
      gallery: [],
    },
    onConfirm: () => {},
  });

  // Auto-validate the selected new cover as soon as it changes.
  useEffect(() => {
    const src = confirm.selectedNext;
    validationCtrlRef.current?.abort();
    if (!confirm.open || !src) {
      setCoverValidation({ src: "", status: "idle" });
      return;
    }
    const ctrl = new AbortController();
    validationCtrlRef.current = ctrl;
    setCoverValidation({ src, status: "validating" });
    validateCoverImage(src, ctrl.signal)
      .then((meta) => {
        if (ctrl.signal.aborted) return;
        setCoverValidation({ src, status: "valid", meta });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Falha na validação da imagem.";
        setCoverValidation({ src, status: "invalid", message });
      });
    return () => ctrl.abort();
  }, [confirm.selectedNext, confirm.open]);

  function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      target.isContentEditable
    );
  }

  function isActionTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return (
      tag === "button" ||
      tag === "a" ||
      target.getAttribute("role") === "button" ||
      target.getAttribute("role") === "link"
    );
  }

  useEffect(() => {
    if (!confirm.open || finalConfirm.open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (canUndoCover || (editing?.cover && confirm.selectedNext !== editing.cover)) {
          undoCoverSelection();
        } else {
          toast.message("Nada para desfazer.");
        }
        return;
      }
      if (e.key === "Enter" && !e.shiftKey && !e.altKey && !isActionTarget(e.target)) {
        e.preventDefault();
        requestFinalConfirm();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    confirm.open,
    confirm.selectedNext,
    editing?.cover,
    canUndoCover,
    finalConfirm.open,
    coverValidation,
  ]);


  function openConfirm(opts: Omit<ConfirmState, "open">) {
    coverHistoryRef.current = [editing?.cover ?? ""];
    setCanUndoCover(true);
    setConfirm({ open: true, ...opts });
  }

  function closeConfirm() {
    setFullPreview(false);
    coverHistoryRef.current = [];
    setCanUndoCover(false);
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
                            const candidates = editing.gallery.filter((g) => g !== editing.cover);
                            if (candidates.length === 0) {
                              setError(null);
                              setEditing({ ...editing, cover: "" });
                              return;
                            }
                            openConfirm({
                              title: "Trocar capa principal?",
                              description:
                                "A imagem atual é a capa do produto. Escolha abaixo qual imagem da galeria será a nova capa.",
                              actionLabel: "Sim, trocar capa",
                              candidates,
                              selectedNext: candidates[0],
                              preview: {
                                title: editing.title || "Título do produto",
                                tagline: editing.tagline || editing.title || "Subtítulo do produto",
                                category: editing.category || "Categoria",
                                platform: editing.platform,
                                price: Number(editing.price.replace(",", ".")) || 0,
                                originalPrice: editing.originalPrice
                                  ? Number(editing.originalPrice.replace(",", ".")) || undefined
                                  : undefined,
                                rating: 5,
                                reviews: 0,
                                gallery: editing.gallery.filter(Boolean),
                              },
                              onConfirm: (nextCover) => {
                                setError(null);
                                setEditing({ ...editing, cover: nextCover });
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
                                  const candidates = editing.gallery.filter((_, j) => j !== i);
                                  openConfirm({
                                    title: "Trocar capa principal?",
                                    description:
                                      "Esta imagem é a capa atual do produto. Escolha abaixo qual imagem da galeria será a nova capa.",
                                    actionLabel: "Sim, trocar capa",
                                    candidates,
                                    selectedNext: candidates[0] ?? "",
                                    preview: {
                                      title: editing.title || "Título do produto",
                                      tagline: editing.tagline || editing.title || "Subtítulo do produto",
                                      category: editing.category || "Categoria",
                                      platform: editing.platform,
                                      price: Number(editing.price.replace(",", ".")) || 0,
                                      originalPrice: editing.originalPrice
                                        ? Number(editing.originalPrice.replace(",", ".")) || undefined
                                        : undefined,
                                      rating: 5,
                                      reviews: 0,
                                      gallery: editing.gallery.filter((_, j) => j !== i),
                                    },
                                    onConfirm: (nextCover) => {
                                      setError(null);
                                      setEditing((prev) => {
                                        if (!prev) return prev;
                                        const next = prev.gallery.filter((_, j) => j !== i);
                                        return {
                                          ...prev,
                                          gallery: next,
                                          cover: nextCover,
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
              {confirm.candidates.length > 0 ? (
                <div className="mt-5 w-full space-y-3 text-left">
                  <div className="grid w-full gap-5 sm:grid-cols-[1fr_220px]">
                    <div className="rounded-xl border border-border/60 bg-surface/60 p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Selecione a nova capa:
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {confirm.candidates.map((src) => (
                          <button
                            key={src}
                            type="button"
                            onClick={() => selectNextCover(src)}
                            className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition-all ${
                              confirm.selectedNext === src
                                ? "border-primary ring-2 ring-primary/40"
                                : "border-border/60 hover:border-primary/50"
                            }`}
                          >
                            <img src={src} alt="" className="h-full w-full object-cover" />
                            {confirm.selectedNext === src && (
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-primary/90 px-1 py-0.5 text-center text-[10px] font-semibold text-primary-foreground">
                                NOVA CAPA
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-surface/60 p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Prévia no catálogo:
                      </p>
                      <CoverPreviewCard cover={confirm.selectedNext} {...confirm.preview} />
                      <ValidationBadge
                        state={coverValidation}
                        selected={confirm.selectedNext}
                      />
                    </div>
                  </div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!coverDropActive) setCoverDropActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setCoverDropActive(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setCoverDropActive(false);
                      if (e.dataTransfer.files?.length) {
                        handleCoverFileDrop(e.dataTransfer.files);
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-all ${
                      coverDropActive
                        ? "border-primary bg-primary/10"
                        : "border-border/70 bg-surface/40 hover:border-primary/50"
                    }`}
                  >
                    <ImageIcon className="mb-2 h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Arraste e solte uma imagem aqui
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      JPEG, PNG, WebP, GIF ou AVIF · até 5 MB · validação automática
                    </p>
                    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2">
                      <Upload className="h-3.5 w-3.5" />
                      Selecionar arquivo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) handleCoverFileDrop(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {coverDropError && (
                      <p className="mt-2 text-xs text-destructive">{coverDropError}</p>
                    )}
                  </div>
                  {confirm.candidates.length === 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Nenhuma imagem restante na galeria. Solte uma imagem acima para definir como nova capa.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-5 w-full text-left">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!coverDropActive) setCoverDropActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setCoverDropActive(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setCoverDropActive(false);
                      if (e.dataTransfer.files?.length) {
                        handleCoverFileDrop(e.dataTransfer.files);
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all ${
                      coverDropActive
                        ? "border-primary bg-primary/10"
                        : "border-border/70 bg-surface/40 hover:border-primary/50"
                    }`}
                  >
                    <ImageIcon className="mb-2 h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Arraste e solte uma imagem para definir como nova capa
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      JPEG, PNG, WebP, GIF ou AVIF · até 5 MB · validação automática
                    </p>
                    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2">
                      <Upload className="h-3.5 w-3.5" />
                      Selecionar arquivo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) handleCoverFileDrop(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {coverDropError && (
                      <p className="mt-2 text-xs text-destructive">{coverDropError}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
              >
                Cancelar
              </button>
              {(canUndoCover || (editing?.cover && confirm.selectedNext !== editing.cover)) && (
                <button
                  type="button"
                  onClick={undoCoverSelection}
                  title="Desfazer seleção (Ctrl+Z)"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
                >
                  <Undo className="h-4 w-4" /> Desfazer <span className="hidden text-[10px] opacity-60 sm:inline">Ctrl+Z</span>
                </button>
              )}
              {confirm.candidates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFullPreview(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <Eye className="h-4 w-4" /> Ver vitrine completa
                </button>
              )}
              <button
                type="button"
                onClick={requestFinalConfirm}
                disabled={
                  coverValidation.status !== "valid" ||
                  coverValidation.src !== confirm.selectedNext
                }
                title={
                  coverValidation.status === "valid" &&
                  coverValidation.src === confirm.selectedNext
                    ? "Confirmar troca de capa (Enter)"
                    : "Aguarde a validação da nova capa"
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {coverValidation.status === "validating" &&
                coverValidation.src === confirm.selectedNext ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Validando…
                  </>
                ) : (
                  <>
                    {confirm.actionLabel}{" "}
                    <span className="hidden text-[10px] opacity-70 sm:inline">Enter</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {fullPreview && confirm.open && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border/60 bg-surface/60 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Prévia da vitrine
              </p>
              <h3 className="font-display text-lg font-semibold">
                Como o catálogo ficará com a nova capa
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setFullPreview(false)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
            >
              <X className="h-4 w-4" /> Fechar prévia
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="mx-auto max-w-6xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Catálogo do assinante
              </span>
              <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Produtos que convertem, prontos para divulgar.
              </h1>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(() => {
                  const editedId = editing?.id ?? "";
                  const previewCard = (
                    <div
                      key="__preview__"
                      className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-primary bg-card shadow-card ring-2 ring-primary/30"
                    >
                      <span className="absolute right-3 top-3 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        PRÉVIA
                      </span>
                      <StorefrontCard
                        cover={confirm.selectedNext}
                        title={confirm.preview.title}
                        tagline={confirm.preview.tagline}
                        category={confirm.preview.category}
                        platform={confirm.preview.platform}
                        price={confirm.preview.price}
                        originalPrice={confirm.preview.originalPrice}
                        rating={confirm.preview.rating}
                        reviews={confirm.preview.reviews}
                        gallery={confirm.preview.gallery}
                      />
                    </div>
                  );
                  const others = sorted
                    .filter((p) => p.published !== false && p.id !== editedId)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card opacity-70"
                      >
                        <StorefrontCard
                          cover={p.cover}
                          title={p.title}
                          tagline={p.tagline}
                          category={p.category}
                          platform={p.platform}
                          price={p.price}
                          originalPrice={p.originalPrice}
                          rating={p.rating}
                          reviews={p.reviews}
                          gallery={p.gallery ?? []}
                        />
                      </div>
                    ));
                  return [previewCard, ...others];
                })()}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={requestFinalConfirm}
            title="Confirmar troca de capa (Enter)"
            className="fixed bottom-24 right-6 z-[80] inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-3 text-sm font-semibold text-destructive-foreground shadow-2xl shadow-destructive/40 ring-1 ring-destructive/60 transition-transform hover:scale-[1.03] sm:bottom-28 sm:right-10"
            aria-label="Confirmar troca de capa (Enter)"
          >
            <Check className="h-4 w-4" /> Confirmar troca de capa{" "}
            <span className="hidden text-[10px] opacity-70 sm:inline">Enter</span>
          </button>

          <div className="border-t border-border/60 bg-surface/60 px-6 py-4">
            <div className="mx-auto flex max-w-6xl flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setFullPreview(false)}
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
              >
                Voltar ao modal
              </button>
              {(canUndoCover || (editing?.cover && confirm.selectedNext !== editing.cover)) && (
                <button
                  type="button"
                  onClick={undoCoverSelection}
                  title="Desfazer seleção (Ctrl+Z)"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
                >
                  <Undo className="h-4 w-4" /> Desfazer{" "}
                  <span className="hidden text-[10px] opacity-60 sm:inline">Ctrl+Z</span>
                </button>
              )}
              <button
                type="button"
                onClick={requestFinalConfirm}
                title="Confirmar troca de capa (Enter)"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-transform hover:scale-[1.01]"
              >
                {confirm.actionLabel}{" "}
                <span className="hidden text-[10px] opacity-70 sm:inline">Enter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {finalConfirm.open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl">
            <div className="flex items-start gap-3 border-b border-border/60 bg-surface/60 px-6 py-4">
              <div className="rounded-xl bg-destructive/15 p-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold">
                  Confirmação final da troca de capa
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Compare a capa atual com a nova capa antes de salvar. Esta ação atualizará imediatamente o card do catálogo.
                </p>
              </div>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Capa atual</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">ATUAL</span>
                </div>
                <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border/60 bg-surface">
                  {finalConfirm.currentCover ? (
                    <img src={finalConfirm.currentCover} alt="Capa atual" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Sem capa</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-primary">Nova capa</span>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">NOVA</span>
                </div>
                <div className="aspect-[4/3] overflow-hidden rounded-xl border-2 border-primary bg-surface ring-2 ring-primary/30">
                  {finalConfirm.nextCover ? (
                    <img src={finalConfirm.nextCover} alt="Nova capa" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Sem capa</div>
                  )}
                </div>
              </div>
            </div>
            {saveError && (
              <div className="mx-6 mb-4 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <p className="font-semibold">Erro ao salvar a nova capa</p>
                <p className="mt-1 text-xs opacity-90">{saveError}</p>
              </div>
            )}
            <div className="flex flex-col-reverse gap-2 border-t border-border/60 bg-surface/60 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={savingCover}
                onClick={() => setFinalConfirm((p) => ({ ...p, open: false }))}
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingCover}
                onClick={handleSaveCover}
                aria-busy={savingCover}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                {savingCover ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Salvar nova capa
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function ValidationBadge({
  state,
  selected,
}: {
  state: {
    src: string;
    status: "idle" | "validating" | "valid" | "invalid";
    message?: string;
    meta?: CoverMeta;
  };
  selected: string;
}) {
  if (!selected) return null;
  const matches = state.src === selected;
  if (!matches || state.status === "idle") {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/60 bg-surface px-2.5 py-1.5 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Preparando validação…
      </div>
    );
  }
  if (state.status === "validating") {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-[11px] text-primary">
        <Loader2 className="h-3 w-3 animate-spin" /> Validando formato, tamanho e acessibilidade…
      </div>
    );
  }
  if (state.status === "valid" && state.meta) {
    const { width, height, mime, bytes } = state.meta;
    const size = bytes ? ` · ${(bytes / 1024).toFixed(0)} KB` : "";
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-500">
        <Check className="h-3 w-3" /> Imagem válida · {width}×{height}
        {mime ? ` · ${mime}` : ""}
        {size}
      </div>
    );
  }
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive">
      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
      <span>{state.message ?? "Imagem inválida."}</span>
    </div>
  );
}

function CoverPreviewCard({
  cover,
  title,
  tagline,
  category,
  platform,
  price,
  originalPrice,
  rating,
  reviews,
  gallery,
}: {
  cover: string;
  title: string;
  tagline: string;
  category: string;
  platform: Product["platform"];
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  gallery: string[];
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-card">
      <div className="relative aspect-[3/2] overflow-hidden">
        <img
          src={cover}
          alt={`Capa de ${title}`}
          className="h-full w-full object-cover"
        />
        <span className="absolute left-2 top-2 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
          {platform}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="truncate">{category}</span>
          <span className="inline-flex items-center gap-0.5 text-foreground/80">
            <Star className="h-3 w-3 fill-accent text-accent" />
            {rating.toFixed(1)}
            <span className="text-muted-foreground">({reviews})</span>
          </span>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold leading-tight line-clamp-1">{title}</h4>
          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{tagline}</p>
        </div>
        {gallery.length > 0 && (
          <div className="flex items-center gap-1">
            {gallery.slice(0, 3).map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="h-7 w-7 rounded border border-border/60 object-cover"
              />
            ))}
            {gallery.length > 3 && (
              <span className="rounded border border-border/60 bg-surface px-1 py-0.5 text-[9px] text-muted-foreground">
                +{gallery.length - 3}
              </span>
            )}
          </div>
        )}
        <div className="mt-auto flex items-end justify-between pt-1">
          <div>
            {originalPrice !== undefined && originalPrice > 0 && (
              <div className="text-[9px] text-muted-foreground line-through">
                R$ {originalPrice.toFixed(0)}
              </div>
            )}
            <div className="font-display text-sm font-semibold text-foreground">
              R$ {price.toFixed(0)}
            </div>
          </div>
          <span className="inline-flex items-center gap-0.5 text-[10px] text-primary">
            Ver <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
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

function StorefrontCard({
  cover,
  title,
  tagline,
  category,
  platform,
  price,
  originalPrice,
  rating,
  reviews,
  gallery,
}: {
  cover: string;
  title: string;
  tagline: string;
  category: string;
  platform: Product["platform"];
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  gallery: string[];
}) {
  return (
    <>
      <div className="relative aspect-[3/2] overflow-hidden">
        {cover ? (
          <img src={cover} alt={`Capa de ${title}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface text-xs text-muted-foreground">
            Sem capa
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
          {platform}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{category || "Sem categoria"}</span>
          <span className="inline-flex items-center gap-1 text-foreground/80">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            {rating.toFixed(1)}
            <span className="text-muted-foreground">({reviews})</span>
          </span>
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold leading-tight">
            {title || "Sem título"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{tagline}</p>
        </div>
        {gallery.length > 0 && (
          <div className="flex items-center gap-1.5">
            {gallery.slice(0, 4).map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="h-10 w-10 rounded-md border border-border/60 object-cover"
              />
            ))}
            {gallery.length > 4 && (
              <span className="rounded-md border border-border/60 bg-surface px-2 py-1 text-[11px] text-muted-foreground">
                +{gallery.length - 4}
              </span>
            )}
          </div>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            {originalPrice !== undefined && originalPrice > 0 && (
              <div className="text-xs text-muted-foreground line-through">
                R$ {originalPrice.toFixed(0)}
              </div>
            )}
            <div className="font-display text-xl font-semibold text-foreground">
              R$ {price.toFixed(0)}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-sm text-primary">
            Ver <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </>
  );
}
