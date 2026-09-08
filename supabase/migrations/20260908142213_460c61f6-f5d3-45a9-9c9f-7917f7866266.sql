CREATE TABLE public.catalogs (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.catalog_products (
  id text PRIMARY KEY,
  catalog_id text NOT NULL,
  data jsonb NOT NULL,
  published boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.catalogs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalogs TO authenticated;
GRANT ALL ON public.catalogs TO service_role;

GRANT SELECT ON public.catalog_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_products TO authenticated;
GRANT ALL ON public.catalog_products TO service_role;

ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view catalogs" ON public.catalogs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated can insert catalogs" ON public.catalogs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update catalogs" ON public.catalogs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete catalogs" ON public.catalogs FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public can view catalog products" ON public.catalog_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated can insert catalog products" ON public.catalog_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update catalog products" ON public.catalog_products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete catalog products" ON public.catalog_products FOR DELETE TO authenticated USING (true);

INSERT INTO public.catalogs (id, name, created_at) VALUES ('catalogo-principal', 'Catálogo principal', now());