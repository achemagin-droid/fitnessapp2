import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { classTypes } from '../../data/mockData';
import { format, parseISO, isAfter, addHours, isBefore } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Bell, Send, CheckCircle2, AlertCircle, MessageCircle, Mail } from 'lucide-react';

interface NotificationItem {
  id: string;
  clientName: string;
  sessionName: string;
  sessionTime: string;
  channel: 'telegram' | 'email';
  status: 'pending' | 'sent' | 'failed';
  message: string;
}

export default function NotificationsPanel() {
  const { sessions, bookings, clients, getBookingsForSession } = useStore();
  const [sentNotifications, setSentNotifications] = useState<string[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const upcomingNotifications = useMemo(() => {
    const now = new Date();
    const notifications: NotificationItem[] = [];

    sessions.forEach((session) => {
      const startTime = parseISO(session.start_time);
      
      if (isAfter(startTime, now) && isBefore(startTime, addHours(now, 48))) {
        const sessionBookings = getBookingsForSession(session.id);
        const classType = classTypes.find(ct => ct.id === session.class_type_id);
        
        sessionBookings.forEach((booking) => {
          const client = clients.find(c => c.id === booking.client_id);
          if (!client || client.notification_preference === 'none') return;

          const notifId = `${booking.id}-${session.id}`;
          
          notifications.push({
            id: notifId,
            clientName: `${client.first_name} ${client.last_name}`,
            sessionName: classType?.name || 'Тренировка',
            sessionTime: format(startTime, 'd MMM, HH:mm', { locale: ru }),
            channel: client.notification_preference as 'telegram' | 'email',
            status: sentNotifications.includes(notifId) ? 'sent' : 'pending',
            message: `Напоминание: ${classType?.name} ${format(startTime, 'd MMM в HH:mm', { locale: ru })}. Ждём вас!`,
          });
        });
      }
    });

    return notifications.sort((a, b) => {
      if (a.status === 'sent' && b.status !== 'sent') return 1;
      if (a.status !== 'sent' && b.status === 'sent') return -1;
      return 0;
    });
  }, [sessions, bookings, clients, sentNotifications]);

  const handleSend = (notifId: string) => {
    setSendingId(notifId);
    setTimeout(() => {
      setSentNotifications(prev => [...prev, notifId]);
      setSendingId(null);
    }, 1000);
  };

  const handleSendAll = () => {
    const pending = upcomingNotifications.filter(n => n.status === 'pending');
    pending.forEach((n, i) => {
      setTimeout(() => {
        setSentNotifications(prev => [...prev, n.id]);
      }, i * 300);
    });
  };

  const pendingCount = upcomingNotifications.filter(n => n.status === 'pending').length;
  const sentCount = upcomingNotifications.filter(n => n.status === 'sent').length;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Уведомления</h2>
          <p className="text-sm text-gray-500">Автоматические напоминания за 2 часа до тренировки</p>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={handleSendAll}
            className="flex items-center gap-2 px-4 py-2 bg-[#E11D48] text-white rounded-xl text-sm font-medium hover:bg-[#BE123C] transition-colors shadow-lg shadow-rose-200"
          >
            <Send className="w-4 h-4" />
            Отправить все ({pendingCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{pendingCount}</p>
          <p className="text-xs text-blue-600">Ожидают отправки</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{sentCount}</p>
          <p className="text-xs text-green-600">Отправлено</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{upcomingNotifications.length}</p>
          <p className="text-xs text-gray-600">Всего</p>
        </div>
      </div>

      {upcomingNotifications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Нет уведомлений для отправки</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
                notif.status === 'sent' ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {notif.channel === 'telegram' ? (
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Mail className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="font-medium text-gray-900 text-sm">{notif.clientName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      notif.channel === 'telegram' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {notif.channel === 'telegram' ? 'TG' : 'Email'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">{notif.sessionName}</span> — {notif.sessionTime}
                  </p>
                  <p className="text-xs text-gray-400 italic">«{notif.message}»</p>
                </div>
                <div className="ml-3">
                  {notif.status === 'sent' ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Отправлено
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSend(notif.id)}
                      disabled={sendingId === notif.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E11D48] text-white rounded-lg text-xs font-medium hover:bg-[#BE123C] transition-colors disabled:opacity-50"
                    >
                      {sendingId === notif.id ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Отправка...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          Отправить
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Как работают уведомления</p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Автоматическое напоминание отправляется за 2 часа до тренировки</li>
              <li>• Telegram — через Telegram Bot API</li>
              <li>• Email — через SMTP-сервер</li>
              <li>• При покупке абонемента — уведомление об активации</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
