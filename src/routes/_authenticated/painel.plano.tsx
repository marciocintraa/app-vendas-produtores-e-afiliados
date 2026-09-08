import { createFileRoute } from "@tanstack/react-router";
import { Crown, Check, Loader2 } from "lucide-react";
import { usePlan } from "@/lib/use-plan";
import { useCatalogs, useProducts } from "@/lib/catalog-store";
import { CHECKOUT_PLANS } from "@/lib/checkout-links";

export const Route = createFileRoute("/_authenticated/painel/plano")({
  head: () => ({
    meta: [
      { title: "Meu Plano — Vende Fácil Pro" },
      { name: "description", content: "Veja o seu plano atual, os limites de catálogos e como liberar todos os recursos." },
      { property: "og:title", content: "Meu Plano — Vende Fácil Pro" },
      { property: "og:description", content: "Acompanhe seus limites e libere 5 catálogos com produtos ilimitados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanoPage,
});

function PlanoPage() {
  const { plan, maxCatalogs, maxProductsPerCatalog, loading } = usePlan();
  const catalogs = useCatalogs();
  const products = useProducts();
  const paid = CHECKOUT_PLANS.find((p) => p.id === "vitalicio");

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <Crown className="h-7 w-7 text-primary" /> Meu Plano
      </h1>

      <div className="mt-6 rounded-2xl border border-border/50 bg-card p-6">
        <p className="text-sm text-muted-foreground">Você está no plano</p>
        <p className="text-2xl font-bold">{plan === "vitalicio" ? "Vende Fácil Pro — acesso vitalício" : "Conta Grátis"}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Catálogos</p>
            <p className="text-xl font-semibold">
              {catalogs.length} / {maxCatalogs}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Produtos</p>
            <p className="text-xl font-semibold">
              {products.length}
              {maxProductsPerCatalog === null ? " · ilimitados" : ` / ${maxProductsPerCatalog} por catálogo`}
            </p>
          </div>
        </div>
      </div>

      {plan === "gratis" && paid && (
        <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Oferta imperdível</p>
          <p className="mt-1 text-2xl font-bold">{paid.installmentPrice}</p>
          <p className="text-sm text-muted-foreground">ou {paid.price} à vista — pagamento único</p>
          <ul className="mt-4 space-y-2 text-sm">
            {paid.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
              </li>
            ))}
          </ul>
          <a
            href={paid.url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block rounded-lg bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Liberar acesso completo
          </a>
        </div>
      )}

      {plan === "vitalicio" && (
        <p className="mt-6 rounded-2xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
          Seu acesso é vitalício: 5 catálogos com produtos ilimitados e todos os recursos liberados, sem mensalidade.
        </p>
      )}
    </div>
  );
}
