import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
  Mail,
  ArrowLeft,
  PackageOpen,
} from "lucide-react";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { findUserByEmail } from "@/lib/hotmart.server";

/**
 * Página pública de status da entrega.
 *
 * O comprador pode digitar o email usado na compra e verificar se o acesso
 * já foi liberado. Se sim, ele é redirecionado para /acesso com o mesmo email.
 */

type DeliveryStatus = "idle" | "checking" | "found" | "not_found" | "inactive" | "error";

const checkDelivery = createServerFn({ method: "GET" })
  .validator((d: { email: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { status: "invalid_email" as const };
    }

    const userId = await findUserByEmail(email);
    if (!userId) {
      return { status: "not_found" as const, email };
    }

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("status,current_period_end,price_id")
      .eq("user_id", userId)
      .eq("environment", "hotmart")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) {
      return { status: "not_found" as const, email };
    }

    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
    const now = new Date();
    const activeStatuses = ["active", "trialing", "past_due"];
    const isActive =
      (activeStatuses.includes(sub.status as string) && (!periodEnd || periodEnd > now)) ||
      (sub.status === "canceled" && periodEnd && periodEnd > now);

    if (!isActive) {
      return { status: "inactive" as const, email, plan: sub.price_id };
    }

    return { status: "found" as const, email, plan: sub.price_id };
  });

export const Route = createFileRoute("/entrega")({
  head: () => ({
    meta: [
      { title: "Status da entrega — Vende Fácil Pro" },
      { name: "description", content: "Verifique se o acesso ao Vende Fácil Pro já foi liberado." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DeliveryPage,
});

function DeliveryPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<DeliveryStatus>("idle");
  const [result, setResult] = useState<{ email?: string; plan?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("checking");
    try {
      const res = await checkDelivery({ data: { email: email.trim().toLowerCase() } });
      setResult({ email: res.email, plan: res.plan });
      switch (res.status) {
        case "found":
          setStatus("found");
          break;
        case "not_found":
          setStatus("not_found");
          break;
        case "inactive":
          setStatus("inactive");
          break;
        default:
          setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const planLabel = (plan?: string) => {
    if (plan === "starter_monthly") return "Starter";
    if (plan === "pro_monthly") return "Pro";
    if (plan === "premium_monthly") return "Premium";
    return "Plano";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full rounded-2xl border border-border/50 bg-card p-8 md:p-10 shadow-2xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Página inicial
        </Link>

        <div className="text-center mb-8">
          <PackageOpen className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-2xl font-bold mt-4">Status da entrega</h1>
          <p className="text-muted-foreground mt-2">
            Informe o email usado na compra para verificar se o acesso já foi liberado.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="delivery-email" className="text-sm font-medium mb-2 block">
              E-mail da compra
            </label>
            <input
              id="delivery-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {loading ? "Verificando…" : "Verificar acesso"}
          </button>
        </form>

        <div className="mt-6">
          {status === "checking" && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Buscando sua compra…
            </div>
          )}

          {status === "found" && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-emerald-500" />
              <h2 className="font-semibold mt-2">Acesso liberado!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Encontramos sua assinatura {planLabel(result?.plan)} para{" "}
                <strong>{result?.email}</strong>.
              </p>
              <a
                href={`/acesso?email=${encodeURIComponent(result?.email ?? "")}`}
                className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
              >
                <Mail className="w-4 h-4" /> Entrar no app
              </a>
            </div>
          )}

          {status === "not_found" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-500" />
              <h2 className="font-semibold mt-2">Compra ainda não processada</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Não localizamos uma assinatura ativa para <strong>{result?.email}</strong>. Se
                acabou de comprar, aguarde alguns minutos e tente novamente.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Pagamentos via boleto são liberados após compensação (1 a 2 dias úteis).
              </p>
            </div>
          )}

          {status === "inactive" && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
              <h2 className="font-semibold mt-2">Assinatura inativa</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sua assinatura {planLabel(result?.plan)} para <strong>{result?.email}</strong> está
                cancelada ou expirada. Reative na Hotmart para voltar a acessar.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
              <h2 className="font-semibold mt-2">Erro ao verificar</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Não conseguimos verificar agora. Tente novamente em instantes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
