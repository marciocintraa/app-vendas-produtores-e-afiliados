// Links de checkout da Hotmart usados dentro do app.
// Alterar aqui não afeta o webhook nem a entrega do produto.
export type CheckoutPlanId = "vitalicio";

export interface CheckoutPlan {
  id: CheckoutPlanId;
  name: string;
  price: string;
  /** Preço parcelado exibido na oferta. */
  installmentPrice?: string;
  /** Limite de produtos liberado por este checkout (null = ilimitado). */
  productLimit: number | null;
  limitLabel: string;
  highlight?: boolean;
  features: string[];
  /** URL do checkout Hotmart (pagamento único ou parcelado). */
  url: string;
}

export const CHECKOUT_PLANS: CheckoutPlan[] = [
  {
    id: "vitalicio",
    name: "Vende Fácil Pro",
    price: "R$ 197,00",
    installmentPrice: "6 x de R$ 36,96",
    productLimit: null,
    limitLabel: "Produtos ilimitados",
    highlight: true,
    features: [
      "Produtos ilimitados no catálogo",
      "Links de afiliado ilimitados",
      "Personalização completa da vitrine",
      "Recursos avançados de marketing",
      "Acesso Web + Android",
      "Pagamento único — sem mensalidades",
    ],
    url: "https://pay.hotmart.com/F106901874H?checkoutMode=6",
  },
];

/** Limite de produtos por plano (null = ilimitado). */
export const PLAN_PRODUCT_LIMITS: Record<CheckoutPlanId, number | null> = {
  vitalicio: null,
};
