// Links de checkout usados APENAS pela página de vendas (landing page).
// Este arquivo é independente da lógica do app/entrega — alterar aqui não afeta
// o webhook da Hotmart nem o acesso do comprador.
export type LandingPlanId = "starter_monthly" | "pro_monthly" | "premium_monthly";

export const LANDING_CHECKOUT_URLS: Record<LandingPlanId, string> = {
  starter_monthly: "https://pay.hotmart.com/F106901874H?off=pqlbolqg&checkoutMode=6",
  pro_monthly: "https://pay.hotmart.com/F106901874H?off=wqs9zkki&checkoutMode=6",
  premium_monthly: "https://pay.hotmart.com/F106901874H?off=5c699sq1&checkoutMode=6",
};
