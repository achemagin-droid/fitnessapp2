import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { format, parseISO, setHours, setMinutes, addMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import { X, Calendar, Clock, User, Tag } from 'lucide-react';
import { ClassSession } from '../../types';

interface SessionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: ClassSession | null;
  initialDate?: Date;
}

export default function SessionFormModal({ isOpen, onClose, session, initialDate }: SessionFormModalProps) {
  const { addSession, updateSession, classTypes, trainers } = useStore();
  
  const [classTypeId, setClassTypeId] = useState(session?.class_type_id || '');
  const [trainerId, setTrainerId] = useState(session?.trainer_id || '');
  const [date, setDate] = useState(
    session ? format(parseISO(session.start_time), 'yyyy-MM-dd') : 
    initialDate ? format(initialDate, 'yyyy-MM-dd') : 
    format(new Date(), 'yyyy-MM-dd')
  );
  const [startTime, setStartTime] = useState(
    session ? format(parseISO(session.start_time), 'HH:mm') : '10:00'
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      setClassTypeId(session.class_type_id);
      setTrainerId(session.trainer_id);
      setDate(format(parseISO(session.start_time), 'yyyy-MM-dd'));
      setStartTime(format(parseISO(session.start_time), 'HH:mm'));
    }
  }, [session]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!classTypeId || !trainerId || !date || !startTime) {
      setError('Заполните все поля');
      return;
    }

    const classType = classTypes.find(ct => ct.id === classTypeId);
    if (!classType) return;

    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = setMinutes(setHours(new Date(date), hours), minutes);
    const endDate = addMinutes(startDate, classType.duration_minutes);

    if (session) {
      updateSession(session.id, {
        class_type_id: classTypeId,
        trainer_id: trainerId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      });
    } else {
      const newSession: ClassSession = {
        id: `s${Date.now()}`,
        class_type_id: classTypeId,
        trainer_id: trainerId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        is_active: true,
      };
      addSession(newSession);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {session ? 'Редактировать занятие' : 'Новое занятие'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Тип занятия */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Тип занятия *
            </label>
            <select
              value={classTypeId}
              onChange={(e) => setClassTypeId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48]"
            >
              <option value="">Выберите тип</option>
              {classTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name} ({ct.duration_minutes} мин, макс. {ct.max_capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Тренер */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Тренер *
            </label>
            <select
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48]"
            >
              <option value="">Выберите тренера</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.description}
                </option>
              ))}
            </select>
          </div>

          {/* Дата */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Дата *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48]"
            />
          </div>

          {/* Время начала */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Время начала *
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48]"
            />
          </div>

          {/* Предпросмотр */}
          {classTypeId && date && startTime && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Предпросмотр:</p>
              <p className="text-sm text-gray-600">
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: classTypes.find(ct => ct.id === classTypeId)?.color_code }} />
                {classTypes.find(ct => ct.id === classTypeId)?.name} с {trainers.find(t => t.id === trainerId)?.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {format(new Date(date), 'd MMMM', { locale: ru })} в {startTime}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#E11D48] text-white rounded-xl font-medium hover:bg-[#BE123C] transition-colors"
            >
              {session ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
