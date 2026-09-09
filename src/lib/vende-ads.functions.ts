import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * VENDE ADS IA — geração de anúncios para um produto.
 *
 * Usa a integração de IA já existente (Lovable AI Gateway, LOVABLE_API_KEY no servidor).
 * Acesso: qualquer usuário com Plano PRO ativo OU administrador. Plano Grátis é bloqueado
 * também no servidor, então não há como contornar pela URL ou por chamada direta.
 */

export type VendeAdsInput = {
  productName: string;
  platform: string;
  objective?: string;
  audience?: string;
  price?: string;
  offer?: string;
  salesPageUrl?: string;
  notes?: string;
};

export type VendeAdsSection = { title: string; items: string[] };
export type VendeAdsResult = { sections: VendeAdsSection[] };

export const AD_PLATFORMS = ["Meta Ads (Facebook e Instagram)", "Google Ads", "TikTok Ads", "YouTube Ads"] as const;

const SECTION_TITLES = [
  "Títulos (headlines)",
  "Textos principais do anúncio",
  "Descrições curtas",
  "Ganchos de abertura",
  "Roteiro de vídeo curto",
  "Segmentação sugerida",
  "Palavras-chave e interesses",
  "Chamadas para ação",
  "Sugestões de criativo",
  "Cuidados e políticas de anúncio",
];

function validate(input: unknown): VendeAdsInput {
  const raw = (input ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max = 600) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const productName = str(raw.productName, 160);
  if (!productName) throw new Error("Informe o nome do produto.");
  return {
    productName,
    platform: str(raw.platform, 80) || AD_PLATFORMS[0],
    objective: str(raw.objective, 80),
    audience: str(raw.audience, 300),
    price: str(raw.price, 60),
    offer: str(raw.offer, 400),
    salesPageUrl: str(raw.salesPageUrl, 500),
    notes: str(raw.notes, 1500),
  };
}

export const generateAds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<VendeAdsResult> => {
    const { hasProAccess } = await import("@/lib/pro-access.server");
    const allowed = await hasProAccess(context.supabase, context.userId);
    if (!allowed) throw new Response("Recurso disponível no Plano PRO.", { status: 403 });

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("A integração de IA não está configurada no servidor.");

    const prompt = [
      "Você é um especialista brasileiro em tráfego pago para produtos digitais e afiliados.",
      "Crie um pacote de anúncios prontos para o produto abaixo e devolva em JSON.",
      "",
      `Produto: ${data.productName}`,
      `Plataforma: ${data.platform}`,
      data.objective ? `Objetivo da campanha: ${data.objective}` : "",
      data.audience ? `Público informado: ${data.audience}` : "",
      data.price ? `Preço: ${data.price}` : "",
      data.offer ? `Oferta: ${data.offer}` : "",
      data.salesPageUrl ? `Página de vendas: ${data.salesPageUrl}` : "",
      data.notes ? `Observações: ${data.notes}` : "",
      "",
      "Responda SOMENTE com um objeto JSON no formato:",
      '{"sections":[{"title":"Títulos (headlines)","items":["..."]}]}',
      `Use exatamente estas seções, nesta ordem: ${SECTION_TITLES.join(" | ")}.`,
      "Cada seção deve ter de 3 a 6 itens curtos, em português do Brasil, prontos para copiar e colar.",
      "Respeite os limites e as políticas de anúncio da plataforma informada.",
      "Não invente dados verificáveis (números de alunos, resultados, garantias) que não foram informados.",
      "Não prometa ganhos financeiros garantidos.",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Muitas gerações seguidas. Aguarde alguns instantes e tente novamente.");
      if (res.status === 402) throw new Error("Os créditos de IA do aplicativo acabaram. Adicione créditos para continuar.");
      throw new Error(`Não foi possível gerar os anúncios agora. (${res.status}) ${text.slice(0, 200)}`);
    }

    const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Os anúncios voltaram em um formato inesperado. Tente novamente.");
      parsed = JSON.parse(match[0]);
    }

    const sectionsRaw = (parsed as { sections?: unknown }).sections;
    if (!Array.isArray(sectionsRaw)) throw new Error("A geração voltou incompleta. Tente novamente.");

    const sections: VendeAdsSection[] = sectionsRaw
      .map((s) => {
        const obj = (s ?? {}) as { title?: unknown; items?: unknown };
        const title = typeof obj.title === "string" ? obj.title : "";
        const items = Array.isArray(obj.items)
          ? obj.items.filter((i): i is string => typeof i === "string" && i.trim().length > 0)
          : [];
        return { title, items };
      })
      .filter((s) => s.title && s.items.length > 0);

    if (sections.length === 0) throw new Error("A geração voltou vazia. Tente novamente.");
    return { sections };
  });
