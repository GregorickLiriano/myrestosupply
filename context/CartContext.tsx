'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipos de datos para el carrito
export type CartItem = {
  cartItemId: string; 
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  options?: Record<string, string>; 
  sku?: string;
};

type CartContextType = {
  cartItems: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void; // 🚀 FUNCIÓN PARA VACIAR EL CARRITO TRAS EL PAGO
  cartTotal: number;
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('shopping_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing cart");
      }
    }
  }, []);

  // Guardar carrito en localStorage cada vez que cambia
  useEffect(() => {
    localStorage.setItem('shopping_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (newItem: CartItem) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.cartItemId === newItem.cartItemId);
      if (existingItem) {
        return prev.map(item =>
          item.cartItemId === newItem.cartItemId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prev, newItem];
    });
    openCart(); 
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;
    setCartItems(prev =>
      prev.map(item => (item.cartItemId === cartItemId ? { ...item, quantity } : item))
    );
  };

  // 🚀 IMPLEMENTACIÓN DE clearCart
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('shopping_cart');
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, isCartOpen, openCart, closeCart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}