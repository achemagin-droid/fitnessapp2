import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { classTypes, trainers } from '../../data/mockData';
import { format, parseISO, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';
import SessionDetail from './SessionDetail';

export default function ScheduleBoard() {
  const { sessions, getSessionOccupancy } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(addDays(start, weekOffset * 7), i));
  }, [weekOffset]);

  const getSessionsForDay = (day: Date) => {
    return sessions
      .filter(s => isSameDay(parseISO(s.start_time), day) && s.is_active)
      .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
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
      {/* Week Navigation */}
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
        <button
          onClick={() => setWeekOffset(w => Math.min(w + 1, 4))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Schedule Grid */}
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
                      <button
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors group"
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
                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentage >= 90 ? 'bg-red-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
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
    </div>
  );
}
