export type PlanId = "starter_monthly" | "pro_monthly" | "premium_monthly";

// Links de checkout da Hotmart para cada plano.
// Você encontra em: Hotmart → Produtos → [seu produto] → Divulgação → Link de compra.
export const HOTMART_CHECKOUT_URLS: Record<PlanId, string> = {
  starter_monthly: "https://pay.hotmart.com/F106901874H?off=pqlbolqg&checkoutMode=6",
  pro_monthly: "https://pay.hotmart.com/F106901874H?off=wqs9zkki&checkoutMode=6",
  premium_monthly: "https://pay.hotmart.com/F106901874H?off=5c699sq1&checkoutMode=6",
};

// Mapeia o `product.id` que a Hotmart envia no webhook para o plano interno.
// Como as 3 ofertas estão no MESMO produto (ID 8200482), esse mapeamento sozinho
// não consegue diferenciar os planos. Usamos o código da oferta (ver abaixo).
export const HOTMART_PRODUCT_TO_PLAN: Record<string, PlanId> = {
  // '8200482': 'starter_monthly', // fallback genérico — evitar
};

// Mapeia o código da oferta (`purchase.offer.code` no webhook) para o plano interno.
// O código da oferta é exatamente o valor que vem depois de `off=` no link de checkout.
// Exemplo: https://pay.hotmart.com/F106901874H?off=pqlbolqg&checkoutMode=6
export const HOTMART_OFFER_TO_PLAN: Record<string, PlanId> = {
  pqlbolqg: "starter_monthly",
  wqs9zkki: "pro_monthly",
  "5c699sq1": "premium_monthly",
};
