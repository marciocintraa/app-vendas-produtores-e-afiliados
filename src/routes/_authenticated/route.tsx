import { createFileRoute, Outlet, redirect, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Loader2, AlertCircle } from 'lucide-react';
import { logAccessEvent } from '@/lib/access-journey';


export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: '/auth' });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [subStatus, setSubStatus] = useState<'checking' | 'active' | 'none'>('checking');

  useEffect(() => {
    logAccessEvent({
      route: "/_authenticated",
      state: "auth_ok",
      email: user.email ?? undefined,
      detail: "sessão Supabase válida — verificando assinatura",
    });
    supabase
      .from('subscriptions')
      .select('status,current_period_end,cancel_at_period_end')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          logAccessEvent({
            route: "/_authenticated",
            state: "no_active_sub",
            email: user.email ?? undefined,
            detail: "nenhuma linha em subscriptions",
          });
          return setSubStatus('none');
        }
        const active =
          (['active', 'trialing', 'past_due'].includes(data.status as string) &&
            (!data.current_period_end || new Date(data.current_period_end as string) > new Date())) ||
          (data.status === 'canceled' &&
            data.current_period_end &&
            new Date(data.current_period_end as string) > new Date());
        logAccessEvent({
          route: "/_authenticated",
          state: active ? "entered_app" : "no_active_sub",
          email: user.email ?? undefined,
          detail: `status=${data.status} period_end=${data.current_period_end ?? "—"}`,
        });
        setSubStatus(active ? 'active' : 'none');
      });
  }, [user.id, user.email]);


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/auth', replace: true });
  };

  if (subStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (subStatus === 'none') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-border/50 bg-card p-8 text-center shadow-2xl">
          <AlertCircle className="w-14 h-14 mx-auto text-amber-500" />
          <h1 className="text-2xl font-bold mt-4">Nenhum plano ativo</h1>
          <p className="text-muted-foreground mt-2">
            Você entrou com <strong className="text-foreground">{user.email}</strong>, mas não encontramos uma assinatura
            ativa nesta conta. Escolha um plano para liberar o app.
          </p>
          <Link
            to="/"
            hash="planos"
            className="mt-6 inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90"
          >
            Ver planos
          </Link>
          <button
            onClick={handleSignOut}
            className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
