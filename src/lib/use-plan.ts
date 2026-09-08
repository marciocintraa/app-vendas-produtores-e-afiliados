import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppPlan = "gratis" | "vitalicio";

export type PlanLimits = {
  plan: AppPlan;
  /** Quantos catálogos o plano permite. */
  maxCatalogs: number;
  /** Produtos por catálogo (null = ilimitado). */
  maxProductsPerCatalog: number | null;
  loading: boolean;
};

export const PLAN_LIMITS: Record<AppPlan, { maxCatalogs: number; maxProductsPerCatalog: number | null }> = {
  gratis: { maxCatalogs: 1, maxProductsPerCatalog: 2 },
  vitalicio: { maxCatalogs: 5, maxProductsPerCatalog: null },
};

/** Descobre o plano do usuário conectado a partir da compra registrada. */
export function usePlan(): PlanLimits {
  const [plan, setPlan] = useState<AppPlan>("gratis");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("product_id, status, current_period_end")
        .eq("user_id", user.id);
      if (cancelled) return;
      const now = Date.now();
      const hasPaid = (data ?? []).some((row) => {
        if (row.product_id === "free") return false;
        if (!["active", "trialing", "past_due"].includes(String(row.status))) return false;
        if (row.current_period_end && new Date(row.current_period_end).getTime() < now) return false;
        return true;
      });
      setPlan(hasPaid ? "vitalicio" : "gratis");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { plan, ...PLAN_LIMITS[plan], loading };
}
