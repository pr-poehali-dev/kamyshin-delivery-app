import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

const ORDERS_API = func2url.orders;
const CONFIG_API = func2url.config;

type Order = {
  id: number;
  place: string;
  delivery_address: string;
  district: string;
  status: string;
  eta_minutes: number;
  total_price: number;
  pickup_lat: number | null;
  pickup_lon: number | null;
  delivery_lat: number | null;
  delivery_lon: number | null;
};

const displaySteps = [
  { label: 'Готовится', icon: 'ChefHat', match: ['new', 'accepted', 'cooking'] },
  { label: 'Передан курьеру', icon: 'PackageCheck', match: ['accepted', 'cooking', 'on_way', 'delivered'] },
  { label: 'В пути', icon: 'Bike', match: ['on_way', 'delivered'] },
  { label: 'Доставлен', icon: 'Home', match: ['delivered'] },
];

type YMapInstance = { geoObjects: { add: (obj: unknown) => void } };
type YMapsRoute = { getPaths: () => { options: { set: (o: Record<string, unknown>) => void } } };

declare global {
  interface Window {
    ymaps?: {
      ready: (cb: () => void) => void;
      Map: new (el: HTMLElement, opts: Record<string, unknown>) => YMapInstance;
      Placemark: new (coords: number[], props: Record<string, unknown>, opts: Record<string, unknown>) => unknown;
      route: (points: number[][]) => Promise<YMapsRoute>;
    };
  }
}

export default function Tracking() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<YMapInstance | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const loadOrder = useCallback(async () => {
    const r = await fetch(`${ORDERS_API}?resource=order&order_id=${id}`);
    const d = await r.json();
    setOrder(d.order || null);
  }, [id]);

  useEffect(() => {
    loadOrder();
    const t = setInterval(loadOrder, 6000);
    return () => clearInterval(t);
  }, [loadOrder]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch(CONFIG_API);
      const d = await r.json();
      const key = d.yandex_maps_key;
      if (!key) return;

      if (window.ymaps) {
        setMapReady(true);
        return;
      }
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${key}&lang=ru_RU`;
      script.onload = () => {
        window.ymaps.ready(() => {
          if (!cancelled) setMapReady(true);
        });
      };
      document.head.appendChild(script);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !order || !mapRef.current || mapInstance.current) return;
    if (!order.pickup_lat || !order.delivery_lat) return;

    const ymaps = window.ymaps;
    const center = [
      (Number(order.pickup_lat) + Number(order.delivery_lat)) / 2,
      (Number(order.pickup_lon) + Number(order.delivery_lon)) / 2,
    ];
    const map = new ymaps.Map(mapRef.current, {
      center,
      zoom: 14,
      controls: [],
    });
    mapInstance.current = map;

    const pickup = new ymaps.Placemark(
      [Number(order.pickup_lat), Number(order.pickup_lon)],
      { hintContent: order.place },
      { preset: 'islands#redDotIcon' },
    );
    const delivery = new ymaps.Placemark(
      [Number(order.delivery_lat), Number(order.delivery_lon)],
      { hintContent: 'Адрес доставки' },
      { preset: 'islands#greenHomeIcon' },
    );
    map.geoObjects.add(pickup);
    map.geoObjects.add(delivery);

    ymaps.route([
      [Number(order.pickup_lat), Number(order.pickup_lon)],
      [Number(order.delivery_lat), Number(order.delivery_lon)],
    ]).then((route: YMapsRoute) => {
      route.getPaths().options.set({ strokeColor: '2E9C7B', strokeWidth: 4, opacity: 0.8 });
      map.geoObjects.add(route);
    }).catch(() => {});
  }, [mapReady, order]);

  if (!order) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto flex items-center justify-center">
        <Icon name="LoaderCircle" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10 max-w-md mx-auto">
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground px-5 pt-5 pb-5 rounded-b-[2rem] shadow-lg flex items-center gap-3">
        <Link to="/" className="bg-white/15 rounded-full p-2">
          <Icon name="ArrowLeft" size={20} />
        </Link>
        <div>
          <p className="font-display text-2xl leading-tight">Заказ #{order.id}</p>
          <p className="text-xs opacity-80">{order.place} · {order.district}</p>
        </div>
      </header>

      <main className="px-5 mt-5">
        <div className="rounded-3xl overflow-hidden border border-border shadow-sm bg-muted h-64 relative">
          {order.pickup_lat && order.delivery_lat ? (
            <div ref={mapRef} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              Карта недоступна для этого заказа
            </div>
          )}
        </div>

        <div className="bg-card rounded-3xl border border-border p-5 shadow-sm mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold flex items-center gap-2">
              <Icon name="Bike" size={18} className="text-primary" /> {order.delivery_address}
            </p>
            <span className="text-xs font-bold text-secondary">~{order.eta_minutes} мин</span>
          </div>

          <div className="flex justify-between">
            {displaySteps.map((s) => {
              const active = s.match.includes(order.status);
              return (
                <div key={s.label} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      active ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'
                    } ${active && order.status !== 'delivered' && s.match.includes(order.status) ? 'wiggle' : ''}`}
                  >
                    <Icon name={s.icon} size={16} />
                  </div>
                  <span className={`text-[10px] text-center font-semibold ${active ? 'text-secondary' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-accent/15 rounded-3xl p-4 mt-4 flex items-center gap-2 text-sm">
          <Icon name="Bell" size={16} className="text-accent-foreground" />
          Пришлём push и SMS при смене статуса заказа
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Сумма заказа: <span className="font-bold text-foreground">{order.total_price} ₽</span>
        </p>
      </main>
    </div>
  );
}