import { useSyncExternalStore } from "react";
import { PRODUCTS, type Product } from "./catalog-data";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "dsp:catalog:v1";
const CATALOGS_KEY = "dsp:catalogs:v1";
const MIGRATED_KEY = "dsp:migrated-to-cloud:v1";

export const MAX_CATALOGS = 5;
export const DEFAULT_CATALOG_ID = "catalogo-principal";

export type Catalog = {
  id: string;
  name: string;
  createdAt: number;
};

const DEFAULT_CATALOGS: Catalog[] = [
  { id: DEFAULT_CATALOG_ID, name: "Catálogo principal", createdAt: 0 },
];

type Listener = () => void;
const listeners = new Set<Listener>();

let state: Product[] = PRODUCTS;
let catalogsState: Catalog[] = DEFAULT_CATALOGS;
let loadStarted = false;

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: Listener) {
  listeners.add(l);
  ensureLoaded();
  return () => listeners.delete(l);
}

/* ---------------- localStorage (cache local + migração) ---------------- */

function readLocal<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function cacheAll() {
  writeLocal(STORAGE_KEY, state);
  writeLocal(CATALOGS_KEY, catalogsState);
}

/* ---------------- Carregamento do banco ---------------- */

type CatalogRow = { id: string; name: string; created_at: string };
type ProductRow = { id: string; catalog_id: string; data: Product; published: boolean };

function rowToProduct(row: ProductRow): Product {
  return { ...row.data, id: row.id, catalogId: row.catalog_id, published: row.published };
}

function productToRow(p: Product) {
  const { ...data } = p;
  return {
    id: p.id,
    catalog_id: p.catalogId ?? DEFAULT_CATALOG_ID,
    published: p.published !== false,
    data,
    updated_at: new Date().toISOString(),
  };
}

function ensureLoaded() {
  if (loadStarted || typeof window === "undefined") return;
  loadStarted = true;

  // Mostra imediatamente o que já estava salvo no aparelho.
  const localProducts = readLocal<Product[]>(STORAGE_KEY);
  const localCatalogs = readLocal<Catalog[]>(CATALOGS_KEY);
  if (localProducts) state = localProducts;
  if (localCatalogs && localCatalogs.length > 0) catalogsState = localCatalogs;
  emit();

  void loadFromCloud();
}

async function loadFromCloud() {
  try {
    const [catalogsRes, productsRes] = await Promise.all([
      supabase.from("catalogs").select("id, name, created_at").order("created_at"),
      supabase.from("catalog_products").select("id, catalog_id, data, published"),
    ]);

    if (catalogsRes.error || productsRes.error) return;

    const cloudCatalogs = (catalogsRes.data ?? []) as CatalogRow[];
    const cloudProducts = (productsRes.data ?? []) as unknown as ProductRow[];

    const alreadyMigrated =
      typeof window !== "undefined" && window.localStorage.getItem(MIGRATED_KEY) === "1";

    if (cloudProducts.length === 0 && !alreadyMigrated) {
      await migrateLocalToCloud();
      return;
    }

    catalogsState =
      cloudCatalogs.length > 0
        ? cloudCatalogs.map((c) => ({
            id: c.id,
            name: c.name,
            createdAt: new Date(c.created_at).getTime(),
          }))
        : DEFAULT_CATALOGS;
    state = cloudProducts.map(rowToProduct);
    cacheAll();
    emit();
  } catch {
    /* offline: segue com o cache local */
  }
}

/** Envia o conteúdo local (ou o exemplo inicial) para o banco na primeira vez. */
async function migrateLocalToCloud() {
  try {
    const catalogRows = catalogsState.map((c) => ({
      id: c.id,
      name: c.name,
      created_at: new Date(c.createdAt || Date.now()).toISOString(),
    }));
    await supabase.from("catalogs").upsert(catalogRows);
    if (state.length > 0) {
      await supabase.from("catalog_products").upsert(state.map(productToRow));
    }
    if (typeof window !== "undefined") window.localStorage.setItem(MIGRATED_KEY, "1");
    cacheAll();
    emit();
  } catch {
    /* ignore */
  }
}

/* ---------------- Snapshots ---------------- */

function getSnapshot() {
  ensureLoaded();
  return state;
}

function getServerSnapshot() {
  return PRODUCTS;
}

function getCatalogsSnapshot() {
  ensureLoaded();
  return catalogsState;
}

function getServerCatalogsSnapshot(): Catalog[] {
  return DEFAULT_CATALOGS;
}

export function useProducts() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useCatalogs() {
  return useSyncExternalStore(subscribe, getCatalogsSnapshot, getServerCatalogsSnapshot);
}

export function useProduct(id: string): Product | undefined {
  const products = useProducts();
  return products.find((p) => p.id === id);
}

export function getAllProducts(): Product[] {
  ensureLoaded();
  return state;
}

export function getAllCatalogs(): Catalog[] {
  ensureLoaded();
  return catalogsState;
}

/* ---------------- Escritas (otimistas + banco) ---------------- */

export function saveProduct(product: Product) {
  ensureLoaded();
  const idx = state.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    const next = state.slice();
    next[idx] = product;
    state = next;
  } else {
    state = [product, ...state];
  }
  cacheAll();
  emit();
  void supabase.from("catalog_products").upsert(productToRow(product));
}

export function deleteProduct(id: string) {
  ensureLoaded();
  state = state.filter((p) => p.id !== id);
  cacheAll();
  emit();
  void supabase.from("catalog_products").delete().eq("id", id);
}

export function saveCatalog(catalog: Catalog) {
  ensureLoaded();
  const idx = catalogsState.findIndex((c) => c.id === catalog.id);
  if (idx >= 0) {
    const next = catalogsState.slice();
    next[idx] = catalog;
    catalogsState = next;
  } else {
    catalogsState = [...catalogsState, catalog];
  }
  cacheAll();
  emit();
  void supabase.from("catalogs").upsert({
    id: catalog.id,
    name: catalog.name,
    created_at: new Date(catalog.createdAt || Date.now()).toISOString(),
  });
}

export function deleteCatalog(id: string) {
  ensureLoaded();
  const remaining = catalogsState.filter((c) => c.id !== id);
  if (remaining.length === 0) {
    remaining.push({ id: DEFAULT_CATALOG_ID, name: "Catálogo principal", createdAt: Date.now() });
  }
  catalogsState = remaining;
  const fallbackId = remaining[0].id;
  const moved: Product[] = [];
  state = state.map((p) => {
    if ((p.catalogId ?? DEFAULT_CATALOG_ID) !== id) return p;
    const next = { ...p, catalogId: fallbackId };
    moved.push(next);
    return next;
  });
  cacheAll();
  emit();

  void (async () => {
    if (moved.length > 0) {
      await supabase.from("catalog_products").upsert(moved.map(productToRow));
    }
    await supabase.from("catalogs").delete().eq("id", id);
  })();
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function makeCoverPlaceholder(title: string): string {
  const label = title || "Novo produto";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='#7c3aed'/><stop offset='1' stop-color='#22d3ee'/></linearGradient></defs><rect width='600' height='400' fill='url(%23g)'/><text x='50%' y='52%' font-family='Inter,sans-serif' font-size='30' font-weight='700' fill='white' text-anchor='middle'>${label.replace(/[<>&]/g, "")}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
