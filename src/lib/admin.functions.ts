import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminAccount = {
  userId: string;
  email: string;
  lastSignInAt: string | null;
  createdAt: string;
  isAdmin: boolean;
  plan: "free" | "pro";
  catalogs: number;
  products: number;
};

/** Lista todas as contas do aplicativo. Só responde para administradores. */
export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAccount[]> => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [users, roles, subs, catalogs, products] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("user_roles").select("user_id,role"),
      supabaseAdmin.from("subscriptions").select("user_id,status,current_period_end"),
      supabaseAdmin.from("catalogs").select("user_id"),
      supabaseAdmin.from("catalog_products").select("user_id"),
    ]);
    if (users.error) throw new Error(users.error.message);

    const count = (rows: { user_id: string | null }[] | null, id: string) =>
      (rows ?? []).filter((r) => r.user_id === id).length;

    const now = Date.now();
    const activeSub = (id: string) =>
      (subs.data ?? []).some((s) => {
        if (s.user_id !== id) return false;
        const end = s.current_period_end ? new Date(s.current_period_end).getTime() : null;
        if (["active", "trialing", "past_due"].includes(s.status ?? "")) return end === null || end > now;
        if (s.status === "canceled") return end !== null && end > now;
        return false;
      });

    return users.data.users.map((u) => ({
      userId: u.id,
      email: u.email ?? "(sem e-mail)",
      lastSignInAt: u.last_sign_in_at ?? null,
      createdAt: u.created_at,
      isAdmin: (roles.data ?? []).some((r) => r.user_id === u.id && r.role === "admin"),
      plan: activeSub(u.id) ? ("pro" as const) : ("free" as const),
      catalogs: count(catalogs.data, u.id),
      products: count(products.data, u.id),
    }));
  });
