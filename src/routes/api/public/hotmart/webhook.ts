import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import { HOTMART_PRODUCT_TO_PLAN, HOTMART_OFFER_TO_PLAN, type PlanId } from '@/lib/hotmart';

/**
 * Webhook de compra da Hotmart.
 * URL para configurar na Hotmart: https://SEU-DOMINIO/api/public/hotmart/webhook
 * (Ferramentas → Webhook / Postback)
 *
 * Autenticação: Hotmart envia um `hottok` como query param OU header.
 * Configure o mesmo valor como secret HOTMART_HOTTOK aqui.
 *
 * Eventos tratados:
 * - PURCHASE_APPROVED / PURCHASE_COMPLETE → cria usuário + assinatura ativa
 * - PURCHASE_REFUNDED / PURCHASE_CHARGEBACK / PURCHASE_CANCELED → cancela assinatura
 * - SUBSCRIPTION_CANCELLATION → cancela ao fim do período
 */

let _sb: ReturnType<typeof createClient> | null = null;
function sb(): any {
  if (!_sb) {
    _sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _sb;
}

function planFromEvent(payload: any): PlanId | null {
  const offerId = String(payload?.data?.offer?.id ?? '');
  if (offerId && HOTMART_OFFER_TO_PLAN[offerId]) return HOTMART_OFFER_TO_PLAN[offerId];
  const productId = String(payload?.data?.product?.id ?? '');
  return HOTMART_PRODUCT_TO_PLAN[productId] ?? null;
}

async function ensureUser(email: string): Promise<string | null> {
  const admin = sb().auth.admin;
  // Try to find existing user
  const { data: list } = await admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing.id;
  const { data, error } = await admin.createUser({ email, email_confirm: true });
  if (error) {
    console.error('createUser failed', error);
    return null;
  }
  return data.user?.id ?? null;
}

async function upsertActive(payload: any) {
  const email = payload?.data?.buyer?.email as string | undefined;
  const subscriptionCode = payload?.data?.subscription?.subscriber?.code
    ?? payload?.data?.purchase?.transaction
    ?? payload?.data?.subscription?.code;
  const transaction = payload?.data?.purchase?.transaction as string | undefined;
  const plan = planFromEvent(payload);

  if (!email || !subscriptionCode || !plan) {
    console.error('missing fields in payload', { email, subscriptionCode, plan });
    return;
  }

  const userId = await ensureUser(email);
  if (!userId) return;

  const nextCharge = payload?.data?.purchase?.date_next_charge
    ?? payload?.data?.subscription?.date_next_charge;
  const periodEnd = nextCharge ? new Date(Number(nextCharge)).toISOString() : null;

  await sb().from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_subscription_id: String(subscriptionCode),
      stripe_customer_id: String(transaction ?? email),
      product_id: String(payload?.data?.product?.id ?? ''),
      price_id: plan,
      status: 'active',
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      environment: 'hotmart',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' },
  );
}

async function markCanceled(payload: any, atPeriodEnd: boolean) {
  const subscriptionCode = payload?.data?.subscription?.subscriber?.code
    ?? payload?.data?.purchase?.transaction
    ?? payload?.data?.subscription?.code;
  if (!subscriptionCode) return;
  await sb()
    .from('subscriptions')
    .update({
      status: atPeriodEnd ? 'active' : 'canceled',
      cancel_at_period_end: atPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', String(subscriptionCode))
    .eq('environment', 'hotmart');
}

export const Route = createFileRoute('/api/public/hotmart/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.HOTMART_HOTTOK;
        if (!expected) {
          console.error('HOTMART_HOTTOK not configured');
          return new Response('server not configured', { status: 500 });
        }
        const url = new URL(request.url);
        const got = request.headers.get('x-hotmart-hottok') ?? url.searchParams.get('hottok');
        if (got !== expected) return new Response('invalid hottok', { status: 401 });

        let payload: any;
        try { payload = await request.json(); }
        catch { return new Response('invalid json', { status: 400 }); }

        const event = payload?.event as string | undefined;
        try {
          switch (event) {
            case 'PURCHASE_APPROVED':
            case 'PURCHASE_COMPLETE':
            case 'PURCHASE_BILLET_PRINTED': // não libera acesso ainda, aguarda APPROVED
              if (event !== 'PURCHASE_BILLET_PRINTED') await upsertActive(payload);
              break;
            case 'PURCHASE_REFUNDED':
            case 'PURCHASE_CHARGEBACK':
            case 'PURCHASE_CANCELED':
            case 'PURCHASE_EXPIRED':
              await markCanceled(payload, false);
              break;
            case 'SUBSCRIPTION_CANCELLATION':
              await markCanceled(payload, true);
              break;
            default:
              console.log('hotmart event ignored:', event);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error('hotmart webhook error', e);
          return new Response('handler error', { status: 500 });
        }
      },
    },
  },
});
