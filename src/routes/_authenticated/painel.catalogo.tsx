import { createFileRoute, Link } from "@tanstack/react-router";
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
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCatalogs,
  useProducts,
  DEFAULT_CATALOG_ID,
  MAX_CATALOGS,
  saveCatalog,
  deleteCatalog,
  slugify,
} from "@/lib/catalog-store";

export const Route = createFileRoute("/_authenticated/painel/catalogo")({
  head: () => ({
    meta: [
      { title: "Meus Catálogos — Vende Fácil Pro" },
      {
        name: "description",
        content: "Gerencie seus catálogos, links públicos, QR Codes e produtos publicados.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CatalogosPage,
});

function CatalogosPage() {
  const catalogs = useCatalogs();
  const products = useProducts();
  const [selectedId, setSelectedId] = useState(DEFAULT_CATALOG_ID);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (catalogs.length && !catalogs.some((c) => c.id === selectedId)) {
      setSelectedId(catalogs[0].id);
    }
  }, [catalogs, selectedId]);

  const selected = catalogs.find((c) => c.id === selectedId) ?? catalogs[0];
  const publicUrl = origin
    ? `${origin}/catalogo?c=${selected?.slug ?? "principal"}`
    : `/catalogo?c=${selected?.slug ?? "principal"}`;

  const stats = useMemo(() => {
    const inCatalog = products.filter(
      (p) => (p.catalogId ?? DEFAULT_CATALOG_ID) === selected?.id,
    );
    return {
      total: inCatalog.length,
      published: inCatalog.filter((p) => p.published !== false).length,
      drafts: inCatalog.filter((p) => p.published === false).length,
    };
  }, [products, selected?.id]);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(publicUrl)}`;

  function createCatalog() {
    const name = newName.trim();
    if (!name) return;
    if (catalogs.length >= MAX_CATALOGS) {
      toast.error(`Seu plano permite até ${MAX_CATALOGS} catálogos.`);
      return;
    }
    const base = slugify(name) || `catalogo-${Date.now()}`;
    let slug = base;
    let n = 2;
    while (catalogs.some((c) => c.slug === slug)) slug = `${base}-${n++}`;
    const id = `cat-${Date.now()}`;
    saveCatalog({ id, name, slug });
    setSelectedId(id);
    setNewName("");
    setCreating(false);
    toast.success("Catálogo criado com sucesso!");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link do catálogo copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  async function shareCatalog() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Catálogo ${selected?.name ?? ""}`, url: publicUrl });
        return;
      } catch {
        return;
      }
    }
    await copyLink();
  }

  function removeSelected() {
    if (!selected || selected.id === DEFAULT_CATALOG_ID) return;
    if (!window.confirm(`Excluir o catálogo “${selected.name}”? Os produtos voltarão ao catálogo principal.`)) return;
    deleteCatalog(selected.id);
    setSelectedId(DEFAULT_CATALOG_ID);
    toast.success("Catálogo excluído.");
  }

  return (
    <div className="min-h-screen bg-[#070B18] text-white">
      <header className="border-b border-white/5 bg-[#0A0F22]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">VENDE FÁCIL PRO</p>
            <h1 className="mt-1 text-2xl font-bold">Meus Catálogos</h1>
            <p className="mt-1 text-sm text-slate-400">Organize seus produtos e compartilhe cada catálogo com um link próprio.</p>
          </div>
          <Link
            to="/painel/produtos"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
          >
            <Settings className="h-4 w-4" /> Gerenciar produtos
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {catalogs.map((catalog) => {
            const count = products.filter((p) => (p.catalogId ?? DEFAULT_CATALOG_ID) === catalog.id).length;
            const active = catalog.id === selected?.id;
            return (
              <button
                key={catalog.id}
                type="button"
                onClick={() => setSelectedId(catalog.id)}
                className={`rounded-2xl border p-5 text-left transition ${active ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/10 bg-[#0A0F22] hover:border-white/20"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${active ? "bg-cyan-400/15 text-cyan-300" : "bg-white/5 text-slate-400"}`}>
                    <LayoutGrid className="h-5 w-5" />
                  </span>
                  {active && <span className="text-xs font-semibold text-cyan-300">Selecionado</span>}
                </div>
                <h2 className="mt-4 truncate font-semibold">{catalog.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{count} {count === 1 ? "produto" : "produtos"}</p>
              </button>
            );
          })}
          {catalogs.length < MAX_CATALOGS && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="min-h-[150px] rounded-2xl border border-dashed border-white/15 bg-[#0A0F22]/60 p-5 text-left text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/5"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-cyan-300"><Plus className="h-5 w-5" /></span>
              <p className="mt-4 font-semibold">Novo catálogo</p>
              <p className="mt-1 text-sm text-slate-500">Você pode criar mais {MAX_CATALOGS - catalogs.length}.</p>
            </button>
          )}
        </section>

        {creating && (
          <section className="rounded-2xl border border-cyan-400/20 bg-[#0A0F22] p-5">
            <p className="font-semibold">Criar novo catálogo</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createCatalog()}
                placeholder="Ex.: Catálogo Fitness"
                className="h-11 flex-1 rounded-xl border border-white/10 bg-[#070B18] px-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
              />
              <button type="button" onClick={createCatalog} className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-[#06101A] hover:opacity-90">Criar catálogo</button>
              <button type="button" onClick={() => { setCreating(false); setNewName(""); }} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5">Cancelar</button>
            </div>
          </section>
        )}

        {selected && (
          <>
            <section className="rounded-2xl border border-white/10 bg-[#0A0F22] p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Share2 className="h-6 w-6" /></span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Catálogo selecionado</p>
                      <h2 className="text-xl font-bold">{selected.name}</h2>
                    </div>
                  </div>
                  <p className="mt-5 text-sm text-slate-400">Link público para divulgar seu catálogo:</p>
                  <div className="mt-2 break-all rounded-xl border border-white/10 bg-[#070B18] px-4 py-3 text-sm text-slate-200">{publicUrl}</div>
                </div>
                <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                  <button type="button" onClick={copyLink} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-[#06101A] hover:opacity-90">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copiado" : "Copiar link"}
                  </button>
                  <button type="button" onClick={shareCatalog} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/5"><Share2 className="h-4 w-4" /> Compartilhar</button>
                  <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/5"><ExternalLink className="h-4 w-4" /> Visualizar</a>
                  {selected.id !== DEFAULT_CATALOG_ID && <button type="button" onClick={removeSelected} className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-400/5"><Trash2 className="h-4 w-4" /> Excluir</button>}
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <section className="rounded-2xl border border-white/10 bg-[#0A0F22] p-6">
                <div className="flex items-center gap-2 text-sm font-semibold"><QrCode className="h-4 w-4 text-cyan-300" /> QR Code</div>
                <div className="mt-5 flex flex-col items-center">
                  <div className="rounded-2xl bg-white p-3"><img src={qrSrc} alt={`QR Code de ${selected.name}`} width={220} height={220} /></div>
                  <a href={qrSrc} download="qrcode-catalogo.png" target="_blank" rel="noreferrer" className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/5">Baixar QR Code</a>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#0A0F22] p-6">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4 text-cyan-300" /> Resumo do catálogo</div><Link to="/painel/produtos" className="text-sm font-semibold text-cyan-300">Editar produtos</Link></div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Stat label="Publicados" value={stats.published} icon={<Eye className="h-4 w-4" />} />
                  <Stat label="Total" value={stats.total} icon={<Package className="h-4 w-4" />} />
                  <Stat label="Rascunhos" value={stats.drafts} icon={<Package className="h-4 w-4" />} />
                </div>
                <p className="mt-5 text-xs leading-5 text-slate-500">Somente produtos publicados aparecem no link público. Para adicionar ou mover produtos entre catálogos, use Gerenciar produtos.</p>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-xl border border-white/10 bg-[#070B18] p-4"><p className="flex items-center gap-2 text-xs text-slate-500">{icon}{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>;
}
