// Links de checkout da Hotmart usados dentro do app.
// Alterar aqui não afeta o webhook nem a entrega do produto.
export type CheckoutPlanId = "individual" | "familiar" | "premium";

export interface CheckoutPlan {
  id: CheckoutPlanId;
  name: string;
  price: string;
  /** Limite de produtos liberado por este checkout (null = ilimitado). */
  productLimit: number | null;
  limitLabel: string;
  highlight?: boolean;
  features: string[];
  url: string;
}

export const CHECKOUT_PLANS: CheckoutPlan[] = [
  {
    id: "individual",
    name: "Individual",
    price: "R$ 37,00",
    productLimit: 2,
    limitLabel: "2 produtos",
    features: ["Até 2 produtos no catálogo", "Links de afiliado ilimitados", "Acesso Web + Android"],
    url: "https://pay.hotmart.com/F106901874H?off=pqlbolqg&checkoutMode=6",
  },
  {
    id: "familiar",
    name: "Familiar",
    price: "R$ 57,00",
    productLimit: 5,
    limitLabel: "5 produtos",
    highlight: true,
    features: ["Até 5 produtos no catálogo", "Personalização da vitrine", "Acesso Web + Android"],
    url: "https://pay.hotmart.com/F106901874H?off=wqs9zkki&checkoutMode=6",
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$ 97,00",
    productLimit: null,
    limitLabel: "Produtos ilimitados",
    features: ["Produtos ilimitados", "Recursos avançados de marketing", "Acesso Web + Android"],
    url: "https://pay.hotmart.com/F106901874H?off=5c699sq1&checkoutMode=6",
  },
];

/** Limite de produtos por plano (null = ilimitado). */
export const PLAN_PRODUCT_LIMITS: Record<CheckoutPlanId, number | null> = {
  individual: 2,
  familiar: 5,
  premium: null,
};
