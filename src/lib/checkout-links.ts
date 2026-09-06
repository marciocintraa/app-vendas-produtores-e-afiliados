// Links de checkout da Hotmart usados dentro do app.
// Alterar aqui não afeta o webhook nem a entrega do produto.
export type CheckoutPlanId = "gratis" | "vitalicio";

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
  /** Se true, o botão leva ao formulário de acesso em vez do checkout. */
  isFree?: boolean;
}

export const CHECKOUT_PLANS: CheckoutPlan[] = [
  {
    id: "gratis",
    name: "Conta Grátis",
    price: "R$ 0,00",
    productLimit: 2,
    limitLabel: "2 produtos",
    features: [
      "Até 2 produtos no catálogo",
      "Links de afiliado nos produtos",
      "Vitrine personalizável",
      "Acesso Web + Android",
    ],
    url: "#form-acesso",
    isFree: true,
  },
  {
    id: "vitalicio",
    name: "Vende Fácil Pro",
    price: "R$ 197,00",
    installmentPrice: "6 x de R$ 36,96",
    productLimit: 5,
    limitLabel: "5 produtos",
    highlight: true,
    features: [
      "Até 5 produtos no catálogo",
      "Links de afiliado nos produtos",
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
  gratis: 2,
  vitalicio: 5,
};
