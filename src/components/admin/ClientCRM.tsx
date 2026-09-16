import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Search, Phone, CreditCard, History, Plus, User, AlertCircle, Users } from 'lucide-react';
import { BookingStatus } from '../../types';

export default function ClientCRM() {
  const { clients, findClientByPhone, getBookingsForClient, getAllPassesForClient, getActivePassForClient, addPass, sessions: allSessions, classTypes } = useStore();
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showNewPass, setShowNewPass] = useState(false);
  const [newPassVisits, setNewPassVisits] = useState(10);
  const [newPassDays, setNewPassDays] = useState(30);
  const [showAllClients, setShowAllClients] = useState(false);

  const foundClient = useMemo(() => {
    if (searchPhone.length >= 11) {
      return findClientByPhone(searchPhone);
    }
    return null;
  }, [searchPhone]);

  const clientId = selectedClientId || foundClient?.id;
  const client = clientId ? clients.find(c => c.id === clientId) : null;
  const clientBookings = clientId ? getBookingsForClient(clientId) : [];
  const clientPasses = clientId ? getAllPassesForClient(clientId) : [];
  const activePass = clientId ? getActivePassForClient(clientId) : null;

  const handleCreatePass = () => {
    if (!clientId) return;
    const pass = {
      id: `p${Date.now()}`,
      client_id: clientId,
      total_visits: newPassVisits,
      remaining_visits: newPassVisits,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + newPassDays * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active' as const,
      created_at: new Date().toISOString(),
    };
    addPass(pass);
    setShowNewPass(false);
  };

  const getStatusLabel = (status: BookingStatus) => {
    const labels: Record<BookingStatus, string> = {
      confirmed: '✅ Записан',
      waitlist: '⏳ Ожидание',
      cancelled_client: '❌ Отменён',
      cancelled_admin: '❌ Отменён адм.',
      completed: '✓ Пришёл',
      no_show: '⚠️ Не пришёл',
    };
    return labels[status];
  };

  const getSessionInfo = (sessionId: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return null;
    const ct = classTypes.find(c => c.id === session.class_type_id);
    return { session, classType: ct };
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Клиенты и абонементы</h2>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            value={searchPhone}
            onChange={(e) => { setSearchPhone(e.target.value); setSelectedClientId(null); }}
            placeholder="Поиск по телефону: +79161234567"
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48] transition-all"
          />
        </div>
        {foundClient && !selectedClientId && (
          <button
            onClick={() => setSelectedClientId(foundClient.id)}
            className="mt-3 w-full text-left p-3 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
          >
            <p className="font-medium text-gray-900">{foundClient.first_name} {foundClient.last_name}</p>
            <p className="text-sm text-gray-500">{foundClient.phone}</p>
          </button>
        )}
      </div>

      {/* Кнопка показать всех клиентов */}
      <button
        onClick={() => setShowAllClients(!showAllClients)}
        className="w-full mb-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
      >
        <Users className="w-4 h-4" />
        {showAllClients ? 'Скрыть список клиентов' : `Показать всех клиентов (${clients.length})`}
      </button>

      {/* Список всех клиентов */}
      {showAllClients && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6 animate-fade-in">
          <h3 className="font-semibold text-gray-900 mb-4">Все клиенты</h3>
          {clients.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Нет клиентов</p>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => {
                const activePass = getActivePassForClient(client.id);
                return (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setShowAllClients(false);
                    }}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{client.phone}</p>
                      </div>
                      <div className="text-right">
                        {activePass ? (
                          <div>
                            <p className="text-sm font-semibold text-green-700">
                              {activePass.remaining_visits}/{activePass.total_visits}
                            </p>
                            <p className="text-xs text-gray-500">посещений</p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">Нет абонемента</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {client && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-[#E11D48]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{client.first_name} {client.last_name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {client.phone}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {client.email && (
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-1 text-gray-900">{client.email}</span>
                </div>
              )}
              {client.telegram_id && (
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-500">TG:</span>
                  <span className="ml-1 text-gray-900">{client.telegram_id}</span>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-2">
                <span className="text-gray-500">Уведомления:</span>
                <span className="ml-1 text-gray-900">
                  {client.notification_preference === 'telegram' ? '💬 Telegram' : client.notification_preference === 'email' ? '📧 Email' : '🔕 Нет'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Абонементы
              </h4>
              <button
                onClick={() => setShowNewPass(!showNewPass)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#E11D48] text-white rounded-lg text-sm font-medium hover:bg-[#BE123C] transition-colors"
              >
                <Plus className="w-3 h-3" /> Новый
              </button>
            </div>

            {activePass ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">Активный абонемент</p>
                    <p className="text-sm text-green-600">
                      {activePass.remaining_visits} из {activePass.total_visits} посещений
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                      Действует до {format(parseISO(activePass.end_date), 'd MMMM yyyy', { locale: ru })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-700">{activePass.remaining_visits}</div>
                    <div className="text-xs text-green-500">осталось</div>
                  </div>
                </div>
                <div className="mt-3 w-full h-2 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${(activePass.remaining_visits / activePass.total_visits) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-700">Нет активного абонемента</p>
              </div>
            )}

            {showNewPass && (
              <div className="bg-gray-50 rounded-xl p-4 mb-3 animate-fade-in">
                <h5 className="font-medium text-gray-800 mb-3">Новый абонемент</h5>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Кол-во посещений</label>
                    <input
                      type="number"
                      value={newPassVisits}
                      onChange={(e) => setNewPassVisits(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Срок (дней)</label>
                    <input
                      type="number"
                      value={newPassDays}
                      onChange={(e) => setNewPassDays(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                      min={1}
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreatePass}
                  className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Выпустить абонемент
                </button>
              </div>
            )}

            {clientPasses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Все абонементы</p>
                {clientPasses.map((pass) => (
                  <div key={pass.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <span className="font-medium">{pass.remaining_visits}/{pass.total_visits}</span>
                      <span className="text-gray-500 ml-2">
                        {format(parseISO(pass.start_date), 'd.MM')} — {format(parseISO(pass.end_date), 'd.MM.yy')}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      pass.status === 'active' ? 'bg-green-100 text-green-700' :
                      pass.status === 'exhausted' ? 'bg-gray-100 text-gray-600' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {pass.status === 'active' ? 'Активен' : pass.status === 'exhausted' ? 'Исчерпан' : 'Истёк'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <History className="w-4 h-4" /> История посещений
            </h4>
            {clientBookings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Нет записей</p>
            ) : (
              <div className="space-y-2">
                {clientBookings
                  .sort((a, b) => parseISO(b.booked_at).getTime() - parseISO(a.booked_at).getTime())
                  .slice(0, 10)
                  .map((booking) => {
                    const info = getSessionInfo(booking.session_id);
                    return (
                      <div key={booking.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{info?.classType?.name || '—'}</p>
                          <p className="text-xs text-gray-500">
                            {info ? format(parseISO(info.session.start_time), 'd MMM, HH:mm', { locale: ru }) : '—'}
                          </p>
                        </div>
                        <span className="text-xs">{getStatusLabel(booking.status)}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {!client && searchPhone.length < 11 && (
        <div className="text-center py-12 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Введите номер телефона для поиска клиента</p>
          <p className="text-xs mt-2 text-gray-300">Пример: +79161234567</p>
        </div>
      )}
    </div>
  );
}
