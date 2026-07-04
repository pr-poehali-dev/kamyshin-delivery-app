import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CartItem = { name: string; place: string; price: number; qty: number; section: 'food' | 'goods' };
export type User = { id: number; phone: string; name: string | null };

export const ADMIN_PHONES = ['89061678157', '79061678157'];

type AppState = {
  user: User | null;
  setUser: (u: User | null) => void;
  isAdmin: boolean;
  district: string;
  setDistrict: (d: string) => void;
  address: string;
  setAddress: (a: string) => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'qty'>) => void;
  removeFromCart: (name: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSum: number;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    const raw = localStorage.getItem('kmsh_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [district, setDistrict] = useState('Центр');
  const [address, setAddress] = useState('ул. Ленина, 10');
  const [cart, setCart] = useState<CartItem[]>(() => {
    const raw = localStorage.getItem('kmsh_cart');
    return raw ? JSON.parse(raw) : [];
  });

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) localStorage.setItem('kmsh_user', JSON.stringify(u));
    else localStorage.removeItem('kmsh_user');
  };

  useEffect(() => {
    localStorage.setItem('kmsh_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Omit<CartItem, 'qty'>) => {
    setCart((c) => {
      const existing = c.find((x) => x.name === item.name);
      if (existing) {
        return c.map((x) => (x.name === item.name ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...c, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (name: string) => {
    setCart((c) => {
      const existing = c.find((x) => x.name === name);
      if (existing && existing.qty > 1) {
        return c.map((x) => (x.name === name ? { ...x, qty: x.qty - 1 } : x));
      }
      return c.filter((x) => x.name !== name);
    });
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((a, b) => a + b.qty, 0);
  const cartSum = cart.reduce((a, b) => a + b.qty * b.price, 0);
  const isAdmin = !!user && ADMIN_PHONES.includes(user.phone);

  return (
    <AppContext.Provider
      value={{
        user, setUser, isAdmin,
        district, setDistrict,
        address, setAddress,
        cart, addToCart, removeFromCart, clearCart,
        cartCount, cartSum,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}