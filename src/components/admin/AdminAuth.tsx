import React, { FormEvent, useState } from 'react';
import { LockKeyhole, Sparkles } from 'lucide-react';
import { getMe, login, logout } from '../../api';
import AdminPanel from './AdminPanel';

export function getAdminToken() { return undefined; }

export default function AdminAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  React.useEffect(() => { getMe().then(result => { setCurrentUser(result.username); setAuthenticated(true); }).catch(() => undefined); }, []);
  if (authenticated) return <AdminPanel token="" username={currentUser} onLogout={async () => { await logout(); setAuthenticated(false); }} />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const result = await login(username.trim(), password);
      setCurrentUser(result.username); setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-rose-900 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="w-14 h-14 bg-[#E11D48] rounded-2xl flex items-center justify-center mx-auto mb-5"><Sparkles className="w-7 h-7 text-white" /></div>
        <h1 className="text-2xl font-bold text-center text-gray-900">Вход для тренера</h1>
        <p className="text-sm text-gray-500 text-center mt-2 mb-6">Доступ к административной панели</p>
        <label className="block text-sm font-medium text-gray-700 mb-1">Имя тренера</label>
        <input value={username} onChange={e => setUsername(e.target.value)} required className="w-full border rounded-xl px-3 py-2.5 mb-4" placeholder="Например, Марта" />
        <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border rounded-xl px-3 py-2.5 mb-4" />
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <button disabled={busy} className="w-full bg-[#E11D48] text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"><LockKeyhole className="w-4 h-4" />{busy ? 'Проверка...' : 'Войти'}</button>
        <p className="text-xs text-gray-400 mt-4 text-center">Первоначальный пароль задаётся переменной ADMIN_PASSWORD.</p>
      </form>
    </div>
  );
}
