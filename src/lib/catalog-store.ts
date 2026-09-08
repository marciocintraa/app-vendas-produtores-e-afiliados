import { useSyncExternalStore } from "react";
import { PRODUCTS, type Product } from "./catalog-data";

const STORAGE_KEY = "dsp:catalog:v1";
const CATALOGS_KEY = "dsp:catalogs:v1";

export const MAX_CATALOGS = 5;
export const DEFAULT_CATALOG_ID = "catalogo-principal";

export type Catalog = {
  id: string;
  name: string;
  createdAt: number;
};

type Listener = () => void;
const listeners = new Set<Listener>();

let state: Product[] = PRODUCTS;
let hydrated = false;

let catalogsState: Catalog[] = [
  { id: DEFAULT_CATALOG_ID, name: "Catálogo principal", createdAt: 0 },
];
let catalogsHydrated = false;

function loadFromStorage(): Product[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Product[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const loaded = loadFromStorage();
  if (loaded) state = loaded;
  else persist();
}

function loadCatalogsFromStorage(): Catalog[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CATALOGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Catalog[];
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((c) => c && typeof c.id === "string" && typeof c.name === "string");
  } catch {
    return null;
  }
}

function persistCatalogs() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CATALOGS_KEY, JSON.stringify(catalogsState));
  } catch {
    /* ignore */
  }
}

function ensureCatalogsHydrated() {
  if (catalogsHydrated || typeof window === "undefined") return;
  catalogsHydrated = true;
  const loaded = loadCatalogsFromStorage();
  if (loaded && loaded.length > 0) {
    catalogsState = loaded;
  } else {
    persistCatalogs();
  }
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  ensureHydrated();
  return state;
}

function getServerSnapshot() {
  return PRODUCTS;
}

function getCatalogsSnapshot() {
  ensureCatalogsHydrated();
  return catalogsState;
}

function getServerCatalogsSnapshot(): Catalog[] {
  return [{ id: DEFAULT_CATALOG_ID, name: "Catálogo principal", createdAt: 0 }];
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
  ensureHydrated();
  return state;
}

export function getAllCatalogs(): Catalog[] {
  ensureCatalogsHydrated();
  return catalogsState;
}

export function saveProduct(product: Product) {
  ensureHydrated();
  const idx = state.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    const next = state.slice();
    next[idx] = product;
    state = next;
  } else {
    state = [product, ...state];
  }
  persist();
  emit();
}

export function deleteProduct(id: string) {
  ensureHydrated();
  state = state.filter((p) => p.id !== id);
  persist();
  emit();
}

export function saveCatalog(catalog: Catalog) {
  ensureCatalogsHydrated();
  const idx = catalogsState.findIndex((c) => c.id === catalog.id);
  if (idx >= 0) {
    const next = catalogsState.slice();
    next[idx] = catalog;
    catalogsState = next;
  } else {
    catalogsState = [...catalogsState, catalog];
  }
  persistCatalogs();
  emit();
}

export function deleteCatalog(id: string) {
  ensureCatalogsHydrated();
  ensureHydrated();
  const remaining = catalogsState.filter((c) => c.id !== id);
  if (remaining.length === 0) {
    remaining.push({ id: DEFAULT_CATALOG_ID, name: "Catálogo principal", createdAt: Date.now() });
  }
  catalogsState = remaining;
  // Produtos do catálogo removido voltam para o primeiro catálogo restante.
  const fallbackId = remaining[0].id;
  state = state.map((p) =>
    (p.catalogId ?? DEFAULT_CATALOG_ID) === id ? { ...p, catalogId: fallbackId } : p,
  );
  persistCatalogs();
  persist();
  emit();
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function makeCoverPlaceholder(title: string): string {
  const label = title || "Novo produto";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='#7c3aed'/><stop offset='1' stop-color='#22d3ee'/></linearGradient></defs><rect width='600' height='400' fill='url(%23g)'/><text x='50%' y='52%' font-family='Inter,sans-serif' font-size='30' font-weight='700' fill='white' text-anchor='middle'>${label.replace(/[<>&]/g, "")}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
