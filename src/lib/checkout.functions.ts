import { createServerFn } from '@tanstack/react-start';
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from './stripe.server';

type CheckoutResult = { clientSecret: string; userId: string } | { error: string };

async function findOrCreateAuthUser(email: string): Promise<string> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  // list users filtered by email (v2 API)
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase());
  if (existing) return existing.id;
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createErr || !created.user) throw createErr ?? new Error('Falha ao criar usuário');
  return created.user.id;
}

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  email: string,
  userId: string,
): Promise<string> {
  if (!/^[a-zA-Z0-9-]+$/.test(userId)) throw new Error('Invalid userId');
  const found = await stripe.customers.search({
    query: `metadata['userId']:'${userId}'`,
    limit: 1,
  });
  if (found.data.length) return found.data[0].id;
  const byEmail = await stripe.customers.list({ email, limit: 1 });
  if (byEmail.data.length) {
    const c = byEmail.data[0];
    if (c.metadata?.userId !== userId) {
      await stripe.customers.update(c.id, { metadata: { ...c.metadata, userId } });
    }
    return c.id;
  }
  const created = await stripe.customers.create({ email, metadata: { userId } });
  return created.id;
}

export const startCheckout = createServerFn({ method: 'POST' })
  .inputValidator((data: { priceId: string; email: string; returnUrl: string; environment: StripeEnv }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error('Invalid priceId');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('E-mail inválido');
    return data;
  })
  .handler(async ({ data }): Promise<CheckoutResult> => {
    try {
      const email = data.email.trim().toLowerCase();
      const userId = await findOrCreateAuthUser(email);
      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error('Plano não encontrado');
      const price = prices.data[0];

      const customerId = await resolveOrCreateCustomer(stripe, email, userId);

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: 'subscription',
        ui_mode: 'embedded_page',
        return_url: data.returnUrl,
        customer: customerId,
        metadata: { userId, email },
        subscription_data: { metadata: { userId, email } },
      });
      return { clientSecret: session.client_secret ?? '', userId };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

type FinalizeResult =
  | { status: 'paid' | 'processing' | 'open'; email: string }
  | { error: string };

export const finalizeCheckout = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string; environment: StripeEnv }) => {
    if (!/^[a-zA-Z0-9_]+$/.test(data.sessionId)) throw new Error('Invalid sessionId');
    return data;
  })
  .handler(async ({ data }): Promise<FinalizeResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      const email = (session.customer_details?.email ?? session.metadata?.email ?? '').toLowerCase();
      const paid = session.payment_status === 'paid' || session.status === 'complete';
      const processing = session.payment_status === 'unpaid' && session.status === 'complete';
      return {
        status: paid ? 'paid' : processing ? 'processing' : 'open',
        email,
      };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
