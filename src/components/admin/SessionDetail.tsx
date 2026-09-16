import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, UserCheck, UserX, XCircle, UserPlus, Clock, Users, CheckCircle2, Trash2 } from 'lucide-react';
import { BookingStatus } from '../../types';

interface SessionDetailProps {
  sessionId: string;
  onBack: () => void;
}

export default function SessionDetail({ sessionId, onBack }: SessionDetailProps) {
  const { sessions, getBookingsForSession, updateBookingStatus, removeBooking, getClientById, getSessionOccupancy, addBooking, addClient, isClientBookedForSession, classTypes, trainers } = useStore();
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);

  const session = sessions.find(s => s.id === sessionId);
  const classType = classTypes.find(ct => ct.id === session?.class_type_id);
  const trainer = trainers.find(t => t.id === session?.trainer_id);
  const bookings = getBookingsForSession(sessionId);
  const occupancy = getSessionOccupancy(sessionId);

  const handleStatusChange = (bookingId: string, status: BookingStatus) => {
    updateBookingStatus(bookingId, status);
  };

  const handleDeleteBooking = (bookingId: string) => {
    setDeleteBookingId(bookingId);
  };

  const confirmDeleteBooking = () => {
    if (deleteBookingId) {
      removeBooking(deleteBookingId);
      setDeleteBookingId(null);
    }
  };

  const cancelDeleteBooking = () => {
    setDeleteBookingId(null);
  };

  const handleWalkIn = () => {
    if (!walkInName.trim() || !walkInPhone.trim()) return;
    
    let client = useStore.getState().findClientByPhone(walkInPhone.trim());
    if (!client) {
      const nameParts = walkInName.trim().split(' ');
      client = {
        id: `c${Date.now()}`,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || '',
        phone: walkInPhone.trim(),
        notification_preference: 'none',
      };
      addClient(client);
    }

    // Проверка на дубликаты
    if (isClientBookedForSession(client.id, sessionId)) {
      alert('Этот клиент уже записан на данную тренировку');
      return;
    }

    const booking = {
      id: `b${Date.now()}`,
      client_id: client.id,
      session_id: sessionId,
      status: 'confirmed' as const,
      booked_at: new Date().toISOString(),
    };
    addBooking(booking);
    
    setTimeout(() => {
      updateBookingStatus(booking.id, 'completed');
    }, 100);

    setWalkInName('');
    setWalkInPhone('');
    setShowWalkIn(false);
  };

  if (!session || !classType) return null;

  const getStatusBadge = (status: BookingStatus) => {
    const styles: Record<BookingStatus, string> = {
      confirmed: 'bg-blue-100 text-blue-700',
      waitlist: 'bg-amber-100 text-amber-700',
      cancelled_client: 'bg-gray-100 text-gray-600',
      cancelled_admin: 'bg-gray-100 text-gray-600',
      completed: 'bg-green-100 text-green-700',
      no_show: 'bg-red-100 text-red-700',
    };
    const labels: Record<BookingStatus, string> = {
      confirmed: 'Записан',
      waitlist: 'Лист ожидания',
      cancelled_client: 'Отменён клиентом',
      cancelled_admin: 'Отменён админом',
      completed: 'Пришёл',
      no_show: 'Не пришёл',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: classType.color_code }} />
            <h2 className="text-xl font-bold text-gray-900">{classType.name}</h2>
          </div>
          <p className="text-sm text-gray-500">
            {trainer?.name} • {format(parseISO(session.start_time), 'd MMMM, HH:mm', { locale: ru })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{occupancy}</p>
          <p className="text-xs text-blue-600">Записано</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{classType.max_capacity - occupancy}</p>
          <p className="text-xs text-green-600">Свободно</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-700">{classType.max_capacity}</p>
          <p className="text-xs text-gray-600">Вместимость</p>
        </div>
      </div>

      <button
        onClick={() => setShowWalkIn(!showWalkIn)}
        className="w-full mb-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-[#E11D48] hover:text-[#E11D48] transition-colors flex items-center justify-center gap-2"
      >
        <UserPlus className="w-4 h-4" />
        Walk-in (добавить без записи)
      </button>

      {showWalkIn && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 animate-fade-in">
          <h4 className="font-medium text-amber-800 mb-3">Добавить walk-in клиента</h4>
          <div className="space-y-2">
            <input
              type="text"
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              placeholder="Имя Фамилия"
              className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <input
              type="tel"
              value={walkInPhone}
              onChange={(e) => setWalkInPhone(e.target.value)}
              placeholder="Телефон"
              className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <div className="flex gap-2">
              <button
                onClick={handleWalkIn}
                className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                Добавить и отметить
              </button>
              <button
                onClick={() => setShowWalkIn(false)}
                className="px-4 py-2 border border-amber-300 rounded-lg text-sm text-amber-700 hover:bg-amber-100 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Список записанных ({bookings.length})
        </h3>

        {bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Пока никто не записался</p>
          </div>
        ) : (
          bookings.map((booking) => {
            const client = getClientById(booking.client_id);
            if (!client) return null;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {client.first_name} {client.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{client.phone}</p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                {booking.status === 'confirmed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(booking.id, 'completed')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                      Пришёл
                    </button>
                    <button
                      onClick={() => handleStatusChange(booking.id, 'no_show')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      No-show
                    </button>
                    <button
                      onClick={() => handleStatusChange(booking.id, 'cancelled_admin')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                      Отменить
                    </button>
                  </div>
                )}

                {/* Кнопка удаления для всех статусов */}
                <button
                  onClick={() => handleDeleteBooking(booking.id)}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить запись
                </button>

                {(booking.status === 'completed' || booking.status === 'no_show') && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                    <CheckCircle2 className="w-3 h-3" />
                    {booking.status === 'completed' ? 'Посещение отмечено, абонемент списан' : 'Не явился, абонемент списан'}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Модальное окно подтверждения удаления записи */}
      {deleteBookingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Подтверждение удаления</h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить эту запись?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelDeleteBooking}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDeleteBooking}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
