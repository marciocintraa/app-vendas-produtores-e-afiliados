import { useSyncExternalStore } from "react";

export type ContentItem = {
  id: string;
  title: string;
  type: "post" | "story" | "video" | "email" | "pdf";
  body: string;
  link: string;
  createdAt: number;
};

export type Notice = {
  id: string;
  title: string;
  message: string;
  audience: "todos" | "clientes" | "leads";
  sendAt: string; // YYYY-MM-DD
  sent: boolean;
  createdAt: number;
};

export type TrackedLink = {
  id: string;
  label: string;
  url: string;
  source: string;
  clicks: number;
  createdAt: number;
};

export type Brand = {
  storeName: string;
  tagline: string;
  logoUrl: string;
  whatsapp: string;
  instagram: string;
  accent: string;
  footerNote: string;
};

const KEYS = {
  content: "vfp:content:v1",
  notices: "vfp:notices:v1",
  links: "vfp:links:v1",
  brand: "vfp:brand:v1",
};

export const DEFAULT_BRAND: Brand = {
  storeName: "Meu Catálogo",
  tagline: "Os melhores produtos digitais selecionados para você",
  logoUrl: "",
  whatsapp: "",
  instagram: "",
  accent: "#7c5cff",
  footerNote: "",
};

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, value: T[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
  emit();
}

let cache: Record<string, unknown> = {};

function getList<T>(key: string): T[] {
  if (!(key in cache)) cache[key] = readList<T>(key);
  return cache[key] as T[];
}

function setList<T>(key: string, value: T[]) {
  cache[key] = value;
  writeList(key, value);
}

export const newId = () => Math.random().toString(36).slice(2, 10);

const emptyList: never[] = [];

function useList<T>(key: string): T[] {
  return useSyncExternalStore(
    subscribe,
    () => getList<T>(key),
    () => emptyList as unknown as T[],
  );
}

/* ---------- Biblioteca de conteúdo ---------- */
export const useContentItems = () => useList<ContentItem>(KEYS.content);
export function saveContentItem(item: ContentItem) {
  const all = getList<ContentItem>(KEYS.content);
  const i = all.findIndex((x) => x.id === item.id);
  setList(KEYS.content, i >= 0 ? all.map((x) => (x.id === item.id ? item : x)) : [item, ...all]);
}
export function deleteContentItem(id: string) {
  setList(
    KEYS.content,
    getList<ContentItem>(KEYS.content).filter((x) => x.id !== id),
  );
}

/* ---------- Avisos / notificações ---------- */
export const useNotices = () => useList<Notice>(KEYS.notices);
export function saveNotice(item: Notice) {
  const all = getList<Notice>(KEYS.notices);
  const i = all.findIndex((x) => x.id === item.id);
  setList(KEYS.notices, i >= 0 ? all.map((x) => (x.id === item.id ? item : x)) : [item, ...all]);
}
export function deleteNotice(id: string) {
  setList(
    KEYS.notices,
    getList<Notice>(KEYS.notices).filter((x) => x.id !== id),
  );
}

/* ---------- Links rastreados ---------- */
export const useTrackedLinks = () => useList<TrackedLink>(KEYS.links);
export function saveTrackedLink(item: TrackedLink) {
  const all = getList<TrackedLink>(KEYS.links);
  const i = all.findIndex((x) => x.id === item.id);
  setList(KEYS.links, i >= 0 ? all.map((x) => (x.id === item.id ? item : x)) : [item, ...all]);
}
export function deleteTrackedLink(id: string) {
  setList(
    KEYS.links,
    getList<TrackedLink>(KEYS.links).filter((x) => x.id !== id),
  );
}

/* ---------- Marca (white label) ---------- */
export function useBrand(): Brand {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!(KEYS.brand in cache)) {
        let stored: Partial<Brand> = {};
        try {
          const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEYS.brand) : null;
          if (raw) stored = JSON.parse(raw) as Partial<Brand>;
        } catch {
          stored = {};
        }
        cache[KEYS.brand] = { ...DEFAULT_BRAND, ...stored };
      }
      return cache[KEYS.brand] as Brand;
    },
    () => DEFAULT_BRAND,
  );
}

export function saveBrand(brand: Brand) {
  cache[KEYS.brand] = brand;
  if (typeof window !== "undefined") window.localStorage.setItem(KEYS.brand, JSON.stringify(brand));
  emit();
}

export function resetExtras() {
  cache = {};
  emit();
}
