import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * PROMPT MASTER IA — cria prompts profissionais prontos para uso.
 *
 * Reutiliza a mesma infraestrutura segura das outras ferramentas
 * (Lovable AI Gateway, LOVABLE_API_KEY apenas no servidor).
 * Acesso: Plano PRO ativo OU administrador. Bloqueio também no servidor.
 */

export type PromptMasterInput = {
  goal: string;
  category: string;
  purpose?: string;
  context?: string;
  audience?: string;
  tone?: string;
  targetTool?: string;
  notes?: string;
  /** pedido de refinamento sobre um prompt já gerado */
  previousPrompt?: string;
  improveInstruction?: string;
};

export type PromptMasterBlock = { title: string; content: string };
export type PromptMasterResult = {
  category: string;
  purpose: string;
  blocks: PromptMasterBlock[];
  finalPrompt: string;
  usageNotes: string[];
};

export const PROMPT_CATEGORIES = [
  "Marketing",
  "Vendas",
  "Anúncios",
  "Copywriting",
  "Redes sociais",
  "Conteúdo",
  "Vídeos",
  "Imagens",
  "Negócios",
  "Estudos",
  "Produtividade",
  "Atendimento",
  "Outros",
] as const;

export const PROMPT_TONES = [
  "Profissional",
  "Persuasivo",
  "Amigável",
  "Direto",
  "Inspirador",
  "Didático",
  "Divertido",
] as const;

export const PROMPT_TOOLS = ["ChatGPT", "Gemini", "Claude", "Midjourney", "Sora / vídeo", "Outra"] as const;

function validate(input: unknown): PromptMasterInput {
  const raw = (input ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max = 600) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const goal = str(raw.goal, 2000);
  if (!goal) throw new Error("Descreva o que você quer que a IA faça.");
  return {
    goal,
    category: str(raw.category, 60) || "Outros",
    purpose: str(raw.purpose, 200),
    context: str(raw.context, 1500),
    audience: str(raw.audience, 300),
    tone: str(raw.tone, 60),
    targetTool: str(raw.targetTool, 60),
    notes: str(raw.notes, 1500),
    previousPrompt: str(raw.previousPrompt, 6000),
    improveInstruction: str(raw.improveInstruction, 600),
  };
}

export const createPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<PromptMasterResult> => {
    const { hasProAccess } = await import("@/lib/pro-access.server");
    const allowed = await hasProAccess(context.supabase, context.userId);
    if (!allowed) throw new Response("Recurso disponível no Plano PRO.", { status: 403 });

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("A integração de IA não está configurada no servidor.");

    const prompt = [
      "Você é um engenheiro de prompts brasileiro especialista em transformar pedidos simples em prompts profissionais.",
      "Crie um prompt estruturado, detalhado e otimizado a partir das informações abaixo. Responda em português do Brasil.",
      "",
      `Pedido do usuário: ${data.goal}`,
      `Categoria: ${data.category}`,
      data.purpose ? `Finalidade: ${data.purpose}` : "",
      data.context ? `Contexto: ${data.context}` : "",
      data.audience ? `Público-alvo: ${data.audience}` : "",
      data.tone ? `Tom de comunicação: ${data.tone}` : "",
      data.targetTool ? `Ferramenta de IA de destino: ${data.targetTool}` : "",
      data.notes ? `Informações adicionais: ${data.notes}` : "",
      data.previousPrompt ? `Versão anterior do prompt (melhore-a):\n${data.previousPrompt}` : "",
      data.improveInstruction ? `O que melhorar: ${data.improveInstruction}` : "",
      "",
      "Responda SOMENTE com um objeto JSON no formato:",
      '{"category":"...","purpose":"...","blocks":[{"title":"Papel da IA","content":"..."}],"finalPrompt":"...","usageNotes":["..."]}',
      "Use apenas os blocos que fizerem sentido, entre estes: Papel da IA | Objetivo | Contexto | Tarefa | Regras e restrições | Público-alvo | Tom e estilo | Formato da resposta | Critérios de qualidade.",
      "O campo finalPrompt deve conter o prompt completo pronto para copiar e colar, reunindo os blocos em texto corrido bem formatado.",
      "Quando faltar informação essencial, use variáveis editáveis entre colchetes, como [Nome do Produto] ou [Público-Alvo].",
      "Nunca invente dados específicos que não foram informados.",
      "usageNotes: 2 a 4 dicas curtas de como usar ou personalizar o prompt.",
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
      throw new Error(`Não foi possível criar o prompt agora. (${res.status}) ${text.slice(0, 200)}`);
    }

    const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("O prompt voltou em um formato inesperado. Tente novamente.");
      parsed = JSON.parse(match[0]);
    }

    const obj = (parsed ?? {}) as Record<string, unknown>;
    const blocks: PromptMasterBlock[] = Array.isArray(obj.blocks)
      ? obj.blocks
          .map((b) => {
            const o = (b ?? {}) as { title?: unknown; content?: unknown };
            return {
              title: typeof o.title === "string" ? o.title : "",
              content: typeof o.content === "string" ? o.content : "",
            };
          })
          .filter((b) => b.title && b.content)
      : [];

    const finalPrompt = typeof obj.finalPrompt === "string" ? obj.finalPrompt.trim() : "";
    if (!finalPrompt && blocks.length === 0) throw new Error("A geração voltou vazia. Tente novamente.");

    return {
      category: typeof obj.category === "string" && obj.category ? obj.category : data.category,
      purpose: typeof obj.purpose === "string" ? obj.purpose : (data.purpose ?? ""),
      blocks,
      finalPrompt: finalPrompt || blocks.map((b) => `${b.title}\n${b.content}`).join("\n\n"),
      usageNotes: Array.isArray(obj.usageNotes)
        ? obj.usageNotes.filter((n): n is string => typeof n === "string" && n.trim().length > 0).slice(0, 6)
        : [],
    };
  });
