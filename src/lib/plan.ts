import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Plano do usuário.
 *
 * FREE  = qualquer conta autenticada sem assinatura ativa.
 * PRO   = conta com assinatura ativa (tabela public.subscriptions).
 *
 * Não cria autenticação nova nem altera o fluxo da Hotmart:
 * apenas lê a assinatura já existente do próprio usuário.
 */
export type PlanId = "free" | "pro";

export const PLAN_LIMITS: Record<PlanId, { products: number | null; catalogs: number }> = {
  free: { products: 2, catalogs: 1 },
  pro: { products: null, catalogs: 5 },
};

export const PLAN_LABEL: Record<PlanId, string> = {
  free: "Plano Grátis",
  pro: "Plano PRO",
};

type SubRow = { status: string | null; current_period_end: string | null };

function subscriptionIsActive(sub: SubRow | null): boolean {
  if (!sub || !sub.status) return false;
  const end = sub.current_period_end ? new Date(sub.current_period_end) : null;
  const now = new Date();
  if (["active", "trialing", "past_due"].includes(sub.status) && (!end || end > now)) return true;
  if (sub.status === "canceled" && end && end > now) return true;
  return false;
}

export interface PlanState {
  plan: PlanId;
  loading: boolean;
  isPro: boolean;
  /** null = ilimitado */
  productLimit: number | null;
  catalogLimit: number;
}

export function usePlan(): PlanState {
  const [plan, setPlan] = useState<PlanId>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function resolve() {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        if (active) { setPlan("free"); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("status,current_period_end")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      setPlan(subscriptionIsActive((data as SubRow | null) ?? null) ? "pro" : "free");
      setLoading(false);
    }

    void resolve();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void resolve();
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  const limits = PLAN_LIMITS[plan];
  return { plan, loading, isPro: plan === "pro", productLimit: limits.products, catalogLimit: limits.catalogs };
}

/** true quando a conta autenticada tem a função de administrador. */
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function resolve() {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) { if (active) { setIsAdmin(false); setLoading(false); } return; }
      const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (!active) return;
      setIsAdmin(data === true);
      setLoading(false);
    }
    void resolve();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void resolve();
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return { isAdmin, loading };
}

