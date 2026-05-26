import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type OrderStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface OrderItem {
  id: number;
  name: string;
  qty: number;
  priceTo: number;
  image?: string | null;
}

export interface OrderAddress {
  zip: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Order {
  id: string;
  date: string;
  email: string;
  nome?: string;
  cpf?: string;
  address?: OrderAddress;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  preferenceId?: string | null;
  paymentId?: string | null;
}

interface OrdersContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "date">) => string;
  updateOrderStatus: (preferenceId: string, status: OrderStatus) => void;
  updateOrderStatusById: (id: string, status: OrderStatus) => void;
  updatePaymentId: (preferenceId: string, paymentId: string) => void;
  clearOrders: () => void;
}

const ORDERS_KEY = "g1-orders-v1";

function load(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function persist(orders: Order[]) {
  try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch { /* ignore */ }
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(load);

  // Sync across browser tabs — Admin sees orders created in the store tab in real time
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ORDERS_KEY && e.newValue) {
        try {
          setOrders(JSON.parse(e.newValue) as Order[]);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const mutate = useCallback((fn: (prev: Order[]) => Order[]) => {
    setOrders((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, []);

  const addOrder = useCallback((order: Omit<Order, "id" | "date">): string => {
    const id = `G1-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const date = new Date().toISOString();
    const newOrder: Order = { ...order, id, date };
    mutate((prev) => [newOrder, ...prev]);
    return id;
  }, [mutate]);

  const updateOrderStatus = useCallback((preferenceId: string, status: OrderStatus) => {
    mutate((prev) =>
      prev.map((o) => (o.preferenceId === preferenceId ? { ...o, status } : o))
    );
  }, [mutate]);

  const updateOrderStatusById = useCallback((id: string, status: OrderStatus) => {
    mutate((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, [mutate]);

  const updatePaymentId = useCallback((preferenceId: string, paymentId: string) => {
    mutate((prev) =>
      prev.map((o) => (o.preferenceId === preferenceId ? { ...o, paymentId } : o))
    );
  }, [mutate]);

  const clearOrders = useCallback(() => {
    mutate(() => []);
  }, [mutate]);

  return (
    <OrdersContext.Provider value={{ orders, addOrder, updateOrderStatus, updateOrderStatusById, updatePaymentId, clearOrders }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
