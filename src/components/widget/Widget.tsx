import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { classTypes, trainers } from '../../data/mockData';
import { format, isToday, isTomorrow, parseISO, startOfDay, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, Clock, Users, MapPin, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import BookingForm from './BookingForm';

export default function Widget() {
  const { sessions, getSessionOccupancy, useMockData, refreshSessions } = useStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  useEffect(() => { if (!useMockData) refreshSessions().catch(() => undefined); }, [useMockData]);

  const weekDays = useMemo(() => {
    const start = addDays(startOfDay(new Date()), weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekOffset]);

  const daySessions = useMemo(() => {
    return sessions
      .filter(s => {
        const sessionDate = startOfDay(parseISO(s.start_time));
        return sessionDate.getTime() === selectedDate.getTime() && s.is_active;
      })
      .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
  }, [sessions, selectedDate]);

  const getSessionInfo = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return null;
    const classType = classTypes.find(ct => ct.id === session.class_type_id) || { name: session.class_name, duration_minutes: Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000), max_capacity: session.max_capacity || 0, color_code: session.color_code || '#E11D48' };
    const trainer = trainers.find(t => t.id === session.trainer_id) || { name: session.trainer_name };
    const occupancy = getSessionOccupancy(sessionId);
    return { session, classType, trainer, occupancy };
  };

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return 'Сегодня';
    if (isTomorrow(date)) return 'Завтра';
    return format(date, 'd MMMM', { locale: ru });
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Вы записаны!</h2>
          <p className="text-gray-600 mb-6">Ждём вас на тренировку. Напоминание будет отправлено за 2 часа до начала.</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            {selectedSession && (() => {
              const info = getSessionInfo(selectedSession);
              if (!info) return null;
              return (
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{info.classType?.name}</p>
                  <p className="text-sm text-gray-600">{info.trainer?.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(parseISO(info.session.start_time), 'd MMMM в HH:mm', { locale: ru })}
                  </p>
                </div>
              );
            })()}
          </div>
          <button
            onClick={() => { setBookingSuccess(false); setSelectedSession(null); }}
            className="w-full bg-[#E11D48] text-white py-3 rounded-xl font-semibold hover:bg-[#BE123C] transition-colors"
          >
            Записаться ещё
          </button>
        </div>
      </div>
    );
  }

  if (selectedSession) {
    return (
      <BookingForm
        sessionId={selectedSession}
        onBack={() => setSelectedSession(null)}
        onSuccess={() => setBookingSuccess(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-rose-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E11D48] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">LIFE Studio</h1>
              <p className="text-xs text-gray-500">Запись на тренировки</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-600">
            {format(weekDays[0], 'd MMM', { locale: ru })} — {format(weekDays[6], 'd MMM', { locale: ru })}
          </span>
          <button
            onClick={() => setWeekOffset(w => Math.min(w + 1, 3))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {weekDays.map((day) => {
            const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            const dayName = format(day, 'EEE', { locale: ru });
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-[#E11D48] text-white shadow-lg shadow-rose-200'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <span className="text-xs font-medium uppercase">{dayName}</span>
                <span className="text-lg font-bold">{format(day, 'd')}</span>
              </button>
            );
          })}
        </div>

        {/* Date Label */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {formatDateLabel(selectedDate)}
        </h2>

        {/* Sessions List */}
        {daySessions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Нет занятий на этот день</p>
          </div>
        ) : (
          <div className="space-y-3">
            {daySessions.map((session) => {
              const info = getSessionInfo(session.id);
              if (!info) return null;
              const { classType, trainer, occupancy } = info;
              const isFull = occupancy >= (classType?.max_capacity || 0);
              const spotsLeft = (classType?.max_capacity || 0) - occupancy;

              return (
                <button
                  key={session.id}
                  onClick={() => !isFull && !session.is_cancelled && setSelectedSession(session.id)}
                  disabled={isFull || session.is_cancelled}
                  className={`w-full text-left bg-white rounded-2xl p-4 border transition-all animate-fade-in ${
                    isFull || session.is_cancelled
                      ? 'border-gray-100 opacity-60 cursor-not-allowed'
                      : 'border-gray-100 hover:border-[#E11D48]/30 hover:shadow-md hover:shadow-rose-100 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: classType?.color_code }}
                        />
                        <span className="font-semibold text-gray-900">{classType?.name}{session.is_cancelled ? ' (отменено)' : ''}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{trainer?.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(parseISO(session.start_time), 'HH:mm')} — {format(parseISO(session.end_time), 'HH:mm')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {occupancy}/{classType?.max_capacity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {isFull ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-500">
                          Мест нет
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                          spotsLeft <= 2 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {spotsLeft} мест
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
