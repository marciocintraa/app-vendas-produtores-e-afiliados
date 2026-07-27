import { createFileRoute } from '@tanstack/react-router';
import {
  hotmartWebhookPayloadSchema,
  logDelivery,
  upsertActiveSubscription,
  markSubscriptionCanceled,
  type HotmartWebhookPayload,
} from '@/lib/hotmart.server';

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
 * - PURCHASE_REFUNDED / PURCHASE_CHARGEBACK / PURCHASE_CANCELED / PURCHASE_EXPIRED → cancela assinatura
 * - SUBSCRIPTION_CANCELLATION → cancela ao fim do período
 * - SUBSCRIPTION_REACTIVATED → reativa assinatura
 */

export const Route = createFileRoute('/api/public/hotmart/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.HOTMART_HOTTOK;
        if (!expected) {
          console.error('[HOTMART] HOTMART_HOTTOK not configured');
          return new Response('server not configured', { status: 500 });
        }

        const url = new URL(request.url);
        const got = request.headers.get('x-hotmart-hottok') ?? url.searchParams.get('hottok');
        if (got !== expected) {
          logDelivery({ step: 'auth', event: 'unknown', success: false, detail: 'invalid hottok' });
          return new Response('invalid hottok', { status: 401 });
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return new Response('invalid json', { status: 400 });
        }

        const parse = hotmartWebhookPayloadSchema.safeParse(raw);
        if (!parse.success) {
          logDelivery({ step: 'validate', event: 'unknown', success: false, detail: parse.error.message });
          return Response.json({ received: false, error: 'invalid payload', details: parse.error.format() }, { status: 400 });
        }

        const payload: HotmartWebhookPayload = parse.data;
        const event = payload.event;

        try {
          let logs: ReturnType<typeof logDelivery>[] = [];

          switch (event) {
            case 'PURCHASE_APPROVED':
            case 'PURCHASE_COMPLETE':
            case 'SUBSCRIPTION_REACTIVATED':
              logs = await upsertActiveSubscription(payload);
              break;
            case 'PURCHASE_BILLET_PRINTED':
              // Boleto ainda não libera acesso — aguarda PURCHASE_APPROVED.
              logs = [logDelivery({ step: 'ignore', event, success: true, detail: 'billet printed, awaiting approval' })];
              break;
            case 'PURCHASE_REFUNDED':
            case 'PURCHASE_CHARGEBACK':
            case 'PURCHASE_CANCELED':
            case 'PURCHASE_EXPIRED':
              logs = await markSubscriptionCanceled(payload, false);
              break;
            case 'SUBSCRIPTION_CANCELLATION':
              logs = await markSubscriptionCanceled(payload, true);
              break;
            default:
              logs = [logDelivery({ step: 'ignore', event, success: true, detail: 'event not handled' })];
          }

          const failed = logs.find((l) => !l.success);
          return Response.json({
            received: true,
            event,
            logs: logs.map((l) => ({ step: l.step, success: l.success, detail: l.detail })),
            ok: !failed,
          });
        } catch (e) {
          const detail = e instanceof Error ? e.message : String(e);
          console.error('[HOTMART] webhook error', e);
          logDelivery({ step: 'handler', event, success: false, detail });
          return new Response('handler error', { status: 500 });
        }
      },
    },
  },
});
