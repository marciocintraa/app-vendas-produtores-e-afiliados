UPDATE public.catalogs SET user_id = '42965802-7363-4503-9794-1603338b14e2' WHERE user_id IS NULL;
DELETE FROM public.catalog_products WHERE user_id IS NULL;

ALTER TABLE public.catalogs ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.catalogs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.catalog_products ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.catalog_products ALTER COLUMN user_id SET NOT NULL;

DROP POLICY IF EXISTS "Owner can insert catalogs" ON public.catalogs;
DROP POLICY IF EXISTS "Owner can update catalogs" ON public.catalogs;
DROP POLICY IF EXISTS "Owner can delete catalogs" ON public.catalogs;
CREATE POLICY "Owner can insert catalogs" ON public.catalogs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can update catalogs" ON public.catalogs FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can delete catalogs" ON public.catalogs FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owner can insert catalog products" ON public.catalog_products;
DROP POLICY IF EXISTS "Owner can update catalog products" ON public.catalog_products;
DROP POLICY IF EXISTS "Owner can delete catalog products" ON public.catalog_products;
DROP POLICY IF EXISTS "Public can view catalog products" ON public.catalog_products;
CREATE POLICY "Owner can insert catalog products" ON public.catalog_products FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can update catalog products" ON public.catalog_products FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can delete catalog products" ON public.catalog_products FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Public can view published catalog products" ON public.catalog_products FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Owner can view own catalog products" ON public.catalog_products FOR SELECT TO authenticated USING (user_id = auth.uid());