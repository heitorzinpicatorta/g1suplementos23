import React, { createContext, useContext, useState, useCallback } from "react";
import { PRODUCTS as INITIAL_PRODUCTS } from "@/data/products";

export type Badge = "MAIS VENDIDO" | "OFERTA" | "ESGOTADO" | null;

export interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  image: string;
  priceFrom: number;
  priceTo: number;
  discount: number;
  installments: { count: number; value: number };
  categories: string[];
  inStock: boolean;
  description: string;
  badge: Badge;
}

export interface StoreSettings {
  whatsapp: string;
  bannerText: string;
  heroBannerImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
}

interface StoreData {
  products: Product[];
  categories: string[];
  settings: StoreSettings;
}

interface StoreContextType {
  products: Product[];
  categories: string[];
  settings: StoreSettings;
  updateProduct: (id: number, changes: Partial<Product>) => void;
  addProduct: (product: Omit<Product, "id" | "discount">) => void;
  deleteProduct: (id: number) => void;
  moveProduct: (id: number, direction: "up" | "down") => void;
  moveProductInCategory: (id: number, direction: "up" | "down") => void;
  addCategory: (name: string) => void;
  renameCategory: (oldName: string, newName: string) => void;
  deleteCategory: (name: string) => void;
  moveCategory: (name: string, direction: "up" | "down") => void;
  updateSettings: (changes: Partial<StoreSettings>) => void;
  resetToDefaults: () => void;
}

const STORE_KEY = "g1-store-data";
const initialCategories = ["Adaptógenos", "Vitaminas", "Minerais", "Ácidos Graxos"];
const defaultSettings: StoreSettings = {
  whatsapp: "(11) 94029-5683",
  bannerText: "FRETE GRÁTIS ACIMA DE R$ 199,00 · PARCELE EM ATÉ 6x SEM JUROS",
  heroBannerImage: "",
  heroTitle: "SUPLEMENTOS\nDE ELITE",
  heroSubtitle: "Produtos selecionados para quem leva performance a sério.\nQualidade certificada, preços diretos.",
};

function calcDiscount(from: number, to: number): number {
  if (from <= 0) return 0;
  return Math.max(0, Math.round(((from - to) / from) * 100));
}

function save(data: StoreData) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

function migrateProduct(p: any): Product {
  const categories: string[] = Array.isArray(p.categories)
    ? p.categories
    : p.category
      ? [p.category]
      : [];
  return { ...p, categories };
}

function getInitialData(): StoreData {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as any;
      return {
        ...parsed,
        settings: { ...defaultSettings, ...(parsed.settings || {}) },
        products: (parsed.products as any[]).map(migrateProduct),
      };
    }
  } catch { /* ignore */ }
  return {
    products: (INITIAL_PRODUCTS as any[]).map(migrateProduct),
    categories: initialCategories,
    settings: defaultSettings,
  };
}

let nextId = Math.max(...(getInitialData().products.map((p) => p.id)), 0) + 1;

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<StoreData>(getInitialData);

  const mutate = useCallback((fn: (prev: StoreData) => StoreData) => {
    setData((prev) => {
      const next = fn(prev);
      save(next);
      return next;
    });
  }, []);

  const updateProduct = useCallback((id: number, changes: Partial<Product>) => {
    mutate((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...changes };
        if (changes.priceFrom !== undefined || changes.priceTo !== undefined) {
          updated.discount = calcDiscount(updated.priceFrom, updated.priceTo);
        }
        return updated;
      }),
    }));
  }, [mutate]);

  const addProduct = useCallback((product: Omit<Product, "id" | "discount">) => {
    const id = nextId++;
    const discount = calcDiscount(product.priceFrom, product.priceTo);
    mutate((prev) => ({ ...prev, products: [...prev.products, { ...product, id, discount }] }));
  }, [mutate]);

  const deleteProduct = useCallback((id: number) => {
    mutate((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id) }));
  }, [mutate]);

  const moveProduct = useCallback((id: number, direction: "up" | "down") => {
    mutate((prev) => {
      const products = [...prev.products];
      const idx = products.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= products.length) return prev;
      [products[idx], products[targetIdx]] = [products[targetIdx], products[idx]];
      return { ...prev, products };
    });
  }, [mutate]);

  const moveProductInCategory = useCallback((id: number, direction: "up" | "down") => {
    mutate((prev) => {
      const products = [...prev.products];
      const idx = products.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const primaryCat = products[idx].categories[0];
      if (!primaryCat) return prev;
      const catIndices = products.reduce<number[]>((acc, p, i) => (p.categories.includes(primaryCat) ? [...acc, i] : acc), []);
      const posInCat = catIndices.indexOf(idx);
      const targetPosInCat = direction === "up" ? posInCat - 1 : posInCat + 1;
      if (targetPosInCat < 0 || targetPosInCat >= catIndices.length) return prev;
      const targetIdx = catIndices[targetPosInCat];
      [products[idx], products[targetIdx]] = [products[targetIdx], products[idx]];
      return { ...prev, products };
    });
  }, [mutate]);

  const addCategory = useCallback((name: string) => {
    mutate((prev) => prev.categories.includes(name) ? prev : { ...prev, categories: [...prev.categories, name] });
  }, [mutate]);

  const renameCategory = useCallback((oldName: string, newName: string) => {
    mutate((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c === oldName ? newName : c)),
      products: prev.products.map((p) => ({
        ...p,
        categories: p.categories.map((c) => (c === oldName ? newName : c)),
      })),
    }));
  }, [mutate]);

  const deleteCategory = useCallback((name: string) => {
    mutate((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== name),
      products: prev.products.map((p) => ({
        ...p,
        categories: p.categories.filter((c) => c !== name),
      })),
    }));
  }, [mutate]);

  const moveCategory = useCallback((name: string, direction: "up" | "down") => {
    mutate((prev) => {
      const cats = [...prev.categories];
      const idx = cats.indexOf(name);
      if (idx === -1) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= cats.length) return prev;
      [cats[idx], cats[swapIdx]] = [cats[swapIdx], cats[idx]];
      return { ...prev, categories: cats };
    });
  }, [mutate]);

  const updateSettings = useCallback((changes: Partial<StoreSettings>) => {
    mutate((prev) => ({ ...prev, settings: { ...prev.settings, ...changes } }));
  }, [mutate]);

  const resetToDefaults = useCallback(() => {
    const fresh: StoreData = {
      products: (INITIAL_PRODUCTS as any[]).map(migrateProduct),
      categories: initialCategories,
      settings: defaultSettings,
    };
    save(fresh);
    setData(fresh);
  }, []);

  return (
    <StoreContext.Provider value={{ products: data.products, categories: data.categories, settings: data.settings, updateProduct, addProduct, deleteProduct, moveProduct, moveProductInCategory, addCategory, renameCategory, deleteCategory, moveCategory, updateSettings, resetToDefaults }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
