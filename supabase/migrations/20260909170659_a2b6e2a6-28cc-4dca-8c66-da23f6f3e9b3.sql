ALTER TABLE public.catalogs ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.catalog_products ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS catalog_products_user_id_idx ON public.catalog_products(user_id);
CREATE INDEX IF NOT EXISTS catalog_products_catalog_id_idx ON public.catalog_products(catalog_id);
CREATE INDEX IF NOT EXISTS catalogs_user_id_idx ON public.catalogs(user_id);

DROP POLICY IF EXISTS "Authenticated can insert catalogs" ON public.catalogs;
DROP POLICY IF EXISTS "Authenticated can update catalogs" ON public.catalogs;
DROP POLICY IF EXISTS "Authenticated can delete catalogs" ON public.catalogs;
CREATE POLICY "Owner can insert catalogs" ON public.catalogs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Owner can update catalogs" ON public.catalogs FOR UPDATE TO authenticated USING (user_id = auth.uid() OR user_id IS NULL) WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Owner can delete catalogs" ON public.catalogs FOR DELETE TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Authenticated can insert catalog products" ON public.catalog_products;
DROP POLICY IF EXISTS "Authenticated can update catalog products" ON public.catalog_products;
DROP POLICY IF EXISTS "Authenticated can delete catalog products" ON public.catalog_products;
CREATE POLICY "Owner can insert catalog products" ON public.catalog_products FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Owner can update catalog products" ON public.catalog_products FOR UPDATE TO authenticated USING (user_id = auth.uid() OR user_id IS NULL) WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Owner can delete catalog products" ON public.catalog_products FOR DELETE TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalogs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_products TO authenticated;
GRANT SELECT ON public.catalogs TO anon;
GRANT SELECT ON public.catalog_products TO anon;
GRANT ALL ON public.catalogs TO service_role;
GRANT ALL ON public.catalog_products TO service_role;