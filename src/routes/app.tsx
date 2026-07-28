import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Smartphone, Monitor, Download, ArrowRight, CheckCircle2, Check, ShoppingCart } from "lucide-react";
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
    navigate({ to: "/acesso", search: { email: clean } as never });
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

        {/* Access form */}
        <form
          onSubmit={handleSubmit}
          className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
        >
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
            E-mail da compra
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
            Enviamos um link mágico automaticamente. Não precisa de senha.
          </p>
        </form>

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
