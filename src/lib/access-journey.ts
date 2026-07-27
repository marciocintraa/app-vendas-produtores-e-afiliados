/**
 * Registro leve do fluxo de acesso do comprador.
 *
 * Cada rota do funil (/bem-vindo, /acesso, /entrega e a área
 * protegida) grava um evento em sessionStorage. A página
 * /status-acesso lê esse histórico e mostra qual rota foi usada,
 * qual foi o resultado e por que houve redirecionamento.
 */
export type AccessRoute = "/bem-vindo" | "/acesso" | "/entrega" | "/_authenticated" | "outro";

export interface AccessEvent {
  at: string; // ISO
  route: AccessRoute;
  state: string; // ex: "ok", "no_purchase", "missing_email", "redirect_to_planos"
  detail?: string;
  email?: string;
}

const KEY = "vfp:access-journey";
const MAX = 30;

export function logAccessEvent(evt: Omit<AccessEvent, "at">) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const list: AccessEvent[] = raw ? JSON.parse(raw) : [];
    list.push({ ...evt, at: new Date().toISOString() });
    while (list.length > MAX) list.shift();
    window.sessionStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function readAccessJourney(): AccessEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AccessEvent[]) : [];
  } catch {
    return [];
  }
}

export function clearAccessJourney() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}

export const STATE_LABELS: Record<string, string> = {
  ok: "Acesso liberado — link mágico gerado",
  redirect_magic_link: "Redirecionado para o link mágico do Supabase",
  no_purchase: "Compra ainda não localizada no banco",
  inactive: "Assinatura cancelada ou expirada",
  invalid_email: "Email inválido informado",
  missing_email: "Email ausente na URL — pediu para o usuário digitar",
  link_failed: "Falha ao gerar o link mágico",
  found: "Assinatura ativa encontrada",
  not_found: "Nenhum usuário/assinatura para esse email",
  visited: "Página aberta",
  submit: "Formulário enviado",
  poll: "Nova tentativa automática",
  auth_ok: "Sessão ativa detectada",
  no_active_sub: "Sem assinatura ativa — redirecionado para /#planos",
  entered_app: "Entrou na área protegida",
};
