import React, { useEffect, useState } from 'react';
import { ChevronDown, Plus, Save, Trash2 } from 'lucide-react';
import { createTrainer, deleteTrainer, getNotificationSettings, getTrainers, saveNotificationSettings, NotificationSettings, TrainerRecord } from '../../api';
import { useStore } from '../../store/useStore';

export default function SettingsPanel({ token }: { token: string }) {
  const { useMockData, setMockData } = useStore();
  const [advanced, setAdvanced] = useState(false);
  const [trainers, setTrainers] = useState<TrainerRecord[]>([]);
  const [notification, setNotification] = useState<NotificationSettings>({ telegram_bot_token_configured: false, smtp_host: '', smtp_port: 465, smtp_user: '', smtp_password_configured: false, smtp_from: '' });
  const [form, setForm] = useState({ name: '', description: '', username: '', password: '' });
  const [secrets, setSecrets] = useState({ telegram_bot_token: '', smtp_password: '' });
  const [message, setMessage] = useState('');

  const load = async () => {
    const [trainerResult, settingsResult] = await Promise.all([getTrainers(token), getNotificationSettings(token)]);
    setTrainers(trainerResult.trainers); setNotification(settingsResult);
  };
  useEffect(() => { load().catch(err => setMessage(err.message)); }, []);

  const add = async () => {
    try { await createTrainer(token, form); setForm({ name: '', description: '', username: '', password: '' }); await load(); setMessage('Тренер добавлен'); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Ошибка добавления'); }
  };
  const remove = async (id: string) => {
    if (!window.confirm('Удалить доступ этого тренера?')) return;
    try { await deleteTrainer(token, id); await load(); setMessage('Доступ удалён'); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Ошибка удаления'); }
  };
  const save = async () => {
    try {
      await saveNotificationSettings(token, { telegram_bot_token: secrets.telegram_bot_token, smtp_password: secrets.smtp_password, smtp_host: notification.smtp_host, smtp_port: Number(notification.smtp_port), smtp_user: notification.smtp_user, smtp_from: notification.smtp_from });
      setSecrets({ telegram_bot_token: '', smtp_password: '' }); await load(); setMessage('Настройки уведомлений сохранены');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Ошибка сохранения'); }
  };
  const update = (key: keyof NotificationSettings, value: string | number) => setNotification(prev => ({ ...prev, [key]: value }));

  return <div className="space-y-6 animate-fade-in">
    <div><h2 className="text-xl font-bold text-gray-900">Настройки</h2><p className="text-sm text-gray-500">Тренеры и параметры уведомлений</p></div>
    <section className="bg-white rounded-xl border border-gray-100 p-5"><div className="flex items-center justify-between"><div><h3 className="font-semibold text-gray-900">Демонстрационные данные</h3><p className="text-sm text-gray-500">Показывать mock-расписание, клиентов и записи</p></div><button type="button" onClick={() => setMockData(!useMockData)} className={`relative w-12 h-6 rounded-full transition-colors ${useMockData ? 'bg-[#E11D48]' : 'bg-gray-300'}`}><span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${useMockData ? 'translate-x-6' : 'translate-x-0'}`} /></button></div><p className="text-xs text-gray-400 mt-2">Сейчас: {useMockData ? 'включены' : 'выключены'}</p></section>
    <section className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Тренеры</h3>
      <div className="space-y-2 mb-5">{trainers.map(t => <div key={t.id} className="flex items-center justify-between border rounded-lg px-3 py-2"><div><b>{t.name}</b><span className="text-xs text-gray-500 ml-2">логин: {t.username}</span></div><button onClick={() => remove(t.id)} className="text-red-500 p-2" title="Удалить доступ"><Trash2 className="w-4 h-4" /></button></div>)}</div>
      <div className="grid md:grid-cols-4 gap-2">
        <input className="border rounded-lg px-3 py-2" placeholder="Имя" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="border rounded-lg px-3 py-2" placeholder="Логин" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
        <input className="border rounded-lg px-3 py-2" placeholder="Пароль (8+ символов)" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <button onClick={add} className="bg-[#E11D48] text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Добавить</button>
      </div>
    </section>
    <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onClick={() => setAdvanced(!advanced)} className="w-full p-5 flex items-center justify-between text-left"><div><h3 className="font-semibold text-gray-900">Продвинутые настройки</h3><p className="text-sm text-gray-500">Telegram Bot API и SMTP-почта</p></div><ChevronDown className={`w-5 h-5 transition-transform ${advanced ? 'rotate-180' : ''}`} /></button>
      {advanced && <div className="border-t p-5 space-y-4">
        <div><label className="block text-sm font-medium mb-1">Токен Telegram-бота {notification.telegram_bot_token_configured && <span className="text-green-600">(настроен)</span>}</label><input type="password" className="border rounded-lg px-3 py-2 w-full" placeholder="Оставьте пустым, чтобы не менять" value={secrets.telegram_bot_token} onChange={e => setSecrets({ ...secrets, telegram_bot_token: e.target.value })} /></div>
        <div className="grid md:grid-cols-2 gap-3"><label className="text-sm">SMTP host<input className="block border rounded-lg px-3 py-2 w-full mt-1" value={notification.smtp_host} onChange={e => update('smtp_host', e.target.value)} /></label><label className="text-sm">SMTP port<input type="number" className="block border rounded-lg px-3 py-2 w-full mt-1" value={notification.smtp_port} onChange={e => update('smtp_port', Number(e.target.value))} /></label><label className="text-sm">SMTP user<input className="block border rounded-lg px-3 py-2 w-full mt-1" value={notification.smtp_user} onChange={e => update('smtp_user', e.target.value)} /></label><label className="text-sm">From<input className="block border rounded-lg px-3 py-2 w-full mt-1" value={notification.smtp_from} onChange={e => update('smtp_from', e.target.value)} /></label></div>
        <label className="block text-sm">SMTP password {notification.smtp_password_configured && <span className="text-green-600">(настроен)</span>}<input type="password" className="border rounded-lg px-3 py-2 w-full mt-1" placeholder="Оставьте пустым, чтобы не менять" value={secrets.smtp_password} onChange={e => setSecrets({ ...secrets, smtp_password: e.target.value })} /></label>
        <button onClick={save} className="bg-gray-900 text-white rounded-lg px-4 py-2 flex items-center gap-2"><Save className="w-4 h-4" />Сохранить настройки</button>
      </div>}
    </section>
    {message && <p className="text-sm text-gray-600">{message}</p>}
  </div>;
}
