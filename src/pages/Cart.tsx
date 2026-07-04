import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/AppContext';
import func2url from '../../backend/func2url.json';

const API = func2url.orders;

const placeInfo: Record<string, { pickup: string; delivery: number }> = {
  'Пиццерия «Волга»': { pickup: 'пр. Ленина, 20', delivery: 35 },
  'ShaurmaBro': { pickup: 'ул. Ленина, 8', delivery: 25 },
  'Суши Рай': { pickup: 'ул. Гагарина, 5', delivery: 45 },
  'Бургер Хаус': { pickup: 'ул. Октябрьская, 14', delivery: 30 },
  'Рынок у моста': { pickup: 'ул. Мира, 2', delivery: 40 },
  'Магнит': { pickup: 'ул. Мира, 15', delivery: 30 },
  'Пятёрочка': { pickup: 'ул. Пролетарская, 30', delivery: 35 },
  'Аптека+': { pickup: 'ул. Ленина, 25', delivery: 30 },
};

export default function Cart() {
  const navigate = useNavigate();
  const { user, district, address, setAddress, cart, addToCart, removeFromCart, clearCart, cartSum } = useApp();
  const [payment, setPayment] = useState<'card' | 'cash'>('cash');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const groupedByPlace = cart.reduce<Record<string, typeof cart>>((acc, item) => {
    acc[item.place] = acc[item.place] || [];
    acc[item.place].push(item);
    return acc;
  }, {});

  const eta = Math.max(...cart.map((c) => placeInfo[c.place]?.delivery || 35), 30);

  const checkout = async () => {
    if (!user || cart.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      for (const place of Object.keys(groupedByPlace)) {
        const items = groupedByPlace[place];
        const total = items.reduce((s, i) => s + i.price * i.qty, 0);
        const info = placeInfo[place] || { pickup: 'г. Камышин', delivery: 35 };
        const r = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_order',
            customer_name: user.name || 'Клиент',
            customer_phone: user.phone,
            section: items[0].section,
            place,
            pickup_address: info.pickup,
            delivery_address: address,
            district,
            items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
            total_price: total,
            payment_method: payment,
            comment,
            user_id: user.id,
            eta_minutes: info.delivery,
          }),
        });
        if (!r.ok) throw new Error('Не удалось оформить заказ');
        const d = await r.json();
        clearCart();
        navigate(`/tracking/${d.order.id}`);
        return;
      }
    } catch {
      setError('Не получилось оформить заказ, попробуйте ещё раз');
    }
    setSubmitting(false);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <p className="font-bold text-lg">Корзина пуста</p>
        <p className="text-sm text-muted-foreground mt-1">Добавь что-нибудь вкусное или полезное</p>
        <Link to="/" className="mt-5 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl">
          К каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 max-w-md mx-auto">
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground px-5 pt-5 pb-5 rounded-b-[2rem] shadow-lg flex items-center gap-3">
        <Link to="/" className="bg-white/15 rounded-full p-2">
          <Icon name="ArrowLeft" size={20} />
        </Link>
        <p className="font-display text-2xl">Корзина</p>
      </header>

      <main className="px-5 mt-5 space-y-4">
        {Object.entries(groupedByPlace).map(([place, items]) => (
          <div key={place} className="bg-card rounded-3xl border border-border p-4 shadow-sm">
            <p className="font-bold text-sm mb-3 flex items-center gap-1.5">
              <Icon name="Store" size={15} className="text-secondary" />
              {place}
            </p>
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.name} className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.price} ₽</p>
                  </div>
                  <div className="flex items-center gap-2 bg-muted rounded-full px-1 py-1">
                    <button onClick={() => removeFromCart(i.name)} className="w-7 h-7 rounded-full bg-card flex items-center justify-center">
                      <Icon name="Minus" size={14} />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{i.qty}</span>
                    <button
                      onClick={() => addToCart({ name: i.name, place: i.place, price: i.price, section: i.section })}
                      className="w-7 h-7 rounded-full bg-card flex items-center justify-center"
                    >
                      <Icon name="Plus" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-card rounded-3xl border border-border p-4 shadow-sm">
          <p className="font-bold text-sm mb-2 flex items-center gap-1.5">
            <Icon name="MapPin" size={15} className="text-primary" /> Адрес доставки
          </p>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Улица, дом, квартира"
            className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none"
          />
          <p className="text-xs text-muted-foreground mt-2">Район: {district}</p>
        </div>

        <div className="bg-card rounded-3xl border border-border p-4 shadow-sm">
          <p className="font-bold text-sm mb-2 flex items-center gap-1.5">
            <Icon name="MessageSquareText" size={15} /> Комментарий курьеру
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Позвонить в домофон 123, постучать в дверь..."
            rows={2}
            className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none resize-none"
          />
        </div>

        <div className="bg-card rounded-3xl border border-border p-4 shadow-sm">
          <p className="font-bold text-sm mb-3">Способ оплаты</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPayment('card')}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition ${
                payment === 'card' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
            >
              <Icon name="CreditCard" size={16} /> Картой онлайн
            </button>
            <button
              onClick={() => setPayment('cash')}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition ${
                payment === 'cash' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
            >
              <Icon name="Banknote" size={16} /> Наличными
            </button>
          </div>
        </div>

        <div className="bg-secondary/10 rounded-3xl p-4 flex items-center gap-2 text-sm">
          <Icon name="Clock" size={16} className="text-secondary" />
          Ожидаемое время доставки: <span className="font-bold">~{eta} мин</span>
        </div>

        {error && <p className="text-destructive text-sm text-center">{error}</p>}
      </main>

      <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto bg-card border-t border-border p-4">
        <button
          onClick={checkout}
          disabled={submitting}
          className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? 'Оформляем...' : `Оформить заказ · ${cartSum} ₽`}
        </button>
      </div>
    </div>
  );
}
