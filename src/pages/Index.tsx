import { useState } from 'react';
import Icon from '@/components/ui/icon';

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

const products: Record<Tab, { name: string; place: string; price: number; time: number; rating: number; emoji: string }[]> = {
  food: [
    { name: 'Пепперони 30см', place: 'Пиццерия «Волга»', price: 549, time: 35, rating: 4.9, emoji: '🍕' },
    { name: 'Шаурма XL с курицей', place: 'ShaurmaBro', price: 289, time: 25, rating: 4.8, emoji: '🌯' },
    { name: 'Сет «Камышинский»', place: 'Суши Рай', price: 890, time: 45, rating: 4.7, emoji: '🍣' },
    { name: 'Двойной чизбургер', place: 'Бургер Хаус', price: 399, time: 30, rating: 4.6, emoji: '🍔' },
  ],
  goods: [
    { name: 'Арбуз камышинский, 5кг', place: 'Рынок у моста', price: 350, time: 40, rating: 5.0, emoji: '🍉' },
    { name: 'Молоко 3.2%, 1л', place: 'Магнит', price: 89, time: 30, rating: 4.8, emoji: '🥛' },
    { name: 'Чипсы Lays, 150г', place: 'Пятёрочка', price: 149, time: 35, rating: 4.7, emoji: '🥔' },
    { name: 'Детское пюре, 6шт', place: 'Аптека+', price: 420, time: 30, rating: 4.9, emoji: '🍼' },
  ],
};

const districts = ['Центр', '5-й микрорайон', 'Текстильщики', 'Бекетовка', 'Самовывоз'];

const statuses = [
  { label: 'Готовится', icon: 'ChefHat', done: true },
  { label: 'Передан', icon: 'PackageCheck', done: true },
  { label: 'В пути', icon: 'Bike', active: true },
  { label: 'Доставлен', icon: 'Home' },
];

export default function Index() {
  const [tab, setTab] = useState<Tab>('food');
  const [district, setDistrict] = useState('Центр');
  const [cart, setCart] = useState<Record<string, number>>({});

  const addToCart = (name: string) =>
    setCart((c) => ({ ...c, [name]: (c[name] || 0) + 1 }));

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartSum = Object.entries(cart).reduce((sum, [name, qty]) => {
    const p = [...products.food, ...products.goods].find((x) => x.name === name);
    return sum + (p ? p.price * qty : 0);
  }, 0);

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
          <div className="flex items-center gap-1 bg-white/15 rounded-full pl-1 pr-3 py-1">
            <img src={MASCOT} alt="Арбузик" className="w-8 h-8 rounded-full object-cover wiggle" />
            <span className="font-display text-base">Арбузик</span>
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

        <div className="grid grid-cols-2 gap-3 mt-4">
          {products[tab].map((p, i) => (
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
                    onClick={() => addToCart(p.name)}
                    className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition shadow"
                  >
                    <Icon name={cart[p.name] ? 'Check' : 'Plus'} size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 bg-card rounded-3xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-bold text-base flex items-center gap-2">
              <Icon name="Bike" size={18} className="text-primary" /> Заказ #248 в пути
            </p>
            <span className="text-xs font-bold text-secondary">~12 мин</span>
          </div>
          <div className="relative mt-4 h-28 rounded-2xl bg-secondary/10 overflow-hidden">
            <div className="absolute inset-0 watermelon-dots opacity-20" />
            <div className="absolute top-4 left-5 text-2xl">🏪</div>
            <div className="absolute bottom-4 right-5 text-2xl">🏠</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl wiggle">🛵</div>
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <path d="M 35 30 Q 150 20 200 100" stroke="hsl(168 60% 40%)" strokeWidth="3" strokeDasharray="6 6" fill="none" />
            </svg>
          </div>
          <div className="flex justify-between mt-4">
            {statuses.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    s.active ? 'bg-primary text-primary-foreground wiggle' : s.done ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon name={s.icon} size={16} />
                </div>
                <span className={`text-[10px] text-center font-semibold ${s.active ? 'text-primary' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 bg-accent text-accent-foreground rounded-3xl p-5 flex items-center justify-between">
          <div>
            <p className="font-black text-base">Стать курьером 🛵</p>
            <p className="text-xs mt-0.5 opacity-80">Свободный график по Камышину</p>
          </div>
          <button className="bg-accent-foreground text-accent font-bold text-sm px-4 py-2 rounded-full">
            Начать
          </button>
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border px-6 py-2 flex justify-around max-w-md mx-auto">
        {[
          { icon: 'House', label: 'Главная', active: true },
          { icon: 'Search', label: 'Поиск' },
          { icon: 'ClipboardList', label: 'Заказы' },
          { icon: 'User', label: 'Профиль' },
        ].map((n) => (
          <button key={n.label} className={`flex flex-col items-center gap-0.5 ${n.active ? 'text-primary' : 'text-muted-foreground'}`}>
            <Icon name={n.icon} size={22} />
            <span className="text-[10px] font-semibold">{n.label}</span>
          </button>
        ))}
      </nav>

      {cartCount > 0 && (
        <button className="fixed bottom-20 right-5 z-40 bg-primary text-primary-foreground rounded-full pl-4 pr-5 py-3 shadow-2xl flex items-center gap-2 float-in">
          <div className="relative">
            <Icon name="ShoppingCart" size={22} />
            <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </div>
          <span className="font-black">{cartSum} ₽</span>
        </button>
      )}
    </div>
  );
}
