// Links de checkout da Hotmart para cada plano.
// Substitua pelos links reais de checkout dos seus 3 produtos na Hotmart.
// Você encontra em: Hotmart → Produtos → [seu produto] → Divulgação → Link de compra.
export const HOTMART_CHECKOUT_URLS: Record<PlanId, string> = {
  starter_monthly: 'https://pay.hotmart.com/COLOQUE_SEU_LINK_STARTER',
  pro_monthly: 'https://pay.hotmart.com/COLOQUE_SEU_LINK_PRO',
  premium_monthly: 'https://pay.hotmart.com/COLOQUE_SEU_LINK_PREMIUM',
};

export type PlanId = 'starter_monthly' | 'pro_monthly' | 'premium_monthly';

// Mapeia o `product.id` (ou `plan.name`) que a Hotmart envia no webhook para o plano interno.
// Preencha com os IDs numéricos de cada um dos 3 produtos criados na Hotmart.
export const HOTMART_PRODUCT_TO_PLAN: Record<string, PlanId> = {
  // Exemplo:
  // '1234567': 'starter_monthly',
  // '1234568': 'pro_monthly',
  // '1234569': 'premium_monthly',
};
