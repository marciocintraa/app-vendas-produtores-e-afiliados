export type PlanId = "lifetime";

// Link de checkout da Hotmart (pagamento único R$ 197 ou parcelado).
// Você encontra em: Hotmart → Produtos → [seu produto] → Divulgação → Link de compra.
export const HOTMART_CHECKOUT_URLS: Record<PlanId, string> = {
  lifetime: "https://pay.hotmart.com/F106901874H?checkoutMode=6",
};

// Mapeia o `product.id` que a Hotmart envia no webhook para o plano interno.
// Agora existe apenas UM produto/oferta: pagamento único vitalício (ID 8200482).
export const HOTMART_PRODUCT_TO_PLAN: Record<string, PlanId> = {
  "8200482": "lifetime",
};

// Mapeia o código da oferta (`purchase.offer.code` no webhook) para o plano interno.
// Ofertas antigas (assinaturas) continuam mapeadas para não quebrar acessos já vendidos.
export const HOTMART_OFFER_TO_PLAN: Record<string, PlanId> = {
  pqlbolqg: "lifetime",
  wqs9zkki: "lifetime",
  "5c699sq1": "lifetime",
};
