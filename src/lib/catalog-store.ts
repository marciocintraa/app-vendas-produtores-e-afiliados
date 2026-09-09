import { useSyncExternalStore } from "react";
import { PRODUCTS, type Product } from "./catalog-data";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "dsp:catalog:v1";
const CATALOGS_KEY = "dsp:catalogs:v1";
const MIGRATED_KEY = "dsp:catalogs-cloud-migrated:v1";

export const MAX_CATALOGS = 5;
export const DEFAULT_CATALOG_ID = "principal";

export type Catalog = { id: string; name: string; slug: string };
export const DEFAULT_CATALOG: Catalog = { id: DEFAULT_CATALOG_ID, name: "Catálogo Principal", slug: "principal" };

type Listener = () => void;
const listeners = new Set<Listener>();
let state: Product[] = PRODUCTS;
let catalogs: Catalog[] = [DEFAULT_CATALOG];
let hydrated = false;
let cloudLoadStarted = false;

function emit() { for (const l of listeners) l(); }
function subscribe(l: Listener) { listeners.add(l); ensureHydrated(); return () => listeners.delete(l); }
function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try { const raw = window.localStorage.getItem(key); if (!raw) return null; return JSON.parse(raw) as T; } catch { return null; }
}
function persist() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); window.localStorage.setItem(CATALOGS_KEY, JSON.stringify(catalogs)); } catch { /* ignore */ }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const loadedCatalogs = read<Catalog[]>(CATALOGS_KEY);
  const loadedProducts = read<Product[]>(STORAGE_KEY);
  if (loadedCatalogs?.length) catalogs = loadedCatalogs;
  if (Array.isArray(loadedProducts)) state = loadedProducts;
  else persist();
  void loadCloud();
}

type CatalogRow = { id: string; name: string; slug: string; created_at?: string };
type ProductRow = { id: string; catalog_id: string; data: Product; published?: boolean };

async function loadCloud() {
  if (cloudLoadStarted) return;
  cloudLoadStarted = true;
  try {
    const [c, p] = await Promise.all([
      supabase.from("catalogs").select("id,name,slug,created_at").order("created_at"),
      supabase.from("catalog_products").select("id,catalog_id,data,published"),
    ]);
    if (c.error || p.error) return;
    const cloudCatalogs = (c.data ?? []) as CatalogRow[];
    const cloudProducts = (p.data ?? []) as ProductRow[];
    const migrated = typeof window !== "undefined" && window.localStorage.getItem(MIGRATED_KEY) === "1";
    if (!cloudCatalogs.length && !cloudProducts.length && !migrated) {
      const { data: auth } = await supabase.auth.getSession();
      if (auth.session) {
        await supabase.from("catalogs").upsert(catalogs.map((x) => ({ id: x.id, name: x.name, slug: x.slug })));
        if (state.length) await supabase.from("catalog_products").upsert(state.map(toRow));
        window.localStorage.setItem(MIGRATED_KEY, "1");
      }
      return;
    }
    if (cloudCatalogs.length) catalogs = cloudCatalogs.map((x) => ({ id: x.id, name: x.name, slug: x.slug }));
    if (cloudProducts.length) state = cloudProducts.map((x) => ({ ...x.data, id: x.id, catalogId: x.catalog_id, published: x.published ?? x.data.published }));
    persist(); emit();
  } catch { /* mantém cache local */ }
}

function toRow(p: Product) {
  const { catalogId, ...data } = p;
  return { id: p.id, catalog_id: catalogId ?? DEFAULT_CATALOG_ID, data, published: p.published !== false, updated_at: new Date().toISOString() };
}

function getSnapshot() { ensureHydrated(); return state; }
function getServerSnapshot() { return PRODUCTS; }
function getCatalogsSnapshot() { ensureHydrated(); return catalogs; }
function getCatalogsServerSnapshot() { return [DEFAULT_CATALOG]; }

export function useProducts() { return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot); }
export function useProduct(id: string): Product | undefined { return useProducts().find((p) => p.id === id); }
export function getAllProducts() { ensureHydrated(); return state; }
export function useCatalogs() { return useSyncExternalStore(subscribe, getCatalogsSnapshot, getCatalogsServerSnapshot); }
export function getAllCatalogs() { ensureHydrated(); return catalogs; }

export function saveProduct(product: Product) {
  ensureHydrated();
  const i = state.findIndex((p) => p.id === product.id);
  state = i >= 0 ? state.map((p, n) => n === i ? product : p) : [product, ...state];
  persist(); emit();
  void supabase.from("catalog_products").upsert(toRow(product));
}
export function deleteProduct(id: string) {
  ensureHydrated(); state = state.filter((p) => p.id !== id); persist(); emit();
  void supabase.from("catalog_products").delete().eq("id", id);
}

export function saveCatalog(catalog: Catalog) {
  ensureHydrated();
  const i = catalogs.findIndex((c) => c.id === catalog.id);
  catalogs = i >= 0 ? catalogs.map((c, n) => n === i ? catalog : c) : [...catalogs, catalog];
  persist(); emit();
  void supabase.from("catalogs").upsert({ id: catalog.id, name: catalog.name, slug: catalog.slug });
}
export function deleteCatalog(id: string) {
  ensureHydrated();
  if (id === DEFAULT_CATALOG_ID) return;
  catalogs = catalogs.filter((c) => c.id !== id);
  state = state.map((p) => p.catalogId === id ? { ...p, catalogId: DEFAULT_CATALOG_ID } : p);
  persist(); emit();
  void (async () => { await supabase.from("catalog_products").upsert(state.filter((p) => p.catalogId === DEFAULT_CATALOG_ID).map(toRow)); await supabase.from("catalogs").delete().eq("id", id); })();
}
export function getCatalogBySlug(slug: string) { ensureHydrated(); return catalogs.find((c) => c.slug === slug); }
export function slugify(input: string) { return input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60); }
export function makeCoverPlaceholder(title: string) {
  const label = (title || "Novo produto").replace(/[<>&]/g, "");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='#7c3aed'/><stop offset='1' stop-color='#22d3ee'/></linearGradient></defs><rect width='600' height='400' fill='url(%23g)'/><text x='50%' y='52%' font-family='Inter,sans-serif' font-size='30' font-weight='700' fill='white' text-anchor='middle'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
