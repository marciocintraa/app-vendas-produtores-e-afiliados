import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { HOTMART_OFFER_TO_PLAN, HOTMART_PRODUCT_TO_PLAN, type PlanId } from "./hotmart";

/**
 * Server-only helpers for the Hotmart purchase → access delivery flow.
 * This module may only be imported by server routes / server functions.
 */

export const hotmartWebhookPayloadSchema = z.object({
  event: z.string(),
  version: z.string().optional(),
  data: z.object({
    product: z.object({ id: z.union([z.string(), z.number()]) }).optional(),
    buyer: z.object({ email: z.string().email().optional() }).optional(),
    purchase: z
      .object({
        transaction: z.union([z.string(), z.number()]).optional(),
        offer: z.object({ code: z.string().optional() }).optional(),
        date_next_charge: z.union([z.string(), z.number()]).optional(),
      })
      .optional(),
    subscription: z
      .object({
        code: z.union([z.string(), z.number()]).optional(),
        subscriber: z.object({ code: z.union([z.string(), z.number()]).optional() }).optional(),
        plan: z.object({ name: z.string().optional() }).optional(),
        date_next_charge: z.union([z.string(), z.number()]).optional(),
      })
      .optional(),
  }),
});

export type HotmartWebhookPayload = z.infer<typeof hotmartWebhookPayloadSchema>;

export interface DeliveryLog {
  step: string;
  event?: string;
  email?: string;
  subscriptionCode?: string;
  plan?: PlanId | null;
  success: boolean;
  detail: string;
  timestamp: string;
}

export function logDelivery(entry: Omit<DeliveryLog, "timestamp">): DeliveryLog {
  const log: DeliveryLog = { ...entry, timestamp: new Date().toISOString() };
  const prefix = log.success ? "[DELIVERY-OK]" : "[DELIVERY-FAIL]";
  console.log(
    `${prefix} ${log.step}${log.event ? ` | event=${log.event}` : ""}${
      log.email ? ` | email=${log.email}` : ""
    }${log.subscriptionCode ? ` | sub=${log.subscriptionCode}` : ""} | ${log.detail}`,
  );
  return log;
}

export function planFromEvent(payload: HotmartWebhookPayload): PlanId | null {
  const offerCode = String(payload.data?.purchase?.offer?.code ?? "");
  if (offerCode && HOTMART_OFFER_TO_PLAN[offerCode]) {
    return HOTMART_OFFER_TO_PLAN[offerCode];
  }

  const planName = String(payload.data?.subscription?.plan?.name ?? "").toLowerCase();
  if (planName.includes("starter") || planName.includes("individual")) return "starter_monthly";
  if (planName.includes("pro") || planName.includes("pró") || planName.includes("familiar")) return "pro_monthly";
  if (planName.includes("premium")) return "premium_monthly";

  const productId = String(payload.data?.product?.id ?? "");
  return HOTMART_PRODUCT_TO_PLAN[productId] ?? null;
}

function toSubscriptionCode(payload: HotmartWebhookPayload): string | null {
  const code =
    payload.data?.subscription?.subscriber?.code ??
    payload.data?.purchase?.transaction ??
    payload.data?.subscription?.code;
  return code != null ? String(code) : null;
}

function toTransaction(payload: HotmartWebhookPayload): string | null {
  const tx = payload.data?.purchase?.transaction;
  return tx != null ? String(tx) : null;
}

function toNextCharge(payload: HotmartWebhookPayload): string | null {
  const raw =
    payload.data?.purchase?.date_next_charge ?? payload.data?.subscription?.date_next_charge;
  if (raw == null) return null;
  if (typeof raw === "number") {
    // Hotmart sometimes sends epoch millis, sometimes seconds. Guard for both.
    const ms = raw > 1_000_000_000_000 ? raw : raw * 1000;
    return new Date(ms).toISOString();
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export async function findUserByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  while (page < 100) {
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      logDelivery({ step: "findUser", email: normalized, success: false, detail: error.message });
      return null;
    }
    const found = list?.users?.find((u) => u.email?.toLowerCase() === normalized);
    if (found) return found.id;
    if ((list?.users?.length ?? 0) < perPage) break;
    page++;
  }
  return null;
}

export async function ensureUser(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalized);
  if (existing) {
    logDelivery({ step: "ensureUser", email: normalized, success: true, detail: "existing user" });
    return existing;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: normalized,
    email_confirm: true,
    user_metadata: { source: "hotmart_webhook" },
  });

  if (error) {
    logDelivery({ step: "ensureUser", email: normalized, success: false, detail: error.message });
    return null;
  }

  logDelivery({ step: "ensureUser", email: normalized, success: true, detail: "created user" });
  return data.user?.id ?? null;
}

export async function upsertActiveSubscription(
  payload: HotmartWebhookPayload,
): Promise<DeliveryLog[]> {
  const logs: DeliveryLog[] = [];
  const email = payload.data?.buyer?.email;
  const subscriptionCode = toSubscriptionCode(payload);
  const transaction = toTransaction(payload);
  const plan = planFromEvent(payload);

  if (!email) {
    logs.push(
      logDelivery({
        step: "validate",
        event: payload.event,
        success: false,
        detail: "missing buyer email",
      }),
    );
    return logs;
  }
  if (!subscriptionCode) {
    logs.push(
      logDelivery({
        step: "validate",
        event: payload.event,
        success: false,
        detail: "missing subscription code",
      }),
    );
    return logs;
  }
  if (!plan) {
    logs.push(
      logDelivery({
        step: "validate",
        event: payload.event,
        success: false,
        detail: "unable to map plan",
      }),
    );
    return logs;
  }

  const userId = await ensureUser(email);
  if (!userId) {
    logs.push(
      logDelivery({
        step: "ensureUser",
        event: payload.event,
        email,
        success: false,
        detail: "failed to create/find user",
      }),
    );
    return logs;
  }

  const periodEnd = toNextCharge(payload);
  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscriptionCode,
      stripe_customer_id: transaction ?? email,
      product_id: String(payload.data?.product?.id ?? ""),
      price_id: plan,
      status: "active",
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      environment: "hotmart",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  if (error) {
    logs.push(
      logDelivery({
        step: "upsertSubscription",
        event: payload.event,
        email,
        subscriptionCode,
        plan,
        success: false,
        detail: error.message,
      }),
    );
    return logs;
  }

  logs.push(
    logDelivery({
      step: "upsertSubscription",
      event: payload.event,
      email,
      subscriptionCode,
      plan,
      success: true,
      detail: periodEnd ? `active until ${periodEnd}` : "active (no expiry)",
    }),
  );
  return logs;
}

export async function markSubscriptionCanceled(
  payload: HotmartWebhookPayload,
  atPeriodEnd: boolean,
): Promise<DeliveryLog[]> {
  const logs: DeliveryLog[] = [];
  const subscriptionCode = toSubscriptionCode(payload);

  if (!subscriptionCode) {
    logs.push(
      logDelivery({
        step: "validate",
        event: payload.event,
        success: false,
        detail: "missing subscription code",
      }),
    );
    return logs;
  }

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: atPeriodEnd ? "active" : "canceled",
      cancel_at_period_end: atPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionCode)
    .eq("environment", "hotmart");

  if (error) {
    logs.push(
      logDelivery({
        step: "cancelSubscription",
        event: payload.event,
        subscriptionCode,
        success: false,
        detail: error.message,
      }),
    );
    return logs;
  }

  logs.push(
    logDelivery({
      step: "cancelSubscription",
      event: payload.event,
      subscriptionCode,
      success: true,
      detail: atPeriodEnd ? "scheduled cancel at period end" : "canceled immediately",
    }),
  );
  return logs;
}
