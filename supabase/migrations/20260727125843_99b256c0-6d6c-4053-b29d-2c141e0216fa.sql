-- Explicit deny for authenticated users on write operations; only service_role can write.
CREATE POLICY "No client inserts on subscriptions"
  ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "No client updates on subscriptions"
  ON public.subscriptions FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "No client deletes on subscriptions"
  ON public.subscriptions FOR DELETE TO authenticated
  USING (false);