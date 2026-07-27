import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';
import { StripeEmbeddedCheckoutForm } from '@/components/StripeEmbeddedCheckout';

const PLANS = {
  starter_monthly: { name: 'Starter', price: 'R$ 57', features: ['Até 2 produtos', 'Catálogo personalizável', 'Links de afiliado'] },
  pro_monthly: { name: 'Pro', price: 'R$ 97', features: ['Até 5 produtos', 'IA de marketing', 'Analytics'] },
  premium_monthly: { name: 'Premium', price: 'R$ 157', features: ['Produtos ilimitados', 'White label completo', 'Suporte prioritário'] },
} as const;

type PlanId = keyof typeof PLANS;

export const Route = createFileRoute('/checkout/$plan')({
  head: () => ({
    meta: [
      { title: 'Assinar plano — Vende Fácil Pro' },
      { name: 'description', content: 'Escolha seu plano e comece a vender agora com o Vende Fácil Pro.' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { plan } = Route.useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);

  const planId = plan as PlanId;
  const planInfo = PLANS[planId];

  if (!planInfo) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Plano não encontrado</h1>
          <Link to="/" className="text-primary hover:underline">Voltar para a página inicial</Link>
        </div>
      </div>
    );
  }

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setConfirmedEmail(email.trim().toLowerCase());
  };

  const returnUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/checkout-return?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}`
    : '/checkout-return?session_id={CHECKOUT_SESSION_ID}';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PaymentTestModeBanner />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate({ to: '/', hash: 'planos' })}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar aos planos
        </button>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Plano escolhido</p>
              <h1 className="text-3xl font-bold mt-1">Vende Fácil Pro — {planInfo.name}</h1>
              <p className="text-4xl font-bold mt-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {planInfo.price}<span className="text-lg text-muted-foreground font-normal">/mês</span>
              </p>
            </div>
            <ul className="space-y-3">
              {planInfo.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-sm text-muted-foreground">
              Após a confirmação do pagamento, você receberá no e-mail informado o link exclusivo para acessar o app.
              <br />
              <span className="text-xs">Boleto: liberação em 1 a 2 dias úteis após compensação.</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-2xl">
            {!confirmedEmail ? (
              <form onSubmit={handleContinue} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Seus dados</h2>
                  <p className="text-sm text-muted-foreground">Informe o e-mail onde você quer receber o acesso ao app.</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">E-mail</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition"
                >
                  Continuar para pagamento
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  Pagamento seguro processado pelo Stripe. Cartão de crédito, PIX e Boleto.
                </p>
              </form>
            ) : (
              <div>
                <div className="mb-4 text-sm text-muted-foreground">
                  Pagamento para <strong className="text-foreground">{confirmedEmail}</strong>{' '}
                  <button
                    type="button"
                    onClick={() => setConfirmedEmail(null)}
                    className="text-primary hover:underline text-xs ml-2"
                  >
                    alterar
                  </button>
                </div>
                <StripeEmbeddedCheckoutForm
                  priceId={planId}
                  email={confirmedEmail}
                  returnUrl={returnUrl}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
