import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Mail, Loader2 } from 'lucide-react';
import { finalizeCheckout } from '@/lib/checkout.functions';
import { getStripeEnvironment } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/checkout-return')({
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === 'string' ? s.session_id : undefined,
    email: typeof s.email === 'string' ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Pagamento confirmado — Vende Fácil Pro' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: ReturnPage,
});

type State =
  | { kind: 'loading' }
  | { kind: 'paid'; email: string; emailSent: boolean; sending: boolean; error?: string }
  | { kind: 'processing'; email: string }
  | { kind: 'error'; message: string };

function ReturnPage() {
  const { session_id, email: emailParam } = Route.useSearch();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!session_id) {
      setState({ kind: 'error', message: 'Sessão de pagamento não informada.' });
      return;
    }
    (async () => {
      try {
        const res = await finalizeCheckout({ data: { sessionId: session_id, environment: getStripeEnvironment() } });
        if ('error' in res) return setState({ kind: 'error', message: res.error });
        const email = res.email || emailParam || '';
        if (res.status === 'paid') {
          setState({ kind: 'paid', email, emailSent: false, sending: false });
        } else if (res.status === 'processing') {
          setState({ kind: 'processing', email });
        } else {
          setState({ kind: 'error', message: 'Pagamento não concluído. Tente novamente.' });
        }
      } catch (e) {
        setState({ kind: 'error', message: e instanceof Error ? e.message : 'Erro inesperado' });
      }
    })();
  }, [session_id, emailParam]);

  const sendMagicLink = async (email: string) => {
    setState((s) => (s.kind === 'paid' ? { ...s, sending: true, error: undefined } : s));
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/painel/produtos` },
    });
    setState((s) =>
      s.kind === 'paid'
        ? { ...s, sending: false, emailSent: !error, error: error?.message }
        : s,
    );
  };

  // auto-send once paid
  useEffect(() => {
    if (state.kind === 'paid' && !state.emailSent && !state.sending && state.email) {
      sendMagicLink(state.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full rounded-2xl border border-border/50 bg-card p-8 md:p-10 text-center shadow-2xl">
        {state.kind === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <h1 className="text-2xl font-semibold mt-4">Confirmando pagamento…</h1>
          </>
        )}
        {state.kind === 'paid' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
            <h1 className="text-2xl font-bold mt-4">Pagamento confirmado!</h1>
            <p className="text-muted-foreground mt-2">
              Enviamos o link de acesso ao app para{' '}
              <strong className="text-foreground">{state.email}</strong>.
            </p>
            <div className="mt-6 p-4 rounded-lg bg-background/50 border border-border/50 flex items-start gap-3 text-left">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Verifique sua caixa de entrada</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Clique no botão do e-mail para entrar no app. Verifique também a pasta de spam.
                </p>
              </div>
            </div>
            {state.error && (
              <p className="text-sm text-red-500 mt-4">Falha ao enviar e-mail: {state.error}</p>
            )}
            <button
              onClick={() => sendMagicLink(state.email)}
              disabled={state.sending}
              className="mt-6 text-sm text-primary hover:underline disabled:opacity-50"
            >
              {state.sending ? 'Reenviando…' : state.emailSent ? 'Reenviar e-mail' : 'Enviar novamente'}
            </button>
          </>
        )}
        {state.kind === 'processing' && (
          <>
            <Clock className="w-16 h-16 mx-auto text-amber-500" />
            <h1 className="text-2xl font-bold mt-4">Aguardando confirmação</h1>
            <p className="text-muted-foreground mt-2">
              Seu pagamento (boleto ou PIX) está sendo processado. Assim que confirmado, enviaremos o link
              de acesso para <strong className="text-foreground">{state.email}</strong>.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Boleto: 1 a 2 dias úteis após compensação. PIX: alguns minutos.
            </p>
          </>
        )}
        {state.kind === 'error' && (
          <>
            <h1 className="text-2xl font-bold text-red-500">Ops!</h1>
            <p className="text-muted-foreground mt-2">{state.message}</p>
            <Link to="/" className="mt-6 inline-block text-primary hover:underline">
              Voltar ao início
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
