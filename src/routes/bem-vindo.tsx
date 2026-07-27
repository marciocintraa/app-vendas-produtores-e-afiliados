import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, ArrowRight, Mail, Sparkles, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/bem-vindo")({
  head: () => ({
    meta: [
      { title: "Bem-vindo ao Vende Fácil Pro" },
      {
        name: "description",
        content:
          "Sua compra foi aprovada. Acesse agora o Vende Fácil Pro e comece a montar seu catálogo digital.",
      },
      { property: "og:title", content: "Bem-vindo ao Vende Fácil Pro" },
      {
        property: "og:description",
        content: "Sua compra foi aprovada. Comece agora a montar seu catálogo digital.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BemVindoPage,
});

const HOTMARKT_PLACEHOLDERS = [
  "{{",
  "}}",
  "buyer_email",
  "email_do_comprador",
  "email_comprador",
  "undefined",
  "null",
  "n/a",
  "nao_informado",
];

function sanitizeEmail(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "";
  if (HOTMARKT_PLACEHOLDERS.some((p) => trimmed.includes(p))) return "";
  return trimmed;
}

function BemVindoPage() {
  const navigate = useNavigate();
  const initialEmail =
    typeof window !== "undefined"
      ? sanitizeEmail(new URLSearchParams(window.location.search).get("email"))
      : "";

  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(initialEmail.length === 0);

  const hasEmail = initialEmail.length > 0 && !editing;
  const accessHref = hasEmail ? `/acesso?email=${encodeURIComponent(initialEmail)}` : "/acesso";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError("Digite um email válido (o mesmo usado na compra).");
      return;
    }
    setError(null);
    navigate({ to: "/acesso", search: { email: clean } });
  };

  const handleEdit = () => {
    setEditing(true);
    setEmail(initialEmail);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>

        <h1 className="mb-4 text-center text-4xl font-bold tracking-tight sm:text-5xl">
          Sua compra foi aprovada!
        </h1>
        <p className="mb-10 text-center text-lg text-muted-foreground">
          Bem-vindo ao <span className="font-semibold text-foreground">Vende Fácil Pro</span>.{" "}
          {hasEmail
            ? "Seu acesso já está liberado — é só clicar no botão abaixo para entrar."
            : "Confirme o email usado na compra para liberar seu acesso."}
        </p>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-lg backdrop-blur sm:p-8">
          <div className="mb-6 space-y-4">
            <FeatureRow
              icon={<Sparkles className="h-5 w-5" />}
              title="Monte seu catálogo em minutos"
              text="Cadastre produtos, links de afiliado e personalize sua vitrine."
            />
            <FeatureRow
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Acesso vitalício ao seu plano"
              text="Enquanto sua assinatura estiver ativa, tudo continua liberado."
            />
            <FeatureRow
              icon={<Mail className="h-5 w-5" />}
              title="Login automático por email"
              text={
                hasEmail
                  ? `Vamos te logar automaticamente como ${initialEmail}.`
                  : "Use o mesmo email que você informou no checkout da Hotmart."
              }
            />
          </div>

          {hasEmail ? (
            <Link
              to={accessHref}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            >
              Acessar o Vende Fácil Pro
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </Link>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label htmlFor="buyer-email" className="block text-sm font-medium">
                Email usado na compra
              </label>
              <input
                id="buyer-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none ring-primary/40 transition focus:ring-2"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                Liberar meu acesso
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Problemas para entrar?{" "}
            <Link to="/entrega" className="font-medium text-primary hover:underline">
              Verifique o status da entrega
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Guarde esta página nos favoritos para acesso rápido.
        </p>
      </div>
    </main>
  );
}

function FeatureRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}
