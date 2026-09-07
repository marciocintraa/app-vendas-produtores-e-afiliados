import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Smartphone, Monitor, Download, ArrowRight, CheckCircle2, Check, ShoppingCart, Sparkles, FolderOpen, Infinity } from "lucide-react";
import { CHECKOUT_PLANS } from "@/lib/checkout-links";


export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Acessar na Web — Vende Fácil Pro" },
      {
        name: "description",
        content:
          "Acesse o Vende Fácil Pro pelo navegador em qualquer dispositivo. Basta informar o e-mail usado na compra.",
      },
      { property: "og:title", content: "Acessar na Web — Vende Fácil Pro" },
      {
        property: "og:description",
        content:
          "Use o Vende Fácil Pro na Web sem precisar instalar. Também é possível fixar como app na tela inicial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WebAppEntry,
});

function WebAppEntry() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [isStandalone, setIsStandalone] = useState(false);
  const [freeMode, setFreeMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform("ios");
    else if (/android/.test(ua)) setPlatform("android");
    else setPlatform("desktop");

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    setIsStandalone(standalone);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) return;
    navigate({ to: "/acesso", search: { email: clean, free: freeMode || undefined } as never });
  }

  function startFree() {
    setFreeMode(true);
    const form = document.getElementById("form-acesso");
    form?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      const input = document.getElementById("email");
      input?.focus();
    }, 400);
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0814] via-[#150922] to-[#0B0814] text-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-200">
            <Monitor className="h-4 w-4" />
            Versão Web — funciona em qualquer dispositivo
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Bem-vindo ao{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Vende Fácil Pro
            </span>
          </h1>
          <p className="text-lg text-slate-300">
            Acesse seu painel pelo navegador. Basta informar o e-mail usado na compra.
          </p>
        </div>

        {/* Destaque do recurso: catálogos */}
        <div className="mb-10 overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-purple-600/15 to-pink-500/15 p-1 shadow-2xl">
          <div className="rounded-xl bg-black/20 p-6 backdrop-blur-sm sm:p-8">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-pink-500 text-black shadow-lg">
                <FolderOpen className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Recurso em destaque
                </span>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Organize seus produtos em{" "}
                  <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                    até 5 catálogos
                  </span>
                </h2>
                <p className="mt-2 max-w-xl text-slate-200">
                  No plano pago você cria <strong>5 catálogos completos</strong> com{" "}
                  <strong>produtos ilimitados</strong> em cada um. No grátis, comece com{" "}
                  <strong>1 catálogo e 2 produtos</strong> para testar tudo.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2">
                    <FolderOpen className="h-4 w-4 text-amber-300" />
                    <span className="text-sm font-semibold">5 catálogos</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2">
                    <Infinity className="h-4 w-4 text-pink-300" />
                    <span className="text-sm font-semibold">Produtos ilimitados</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Access form */}
        <form
          id="form-acesso"
          onSubmit={handleSubmit}
          className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
        >
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
            {freeMode ? "E-mail para acessar grátis" : "E-mail da compra"}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-white/10 bg-black/30 py-3 pl-10 pr-3 text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Entrar <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {freeMode
              ? "Crie sua conta grátis com 1 catálogo e até 2 produtos. Enviamos um link mágico — não precisa de senha."
              : "Enviamos um link mágico automaticamente. Não precisa de senha."}
          </p>
        </form>

        {/* Planos — grátis e oferta vitalícia */}
        <div className="mb-10 grid gap-6 md:grid-cols-2">
          {CHECKOUT_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative overflow-hidden rounded-2xl border p-6 text-center shadow-2xl backdrop-blur ${
                plan.highlight
                  ? "border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {plan.highlight && (
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 px-4 py-1 text-xs font-bold uppercase tracking-widest text-black">
                  <Sparkles className="h-4 w-4" />
                  Oferta Imperdível
                </span>
              )}
              <h2 className="text-2xl font-bold sm:text-3xl">{plan.name}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-200">
                {plan.id === "vitalicio"
                  ? "Invista no seu app profissional. Pague uma única vez e use para sempre — sem mensalidades, sem taxas escondidas."
                  : "Comece sem pagar nada. Ideal para testar e começar a divulgar seus primeiros catálogos."}
              </p>

              <div className="mt-5">
                {plan.id === "vitalicio" && (
                  <p className="text-sm text-slate-300 line-through">De R$ 497,00 por apenas</p>
                )}
                <p className="text-5xl font-extrabold tracking-tight">{plan.price}</p>
                {plan.installmentPrice && (
                  <p className="mt-1 text-base font-semibold text-amber-300">ou {plan.installmentPrice}</p>
                )}
              </div>

              <ul className="mx-auto mb-6 mt-5 max-w-xs space-y-2 text-left text-sm text-slate-200">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.isFree ? (
                <button
                  type="button"
                  onClick={startFree}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-8 py-3 font-bold text-white transition hover:bg-white/20"
                >
                  Começar grátis <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <a
                  href={plan.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-pink-500 px-8 py-3 font-bold text-black transition hover:opacity-90"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Quero meu acesso agora <ArrowRight className="h-4 w-4" />
                </a>
              )}

              {plan.id === "vitalicio" && (
                <p className="mt-3 text-xs text-slate-400">
                  Pagamento seguro pela Hotmart — cartão (à vista ou parcelado), PIX ou boleto.
                  Após a confirmação você recebe o acesso no e-mail informado na compra.
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Acesso de quem já comprou */}
        <div className="mb-10 text-center">
          <p className="text-sm text-slate-400">
            Já comprou? Informe seu e-mail no formulário acima para entrar no painel.
          </p>
        </div>

        {/* Install as app section */}

        {!isStandalone && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-purple-300" />
              <h2 className="text-lg font-semibold">Fixar como app na tela inicial</h2>
            </div>
            <p className="mb-4 text-sm text-slate-300">
              Opcional: adicione um ícone na sua tela inicial para abrir o Vende Fácil Pro
              como se fosse um aplicativo — sem baixar nada.
            </p>

            <div className="space-y-3 text-sm text-slate-200">
              {platform === "ios" && (
                <ol className="list-inside list-decimal space-y-1.5">
                  <li>Toque no botão <strong>Compartilhar</strong> do Safari</li>
                  <li>Escolha <strong>"Adicionar à Tela de Início"</strong></li>
                  <li>Toque em <strong>Adicionar</strong> no canto superior direito</li>
                </ol>
              )}
              {platform === "android" && (
                <ol className="list-inside list-decimal space-y-1.5">
                  <li>Toque no menu <strong>⋮</strong> do Chrome</li>
                  <li>Escolha <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong></li>
                  <li>Confirme tocando em <strong>Instalar</strong></li>
                </ol>
              )}
              {platform === "desktop" && (
                <ol className="list-inside list-decimal space-y-1.5">
                  <li>Procure o ícone <Smartphone className="inline h-4 w-4" /> na barra de endereço</li>
                  <li>Clique em <strong>Instalar</strong></li>
                  <li>O app abrirá em uma janela própria, como um programa</li>
                </ol>
              )}
            </div>
          </div>
        )}

        {isStandalone && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm">
              Você já está usando o Vende Fácil Pro como app instalado. 🎉
            </span>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          Prefere o app Android? Após a compra, o link do APK também é enviado no seu e-mail.
        </p>
      </div>
    </div>
  );
}
