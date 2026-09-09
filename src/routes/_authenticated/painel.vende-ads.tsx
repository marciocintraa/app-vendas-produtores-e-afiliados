import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Copy, Loader2, Lock, Megaphone } from "lucide-react";
import { generateAds, AD_PLATFORMS, type VendeAdsResult } from "@/lib/vende-ads.functions";
import { useProducts } from "@/lib/catalog-store";
import { usePlan, useIsAdmin } from "@/lib/plan";
import { CHECKOUT_PLANS } from "@/lib/checkout-links";

export const Route = createFileRoute("/_authenticated/painel/vende-ads")({
  component: VendeAdsPage,
  head: () => ({
    meta: [
      { title: "VENDE ADS IA — Vende Fácil Pro" },
      { name: "description", content: "Gere títulos, textos e roteiros de anúncios prontos para o seu produto." },
      { property: "og:title", content: "VENDE ADS IA — Vende Fácil Pro" },
      { property: "og:description", content: "Anúncios prontos para Meta, Google, TikTok e YouTube." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const input =
  "h-11 w-full rounded-xl border border-white/10 bg-[#070B18] px-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400/50";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400";

const OBJECTIVES = ["Vendas", "Conversões", "Tráfego", "Reconhecimento", "Geração de leads"];

function resultToText(result: VendeAdsResult) {
  return result.sections
    .map((s, i) => `${i + 1}. ${s.title}\n${s.items.map((it) => `- ${it}`).join("\n")}`)
    .join("\n\n");
}

function VendeAdsPage() {
  const products = useProducts();
  const { plan, loading: planLoading } = usePlan();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const run = useServerFn(generateAds);

  const [form, setForm] = useState({
    productName: "",
    platform: AD_PLATFORMS[0] as string,
    objective: OBJECTIVES[0] as string,
    audience: "",
    price: "",
    offer: "",
    salesPageUrl: "",
    notes: "",
  });
  const [copied, setCopied] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({ mutationFn: () => run({ data: form }) });

  const hasAccess = isAdmin || plan === "pro";
  const checking = planLoading || adminLoading;

  function pickProduct(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setForm((f) => ({
      ...f,
      productName: p.title,
      price: `R$ ${p.price.toFixed(2).replace(".", ",")}`,
      offer: p.tagline || f.offer,
      salesPageUrl: p.affiliateUrl || f.salesPageUrl,
    }));
  }

  async function copyAll() {
    if (!mutation.data) return;
    await navigator.clipboard.writeText(resultToText(mutation.data));
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="min-h-screen bg-[#070B18] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Link to="/app" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Link>

        <header className="mt-5 flex items-center gap-3">
          <span className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-300"><Megaphone className="h-5 w-5" /></span>
          <div>
            <h1 className="text-2xl font-bold">VENDE ADS IA</h1>
            <p className="text-sm text-slate-400">
              Gere títulos, textos, ganchos, roteiros e sugestões de segmentação para anunciar o seu produto.
            </p>
          </div>
        </header>

        {checking && (
          <div className="mt-16 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-cyan-400" /></div>
        )}

        {!checking && !hasAccess && (
          <section className="mt-8 rounded-2xl border border-cyan-400/20 bg-[#0A0F22] p-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Lock className="h-3.5 w-3.5" /> Recurso do Plano PRO
            </span>
            <h2 className="mt-4 text-xl font-bold">Disponível no Vende Fácil PRO</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              A VENDE ADS IA cria os anúncios do seu produto prontos para publicar. Ela faz parte do Plano PRO,
              junto com produtos ilimitados e até 5 catálogos. Seu Plano Grátis continua funcionando normalmente.
            </p>
            <a
              href={CHECKOUT_PLANS[0]?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#06101A] hover:opacity-90"
            >
              Conhecer o PRO
            </a>
          </section>
        )}

        {!checking && hasAccess && (
          <>
            <section className="mt-7 rounded-2xl border border-white/5 bg-[#0A0F22] p-6">
              {products.length > 0 && (
                <div className="mb-5">
                  <span className={label}>Usar um produto do seu catálogo</span>
                  <select onChange={(e) => pickProduct(e.target.value)} defaultValue="" className={input}>
                    <option value="">Selecionar produto…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className={label}>Nome do produto *</span>
                  <input className={input} value={form.productName} onChange={(e) => set("productName")(e.target.value)} placeholder="Ex.: Curso de Tráfego Pago" />
                </div>
                <div>
                  <span className={label}>Plataforma</span>
                  <select className={input} value={form.platform} onChange={(e) => set("platform")(e.target.value)}>
                    {AD_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <span className={label}>Objetivo</span>
                  <select className={input} value={form.objective} onChange={(e) => set("objective")(e.target.value)}>
                    {OBJECTIVES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <span className={label}>Público-alvo</span>
                  <input className={input} value={form.audience} onChange={(e) => set("audience")(e.target.value)} placeholder="Ex.: Iniciantes que querem vender online" />
                </div>
                <div>
                  <span className={label}>Preço</span>
                  <input className={input} value={form.price} onChange={(e) => set("price")(e.target.value)} placeholder="Ex.: R$ 197,00" />
                </div>
                <div>
                  <span className={label}>Oferta</span>
                  <input className={input} value={form.offer} onChange={(e) => set("offer")(e.target.value)} placeholder="Ex.: Curso + comunidade + bônus" />
                </div>
                <div className="sm:col-span-2">
                  <span className={label}>Link da página de vendas</span>
                  <input className={input} value={form.salesPageUrl} onChange={(e) => set("salesPageUrl")(e.target.value)} placeholder="https://…" />
                </div>
                <div className="sm:col-span-2">
                  <span className={label}>Informações extras</span>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) => set("notes")(e.target.value)}
                    placeholder="Cole aqui promessas, bônus, diferenciais, tom de voz desejado…"
                    className="w-full rounded-xl border border-white/10 bg-[#070B18] p-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!form.productName.trim() || mutation.isPending}
                onClick={() => mutation.mutate()}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#06101A] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando…</> : <><Megaphone className="h-4 w-4" /> Gerar anúncios</>}
              </button>

              {mutation.isError && (
                <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                  {(mutation.error as Error)?.message || "Não foi possível gerar os anúncios agora."}
                </p>
              )}
            </section>

            {mutation.data && (
              <section className="mt-6 rounded-2xl border border-white/5 bg-[#0A0F22] p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-bold">Anúncios gerados</h2>
                  <button
                    type="button"
                    onClick={copyAll}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copiado" : "Copiar tudo"}
                  </button>
                </div>

                <div className="mt-5 space-y-5">
                  {mutation.data.sections.map((s, i) => (
                    <article key={s.title} className="rounded-xl border border-white/5 bg-[#070B18] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-cyan-300">{i + 1}. {s.title}</h3>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(`${s.title}\n${s.items.map((it) => `- ${it}`).join("\n")}`)}
                          className="shrink-0 rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                          title="Copiar seção"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-slate-300">
                        {s.items.map((it, idx) => (
                          <li key={idx} className="flex gap-2"><span className="text-cyan-400">•</span><span>{it}</span></li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
