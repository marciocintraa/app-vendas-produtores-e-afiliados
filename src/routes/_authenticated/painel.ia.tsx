import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/painel/ia")({
  head: () => ({
    meta: [
      { title: "IA VENDE+ — Vende Fácil Pro" },
      { name: "description", content: "Gere textos de venda, legendas e descrições de produto com inteligência artificial." },
      { property: "og:title", content: "IA VENDE+ — Vende Fácil Pro" },
      { property: "og:description", content: "Textos de venda prontos em segundos com inteligência artificial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IaPage,
});

type Formato = "anuncio" | "legenda" | "descricao" | "whatsapp" | "email";

const PROMPTS: Record<Formato, string> = {
  anuncio: "um anúncio curto e persuasivo para redes sociais, com gancho forte e chamada para ação",
  legenda: "uma legenda para Instagram com emojis, quebras de linha e hashtags relevantes",
  descricao: "uma descrição de produto completa para a página do catálogo, com benefícios em tópicos",
  whatsapp: "uma mensagem curta de WhatsApp para enviar a um cliente, informal e direta",
  email: "um e-mail de divulgação com assunto, abertura, benefícios e chamada para ação",
};

const gerarTexto = createServerFn({ method: "POST" })
  .validator((d: { produto: string; publico: string; formato: Formato }) => d)
  .handler(async ({ data }): Promise<{ ok: boolean; text?: string; error?: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, error: "Serviço de IA indisponível no momento." };

    const instrucao = PROMPTS[data.formato] ?? PROMPTS.anuncio;
    const prompt = `Você é um copywriter brasileiro especialista em marketing de afiliados.
Escreva ${instrucao} em português do Brasil.
Produto: ${data.produto}
Público-alvo: ${data.publico || "público geral interessado em produtos digitais"}
Regras: seja específico, evite promessas irreais, use linguagem simples e envolvente. Responda apenas com o texto final.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (res.status === 429) return { ok: false, error: "Muitas solicitações. Tente novamente em instantes." };
      if (res.status === 402) return { ok: false, error: "Créditos de IA esgotados." };
      if (!res.ok) return { ok: false, error: "Não foi possível gerar o texto agora." };

      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (!text) return { ok: false, error: "A IA não retornou texto. Tente novamente." };
      return { ok: true, text };
    } catch {
      return { ok: false, error: "Falha de conexão com o serviço de IA." };
    }
  });

function IaPage() {
  const [produto, setProduto] = useState("");
  const [publico, setPublico] = useState("");
  const [formato, setFormato] = useState<Formato>("anuncio");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");
  const [copiado, setCopiado] = useState(false);

  const gerar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto.trim()) {
      toast.error("Descreva o produto primeiro.");
      return;
    }
    setLoading(true);
    setResultado("");
    const r = await gerarTexto({ data: { produto: produto.trim(), publico: publico.trim(), formato } });
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error ?? "Não foi possível gerar o texto.");
      return;
    }
    setResultado(r.text ?? "");
    toast.success("Texto gerado!");
  };

  const copiar = async () => {
    await navigator.clipboard.writeText(resultado);
    setCopiado(true);
    toast.success("Texto copiado.");
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <Sparkles className="h-7 w-7 text-primary" /> IA VENDE+
      </h1>
      <p className="mt-2 text-muted-foreground">
        Descreva seu produto e receba o texto pronto para divulgar seu catálogo.
      </p>

      <form onSubmit={gerar} className="mt-8 space-y-3 rounded-2xl border border-border/50 bg-card p-5">
        <textarea
          value={produto}
          onChange={(e) => setProduto(e.target.value)}
          rows={3}
          placeholder="Ex.: Curso de confeitaria para iniciantes, com 40 receitas e suporte no WhatsApp"
          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <input
          value={publico}
          onChange={(e) => setPublico(e.target.value)}
          placeholder="Público-alvo (opcional)"
          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        />
        <select
          value={formato}
          onChange={(e) => setFormato(e.target.value as Formato)}
          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
        >
          <option value="anuncio">Anúncio para redes sociais</option>
          <option value="legenda">Legenda para Instagram</option>
          <option value="descricao">Descrição do produto</option>
          <option value="whatsapp">Mensagem de WhatsApp</option>
          <option value="email">E-mail de divulgação</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Gerando..." : "Gerar texto"}
        </button>
      </form>

      {resultado && (
        <div className="mt-6 rounded-2xl border border-border/50 bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Texto gerado</p>
            <button onClick={copiar} className="flex items-center gap-1 text-sm text-primary hover:underline">
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copiar
            </button>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{resultado}</p>
        </div>
      )}
    </div>
  );
}
