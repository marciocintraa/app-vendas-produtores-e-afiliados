import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Star, ArrowRight, Sparkles } from "lucide-react";
import { useProducts, useCatalogs, DEFAULT_CATALOG, coverOf } from "@/lib/catalog-store";

export const Route = createFileRoute("/catalogo")({
  validateSearch: (search: Record<string, unknown>): { c?: string; public?: string } => ({
    c: typeof search.c === "string" && search.c ? search.c : undefined,
    public: typeof search.public === "string" ? search.public : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Catálogo — Vende Fácil Pro" },
      {
        name: "description",
        content:
          "Explore produtos digitais selecionados: cursos, mentorias e ferramentas para acelerar seu negócio online.",
      },
      { property: "og:title", content: "Catálogo — Vende Fácil Pro" },
      {
        property: "og:description",
        content:
          "Explore produtos digitais selecionados: cursos, mentorias e ferramentas para acelerar seu negócio online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const allProducts = useProducts();
  const catalogs = useCatalogs();
  const { c: catalogSlug } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const activeCatalog = useMemo(
    () => catalogs.find((cat) => cat.slug === catalogSlug),
    [catalogs, catalogSlug],
  );

  const scopedProducts = useMemo(() => {
    if (!activeCatalog) return allProducts;
    return allProducts.filter(
      (p) => (p.catalogId ?? DEFAULT_CATALOG.id) === activeCatalog.id,
    );
  }, [allProducts, activeCatalog]);

  const categories = useMemo(
    () => Array.from(new Set(scopedProducts.map((p) => p.category))),
    [scopedProducts],
  );

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scopedProducts.filter((p) => {
      if (p.published === false) return false;
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [scopedProducts, query, category]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-surface/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            Vende Fácil Pro
          </span>
          <span className="text-sm text-muted-foreground">Catálogo público</span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-12 pb-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Vitrine pública
        </span>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          {activeCatalog ? activeCatalog.name : "Catálogo público"}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {products.length} {products.length === 1 ? "produto disponível" : "produtos disponíveis"} nesta
          vitrine. Toque em um produto para ver todos os detalhes.
        </p>


        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título, nicho ou categoria…"
              className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                category === null
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas
            </button>
            {categories.map((c: string) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  category === c
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-surface/40 p-12 text-center text-muted-foreground">
            Nenhum produto encontrado com esses filtros.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Link
                key={p.id}
                to="/catalogo/$productId"
                params={{ productId: p.id }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50"
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  <img
                    src={coverOf(p)}
                    alt={`Capa de ${p.title}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
                    {p.platform}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.category}</span>
                    <span className="inline-flex items-center gap-1 text-foreground/80">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      {p.rating.toFixed(1)}
                      <span className="text-muted-foreground">({p.reviews})</span>
                    </span>
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold leading-tight">{p.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.tagline}</p>
                  </div>
                  {p.gallery && p.gallery.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {p.gallery.slice(0, 4).map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt=""
                          loading="lazy"
                          className="h-10 w-10 rounded-md border border-border/60 object-cover"
                        />
                      ))}
                      {p.gallery.length > 4 && (
                        <span className="rounded-md border border-border/60 bg-surface px-2 py-1 text-[11px] text-muted-foreground">
                          +{p.gallery.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <div>
                      {p.originalPrice && (
                        <div className="text-xs text-muted-foreground line-through">
                          R$ {p.originalPrice.toFixed(0)}
                        </div>
                      )}
                      <div className="font-display text-xl font-semibold text-foreground">
                        R$ {p.price.toFixed(0)}
                      </div>
                    </div>
                    <a
                      href={p.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                    >
                      Ver <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
