import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/AppContext';
import func2url from '../../backend/func2url.json';

const API = func2url.orders;

type OrderItem = { name: string; qty: number; price: number };
type Order = {
  id: number;
  place: string;
  district: string;
  delivery_address: string;
  items: OrderItem[];
  total_price: number;
  status: string;
  created_at: string;
};

const statusLabel: Record<string, { label: string; color: string }> = {
  new: { label: 'Готовится', color: 'text-accent-foreground bg-accent' },
  accepted: { label: 'Передан курьеру', color: 'text-secondary bg-secondary/15' },
  cooking: { label: 'Готовится', color: 'text-accent-foreground bg-accent' },
  on_way: { label: 'В пути', color: 'text-primary bg-primary/10' },
  delivered: { label: 'Доставлен', color: 'text-secondary bg-secondary/15' },
};

type Filter = 'all' | 'active' | 'completed';

export default function History() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [repeatingId, setRepeatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const statusParam = filter === 'all' ? '' : `&status=${filter}`;
    const r = await fetch(`${API}?resource=orders&user_id=${user.id}${statusParam}`);
    const d = await r.json();
    setOrders(d.orders || []);
    setLoading(false);
  }, [user, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const repeat = async (orderId: number) => {
    setRepeatingId(orderId);
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'repeat_order', order_id: orderId }),
    });
    const d = await r.json();
    setRepeatingId(null);
    if (r.ok) navigate(`/tracking/${d.order.id}`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-10 max-w-md mx-auto">
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground px-5 pt-5 pb-5 rounded-b-[2rem] shadow-lg flex items-center gap-3">
        <Link to="/" className="bg-white/15 rounded-full p-2">
          <Icon name="ArrowLeft" size={20} />
        </Link>
        <p className="font-display text-2xl">Мои заказы</p>
      </header>

      <div className="px-5 mt-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {([
            { key: 'all', label: 'Все' },
            { key: 'active', label: 'Активные' },
            { key: 'completed', label: 'Завершённые' },
          ] as { key: Filter; label: string }[]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-bold px-3.5 py-2 rounded-full whitespace-nowrap transition ${
                filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {f.label}
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
            <div className="text-5xl mb-3">📦</div>
            <p className="font-semibold">Заказов пока нет</p>
          </div>
        )}

        <div className="space-y-3 mt-4">
          {orders.map((o) => {
            const meta = statusLabel[o.status] || statusLabel.new;
            return (
              <div key={o.id} className="bg-card rounded-3xl border border-border shadow-sm p-4 float-in">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">{o.place}</p>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.color}`}>{meta.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{o.district} · {o.delivery_address}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {o.items.map((it, i) => (
                    <span key={i} className="text-xs bg-muted rounded-full px-2.5 py-1 font-medium">
                      {it.name} ×{it.qty}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-black">{o.total_price} ₽</span>
                  <div className="flex gap-2">
                    {o.status !== 'delivered' && (
                      <Link to={`/tracking/${o.id}`} className="text-xs font-bold px-3 py-2 rounded-xl bg-secondary/15 text-secondary">
                        Отследить
                      </Link>
                    )}
                    <button
                      onClick={() => repeat(o.id)}
                      disabled={repeatingId === o.id}
                      className="text-xs font-bold px-3 py-2 rounded-xl bg-primary text-primary-foreground flex items-center gap-1 disabled:opacity-60"
                    >
                      <Icon name="RotateCcw" size={13} />
                      {repeatingId === o.id ? 'Повторяем...' : 'Заказать снова'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
