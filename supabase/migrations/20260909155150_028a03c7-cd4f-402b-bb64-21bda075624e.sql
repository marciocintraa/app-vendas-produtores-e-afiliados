ALTER TABLE public.catalogs ADD COLUMN IF NOT EXISTS slug TEXT;
UPDATE public.catalogs SET slug = id::text WHERE slug IS NULL;