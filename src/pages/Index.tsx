import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/AppContext';
import func2url from '../../backend/func2url.json';

const CATALOG_API = func2url.catalog;

type Product = { name: string; place: string; price: number; time: number; rating: number; emoji: string };

const MASCOT = 'https://cdn.poehali.dev/projects/30aa368c-a3b3-47da-9960-40e0b3c66f78/files/e9d10a74-477e-462e-810d-8c36cf853870.jpg';

type Tab = 'food' | 'goods';

const categories: Record<Tab, { label: string; emoji: string }[]> = {
  food: [
    { label: 'Пицца', emoji: '🍕' },
    { label: 'Шаурма', emoji: '🌯' },
    { label: 'Суши', emoji: '🍣' },
    { label: 'Бургеры', emoji: '🍔' },
    { label: 'Комбо', emoji: '🍱' },
  ],
  goods: [
    { label: 'Бакалея', emoji: '🌾' },
    { label: 'Напитки', emoji: '🥤' },
    { label: 'Снеки', emoji: '🍪' },
    { label: 'Детское', emoji: '🍼' },
    { label: 'Фрукты', emoji: '🍉' },
  ],
};

const districts = ['Центр', '5-й микрорайон', 'Текстильщики', 'Бекетовка', 'Самовывоз'];

export default function Index() {
  const navigate = useNavigate();
  const { user, isAdmin, district, setDistrict, cart, addToCart, cartCount, cartSum } = useApp();
  const [tab, setTab] = useState<Tab>('food');
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${CATALOG_API}?section=${tab}`);
      const d = await r.json();
      setItems(
        (d.products || []).map((p: { name: string; place: string; price: number; delivery_minutes: number; rating: number; emoji: string }) => ({
          name: p.name, place: p.place, price: p.price, time: p.delivery_minutes, rating: Number(p.rating), emoji: p.emoji,
        })),
      );
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  useEffect(() => {
    if (user) loadCatalog();
  }, [user, loadCatalog]);

  if (!user) return null;

  const qtyOf = (name: string) => cart.find((c) => c.name === name)?.qty || 0;

  return (
    <div className="min-h-screen bg-background pb-28 max-w-md mx-auto">
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground rounded-b-[2rem] px-5 pt-5 pb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest opacity-80">Доставляем сегодня</p>
            <button className="flex items-center gap-1.5 mt-0.5 font-bold text-lg">
              <Icon name="MapPin" size={18} />
              {district}
              <Icon name="ChevronDown" size={16} className="opacity-70" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin" className="bg-white/15 rounded-full p-2" title="Админ-панель">
                <Icon name="ShieldCheck" size={20} />
              </Link>
            )}
            <div className="flex items-center gap-1 bg-white/15 rounded-full pl-1 pr-3 py-1">
              <img src={MASCOT} alt="Арбузик" className="w-8 h-8 rounded-full object-cover wiggle" />
              <span className="font-display text-base">Арбузик</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
          {districts.map((d) => (
            <button
              key={d}
              onClick={() => setDistrict(d)}
              className={`whitespace-nowrap text-xs font-semibold px-3.5 py-1.5 rounded-full transition ${
                district === d ? 'bg-accent text-accent-foreground' : 'bg-white/15'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </header>

      <main className="px-5">
        <div className="relative mt-5 rounded-3xl overflow-hidden bg-secondary text-white p-5 float-in">
          <div className="absolute inset-0 watermelon-dots opacity-10" />
          <div className="relative flex items-center justify-between">
            <div className="max-w-[60%]">
              <p className="font-display text-2xl leading-tight">Арбузная столица</p>
              <p className="text-sm opacity-90 mt-1">Приведи друга — скидка 10% на первый заказ 🍉</p>
              <button className="mt-3 bg-white text-secondary font-bold text-sm px-4 py-2 rounded-full">
                Забрать скидку
              </button>
            </div>
            <img src={MASCOT} alt="" className="w-24 h-24 rounded-2xl object-cover shadow-xl" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-muted rounded-2xl p-1.5 mt-5">
          {(['food', 'goods'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition ${
                tab === t ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'
              }`}
            >
              <Icon name={t === 'food' ? 'UtensilsCrossed' : 'ShoppingBasket'} size={18} />
              {t === 'food' ? 'Еда' : 'Товары'}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-5 overflow-x-auto no-scrollbar pb-1">
          {categories[tab].map((c) => (
            <button key={c.label} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center text-2xl hover:scale-105 transition">
                {c.emoji}
              </div>
              <span className="text-xs font-semibold text-foreground">{c.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar">
          <span className="text-sm font-bold mr-1 whitespace-nowrap">Топ в «{district}»</span>
          {['💰 Цена', '⭐ Рейтинг', '⚡ Быстрее'].map((f) => (
            <button key={f} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-card border border-border whitespace-nowrap">
              {f}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center mt-8 text-muted-foreground">
            <Icon name="LoaderCircle" size={28} className="animate-spin" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <p className="text-center text-muted-foreground mt-8 text-sm">В этом разделе пока пусто</p>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          {items.map((p, i) => (
            <div
              key={p.name}
              className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm float-in"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="h-24 bg-muted flex items-center justify-center text-5xl relative">
                {p.emoji}
                <span className="absolute top-2 left-2 bg-card/90 backdrop-blur text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Icon name="Star" size={11} className="text-accent fill-accent" />
                  {p.rating}
                </span>
              </div>
              <div className="p-3">
                <p className="font-bold text-sm leading-tight">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.place}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                  <Icon name="Clock" size={12} />
                  {p.time} мин
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-black text-base">{p.price} ₽</span>
                  <button
                    onClick={() => addToCart({ name: p.name, place: p.place, price: p.price, section: tab })}
                    className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition shadow relative"
                  >
                    <Icon name="Plus" size={18} />
                    {qtyOf(p.name) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                        {qtyOf(p.name)}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 bg-accent text-accent-foreground rounded-3xl p-5 flex items-center justify-between">
          <div>
            <p className="font-black text-base">Стать курьером 🛵</p>
            <p className="text-xs mt-0.5 opacity-80">Свободный график по Камышину</p>
          </div>
          <Link to="/courier" className="bg-accent-foreground text-accent font-bold text-sm px-4 py-2 rounded-full">
            Начать
          </Link>
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border px-6 py-2 flex justify-around max-w-md mx-auto">
        <Link to="/" className="flex flex-col items-center gap-0.5 text-primary">
          <Icon name="House" size={22} />
          <span className="text-[10px] font-semibold">Главная</span>
        </Link>
        <Link to="/history" className="flex flex-col items-center gap-0.5 text-muted-foreground">
          <Icon name="ClipboardList" size={22} />
          <span className="text-[10px] font-semibold">Заказы</span>
        </Link>
        <button className="flex flex-col items-center gap-0.5 text-muted-foreground">
          <Icon name="User" size={22} />
          <span className="text-[10px] font-semibold">Профиль</span>
        </button>
      </nav>

      {cartCount > 0 && (
        <Link
          to="/cart"
          className="fixed bottom-20 right-5 z-40 bg-primary text-primary-foreground rounded-full pl-4 pr-5 py-3 shadow-2xl flex items-center gap-2 float-in"
        >
          <div className="relative">
            <Icon name="ShoppingCart" size={22} />
            <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </div>
          <span className="font-black">{cartSum} ₽</span>
        </Link>
      )}
    </div>
  );
}