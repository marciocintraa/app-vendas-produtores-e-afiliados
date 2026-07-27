import { useSyncExternalStore } from "react";
import { PRODUCTS, type Product } from "./catalog-data";

const STORAGE_KEY = "dsp:catalog:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

let state: Product[] = PRODUCTS;
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
