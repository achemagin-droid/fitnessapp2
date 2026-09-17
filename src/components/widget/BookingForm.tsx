import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { lookupClient } from '../../api';
import { classTypes, trainers } from '../../data/mockData';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, AlertCircle, Check, CreditCard, Mail, Phone, Send } from 'lucide-react';

interface BookingFormProps { sessionId: string; onBack: () => void; onSuccess: () => void; }

type ClientData = { first_name: string; last_name: string; email?: string; telegram_id?: string; notification_preference: 'telegram' | 'email' | 'none' };

export default function BookingForm({ sessionId, onBack, onSuccess }: BookingFormProps) {
  const { sessions, addBooking, findClientByPhone, addClient, getActivePassForClient } = useStore();
  const session = sessions.find(item => item.id === sessionId);
  const classType = classTypes.find(item => item.id === session?.class_type_id);
  const trainer = trainers.find(item => item.id === session?.trainer_id);
  const [phone, setPhone] = useState(() => localStorage.getItem('checklis-client-phone') || '');
  const [client, setClient] = useState<ClientData | null>(null);
  const [existingClientId, setExistingClientId] = useState<string | null>(null);
  const [activePass, setActivePass] = useState<{ remaining_visits: number; total_visits: number } | null>(null);
  const [notificationPref, setNotificationPref] = useState<'telegram' | 'email' | 'none'>('telegram');
  const [lookupDone, setLookupDone] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setLookupDone(false); setClient(null); setExistingClientId(null); setActivePass(null); return; }
    let cancelled = false;
    setLookupLoading(true);
    const timer = window.setTimeout(async () => {
      const local = findClientByPhone(phone);
      try {
        const result = await lookupClient(phone);
        if (cancelled) return;
        if (result.client || local) {
          const found = result.client || local!;
          setClient(found); setExistingClientId(result.client?.id || local?.id || null); setNotificationPref(found.notification_preference);
          setActivePass(result.pass ? { remaining_visits: result.pass.remaining, total_visits: result.pass.total } : local ? getActivePassForClient(local.id) || null : null);
        } else { setClient(null); setExistingClientId(null); setActivePass(null); }
      } catch {
        if (local) { setClient(local); setExistingClientId(local.id); setNotificationPref(local.notification_preference); setActivePass(getActivePassForClient(local.id) || null); }
        else { setClient(null); setExistingClientId(null); setActivePass(null); }
      } finally { if (!cancelled) { setLookupDone(true); setLookupLoading(false); } }
    }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [phone]);

  if (!session || !classType) return null;
  const firstName = client?.first_name || '';
  const lastName = client?.last_name || '';
  const email = client?.email || '';
  const telegramId = client?.telegram_id || '';
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!client?.first_name || !phone.trim()) { setError('Заполните имя и телефон'); return; }
    if (notificationPref === 'email' && !email) { setError('Укажите email для уведомлений'); return; }
    if (notificationPref === 'telegram' && !telegramId) { setError('Укажите Telegram для уведомлений'); return; }
    setIsSubmitting(true); localStorage.setItem('checklis-client-phone', phone.trim());
    setTimeout(() => {
      let clientId = existingClientId;
      if (!clientId) { const newClient = { id: `c${Date.now()}`, first_name: firstName, last_name: lastName, phone: phone.trim(), email: email || undefined, telegram_id: telegramId || undefined, notification_preference: notificationPref }; addClient(newClient); clientId = newClient.id; }
      addBooking({ id: `b${Date.now()}`, client_id: clientId, session_id: sessionId, status: 'confirmed', booked_at: new Date().toISOString() });
      setIsSubmitting(false); onSuccess();
    }, 500);
  };
  const input = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20';
  return <div className="min-h-screen bg-gradient-to-br from-gray-50 to-rose-50"><div className="bg-white border-b border-gray-100"><div className="max-w-lg mx-auto px-4 py-4"><button onClick={onBack} className="flex items-center gap-2 text-gray-600"><ArrowLeft className="w-5 h-5" />Назад</button></div></div><div className="max-w-lg mx-auto px-4 py-6">
    <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-6"><h2 className="text-xl font-bold">{classType.name}</h2><p className="text-gray-600 text-sm mt-2">{trainer?.name} · {format(parseISO(session.start_time), 'd MMMM, HH:mm', { locale: ru })}</p></div>
    <form onSubmit={handleSubmit} className="space-y-4"><div className="bg-white rounded-2xl p-5 border border-gray-100"><label className="block text-sm font-medium text-gray-700 mb-1">Номер телефона *</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+7 (999) 123-45-67" className={`${input} pl-10`} autoFocus /></div>{lookupLoading && <p className="text-xs text-gray-500 mt-2">Проверяем номер...</p>}{lookupDone && existingClientId && <p className="text-xs text-green-600 mt-2">✓ Клиент найден, данные заполнены</p>}{lookupDone && !existingClientId && <p className="text-xs text-gray-500 mt-2">Новый клиент — заполните данные ниже</p>}
      {lookupDone && <div className="space-y-3 mt-4"><input className={input} placeholder="Имя *" value={firstName} onChange={event => setClient(prev => ({ ...(prev || { last_name: '', notification_preference: 'telegram' }), first_name: event.target.value }))} /><input className={input} placeholder="Фамилия" value={lastName} onChange={event => setClient(prev => ({ ...(prev || { first_name: '', notification_preference: 'telegram' }), last_name: event.target.value }))} /><input className={input} type="email" placeholder="Email" value={email} onChange={event => setClient(prev => ({ ...(prev || { first_name: '', last_name: '', notification_preference: 'telegram' }), email: event.target.value }))} /></div>}
    </div>{lookupDone && <><div className="bg-white rounded-2xl p-5 border border-gray-100"><h3 className="font-semibold mb-3">Напомнить о тренировке</h3><div className="flex gap-2">{(['telegram', 'email', 'none'] as const).map(value => <button type="button" key={value} onClick={() => setNotificationPref(value)} className={`flex-1 py-2 rounded-xl text-sm ${notificationPref === value ? 'bg-[#E11D48] text-white' : 'bg-gray-100 text-gray-600'}`}>{value === 'telegram' ? <><Send className="inline w-3 h-3" /> TG</> : value === 'email' ? <><Mail className="inline w-3 h-3" /> Email</> : 'Не нужно'}</button>)}</div>{notificationPref === 'telegram' && <input className={`${input} mt-3`} placeholder="Telegram username" value={telegramId} onChange={event => setClient(prev => ({ ...(prev || { first_name: '', last_name: '', notification_preference: 'telegram' }), telegram_id: event.target.value }))} />}</div>{activePass && <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"><CreditCard className="w-5 h-5 text-green-600" />Осталось {activePass.remaining_visits} из {activePass.total_visits}</div>}</>}
    {error && <p className="text-sm text-red-700 flex gap-2"><AlertCircle className="w-4 h-4" />{error}</p>}<button type="submit" disabled={!lookupDone || lookupLoading || !client?.first_name || isSubmitting} className="w-full bg-[#E11D48] text-white py-3.5 rounded-xl font-semibold disabled:opacity-40">{isSubmitting ? 'Записываем...' : 'Записаться на тренировку'}</button></form>
  </div></div>;
}
