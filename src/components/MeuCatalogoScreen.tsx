import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutGrid,
  Copy,
  Check,
  Share2,
  ExternalLink,
  QrCode,
  Eye,
  Package,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useCatalogs, useProducts, DEFAULT_CATALOG_ID } from "@/lib/catalog-store";
import { usePlan } from "@/lib/use-plan";

const SHARE_NETWORKS = [
  { label: "WhatsApp", href: (u: string, t: string) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}` },
  { label: "Telegram", href: (u: string, t: string) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { label: "Facebook", href: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { label: "LinkedIn", href: (u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { label: "Pinterest", href: (u: string, t: string) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(u)}&description=${encodeURIComponent(t)}` },
  { label: "E-mail", href: (u: string, t: string) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(u)}` },
];

export default function MeuCatalogoScreen() {
  const catalogs = useCatalogs();
  const products = useProducts();
  const { maxCatalogs, maxProductsPerCatalog } = usePlan();
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_CATALOG_ID);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (catalogs.length > 0 && !catalogs.some((c) => c.id === selectedId)) {
      setSelectedId(catalogs[0].id);
    }
  }, [catalogs, selectedId]);

  const selected = catalogs.find((c) => c.id === selectedId) ?? catalogs[0];
  const publicUrl = origin ? `${origin}/catalogo?c=${selectedId}` : `/catalogo?c=${selectedId}`;
  const shareTitle = `Confira meu catálogo: ${selected?.name ?? "Catálogo"}`;

  const stats = useMemo(() => {
    const inCatalog = products.filter((p) => (p.catalogId ?? DEFAULT_CATALOG_ID) === selectedId);
    return {
      total: inCatalog.length,
      published: inCatalog.filter((p) => p.published !== false).length,
      drafts: inCatalog.filter((p) => p.published === false).length,
    };
  }, [products, selectedId]);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(publicUrl)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente o endereço acima.");
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: publicUrl });
        return;
      } catch {
        /* cancelado */
      }
    }
    void copyLink();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-surface/40 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Vende Fácil Pro
            </p>
            <p className="text-sm text-muted-foreground">
              {maxCatalogs} {maxCatalogs === 1 ? "catálogo" : "catálogos"} ·{" "}
              {maxProductsPerCatalog === null
                ? "produtos ilimitados"
                : `${maxProductsPerCatalog} produtos por catálogo`}
            </p>
          </div>
          <Link
            to="/painel/produtos"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-semibold hover:bg-surface"
          >
            <Settings className="h-4 w-4" /> Gerenciar produtos
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <LayoutGrid className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Catálogo</h1>
            <p className="text-muted-foreground">
              Seu catálogo público: compartilhe um único link com todos os seus produtos.
            </p>
          </div>
        </div>

        {catalogs.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {catalogs.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  c.id === selectedId
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/60 text-muted-foreground hover:bg-surface"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <section className="rounded-3xl border border-border/60 bg-surface/40 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Link público do catálogo
          </h2>
          <div className="mt-3 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm font-medium break-all">
            {publicUrl}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar link"}
            </button>
            <button
              type="button"
              onClick={nativeShare}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-4 py-3 text-sm font-semibold hover:bg-surface"
            >
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-4 py-3 text-sm font-semibold hover:bg-surface"
            >
              <ExternalLink className="h-4 w-4" /> Visualizar
            </a>
          </div>

          <p className="mt-5 text-sm font-semibold">Compartilhar em</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SHARE_NETWORKS.map((n) => (
              <a
                key={n.label}
                href={n.href(publicUrl, shareTitle)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border/60 px-4 py-2 text-sm font-semibold hover:bg-surface"
              >
                {n.label}
              </a>
            ))}
            <button
              type="button"
              onClick={copyLink}
              className="rounded-full border border-border/60 px-4 py-2 text-sm font-semibold hover:bg-surface"
            >
              Instagram
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-full border border-border/60 px-4 py-2 text-sm font-semibold hover:bg-surface"
            >
              TikTok
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            No Instagram e no TikTok o link é copiado para você colar na bio ou no story.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-border/60 bg-surface/40 p-5">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <QrCode className="h-4 w-4" /> QR Code do catálogo
            </h2>
            <div className="mt-4 grid place-items-center">
              <img
                src={qrSrc}
                alt={`QR Code do catálogo ${selected?.name ?? ""}`}
                width={260}
                height={260}
                loading="lazy"
                className="rounded-2xl bg-white p-3"
              />
              <a
                href={qrSrc}
                download="qrcode-catalogo.png"
                target="_blank"
                rel="noreferrer"
                className="mt-4 rounded-xl border border-border/60 px-4 py-2 text-sm font-semibold hover:bg-surface"
              >
                Baixar QR Code
              </a>
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-surface/40 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Estatísticas
              </h2>
              <Link to="/painel/produtos" className="text-sm font-semibold text-primary">
                Gerenciar produtos
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatCard icon={<Eye className="h-4 w-4" />} label="Publicados" value={stats.published} />
              <StatCard icon={<Package className="h-4 w-4" />} label="Total" value={stats.total} />
              <StatCard icon={<Package className="h-4 w-4" />} label="Rascunhos" value={stats.drafts} />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Somente produtos publicados aparecem no link público.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-4">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
