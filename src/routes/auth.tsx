import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: 'Entrar — Vende Fácil Pro' },
      { name: 'description', content: 'Acesse sua conta do Vende Fácil Pro.' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: '/painel/produtos', replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/painel/produtos` },
    });
    if (error) {
      setError(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Página inicial
        </Link>
        <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-2xl">
          <h1 className="text-2xl font-bold">Entrar no Vende Fácil Pro</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Informe o e-mail usado na compra do plano. Enviaremos um link mágico de acesso.
          </p>

          {status === 'sent' ? (
            <div className="mt-6 text-center space-y-3">
              <Mail className="w-12 h-12 mx-auto text-primary" />
              <p className="font-medium">Link enviado!</p>
              <p className="text-sm text-muted-foreground">
                Abra o e-mail que enviamos para <strong>{email}</strong> e clique no botão para entrar.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="text-sm text-primary hover:underline"
              >
                Usar outro e-mail
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
                {status === 'sending' ? 'Enviando…' : 'Enviar link de acesso'}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Ainda não é assinante?{' '}
                <Link to="/" hash="planos" className="text-primary hover:underline">
                  Ver planos
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
