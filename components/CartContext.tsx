"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CartItem = {
  id: string;
  produto_id: string;
  nome: string;
  preco: number;
  tamanho: string;
  quantidade: number;
  imagem_url: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantidade: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartTotal: number;
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedCart = localStorage.getItem("garagenatal_cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Erro ao carregar carrinho", e);
      }
    }
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("garagenatal_cart", JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addToCart = (newItem: Omit<CartItem, "id">) => {
    setItems((prev) => {
      // Check if same product + size already exists
      const existingItem = prev.find(
        (i) => i.produto_id === newItem.produto_id && i.tamanho === newItem.tamanho
      );
      if (existingItem) {
        return prev.map((i) =>
          i.id === existingItem.id ? { ...i, quantidade: i.quantidade + newItem.quantidade } : i
        );
      }
      return [...prev, { ...newItem, id: Math.random().toString(36).substring(7) }];
    });
    setIsCartOpen(true); // Abre o carrinho automaticamente
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantidade: number) => {
    if (quantidade <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantidade } : i)));
  };

  const clearCart = () => setItems([]);

  const cartTotal = items.reduce((total, item) => total + item.preco * item.quantidade, 0);
  const cartCount = items.reduce((count, item) => count + item.quantidade, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
