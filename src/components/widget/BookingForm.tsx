import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { classTypes, trainers } from '../../data/mockData';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, User, Phone, Mail, Send, CreditCard, AlertCircle } from 'lucide-react';

interface BookingFormProps {
  sessionId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function BookingForm({ sessionId, onBack, onSuccess }: BookingFormProps) {
  const { sessions, addBooking, findClientByPhone, addClient, getActivePassForClient, getSessionOccupancy } = useStore();
  
  const session = sessions.find(s => s.id === sessionId);
  const classType = classTypes.find(ct => ct.id === session?.class_type_id);
  const trainer = trainers.find(t => t.id === session?.trainer_id);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [notificationPref, setNotificationPref] = useState<'telegram' | 'email' | 'none'>('telegram');
  const [existingClientId, setExistingClientId] = useState<string | null>(null);
  const [activePass, setActivePass] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (phone.length >= 11) {
      const client = findClientByPhone(phone);
      if (client) {
        setFirstName(client.first_name);
        setLastName(client.last_name);
        setEmail(client.email || '');
        setTelegramId(client.telegram_id || '');
        setNotificationPref(client.notification_preference);
        setExistingClientId(client.id);
        const pass = getActivePassForClient(client.id);
        setActivePass(pass || null);
      } else {
        setExistingClientId(null);
        setActivePass(null);
      }
    }
  }, [phone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!firstName.trim() || !phone.trim()) {
      setError('Заполните имя и телефон');
      return;
    }

    if (notificationPref === 'email' && !email.trim()) {
      setError('Укажите email для уведомлений');
      return;
    }

    if (notificationPref === 'telegram' && !telegramId.trim()) {
      setError('Укажите Telegram для уведомлений');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      let clientId = existingClientId;
      
      if (!clientId) {
        const newClient = {
          id: `c${Date.now()}`,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          telegram_id: telegramId.trim() || undefined,
          notification_preference: notificationPref,
        };
        addClient(newClient);
        clientId = newClient.id;
      }

      const booking = {
        id: `b${Date.now()}`,
        client_id: clientId,
        session_id: sessionId,
        status: 'confirmed' as const,
        booked_at: new Date().toISOString(),
      };

      addBooking(booking);
      setIsSubmitting(false);
      onSuccess();
    }, 500);
  };

  if (!session || !classType) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-rose-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Назад</span>
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Session Info Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: classType.color_code }} />
            <h2 className="text-xl font-bold text-gray-900">{classType.name}</h2>
          </div>
          <p className="text-gray-600 text-sm mb-3">{classType.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>👤 {trainer?.name}</span>
            <span>🕐 {format(parseISO(session.start_time), 'd MMMM, HH:mm', { locale: ru })}</span>
            <span>⏱ {classType.duration_minutes} мин</span>
          </div>
        </div>

        {/* Pass Status */}
        {activePass && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Ваш абонемент</p>
              <p className="text-xs text-green-600">
                Осталось {activePass.remaining_visits} из {activePass.total_visits} посещений
              </p>
            </div>
          </div>
        )}

        {!activePass && existingClientId && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">Нет активного абонемента</p>
              <p className="text-xs text-amber-600">Оплата на месте</p>
            </div>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Ваши данные</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ваша фамилия"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48] transition-all"
                  />
                </div>
                {existingClientId && (
                  <p className="text-xs text-green-600 mt-1">✓ Клиент найден</p>
                )}
              </div>
            </div>
          </div>

          {/* Notification Preference */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Напомнить о тренировке</h3>
            <p className="text-sm text-gray-500 mb-4">За 2 часа до начала</p>
            
            <div className="flex gap-2 mb-4">
              {[
                { value: 'telegram' as const, label: 'Telegram', icon: '💬' },
                { value: 'email' as const, label: 'Email', icon: '📧' },
                { value: 'none' as const, label: 'Не нужно', icon: '🔕' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setNotificationPref(option.value)}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                    notificationPref === option.value
                      ? 'bg-[#E11D48] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{option.icon}</span> {option.label}
                </button>
              ))}
            </div>

            {notificationPref === 'telegram' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telegram username</label>
                <div className="relative">
                  <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    placeholder="@username"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48] transition-all"
                  />
                </div>
              </div>
            )}

            {notificationPref === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48] transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#E11D48] text-white py-3.5 rounded-xl font-semibold hover:bg-[#BE123C] transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Записываем...
              </span>
            ) : (
              'Записаться на тренировку'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
