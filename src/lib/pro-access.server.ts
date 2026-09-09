import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Regra comercial única para as ferramentas de IA.
 * Acesso liberado para: administradores OU qualquer usuário com assinatura PRO ativa.
 * Nunca liberar por e-mail ou ID específico.
 */
export async function hasProAccess(supabase: SupabaseClient<any, any, any>, userId: string): Promise<boolean> {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (isAdmin === true) return true;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status,current_period_end")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const end = sub?.current_period_end ? new Date(sub.current_period_end as string).getTime() : null;
  const now = Date.now();
  const status = (sub?.status as string) ?? "";
  return (
    (["active", "trialing", "past_due"].includes(status) && (end === null || end > now)) ||
    (status === "canceled" && end !== null && end > now)
  );
}
