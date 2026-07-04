import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/AppContext';
import func2url from '../../backend/func2url.json';

const API = func2url.auth;
const districts = ['Центр', '5-й микрорайон', 'Текстильщики', 'Бекетовка'];

type Step = 'phone' | 'code' | 'district';

export default function Auth() {
  const navigate = useNavigate();
  const { setUser, setDistrict } = useApp();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [chosenDistrict, setChosenDistrict] = useState('Центр');

  const sendCode = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Введите номер полностью');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_code', phone: digits }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || 'Не удалось отправить код');
      } else {
        setStep('code');
      }
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    if (code.length < 4) return;
    setLoading(true);
    setError('');
    try {
      const digits = phone.replace(/\D/g, '');
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_code', phone: digits, code }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || 'Неверный код');
      } else {
        setUser(d.user);
        setStep('district');
      }
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
    }
    setLoading(false);
  };

  const finish = () => {
    setDistrict(chosenDistrict);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-secondary text-white flex flex-col justify-center px-6 max-w-md mx-auto relative overflow-hidden">
      <div className="absolute inset-0 watermelon-dots opacity-10 pointer-events-none" />

      <div className="relative text-center mb-8 float-in">
        <div className="text-6xl mb-3">🍉</div>
        <p className="font-display text-4xl">Камышин Экспресс</p>
        <p className="text-sm opacity-80 mt-1">Еда и товары к твоему порогу</p>
      </div>

      {step === 'phone' && (
        <div className="relative bg-white text-foreground rounded-3xl p-6 shadow-2xl float-in">
          <p className="font-bold text-lg mb-1">Вход по номеру телефона</p>
          <p className="text-sm text-muted-foreground mb-4">Отправим код подтверждения по SMS</p>
          <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3">
            <Icon name="Phone" size={18} className="text-muted-foreground" />
            <input
              type="tel"
              placeholder="+7 900 000 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-transparent outline-none flex-1 font-medium"
            />
          </div>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          <button
            onClick={sendCode}
            disabled={loading}
            className="mt-4 w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl disabled:opacity-60"
          >
            {loading ? 'Отправляем...' : 'Получить код'}
          </button>
        </div>
      )}

      {step === 'code' && (
        <div className="relative bg-white text-foreground rounded-3xl p-6 shadow-2xl float-in">
          <p className="font-bold text-lg mb-1">Введите код из SMS</p>
          <p className="text-sm text-muted-foreground mb-4">Отправили на {phone}</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center text-3xl tracking-[0.5em] font-black bg-muted rounded-2xl py-4 outline-none"
          />
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          <button
            onClick={verifyCode}
            disabled={loading}
            className="mt-4 w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl disabled:opacity-60"
          >
            {loading ? 'Проверяем...' : 'Подтвердить'}
          </button>
          <button onClick={() => setStep('phone')} className="mt-2 w-full text-sm text-muted-foreground font-semibold py-2">
            Изменить номер
          </button>
        </div>
      )}

      {step === 'district' && (
        <div className="relative bg-white text-foreground rounded-3xl p-6 shadow-2xl float-in">
          <p className="font-bold text-lg mb-1">Твой район в Камышине</p>
          <p className="text-sm text-muted-foreground mb-4">Поможет точнее рассчитать время доставки</p>
          <div className="grid grid-cols-2 gap-2">
            {districts.map((d) => (
              <button
                key={d}
                onClick={() => setChosenDistrict(d)}
                className={`text-sm font-semibold py-3 rounded-2xl transition ${
                  chosenDistrict === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <button onClick={finish} className="mt-5 w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl">
            Готово, поехали!
          </button>
        </div>
      )}
    </div>
  );
}
