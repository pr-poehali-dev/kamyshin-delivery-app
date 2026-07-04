import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

const API = func2url.courier;
const COURIER_ID = 1;
const COURIER_NAME = 'Алексей В.';

type OrderItem = { name: string; qty: number; price: number };
type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  section: string;
  place: string;
  pickup_address: string;
  delivery_address: string;
  district: string;
  items: OrderItem[];
  total_price: number;
  payment_method: string;
  comment: string | null;
  status: string;
  eta_minutes: number;
};

const statusMeta: Record<string, { label: string; icon: string; next: string }> = {
  accepted: { label: 'Принят', icon: 'PackageCheck', next: 'Забрал заказ' },
  cooking: { label: 'Готовится', icon: 'ChefHat', next: 'Выехал' },
  on_way: { label: 'В пути', icon: 'Bike', next: 'Доставлен' },
  delivered: { label: 'Доставлен', icon: 'CircleCheck', next: '' },
};

export default function Courier() {
  const [tab, setTab] = useState<'available' | 'mine'>('available');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const scope = tab;
    const url = scope === 'mine' ? `${API}?scope=mine&courier_id=${COURIER_ID}` : `${API}?scope=available`;
    try {
      const r = await fetch(url);
      const d = await r.json();
      setOrders(d.orders || []);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const accept = async (id: number) => {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', order_id: id, courier_id: COURIER_ID }),
    });
    setTab('mine');
    load();
  };

  const nextStatus = async (id: number) => {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'next_status', order_id: id }),
    });
    load();
  };

  return (
    <div className="min-h-screen bg-background pb-10 max-w-md mx-auto">
      <header className="sticky top-0 z-30 bg-secondary text-white rounded-b-[2rem] px-5 pt-5 pb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest opacity-80">Режим курьера</p>
            <p className="font-display text-2xl leading-tight">{COURIER_NAME}</p>
          </div>
          <Link to="/" className="bg-white/15 rounded-full p-2.5" title="К клиенту">
            <Icon name="Smartphone" size={20} />
          </Link>
        </div>

        <button
          onClick={() => setOnline((v) => !v)}
          className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl font-bold text-sm transition ${
            online ? 'bg-accent text-accent-foreground' : 'bg-white/15 text-white'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-secondary' : 'bg-white/60'}`} />
          {online ? 'На линии — принимаю заказы' : 'Не в сети'}
        </button>

        <div className="flex items-center gap-2 mt-3 text-xs opacity-90">
          <Icon name="Baby" size={14} />
          В машине есть детское кресло
        </div>
      </header>

      <div className="px-5">
        <div className="grid grid-cols-2 gap-2 bg-muted rounded-2xl p-1.5 mt-5">
          {(['available', 'mine'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition ${
                tab === t ? 'bg-secondary text-white shadow' : 'text-muted-foreground'
              }`}
            >
              <Icon name={t === 'available' ? 'Inbox' : 'Bike'} size={18} />
              {t === 'available' ? 'Свободные' : 'Мои заказы'}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center mt-10 text-muted-foreground">
            <Icon name="LoaderCircle" size={28} className="animate-spin" />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="text-center mt-16 text-muted-foreground">
            <div className="text-5xl mb-3">🍉</div>
            <p className="font-semibold">
              {tab === 'available' ? 'Новых заказов пока нет' : 'У тебя нет активных заказов'}
            </p>
            <p className="text-sm mt-1">Обновляется автоматически каждые 8 сек</p>
          </div>
        )}

        <div className="space-y-3 mt-4">
          {orders.map((o) => {
            const meta = statusMeta[o.status];
            return (
              <div key={o.id} className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden float-in">
                <div className="flex items-center justify-between px-4 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{o.section === 'food' ? '🍔' : '🛍️'}</span>
                    <div>
                      <p className="font-bold text-sm leading-tight">{o.place}</p>
                      <p className="text-xs text-muted-foreground">Заказ #{o.id}</p>
                    </div>
                  </div>
                  <span className="font-black text-lg">{o.total_price} ₽</span>
                </div>

                <div className="px-4 mt-3 space-y-2">
                  <div className="flex gap-2 text-sm">
                    <Icon name="Store" size={16} className="text-secondary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{o.pickup_address}</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <Icon name="MapPin" size={16} className="text-primary mt-0.5 shrink-0" />
                    <span>
                      <span className="font-semibold">{o.district}</span> · {o.delivery_address}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 px-4 mt-3">
                  {o.items.map((it, i) => (
                    <span key={i} className="text-xs bg-muted rounded-full px-2.5 py-1 font-medium">
                      {it.name} ×{it.qty}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 px-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon name="Clock" size={13} /> ~{o.eta_minutes} мин
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name={o.payment_method === 'card' ? 'CreditCard' : 'Banknote'} size={13} />
                    {o.payment_method === 'card' ? 'Картой' : 'Наличными'}
                  </span>
                </div>

                {o.comment && (
                  <div className="mx-4 mt-3 bg-accent/20 text-accent-foreground text-xs rounded-xl px-3 py-2 flex gap-2">
                    <Icon name="MessageSquareText" size={14} className="mt-0.5 shrink-0" />
                    {o.comment}
                  </div>
                )}

                <div className="p-4">
                  {o.status === 'new' ? (
                    <button
                      onClick={() => accept(o.id)}
                      className="w-full bg-secondary text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 transition"
                    >
                      <Icon name="Check" size={18} /> Принять заказ
                    </button>
                  ) : meta && meta.next ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-muted rounded-2xl px-3 py-3 text-sm font-semibold">
                        <Icon name={meta.icon} size={16} className="text-secondary" />
                        {meta.label}
                      </div>
                      <button
                        onClick={() => nextStatus(o.id)}
                        className="bg-primary text-primary-foreground font-bold px-4 py-3 rounded-2xl whitespace-nowrap hover:brightness-110 transition"
                      >
                        {meta.next}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full bg-secondary/15 text-secondary font-bold py-3 rounded-2xl flex items-center justify-center gap-2">
                      <Icon name="CircleCheck" size={18} /> Доставлен
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
