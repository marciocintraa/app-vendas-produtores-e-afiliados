-- Restaura a persistência dos catálogos sem alterar rotas, domínio ou páginas de venda.
create table if not exists public.catalogs (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_products (
  id text primary key,
  catalog_id text not null references public.catalogs(id) on delete cascade,
  data jsonb not null,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists catalog_products_catalog_id_idx
  on public.catalog_products(catalog_id);

grant select on public.catalogs to anon, authenticated;
grant insert, update, delete on public.catalogs to authenticated;
grant select on public.catalog_products to anon, authenticated;
grant insert, update, delete on public.catalog_products to authenticated;

alter table public.catalogs enable row level security;
alter table public.catalog_products enable row level security;

do $$ begin
  create policy "catalogs_public_read" on public.catalogs for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "catalogs_authenticated_insert" on public.catalogs for insert to authenticated with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "catalogs_authenticated_update" on public.catalogs for update to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "catalogs_authenticated_delete" on public.catalogs for delete to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "catalog_products_public_read" on public.catalog_products for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "catalog_products_authenticated_insert" on public.catalog_products for insert to authenticated with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "catalog_products_authenticated_update" on public.catalog_products for update to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "catalog_products_authenticated_delete" on public.catalog_products for delete to authenticated using (true);
exception when duplicate_object then null; end $$;

insert into public.catalogs (id, name, slug)
values ('principal', 'Catálogo Principal', 'principal')
on conflict (id) do nothing;
