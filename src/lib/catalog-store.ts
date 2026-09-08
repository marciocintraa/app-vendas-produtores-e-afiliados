import { useSyncExternalStore } from "react";
import { PRODUCTS, type Product } from "./catalog-data";

const STORAGE_KEY = "dsp:catalog:v1";
const CATALOGS_KEY = "dsp:catalogs:v1";

export type Catalog = {
  id: string;
  name: string;
  slug: string;
};

export const DEFAULT_CATALOG: Catalog = {
  id: "principal",
  name: "Catálogo Principal",
  slug: "principal",
};

type Listener = () => void;
const listeners = new Set<Listener>();

let state: Product[] = PRODUCTS;
let catalogs: Catalog[] = [DEFAULT_CATALOG];
let hydrated = false;

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

function loadCatalogsFromStorage(): Catalog[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CATALOGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Catalog[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.localStorage.setItem(CATALOGS_KEY, JSON.stringify(catalogs));
  } catch {
    /* ignore */
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const loadedCatalogs = loadCatalogsFromStorage();
  if (loadedCatalogs) catalogs = loadedCatalogs;
  const loaded = loadFromStorage();
  if (loaded) state = loaded;
  else persist();
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

export function useProducts() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useProduct(id: string): Product | undefined {
  const products = useProducts();
  return products.find((p) => p.id === id);
}

export function getAllProducts(): Product[] {
  ensureHydrated();
  return state;
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

// ===================== Catálogos =====================

export function useCatalogs(): Catalog[] {
  return useSyncExternalStore(subscribe, getCatalogsSnapshot, getCatalogsServerSnapshot);
}

function getCatalogsSnapshot(): Catalog[] {
  ensureHydrated();
  return catalogs;
}

function getCatalogsServerSnapshot(): Catalog[] {
  return [DEFAULT_CATALOG];
}

export function getAllCatalogs(): Catalog[] {
  ensureHydrated();
  return catalogs;
}

export function saveCatalog(catalog: Catalog) {
  ensureHydrated();
  const idx = catalogs.findIndex((c) => c.id === catalog.id);
  if (idx >= 0) {
    const next = catalogs.slice();
    next[idx] = catalog;
    catalogs = next;
  } else {
    catalogs = [...catalogs, catalog];
  }
  persist();
  emit();
}

/** Remove o catálogo e move os produtos dele para o Catálogo Principal. */
export function deleteCatalog(id: string) {
  ensureHydrated();
  if (id === DEFAULT_CATALOG.id) return;
  catalogs = catalogs.filter((c) => c.id !== id);
  state = state.map((p) => (p.catalogId === id ? { ...p, catalogId: DEFAULT_CATALOG.id } : p));
  persist();
  emit();
}

export function getCatalogBySlug(slug: string): Catalog | undefined {
  ensureHydrated();
  return catalogs.find((c) => c.slug === slug);
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
