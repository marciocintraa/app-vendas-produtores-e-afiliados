import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Activity,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
} from "lucide-react";
import {
  readAccessJourney,
  clearAccessJourney,
  STATE_LABELS,
  type AccessEvent,
} from "@/lib/access-journey";

export const Route = createFileRoute("/status-acesso")({
  head: () => ({
    meta: [
      { title: "Diagnóstico de acesso — Vende Fácil Pro" },
      {
        name: "description",
        content:
          "Veja qual rota foi usada (/bem-vindo, /acesso ou /entrega) e por que houve redirecionamento no login.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatusAcessoPage,
});

const ROUTE_META: Record<
  string,
  { label: string; description: string; color: string }
> = {
  "/bem-vindo": {
    label: "Boas-vindas",
    description: "Ponto de entrada vindo da área de membros da Hotmart.",
    color: "text-sky-500 bg-sky-500/10 border-sky-500/30",
  },
  "/acesso": {
    label: "Login automático",
    description: "Gera o link mágico e loga o comprador direto no app.",
    color: "text-primary bg-primary/10 border-primary/30",
  },
  "/entrega": {
    label: "Status manual",
    description: "Consulta pública para o comprador conferir a compra.",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
  "/_authenticated": {
    label: "Área protegida",
    description: "Verifica sessão + assinatura ativa antes de liberar o app.",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  },
  outro: {
    label: "Outra rota",
    description: "Evento registrado fora do funil principal.",
    color: "text-muted-foreground bg-muted/40 border-border",
  },
};

const OK_STATES = new Set([
  "ok",
  "found",
  "auth_ok",
  "entered_app",
  "visited",
  "submit",
]);
const WARN_STATES = new Set(["no_purchase", "not_found", "missing_email", "poll"]);

function stateTone(state: string) {
  if (OK_STATES.has(state)) return "text-emerald-500";
  if (WARN_STATES.has(state)) return "text-amber-500";
  return "text-red-500";
}

function stateIcon(state: string) {
  if (OK_STATES.has(state)) return <CheckCircle2 className="w-4 h-4" />;
  if (WARN_STATES.has(state)) return <Clock className="w-4 h-4" />;
  return <AlertCircle className="w-4 h-4" />;
}

function StatusAcessoPage() {
  const [events, setEvents] = useState<AccessEvent[]>([]);
  const [copied, setCopied] = useState(false);

  const refresh = () => setEvents(readAccessJourney());

  useEffect(() => {
    refresh();
  }, []);

  const grouped = events.reduce<Record<string, AccessEvent[]>>((acc, e) => {
    (acc[e.route] ||= []).push(e);
    return acc;
  }, {});

  const lastEvent = events[events.length - 1];
  const lastRouteMeta =
    lastEvent && (ROUTE_META[lastEvent.route] ?? ROUTE_META.outro);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(events, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Página inicial
        </Link>

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Activity className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest font-semibold">
                Diagnóstico de acesso
              </span>
            </div>
            <h1 className="text-3xl font-bold mt-2">Como você chegou até aqui</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Esta página mostra a sequência de rotas do funil de entrega
              (<code>/bem-vindo</code>, <code>/acesso</code>, <code>/entrega</code> e área
              protegida) e explica cada decisão de redirecionamento na sua sessão atual.
            </p>
          </div>
        </div>

        {lastEvent && lastRouteMeta && (
          <div
            className={`rounded-2xl border p-5 mb-8 ${lastRouteMeta.color}`}
          >
            <div className="text-xs uppercase tracking-wider opacity-80">
              Última rota usada
            </div>
            <div className="text-xl font-bold mt-1">
              {lastRouteMeta.label} · <code className="font-mono">{lastEvent.route}</code>
            </div>
            <div className="mt-2 text-sm opacity-90">
              {STATE_LABELS[lastEvent.state] ?? lastEvent.state}
              {lastEvent.detail ? ` — ${lastEvent.detail}` : ""}
            </div>
            {lastEvent.email && (
              <div className="mt-1 text-sm opacity-80">
                Email: <strong>{lastEvent.email}</strong>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
          <button
            onClick={() => {
              clearAccessJourney();
              refresh();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-sm"
          >
            <Trash2 className="w-4 h-4" /> Limpar histórico
          </button>
          <button
            onClick={copyJson}
            disabled={events.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-sm disabled:opacity-50"
          >
            <Copy className="w-4 h-4" /> {copied ? "Copiado!" : "Copiar JSON"}
          </button>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
            Nenhum evento registrado ainda nesta sessão. Passe por{" "}
            <Link to="/bem-vindo" className="text-primary hover:underline">
              /bem-vindo
            </Link>
            ,{" "}
            <Link to="/acesso" className="text-primary hover:underline">
              /acesso
            </Link>{" "}
            ou{" "}
            <Link to="/entrega" className="text-primary hover:underline">
              /entrega
            </Link>{" "}
            e volte aqui para ver a rota usada e o motivo do redirecionamento.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([route, evs]) => {
              const meta = ROUTE_META[route] ?? ROUTE_META.outro;
              return (
                <section
                  key={route}
                  className="rounded-2xl border border-border/60 bg-card p-5"
                >
                  <header className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <div
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-semibold ${meta.color}`}
                      >
                        <code className="font-mono">{route}</code>
                        <span className="opacity-80">· {meta.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {meta.description}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {evs.length} evento{evs.length > 1 ? "s" : ""}
                    </div>
                  </header>
                  <ol className="space-y-2">
                    {evs.map((e, i) => (
                      <li
                        key={`${route}-${i}-${e.at}`}
                        className="flex gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-sm"
                      >
                        <div className={`mt-0.5 ${stateTone(e.state)}`}>
                          {stateIcon(e.state)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className={`font-semibold ${stateTone(e.state)}`}>
                              {e.state}
                            </span>
                            <span className="text-muted-foreground">
                              {STATE_LABELS[e.state] ?? "—"}
                            </span>
                          </div>
                          {e.detail && (
                            <div className="text-muted-foreground text-xs mt-0.5 break-words">
                              {e.detail}
                            </div>
                          )}
                          {e.email && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Email: <strong>{e.email}</strong>
                            </div>
                          )}
                          <div className="text-[11px] text-muted-foreground/70 mt-0.5">
                            {new Date(e.at).toLocaleString()}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          O histórico fica só no seu navegador (sessionStorage) e é limpo ao
          fechar a aba.
        </p>
      </div>
    </div>
  );
}
