import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Copy, Loader2, Lock, Rocket, Sparkles } from "lucide-react";
import {
  createPrompt,
  PROMPT_CATEGORIES,
  PROMPT_TONES,
  PROMPT_TOOLS,
  type PromptMasterResult,
} from "@/lib/prompt-master.functions";
import { usePlan, useIsAdmin } from "@/lib/plan";
import { CHECKOUT_PLANS } from "@/lib/checkout-links";

export const Route = createFileRoute("/_authenticated/painel/prompt-master")({
  component: PromptMasterPage,
  head: () => ({
    meta: [
      { title: "Prompt Master IA — Vende Fácil Pro" },
      { name: "description", content: "Transforme uma ideia simples em um prompt profissional pronto para usar." },
      { property: "og:title", content: "Prompt Master IA — Vende Fácil Pro" },
      { property: "og:description", content: "Crie prompts estruturados e otimizados em segundos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const input =
  "h-11 w-full rounded-xl border border-white/10 bg-[#070B18] px-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400/50";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400";
const area =
  "w-full rounded-xl border border-white/10 bg-[#070B18] p-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400/50";

function PromptMasterPage() {
  const { plan, loading: planLoading } = usePlan();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const run = useServerFn(createPrompt);

  const [form, setForm] = useState({
    goal: "",
    category: PROMPT_CATEGORIES[0] as string,
    purpose: "",
    context: "",
    audience: "",
    tone: PROMPT_TONES[0] as string,
    targetTool: PROMPT_TOOLS[0] as string,
    notes: "",
  });
  const [improveInstruction, setImproveInstruction] = useState("");
  const [editable, setEditable] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<PromptMasterResult[]>([]);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: (opts: { previousPrompt?: string; improveInstruction?: string }) =>
      run({ data: { ...form, ...opts } }),
    onSuccess: (data) => {
      setEditable(data.finalPrompt);
      setHistory((h) => [data, ...h].slice(0, 6));
    },
  });

  useEffect(() => { setCopied(false); }, [editable]);

  const hasAccess = isAdmin || plan === "pro";
  const checking = planLoading || adminLoading;
  const result = mutation.data;

  async function copyText(text: string, markCopied = false) {
    await navigator.clipboard.writeText(text);
    if (markCopied) { setCopied(true); setTimeout(() => setCopied(false), 2200); }
  }

  return (
    <div className="min-h-screen bg-[#070B18] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Link to="/app" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Link>

        <header className="mt-5 flex items-center gap-3">
          <span className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-300"><Rocket className="h-5 w-5" /></span>
          <div>
            <h1 className="text-2xl font-bold">Prompt Master IA</h1>
            <p className="text-sm text-slate-400">
              Descreva o que você precisa e receba um prompt profissional, estruturado e pronto para copiar.
            </p>
          </div>
        </header>

        {checking && (
          <div className="mt-16 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-cyan-400" /></div>
        )}

        {!checking && !hasAccess && (
          <section className="mt-8 rounded-2xl border border-cyan-400/20 bg-[#0A0F22] p-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Lock className="h-3.5 w-3.5" /> Recurso do Plano PRO
            </span>
            <h2 className="mt-4 text-xl font-bold">Recurso exclusivo do PRO</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              O Prompt Master IA cria prompts profissionais prontos para usar. Ele faz parte do Plano PRO,
              junto com produtos ilimitados e até 5 catálogos. Seu Plano Grátis continua funcionando normalmente.
            </p>
            <a
              href={CHECKOUT_PLANS[0]?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#06101A] hover:opacity-90"
            >
              Conhecer o PRO
            </a>
          </section>
        )}

        {!checking && hasAccess && (
          <>
            <section className="mt-7 rounded-2xl border border-white/5 bg-[#0A0F22] p-6">
              <div>
                <span className={label}>O que você quer que a IA faça? *</span>
                <textarea
                  rows={4}
                  className={area}
                  value={form.goal}
                  onChange={(e) => set("goal")(e.target.value)}
                  placeholder="Ex.: Quero criar um anúncio para o meu curso de tráfego pago no Instagram."
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <span className={label}>Categoria</span>
                  <select className={input} value={form.category} onChange={(e) => set("category")(e.target.value)}>
                    {PROMPT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <span className={label}>Finalidade</span>
                  <input className={input} value={form.purpose} onChange={(e) => set("purpose")(e.target.value)} placeholder="Ex.: Publicar no Instagram" />
                </div>
                <div>
                  <span className={label}>Público-alvo</span>
                  <input className={input} value={form.audience} onChange={(e) => set("audience")(e.target.value)} placeholder="Ex.: Iniciantes em vendas online" />
                </div>
                <div>
                  <span className={label}>Tom de comunicação</span>
                  <select className={input} value={form.tone} onChange={(e) => set("tone")(e.target.value)}>
                    {PROMPT_TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <span className={label}>Ferramenta de destino</span>
                  <select className={input} value={form.targetTool} onChange={(e) => set("targetTool")(e.target.value)}>
                    {PROMPT_TOOLS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <span className={label}>Contexto</span>
                  <textarea rows={3} className={area} value={form.context} onChange={(e) => set("context")(e.target.value)} placeholder="Informações que a IA precisa saber…" />
                </div>
                <div className="sm:col-span-2">
                  <span className={label}>Informações adicionais</span>
                  <textarea rows={3} className={area} value={form.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Restrições, formato desejado, exemplos…" />
                </div>
              </div>

              <button
                type="button"
                disabled={!form.goal.trim() || mutation.isPending}
                onClick={() => mutation.mutate({})}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#06101A] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando…</> : <><Sparkles className="h-4 w-4" /> CRIAR PROMPT</>}
              </button>

              {mutation.isError && (
                <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                  {(mutation.error as Error)?.message || "Não foi possível criar o prompt agora."}
                </p>
              )}
            </section>

            {result && (
              <section className="mt-6 rounded-2xl border border-white/5 bg-[#0A0F22] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">Prompt criado</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {result.category}{result.purpose ? ` • ${result.purpose}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(editable, true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copiado" : "Copiar prompt"}
                  </button>
                </div>

                <textarea
                  rows={14}
                  value={editable}
                  onChange={(e) => setEditable(e.target.value)}
                  className={`${area} mt-5 font-mono text-[13px] leading-relaxed`}
                />

                {result.blocks.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300">Estrutura do prompt</h3>
                    {result.blocks.map((b, i) => (
                      <article key={`${b.title}-${i}`} className="rounded-xl border border-white/5 bg-[#070B18] p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-bold text-cyan-300">{i + 1}. {b.title}</h4>
                          <button
                            type="button"
                            onClick={() => copyText(`${b.title}\n${b.content}`)}
                            className="shrink-0 rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                            title="Copiar bloco"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{b.content}</p>
                      </article>
                    ))}
                  </div>
                )}

                {result.usageNotes.length > 0 && (
                  <div className="mt-6 rounded-xl border border-white/5 bg-[#070B18] p-5">
                    <h3 className="text-sm font-semibold text-slate-300">Como usar</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-400">
                      {result.usageNotes.map((n, i) => (
                        <li key={i} className="flex gap-2"><span className="text-cyan-400">•</span><span>{n}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 rounded-xl border border-white/5 bg-[#070B18] p-5">
                  <span className={label}>Melhorar o prompt</span>
                  <input
                    className={input}
                    value={improveInstruction}
                    onChange={(e) => setImproveInstruction(e.target.value)}
                    placeholder="Ex.: deixe mais específico para o Instagram e mais curto"
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ previousPrompt: editable, improveInstruction })}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-[#06101A] hover:opacity-90 disabled:opacity-40"
                    >
                      {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Melhorar prompt
                    </button>
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({})}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-40"
                    >
                      Gerar outra versão
                    </button>
                  </div>
                </div>

                {history.length > 1 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-300">Versões desta sessão</h3>
                    <div className="mt-3 space-y-2">
                      {history.slice(1).map((h, i) => (
                        <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-[#070B18] p-4">
                          <p className="line-clamp-2 text-xs text-slate-400">{h.finalPrompt}</p>
                          <div className="flex shrink-0 gap-2">
                            <button type="button" onClick={() => setEditable(h.finalPrompt)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5">Restaurar</button>
                            <button type="button" onClick={() => copyText(h.finalPrompt)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5"><Copy className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
