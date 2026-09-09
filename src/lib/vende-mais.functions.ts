import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * IA VENDE+ — análise comercial de um produto.
 *
 * Usa a integração de IA já disponível no projeto (Lovable AI Gateway,
 * chave LOVABLE_API_KEY no servidor). Nenhuma chave é exposta ao navegador.
 * Acesso: contas PRO (assinatura ativa) e administradores.
 */

export type VendeMaisInput = {
  productName: string;
  category?: string;
  audience?: string;
  price?: string;
  offer?: string;
  salesPageUrl?: string;
  notes?: string;
};

export type VendeMaisSection = { title: string; items: string[] };

export type VendeMaisResult = { sections: VendeMaisSection[] };

const SECTION_TITLES = [
  "Resumo da oferta",
  "Público-alvo",
  "Principal problema identificado",
  "Principal transformação prometida",
  "Benefícios",
  "Diferenciais",
  "Argumentos de venda",
  "Objeções e respostas",
  "Ideias de chamadas",
  "CTA recomendado",
];

function validate(input: unknown): VendeMaisInput {
  const raw = (input ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max = 600) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const productName = str(raw.productName, 160);
  if (!productName) throw new Error("Informe o nome do produto.");
  return {
    productName,
    category: str(raw.category, 80),
    audience: str(raw.audience, 300),
    price: str(raw.price, 60),
    offer: str(raw.offer, 400),
    salesPageUrl: str(raw.salesPageUrl, 500),
    notes: str(raw.notes, 1500),
  };
}

export const analyzeProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<VendeMaisResult> => {
    // Regra comercial única: PRO ativo (qualquer comprador) ou administrador.
    const { hasProAccess } = await import("@/lib/pro-access.server");
    const allowed = await hasProAccess(context.supabase, context.userId);
    if (!allowed) throw new Response("Recurso disponível no Plano PRO.", { status: 403 });

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("A integração de IA não está configurada no servidor.");

    const prompt = [
      "Você é um estrategista de marketing digital brasileiro especializado em produtos digitais e afiliados.",
      "Analise o produto abaixo e devolva um JSON com a estrutura comercial de venda.",
      "",
      `Produto: ${data.productName}`,
      data.category ? `Categoria: ${data.category}` : "",
      data.audience ? `Público informado: ${data.audience}` : "",
      data.price ? `Preço: ${data.price}` : "",
      data.offer ? `Oferta: ${data.offer}` : "",
      data.salesPageUrl ? `Página de vendas: ${data.salesPageUrl}` : "",
      data.notes ? `Observações: ${data.notes}` : "",
      "",
      "Responda SOMENTE com um objeto JSON no formato:",
      '{"sections":[{"title":"Resumo da oferta","items":["..."]}]}',
      `Use exatamente estas seções, nesta ordem: ${SECTION_TITLES.join(" | ")}.`,
      "Cada seção deve ter de 1 a 6 itens curtos, em português do Brasil, práticos e específicos.",
      "Em 'Objeções e respostas', cada item deve trazer a objeção e a resposta na mesma linha.",
      "Não invente dados verificáveis (números de alunos, prêmios, garantias) que não foram informados.",
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
      if (res.status === 429) throw new Error("Muitas análises seguidas. Aguarde alguns instantes e tente novamente.");
      if (res.status === 402) throw new Error("Os créditos de IA do aplicativo acabaram. Adicione créditos para continuar.");
      throw new Error(`Não foi possível gerar a análise agora. (${res.status}) ${text.slice(0, 200)}`);
    }

    const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("A análise voltou em um formato inesperado. Tente novamente.");
      parsed = JSON.parse(match[0]);
    }

    const sectionsRaw = (parsed as { sections?: unknown }).sections;
    if (!Array.isArray(sectionsRaw)) throw new Error("A análise voltou incompleta. Tente novamente.");

    const sections: VendeMaisSection[] = sectionsRaw
      .map((s) => {
        const obj = (s ?? {}) as { title?: unknown; items?: unknown };
        const title = typeof obj.title === "string" ? obj.title : "";
        const items = Array.isArray(obj.items)
          ? obj.items.filter((i): i is string => typeof i === "string" && i.trim().length > 0)
          : [];
        return { title, items };
      })
      .filter((s) => s.title && s.items.length > 0);

    if (sections.length === 0) throw new Error("A análise voltou vazia. Tente novamente.");
    return { sections };
  });
