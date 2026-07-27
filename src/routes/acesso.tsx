import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState, useRef } from "react";
import { Loader2, Mail, AlertCircle, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { findUserByEmail, logDelivery } from "@/lib/hotmart.server";

/**
 * Rota de acesso automático a partir do email da Hotmart.
 *
 * Configure na Hotmart, no campo "Página de acesso do produto":
 *   https://SEU-DOMINIO/acesso?email={{buyer_email}}
 *
 * O comprador clica no botão do email da Hotmart, cai aqui, e é logado
 * automaticamente (sem precisar de senha ou de outro email).
 */

const POLL_MS = 2500;
const MAX_POLLS = 12; // ~30s de espera total

interface AccessResult {
  state: "ok" | "no_purchase" | "inactive" | "missing" | "link_failed" | "invalid_email";
  url?: string;
  checkedAt: string;
}

async function getLatestSubscription(userId: string) {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("status,current_period_end")
    .eq("user_id", userId)
    .eq("environment", "hotmart")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

function isActive(sub: { status: string; current_period_end: string | null } | null): boolean {
  if (!sub) return false;
  const activeStatuses = ["active", "trialing", "past_due"];
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
  const now = new Date();

  if (activeStatuses.includes(sub.status) && (!periodEnd || periodEnd > now)) return true;
  if (sub.status === "canceled" && periodEnd && periodEnd > now) return true;
  return false;
}

const buildAccessLink = createServerFn({ method: "GET" })
  .validator((d: { email: string }) => d)
  .handler(async ({ data }): Promise<AccessResult> => {
    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      logDelivery({ step: "access", success: false, detail: "invalid email format" });
      return { state: "invalid_email", checkedAt: new Date().toISOString() };
    }

    const userId = await findUserByEmail(email);
    if (!userId) {
      logDelivery({ step: "access", email, success: false, detail: "user not found" });
      return { state: "no_purchase", checkedAt: new Date().toISOString() };
    }

    const sub = await getLatestSubscription(userId);
    if (!sub) {
      logDelivery({ step: "access", email, success: false, detail: "subscription not found" });
      return { state: "no_purchase", checkedAt: new Date().toISOString() };
    }

    if (!isActive(sub)) {
      logDelivery({ step: "access", email, success: false, detail: "subscription inactive" });
      return { state: "inactive", checkedAt: new Date().toISOString() };
    }

    const url = new URL(process.env.SUPABASE_URL!);
    const origin =
      process.env.SITE_URL ??
      `https://${new URL("https://" + (process.env.SITE_HOSTNAME ?? url.host)).host}`;
    const redirectTo = `${origin.replace(/\/+$/, "")}/painel/produtos`;

    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (error || !link.properties?.action_link) {
      console.error("generateLink failed", error);
      logDelivery({
        step: "access",
        email,
        success: false,
        detail: error?.message ?? "empty action_link",
      });
      return { state: "link_failed", checkedAt: new Date().toISOString() };
    }

    logDelivery({ step: "access", email, success: true, detail: "magic link generated" });
    return { state: "ok", url: link.properties.action_link, checkedAt: new Date().toISOString() };
  });

export const Route = createFileRoute("/acesso")({
  validateSearch: (s: Record<string, unknown>) => ({
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Acessando o app — Vende Fácil Pro" },
      { name: "description", content: "Acesso automático ao Vende Fácil Pro após a compra." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ location }) => {
    const email = (location.search as { email?: string }).email;
    if (!email) return { state: "missing" as const, email: "" };
    const res = await buildAccessLink({ data: { email } });
    if (res.state === "ok" && res.url) throw redirect({ href: res.url });
    return { state: res.state, email };
  },
  component: AccessPage,
});

function AccessPage() {
  const { state: initialState, email } = Route.useLoaderData();
  const [state, setState] = useState(initialState);
  const [polling, setPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [checking, setChecking] = useState(false);
  const pollRef = useRef<number | null>(null);

  // Se o estado inicial for "no_purchase", faz polling por até ~30s.
  // Isso cobre o caso em que o comprador clica no email da Hotmart antes
  // do webhook chegar no nosso servidor.
  useEffect(() => {
    if (initialState !== "no_purchase") return;
    setPolling(true);

    let count = 0;
    const run = async () => {
      count++;
      setPollCount(count);
      setChecking(true);
      try {
        const res = await buildAccessLink({ data: { email } });
        if (res.state === "ok" && res.url) {
          window.location.href = res.url;
          return;
        }
        setState(res.state);
      } finally {
        setChecking(false);
      }

      if (count >= MAX_POLLS) {
        setPolling(false);
        return;
      }
      pollRef.current = window.setTimeout(run, POLL_MS);
    };

    pollRef.current = window.setTimeout(run, POLL_MS);

    return () => {
      if (pollRef.current) window.clearTimeout(pollRef.current);
    };
  }, [initialState, email]);

  const handleRetry = async () => {
    setChecking(true);
    try {
      const res = await buildAccessLink({ data: { email } });
      if (res.state === "ok" && res.url) {
        window.location.href = res.url;
        return;
      }
      setState(res.state);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full rounded-2xl border border-border/50 bg-card p-8 md:p-10 text-center shadow-2xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Página inicial
        </Link>

        {state === "missing" && (
          <>
            <Mail className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-2xl font-bold mt-4">Confirme seu email da compra</h1>
            <p className="text-muted-foreground mt-2">
              Digite o mesmo email usado no checkout da Hotmart para liberar seu acesso
              automaticamente.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const value = (form.elements.namedItem("email") as HTMLInputElement).value
                  .trim()
                  .toLowerCase();
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return;
                window.location.href = `/acesso?email=${encodeURIComponent(value)}`;
              }}
              className="mt-6 space-y-3 text-left"
            >
              <input
                name="email"
                type="email"
                required
                autoFocus
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none ring-primary/40 transition focus:ring-2"
              />
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
              >
                Liberar meu acesso
              </button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">
              Também pode conferir o status em{" "}
              <Link to="/entrega" className="text-primary hover:underline">
                /entrega
              </Link>
              .
            </p>
          </>
        )}

        {(state === "no_purchase" ||
          state === "inactive" ||
          state === "link_failed" ||
          state === "invalid_email") && (
          <>
            {state === "no_purchase" && polling && (
              <>
                <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                <h1 className="text-2xl font-bold mt-4">Processando sua compra…</h1>
                <p className="text-muted-foreground mt-2">
                  Estamos confirmando o pagamento. Assim que o acesso for liberado, você será
                  redirecionado automaticamente.
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Tentativa {pollCount} de {MAX_POLLS} · aguarde
                </p>
              </>
            )}

            {state === "no_purchase" && !polling && (
              <>
                <Mail className="w-12 h-12 mx-auto text-primary" />
                <h1 className="text-2xl font-bold mt-4">Compra não localizada ainda</h1>
                <p className="text-muted-foreground mt-2">
                  Ainda não recebemos a confirmação da sua compra para <strong>{email}</strong>. Se
                  acabou de comprar, aguarde alguns minutos e tente novamente. Se pagou via boleto,
                  a liberação ocorre após a compensação (1 a 2 dias úteis).
                </p>
                <button
                  onClick={handleRetry}
                  disabled={checking}
                  className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {checking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {checking ? "Verificando…" : "Tentar novamente"}
                </button>
              </>
            )}

            {state === "inactive" && (
              <>
                <AlertCircle className="w-12 h-12 mx-auto text-amber-500" />
                <h1 className="text-2xl font-bold mt-4">Assinatura inativa</h1>
                <p className="text-muted-foreground mt-2">
                  Sua assinatura está cancelada ou expirada. Reative na Hotmart para voltar a
                  acessar o app.
                </p>
              </>
            )}

            {state === "link_failed" && (
              <>
                <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
                <h1 className="text-2xl font-bold mt-4">Erro ao gerar acesso</h1>
                <p className="text-muted-foreground mt-2">
                  Não conseguimos gerar seu link agora. Tente novamente em instantes.
                </p>
                <button
                  onClick={handleRetry}
                  disabled={checking}
                  className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {checking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {checking ? "Verificando…" : "Tentar novamente"}
                </button>
              </>
            )}

            {state === "invalid_email" && (
              <>
                <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
                <h1 className="text-2xl font-bold mt-4">Email inválido</h1>
                <p className="text-muted-foreground mt-2">
                  O endereço de email fornecido não parece válido. Verifique o link enviado pela
                  Hotmart.
                </p>
              </>
            )}
          </>
        )}

        {state === "ok" && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-500" />
            <h1 className="text-2xl font-bold mt-4">Acesso liberado!</h1>
            <p className="text-muted-foreground mt-2">Redirecionando você para o app…</p>
          </>
        )}
      </div>
    </div>
  );
}
