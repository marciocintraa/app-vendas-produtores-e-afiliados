export type PlanId = 'starter_monthly' | 'pro_monthly' | 'premium_monthly';

// Links de checkout da Hotmart para cada plano.
// Substitua pelos links reais de checkout dos seus 3 produtos na Hotmart.
// Você encontra em: Hotmart → Produtos → [seu produto] → Divulgação → Link de compra.
export const HOTMART_CHECKOUT_URLS: Record<PlanId, string> = {
  starter_monthly: 'https://pay.hotmart.com/F106901874H?off=pqlbolqg&checkoutMode=6',
  pro_monthly: 'https://pay.hotmart.com/F106901874H?off=wqs9zkki&checkoutMode=6',
  premium_monthly: 'https://pay.hotmart.com/F106901874H?off=5c699sq1&checkoutMode=6',
};

// Mapeia o `product.id` que a Hotmart envia no webhook para o plano interno.
// O produto Hotmart F106901874H tem 3 ofertas (Individual/Starter, Pro, Premium)
// e o ID numérico do produto é 8200482.
export const HOTMART_PRODUCT_TO_PLAN: Record<string, PlanId> = {
  '8200482': 'starter_monthly',
  '8200482_pro': 'pro_monthly',
  '8200482_premium': 'premium_monthly',
};
