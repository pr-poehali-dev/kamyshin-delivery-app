import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/AppContext';
import func2url from '../../backend/func2url.json';

const API = func2url.admin;

type Tab = 'stats' | 'orders' | 'couriers' | 'places';

type Stats = { orders_count: number; revenue: number; avg_check: number; active_orders: number; couriers_online: number };
type OrderItem = { name: string; qty: number; price: number };
type Order = { id: number; place: string; district: string; delivery_address: string; items: OrderItem[]; total_price: number; status: string; payment_method: string };
type Courier = { id: number; name: string; phone: string; has_child_seat: boolean; is_online: boolean; orders_total: number };
type Place = { id: number; name: string; section: string; address: string; rating: number; delivery_minutes: number; is_active: boolean; products_count: number };
type Product = { id: number; name: string; category: string; price: number; weight: string; emoji: string };

const statusList = [
  { key: 'new', label: 'Новый' },
  { key: 'accepted', label: 'Принят' },
  { key: 'cooking', label: 'Готовится' },
  { key: 'on_way', label: 'В пути' },
  { key: 'delivered', label: 'Доставлен' },
];

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin } = useApp();
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [expandedPlace, setExpandedPlace] = useState<number | null>(null);
  const [products, setProducts] = useState<Record<number, Product[]>>({});
  const [showAddCourier, setShowAddCourier] = useState(false);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [newCourier, setNewCourier] = useState({ name: '', phone: '', has_child_seat: false });
  const [newPlace, setNewPlace] = useState({ name: '', section: 'food', address: '', delivery_minutes: '35' });

  const headers = { 'Content-Type': 'application/json', 'X-User-Phone': user?.phone || '' };

  useEffect(() => {
    if (!user || !isAdmin) navigate('/');
  }, [user, isAdmin, navigate]);

  const loadStats = useCallback(async () => {
    const r = await fetch(`${API}?resource=stats`, { headers });
    if (r.ok) setStats(await r.json());
  }, [user]);

  const loadOrders = useCallback(async () => {
    const r = await fetch(`${API}?resource=orders&status=${orderFilter}`, { headers });
    if (r.ok) setOrders((await r.json()).orders || []);
  }, [user, orderFilter]);

  const loadCouriers = useCallback(async () => {
    const r = await fetch(`${API}?resource=couriers`, { headers });
    if (r.ok) setCouriers((await r.json()).couriers || []);
  }, [user]);

  const loadPlaces = useCallback(async () => {
    const r = await fetch(`${API}?resource=places`, { headers });
    if (r.ok) setPlaces((await r.json()).places || []);
  }, [user]);

  useEffect(() => {
    if (tab === 'stats') loadStats();
    if (tab === 'orders') loadOrders();
    if (tab === 'couriers') loadCouriers();
    if (tab === 'places') loadPlaces();
  }, [tab, loadStats, loadOrders, loadCouriers, loadPlaces]);

  const setOrderStatus = async (orderId: number, status: string) => {
    await fetch(API, { method: 'POST', headers, body: JSON.stringify({ action: 'set_order_status', order_id: orderId, status }) });
    loadOrders();
  };

  const toggleCourier = async (id: number) => {
    await fetch(API, { method: 'POST', headers, body: JSON.stringify({ action: 'toggle_courier', courier_id: id }) });
    loadCouriers();
  };

  const addCourier = async () => {
    if (!newCourier.name) return;
    await fetch(API, { method: 'POST', headers, body: JSON.stringify({ action: 'add_courier', ...newCourier }) });
    setNewCourier({ name: '', phone: '', has_child_seat: false });
    setShowAddCourier(false);
    loadCouriers();
  };

  const addPlace = async () => {
    if (!newPlace.name || !newPlace.address) return;
    await fetch(API, { method: 'POST', headers, body: JSON.stringify({ action: 'add_place', ...newPlace, delivery_minutes: Number(newPlace.delivery_minutes) }) });
    setNewPlace({ name: '', section: 'food', address: '', delivery_minutes: '35' });
    setShowAddPlace(false);
    loadPlaces();
  };

  const togglePlace = async (id: number) => {
    await fetch(API, { method: 'POST', headers, body: JSON.stringify({ action: 'toggle_place', place_id: id }) });
    loadPlaces();
  };

  const loadProducts = async (placeId: number) => {
    if (expandedPlace === placeId) {
      setExpandedPlace(null);
      return;
    }
    const r = await fetch(`${API}?resource=products&place_id=${placeId}`, { headers });
    if (r.ok) {
      const d = await r.json();
      setProducts((p) => ({ ...p, [placeId]: d.products || [] }));
      setExpandedPlace(placeId);
    }
  };

  const updatePrice = async (productId: number, price: number, placeId: number) => {
    await fetch(API, { method: 'POST', headers, body: JSON.stringify({ action: 'update_product_price', product_id: productId, price }) });
    const r = await fetch(`${API}?resource=products&place_id=${placeId}`, { headers });
    if (r.ok) {
      const d = await r.json();
      setProducts((p) => ({ ...p, [placeId]: d.products || [] }));
    }
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background pb-24 max-w-md mx-auto">
      <header className="sticky top-0 z-30 bg-foreground text-background px-5 pt-5 pb-5 rounded-b-[2rem] shadow-lg flex items-center gap-3">
        <Link to="/" className="bg-white/15 rounded-full p-2">
          <Icon name="ArrowLeft" size={20} />
        </Link>
        <div>
          <p className="font-display text-2xl leading-tight">Админ-панель</p>
          <p className="text-xs opacity-70">Камышин Экспресс</p>
        </div>
        <Icon name="ShieldCheck" size={22} className="ml-auto opacity-80" />
      </header>

      <main className="px-5 mt-5">
        {tab === 'stats' && stats && (
          <div className="grid grid-cols-2 gap-3 float-in">
            <StatCard icon="Wallet" label="Выручка" value={`${stats.revenue} ₽`} accent />
            <StatCard icon="ShoppingBag" label="Заказов" value={String(stats.orders_count)} />
            <StatCard icon="Receipt" label="Средний чек" value={`${stats.avg_check} ₽`} />
            <StatCard icon="Timer" label="Активных" value={String(stats.active_orders)} />
            <StatCard icon="Bike" label="Курьеров онлайн" value={String(stats.couriers_online)} />
          </div>
        )}

        {tab === 'orders' && (
          <div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
              {[{ key: 'all', label: 'Все' }, ...statusList].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setOrderFilter(f.key)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${orderFilter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm float-in">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-sm">#{o.id} · {o.place}</p>
                    <span className="font-black">{o.total_price} ₽</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{o.district} · {o.delivery_address}</p>
                  <select
                    value={o.status}
                    onChange={(e) => setOrderStatus(o.id, e.target.value)}
                    className="mt-3 w-full bg-muted rounded-xl px-3 py-2 text-sm font-semibold outline-none"
                  >
                    {statusList.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              ))}
              {orders.length === 0 && <p className="text-center text-muted-foreground py-10">Заказов нет</p>}
            </div>
          </div>
        )}

        {tab === 'couriers' && (
          <div>
            <button onClick={() => setShowAddCourier((v) => !v)} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl flex items-center justify-center gap-2 mb-4">
              <Icon name="Plus" size={18} /> Добавить курьера
            </button>
            {showAddCourier && (
              <div className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-2">
                <input placeholder="Имя" value={newCourier.name} onChange={(e) => setNewCourier({ ...newCourier, name: e.target.value })} className="w-full bg-muted rounded-xl px-3 py-2 text-sm outline-none" />
                <input placeholder="Телефон" value={newCourier.phone} onChange={(e) => setNewCourier({ ...newCourier, phone: e.target.value })} className="w-full bg-muted rounded-xl px-3 py-2 text-sm outline-none" />
                <label className="flex items-center gap-2 text-sm py-1">
                  <input type="checkbox" checked={newCourier.has_child_seat} onChange={(e) => setNewCourier({ ...newCourier, has_child_seat: e.target.checked })} />
                  Есть детское кресло
                </label>
                <button onClick={addCourier} className="w-full bg-secondary text-white font-bold py-2.5 rounded-xl">Сохранить</button>
              </div>
            )}
            <div className="space-y-3">
              {couriers.map((c) => (
                <div key={c.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm flex items-center gap-1.5">
                      {c.name}
                      {c.has_child_seat && <Icon name="Baby" size={14} className="text-secondary" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.phone || '—'} · заказов: {c.orders_total}</p>
                  </div>
                  <button
                    onClick={() => toggleCourier(c.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full ${c.is_online ? 'bg-secondary/15 text-secondary' : 'bg-muted text-muted-foreground'}`}
                  >
                    {c.is_online ? 'Онлайн' : 'Офлайн'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'places' && (
          <div>
            <button onClick={() => setShowAddPlace((v) => !v)} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl flex items-center justify-center gap-2 mb-4">
              <Icon name="Plus" size={18} /> Добавить точку
            </button>
            {showAddPlace && (
              <div className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-2">
                <input placeholder="Название" value={newPlace.name} onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })} className="w-full bg-muted rounded-xl px-3 py-2 text-sm outline-none" />
                <input placeholder="Адрес" value={newPlace.address} onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })} className="w-full bg-muted rounded-xl px-3 py-2 text-sm outline-none" />
                <div className="flex gap-2">
                  <select value={newPlace.section} onChange={(e) => setNewPlace({ ...newPlace, section: e.target.value })} className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm outline-none">
                    <option value="food">Еда</option>
                    <option value="goods">Товары</option>
                  </select>
                  <input placeholder="Мин" value={newPlace.delivery_minutes} onChange={(e) => setNewPlace({ ...newPlace, delivery_minutes: e.target.value.replace(/\D/g, '') })} className="w-20 bg-muted rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
                <button onClick={addPlace} className="w-full bg-secondary text-white font-bold py-2.5 rounded-xl">Сохранить</button>
              </div>
            )}
            <div className="space-y-3">
              {places.map((p) => (
                <div key={p.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.section === 'food' ? '🍔 Еда' : '🛍️ Товары'} · ⭐ {p.rating} · {p.products_count} поз.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => togglePlace(p.id)} className={`w-2.5 h-2.5 rounded-full ${p.is_active ? 'bg-secondary' : 'bg-muted-foreground'}`} title="Вкл/выкл" />
                      <button onClick={() => loadProducts(p.id)} className="bg-muted rounded-full p-1.5">
                        <Icon name={expandedPlace === p.id ? 'ChevronUp' : 'ChevronDown'} size={16} />
                      </button>
                    </div>
                  </div>
                  {expandedPlace === p.id && (
                    <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                      {(products[p.id] || []).map((pr) => (
                        <div key={pr.id} className="flex items-center justify-between gap-2">
                          <span className="text-sm">{pr.emoji} {pr.name}</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              defaultValue={pr.price}
                              onBlur={(e) => updatePrice(pr.id, Number(e.target.value), p.id)}
                              className="w-16 bg-muted rounded-lg px-2 py-1 text-sm text-right outline-none"
                            />
                            <span className="text-xs text-muted-foreground">₽</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border px-4 py-2 flex justify-around max-w-md mx-auto">
        {([
          { key: 'stats', icon: 'ChartColumn', label: 'Статистика' },
          { key: 'orders', icon: 'ClipboardList', label: 'Заказы' },
          { key: 'couriers', icon: 'Bike', label: 'Курьеры' },
          { key: 'places', icon: 'Store', label: 'Точки' },
        ] as { key: Tab; icon: string; label: string }[]).map((n) => (
          <button key={n.key} onClick={() => setTab(n.key)} className={`flex flex-col items-center gap-0.5 ${tab === n.key ? 'text-primary' : 'text-muted-foreground'}`}>
            <Icon name={n.icon} size={20} />
            <span className="text-[10px] font-semibold">{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm ${accent ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
      <Icon name={icon} size={20} className={accent ? 'opacity-90' : 'text-primary'} />
      <p className={`text-2xl font-black mt-2 ${accent ? '' : 'text-foreground'}`}>{value}</p>
      <p className={`text-xs mt-0.5 ${accent ? 'opacity-80' : 'text-muted-foreground'}`}>{label}</p>
    </div>
  );
}