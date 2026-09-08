import { useSyncExternalStore } from "react";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  note: string;
  createdAt: number;
};

export type Sale = {
  id: string;
  customerName: string;
  productTitle: string;
  amount: number;
  commission: number;
  status: "pago" | "pendente" | "reembolsado";
  date: string; // YYYY-MM-DD
  createdAt: number;
};

const CUSTOMERS_KEY = "vfp:customers:v1";
const SALES_KEY = "vfp:sales:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

let customers: Customer[] = [];
let sales: Sale[] = [];
let loaded = false;

function emit() {
  for (const l of listeners) l();
}

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  customers = read<Customer>(CUSTOMERS_KEY);
  sales = read<Sale>(SALES_KEY);
  emit();
}

function subscribe(l: Listener) {
  listeners.add(l);
  ensureLoaded();
  return () => listeners.delete(l);
}

export function useCustomers(): Customer[] {
  return useSyncExternalStore(
    subscribe,
    () => customers,
    () => customers,
  );
}

export function useSales(): Sale[] {
  return useSyncExternalStore(
    subscribe,
    () => sales,
    () => sales,
  );
}

export function saveCustomer(customer: Customer) {
  ensureLoaded();
  const idx = customers.findIndex((c) => c.id === customer.id);
  customers = idx >= 0 ? customers.map((c) => (c.id === customer.id ? customer : c)) : [customer, ...customers];
  write(CUSTOMERS_KEY, customers);
  emit();
}

export function deleteCustomer(id: string) {
  ensureLoaded();
  customers = customers.filter((c) => c.id !== id);
  write(CUSTOMERS_KEY, customers);
  emit();
}

export function saveSale(sale: Sale) {
  ensureLoaded();
  const idx = sales.findIndex((s) => s.id === sale.id);
  sales = idx >= 0 ? sales.map((s) => (s.id === sale.id ? sale : s)) : [sale, ...sales];
  write(SALES_KEY, sales);
  emit();
}

export function deleteSale(id: string) {
  ensureLoaded();
  sales = sales.filter((s) => s.id !== id);
  write(SALES_KEY, sales);
  emit();
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
