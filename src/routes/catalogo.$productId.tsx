import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check, ExternalLink, Sparkles, Star, BookOpen, Share2 } from "lucide-react";
import { getProduct, PRODUCTS } from "@/lib/catalog-data";

export const Route = createFileRoute("/catalogo/$productId")({
  loader: ({ params }) => {
    const product = getProduct(params.productId);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Produto não encontrado — Digital Store Pro" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { product } = loaderData;
    const title = `${product.title} — Digital Store Pro`;
    return {
      meta: [
        { title },
        { name: "description", content: product.tagline },
        { property: "og:title", content: title },
        { property: "og:description", content: product.tagline },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background text-center">
      <div>
        <h1 className="font-display text-2xl font-semibold">Produto não encontrado</h1>
        <p className="mt-2 text-muted-foreground">Ele pode ter sido removido do catálogo.</p>
        <Link
          to="/catalogo"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Voltar ao catálogo
        </Link>
      </div>
    </div>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const related = PRODUCTS.filter(
    (p) => p.id !== product.id && p.category === product.category,
  ).slice(0, 3);
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

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
            <ArrowLeft className="h-4 w-4" /> Catálogo
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="relative overflow-hidden rounded-3xl border border-border/70 shadow-card">
              <img
                src={product.cover}
                alt={`Capa de ${product.title}`}
                className="aspect-[4/3] w-full object-cover"
              />
              <span className="absolute left-4 top-4 rounded-full bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur">
                {product.platform}
              </span>
              {discount > 0 && (
                <span className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  -{discount}%
                </span>
              )}
            </div>

            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold">Sobre este produto</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{product.description}</p>
            </section>

            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold">O que está incluso</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {product.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-2 rounded-xl border border-border/60 bg-surface/60 p-3 text-sm"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold">Conteúdo do curso</h2>
              <div className="mt-4 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-surface/40">
                {product.modules.map((m, i) => (
                  <div key={m.title} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="font-medium">{m.title}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" /> {m.lessons} aulas
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
              <div className="text-xs text-muted-foreground">{product.category}</div>
              <h1 className="mt-1 font-display text-3xl font-semibold leading-tight">
                {product.title}
              </h1>
              <p className="mt-2 text-muted-foreground">{product.tagline}</p>

              <div className="mt-4 flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-medium">{product.rating.toFixed(1)}</span>
                </span>
                <span className="text-muted-foreground">
                  {product.reviews.toLocaleString("pt-BR")} avaliações
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-border/60 bg-surface/60 p-4">
                {product.originalPrice && (
                  <div className="text-sm text-muted-foreground line-through">
                    De R$ {product.originalPrice.toFixed(2).replace(".", ",")}
                  </div>
                )}
                <div className="font-display text-4xl font-semibold text-foreground">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  ou 12x de R$ {(product.price / 12).toFixed(2).replace(".", ",")} sem juros
                </div>
              </div>

              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01]"
              >
                Comprar agora <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    void navigator.share({
                      title: product.title,
                      text: product.tagline,
                      url: typeof window !== "undefined" ? window.location.href : undefined,
                    });
                  } else if (typeof navigator !== "undefined") {
                    void navigator.clipboard?.writeText(window.location.href);
                  }
                }}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
              >
                <Share2 className="h-4 w-4" /> Compartilhar
              </button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Pagamento processado por {product.platform}. Garantia de 7 dias.
              </p>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-semibold">Você também pode gostar</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.id}
                  to="/catalogo/$productId"
                  params={{ productId: p.id }}
                  className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50"
                >
                  <img
                    src={p.cover}
                    alt={`Capa de ${p.title}`}
                    className="aspect-[3/2] w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="p-4">
                    <div className="font-display text-base font-semibold">{p.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {p.tagline}
                    </div>
                    <div className="mt-2 font-display text-lg font-semibold">
                      R$ {p.price.toFixed(0)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
