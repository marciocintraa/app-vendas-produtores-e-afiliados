#!/usr/bin/env node
// Diagnóstico ponta-a-ponta do fluxo Hotmart → webhook → /acesso → painel.
//
// Uso:
//   HOTTOK=xxxxx BASE_URL=https://app-vendas-produtores-e-afiliados.lovable.app \
//     TEST_EMAIL=teste+diag@example.com node tests/hotmart-flow-check.mjs
//
// Se BASE_URL não for passado, usa o publicado. TEST_EMAIL default = teste+diag@example.com.
// O script:
//   1. Fire PURCHASE_APPROVED para cada oferta (Starter/Pro/Premium).
//   2. Confere HTTP 200 + { received: true, ok: true }.
//   3. Chama /acesso?email=... e espera redirect para o magic link (Location contém /auth/v1/verify).
//   4. Chama /entrega?email=... (server fn) e confere status 'found'.
//   5. Fire PURCHASE_REFUNDED para o último e confere que /acesso vira 'inactive'.
//   6. Fire SUBSCRIPTION_REACTIVATED e confere que /acesso volta a redirecionar.
// Cada passo é impresso com ✅ / ❌ e detalhe do erro.

const BASE_URL = process.env.BASE_URL || 'https://app-vendas-produtores-e-afiliados.lovable.app';
const HOTTOK = process.env.HOTTOK;
const TEST_EMAIL = process.env.TEST_EMAIL || `teste+diag+${Date.now()}@example.com`;

if (!HOTTOK) {
  console.error('❌ HOTTOK não definido. Exporte HOTTOK=<valor de HOTMART_HOTTOK>');
  process.exit(2);
}

const OFFERS = [
  { code: 'pqlbolqg', plan: 'starter_monthly', label: 'Starter (Individual)' },
  { code: 'wqs9zkki', plan: 'pro_monthly', label: 'Pro' },
  { code: '5c699sq1', plan: 'premium_monthly', label: 'Premium' },
];

let failures = 0;
const step = (ok, label, extra = '') => {
  console.log(`${ok ? '✅' : '❌'} ${label}${extra ? ` — ${extra}` : ''}`);
  if (!ok) failures++;
};

function makePayload(event, offerCode, email, transaction, overrides = {}) {
  return {
    event,
    version: '2.0.0',
    data: {
      product: { id: 8200482, name: 'Vende Fácil Pro' },
      buyer: { email, name: 'Diag Test' },
      purchase: {
        transaction,
        offer: { code: offerCode },
        date_next_charge: Date.now() + 30 * 24 * 3600 * 1000,
      },
      subscription: {
        subscriber: { code: `SUB-${transaction}` },
        plan: { name: offerCode },
      },
      ...overrides,
    },
  };
}

async function postWebhook(payload) {
  const res = await fetch(`${BASE_URL}/api/public/hotmart/webhook?hottok=${encodeURIComponent(HOTTOK)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch {}
  return { status: res.status, text, body };
}

async function testAcesso(email) {
  const res = await fetch(`${BASE_URL}/acesso?email=${encodeURIComponent(email)}`, {
    redirect: 'manual',
  });
  const location = res.headers.get('location') || '';
  const text = res.status < 300 || res.status >= 400 ? await res.text().catch(() => '') : '';
  return { status: res.status, location, snippet: text.slice(0, 400) };
}

async function testEntrega(email) {
  const res = await fetch(`${BASE_URL}/entrega?email=${encodeURIComponent(email)}`, {
    redirect: 'manual',
  });
  const text = await res.text().catch(() => '');
  return { status: res.status, text: text.slice(0, 500) };
}

(async () => {
  console.log(`\n🔎 Diagnóstico Hotmart — Entrega\n   BASE_URL=${BASE_URL}\n   TEST_EMAIL=${TEST_EMAIL}\n`);

  // 1. Webhook rejeita hottok inválido
  const bad = await fetch(`${BASE_URL}/api/public/hotmart/webhook?hottok=invalid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  step(bad.status === 401, 'Webhook rejeita hottok inválido (401)', `status=${bad.status}`);

  // 2. Webhook rejeita payload inválido
  const invalid = await postWebhook({ event: 'PURCHASE_APPROVED' });
  step(
    invalid.status === 400 && invalid.body?.received === false,
    'Webhook rejeita payload sem email/código (400)',
    `status=${invalid.status} body=${invalid.text.slice(0, 120)}`,
  );

  // 3. Boleto impresso NÃO libera acesso
  const billetTx = `TX-BILLET-${Date.now()}`;
  const billetEmail = TEST_EMAIL.replace('@', `+billet@`);
  const billetPayload = makePayload('PURCHASE_BILLET_PRINTED', 'pqlbolqg', billetEmail, billetTx);
  const billetRes = await postWebhook(billetPayload);
  step(
    billetRes.status === 200 && billetRes.body?.ok === true,
    'Webhook ignora PURCHASE_BILLET_PRINTED sem liberar acesso',
    `status=${billetRes.status}`,
  );
  await new Promise((r) => setTimeout(r, 500));
  const billetAcesso = await testAcesso(billetEmail);
  step(
    billetAcesso.status === 200 && /no_purchase|Compra não localizada/.test(billetAcesso.snippet),
    'Boleto impresso não libera acesso (aguarda aprovação)',
    `status=${billetAcesso.status}`,
  );

  const createdSubscriptions = [];

  // 4. Para cada oferta: compra aprovada → /acesso deve redirecionar
  for (const offer of OFFERS) {
    const tx = `TX-${offer.code}-${Date.now()}`;
    const email = TEST_EMAIL.replace('@', `+${offer.code}@`);
    const payload = makePayload('PURCHASE_APPROVED', offer.code, email, tx);

    const r = await postWebhook(payload);
    const received = r.body?.received === true && r.body?.ok === true;
    step(
      r.status === 200 && received,
      `[${offer.label}] Webhook aceita PURCHASE_APPROVED`,
      `status=${r.status} plan=${r.body?.logs?.find((l) => l.step === 'upsertSubscription')?.detail?.slice(0, 40) ?? ''}`,
    );

    createdSubscriptions.push({ offer, tx, email, subCode: `SUB-${tx}` });

    // Aguarda um instante pelo upsert
    await new Promise((r) => setTimeout(r, 800));

    const ac = await testAcesso(email);
    const redirected = ac.status >= 300 && ac.status < 400 && /supabase\.co\/auth\/v1\/verify|access_token=/.test(ac.location);
    step(
      redirected,
      `[${offer.label}] /acesso redireciona para magic link`,
      redirected ? `→ ${ac.location.slice(0, 80)}...` : `status=${ac.status} location="${ac.location}"`,
    );

    // Página de status da entrega
    const entrega = await testEntrega(email);
    step(
      entrega.status === 200 && /Acesso liberado|Entrar no app/.test(entrega.text),
      `[${offer.label}] /entrega reconhece assinatura ativa`,
      `status=${entrega.status}`,
    );
  }

  // 5. Cancelamento revoga acesso
  const cancel = createdSubscriptions[2];
  const refund = makePayload('PURCHASE_REFUNDED', cancel.offer.code, cancel.email, cancel.tx);
  refund.data.subscription.subscriber.code = cancel.subCode;
  const rr = await postWebhook(refund);
  step(rr.status === 200 && rr.body?.ok === true, `PURCHASE_REFUNDED processado sem erro`, `status=${rr.status}`);

  await new Promise((r) => setTimeout(r, 800));
  const afterRefund = await testAcesso(cancel.email);
  step(
    afterRefund.status === 200 && /Assinatura inativa|inactive/.test(afterRefund.snippet),
    `[${cancel.offer.label}] /acesso mostra assinatura inativa após reembolso`,
    `status=${afterRefund.status}`,
  );

  // 6. Reativação restaura acesso
  const reactivate = makePayload('SUBSCRIPTION_REACTIVATED', cancel.offer.code, cancel.email, cancel.tx);
  reactivate.data.subscription.subscriber.code = cancel.subCode;
  const reacRes = await postWebhook(reactivate);
  step(
    reacRes.status === 200 && reacRes.body?.ok === true,
    `SUBSCRIPTION_REACTIVATED reativa assinatura`,
    `status=${reacRes.status}`,
  );

  await new Promise((r) => setTimeout(r, 800));
  const afterReactivate = await testAcesso(cancel.email);
  const reactivatedRedirect =
    afterReactivate.status >= 300 &&
    afterReactivate.status < 400 &&
    /supabase\.co\/auth\/v1\/verify|access_token=/.test(afterReactivate.location);
  step(
    reactivatedRedirect,
    `[${cancel.offer.label}] /acesso redireciona novamente após reativação`,
    reactivatedRedirect ? `→ ${afterReactivate.location.slice(0, 80)}...` : `status=${afterReactivate.status}`,
  );

  console.log(`\n${failures === 0 ? '✅ Todos os passos passaram.' : `❌ ${failures} falha(s) — veja acima.`}`);
  process.exit(failures === 0 ? 0 : 1);
})();
