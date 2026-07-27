import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';

/**
 * Rota de acesso automático a partir do email da Hotmart.
 *
 * Configure na Hotmart, no campo "Página de acesso do produto":
 *   https://SEU-DOMINIO/acesso?email={{buyer_email}}
 *
 * O comprador clica no botão do email da Hotmart, cai aqui, e é logado
 * automaticamente (sem precisar de senha ou de outro email).
 */

const buildAccessLink = createServerFn({ method: 'GET' })
  .inputValidator((d: { email: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: 'Email inválido' as const };
    }
    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Verifica se existe usuário e assinatura ativa antes de gerar link
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const user = list?.users?.find((u) => u.email?.toLowerCase() === email);
    if (!user) return { error: 'no_purchase' as const };

    const { data: sub } = await admin
      .from('subscriptions')
      .select('status,current_period_end')
      .eq('user_id', user.id)
      .eq('environment', 'hotmart')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) return { error: 'no_purchase' as const };
    const active =
      (['active', 'trialing', 'past_due'].includes(sub.status as string) &&
        (!sub.current_period_end || new Date(sub.current_period_end as string) > new Date())) ||
      (sub.status === 'canceled' &&
        sub.current_period_end &&
        new Date(sub.current_period_end as string) > new Date());
    if (!active) return { error: 'inactive' as const };

    const url = new URL(process.env.SUPABASE_URL!);
    const origin = process.env.SITE_URL
      ?? `https://${new URL('https://' + (process.env.SITE_HOSTNAME ?? url.host)).host}`;
    const redirectTo = `${origin.replace(/\/+$/, '')}/painel/produtos`;

    const { data: link, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    });
    if (error || !link.properties?.action_link) {
      console.error('generateLink failed', error);
      return { error: 'link_failed' as const };
    }
    return { url: link.properties.action_link };
  });

export const Route = createFileRoute('/acesso')({
  validateSearch: (s: Record<string, unknown>) => ({
    email: typeof s.email === 'string' ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Acessando o app — Vende Fácil Pro' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  loader: async ({ location }) => {
    const email = (location.search as { email?: string }).email;
    if (!email) return { state: 'missing' as const };
    const res = await buildAccessLink({ data: { email } });
    if ('url' in res) throw redirect({ href: res.url });
    return { state: res.error };
  },
  component: AccessPage,
});

function AccessPage() {
  const { state } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full rounded-2xl border border-border/50 bg-card p-8 md:p-10 text-center shadow-2xl">
        {state === 'missing' && (
          <>
            <h1 className="text-2xl font-bold">Falta o email</h1>
            <p className="text-muted-foreground mt-2">
              Este link precisa vir com o email da compra. Use o botão no email de confirmação da Hotmart.
            </p>
          </>
        )}
        {state === 'no_purchase' && (
          <>
            <h1 className="text-2xl font-bold">Compra não localizada</h1>
            <p className="text-muted-foreground mt-2">
              Ainda não recebemos a confirmação da sua compra. Se acabou de comprar, aguarde alguns minutos e tente
              novamente. Se pagou via boleto, a liberação ocorre após a compensação (1 a 2 dias úteis).
            </p>
          </>
        )}
        {state === 'inactive' && (
          <>
            <h1 className="text-2xl font-bold">Assinatura inativa</h1>
            <p className="text-muted-foreground mt-2">
              Sua assinatura está cancelada ou expirada. Reative na Hotmart para voltar a acessar o app.
            </p>
          </>
        )}
        {state === 'link_failed' && (
          <>
            <h1 className="text-2xl font-bold">Erro ao gerar acesso</h1>
            <p className="text-muted-foreground mt-2">
              Não conseguimos gerar seu link agora. Tente novamente em instantes.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
