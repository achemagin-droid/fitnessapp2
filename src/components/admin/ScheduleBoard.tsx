import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { format, parseISO, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Users, Clock, Plus, Trash2, Edit2 } from 'lucide-react';
import SessionDetail from './SessionDetail';
import SessionFormModal from './SessionFormModal';

export default function ScheduleBoard() {
  const { sessions, getSessionOccupancy, removeSession, classTypes, trainers } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [selectedDateForCreate, setSelectedDateForCreate] = useState<Date | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(addDays(start, weekOffset * 7), i));
  }, [weekOffset]);

  const getSessionsForDay = (day: Date) => {
    return sessions
      .filter(s => isSameDay(parseISO(s.start_time), day) && s.is_active)
      .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteSessionId(sessionId);
  };

  const confirmDeleteSession = () => {
    if (deleteSessionId) {
      removeSession(deleteSessionId);
      setDeleteSessionId(null);
    }
  };

  const cancelDeleteSession = () => {
    setDeleteSessionId(null);
  };

  const handleEditSession = (session: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSession(session);
    setShowCreateModal(true);
  };

  const handleCreateSession = (day: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDateForCreate(day);
    setShowCreateModal(true);
  };

  if (selectedSessionId) {
    return (
      <SessionDetail
        sessionId={selectedSessionId}
        onBack={() => setSelectedSessionId(null)}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">
          {format(weekDays[0], 'd MMMM', { locale: ru })} — {format(weekDays[6], 'd MMMM, yyyy', { locale: ru })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedDateForCreate(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#E11D48] text-white rounded-lg text-sm font-medium hover:bg-[#BE123C] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Создать</span>
          </button>
          <button
            onClick={() => setWeekOffset(w => Math.min(w + 1, 4))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const daySessions = getSessionsForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`rounded-xl border p-3 ${
                isCurrentDay ? 'border-[#E11D48]/30 bg-rose-50/50' : 'border-gray-100 bg-white'
              }`}
            >
              <div className={`text-center mb-3 pb-2 border-b ${isCurrentDay ? 'border-rose-200' : 'border-gray-100'}`}>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  {format(day, 'EEE', { locale: ru })}
                </p>
                <p className={`text-xl font-bold ${isCurrentDay ? 'text-[#E11D48]' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </p>
              </div>

              <div className="space-y-2">
                {daySessions.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">—</p>
                ) : (
                  daySessions.map((session) => {
                    const classType = classTypes.find(ct => ct.id === session.class_type_id);
                    const trainer = trainers.find(t => t.id === session.trainer_id);
                    const occupancy = getSessionOccupancy(session.id);
                    const maxCap = classType?.max_capacity || 0;
                    const percentage = maxCap > 0 ? (occupancy / maxCap) * 100 : 0;

                    return (
                      <div key={session.id} className="relative group">
                        <button
                          onClick={() => setSelectedSessionId(session.id)}
                          className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: classType?.color_code }}
                            />
                            <span className="text-xs font-semibold text-gray-800 truncate">
                              {classType?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <Clock className="w-3 h-3" />
                            {format(parseISO(session.start_time), 'HH:mm')}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
                            <Users className="w-3 h-3" />
                            {occupancy}/{maxCap}
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentage >= 90 ? 'bg-red-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </button>
                        
                        {/* Action buttons */}
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleEditSession(session, e)}
                            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500" /> Свободно
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" /> Заполняется
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" /> Почти полно
        </span>
      </div>

      {/* Session Form Modal */}
      <SessionFormModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingSession(null);
          setSelectedDateForCreate(null);
        }}
        session={editingSession}
        initialDate={selectedDateForCreate || undefined}
      />

      {/* Модальное окно подтверждения удаления занятия */}
      {deleteSessionId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Подтверждение удаления</h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить это занятие? Все записи на это занятие также будут удалены.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelDeleteSession}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDeleteSession}
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
