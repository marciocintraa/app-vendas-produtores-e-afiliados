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
        .select("product_id, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const isFree = !data || data.product_id === "free";
      setPlan(isFree ? "gratis" : "vitalicio");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { plan, ...PLAN_LIMITS[plan], loading };
}
