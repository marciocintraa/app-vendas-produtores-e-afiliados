import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { usePlan } from '@/lib/plan';
import { CHECKOUT_PLANS } from '@/lib/checkout-links';
import { LogOut, Loader2, Sparkles } from 'lucide-react';

export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: '/acesso', search: { email: undefined } });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { plan, loading, catalogLimit, productLimit } = usePlan();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/auth', replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {plan === 'free' && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0A0F22] px-4 py-2.5 text-sm text-slate-200">
          <p className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <span>
              <b className="text-cyan-300">Plano Grátis</b> · até {productLimit} produtos e {catalogLimit} catálogo
            </span>
          </p>
          <div className="flex items-center gap-3">
            <a
              href={CHECKOUT_PLANS[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-bold text-[#06101A] hover:opacity-90"
            >
              Conhecer o PRO
            </a>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      )}
      <Outlet />
    </div>
  );
}
