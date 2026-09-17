import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { classTypes, trainers } from '../../data/mockData';
import { format, parseISO, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Users, Clock, Plus, ChevronDown } from 'lucide-react';
import SessionDetail from './SessionDetail';
import { createClassType as createClassTypeApi, createRecurringSession, getClassTypes, getTrainers, TrainerRecord, ClassTypeApi } from '../../api';

export default function ScheduleBoard({ token }: { token?: string }) {
  const { sessions, getSessionOccupancy, addRecurringSessions, useMockData } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showRecurring, setShowRecurring] = useState(false);
  const [recurring, setRecurring] = useState({ classTypeId: 'ct1', trainerId: 't1', weekdays: [0], startTime: '09:00', weeks: 8, description: '' });
  const [classTypeQuery, setClassTypeQuery] = useState('');
  const [classTypeDropdownOpen, setClassTypeDropdownOpen] = useState(false);

  const [trainerOptions, setTrainerOptions] = useState<TrainerRecord[]>([]);
  const [availableClassTypes, setAvailableClassTypes] = useState<ClassTypeApi[]>(useMockData ? classTypes : []);
  const visibleClassTypes = useMockData ? availableClassTypes : availableClassTypes.filter(item => !item.is_mock);

  React.useEffect(() => {
    const first = visibleClassTypes[0];
    if (!visibleClassTypes.some(item => item.id === recurring.classTypeId)) {
      setRecurring(current => ({ ...current, classTypeId: first?.id || '' }));
    }
    if (!classTypeQuery || classTypes.find(item => item.id === recurring.classTypeId)?.is_mock !== useMockData) {
      setClassTypeQuery(first?.name || '');
    }
  }, [useMockData]);
  React.useEffect(() => { getTrainers(token).then(result => { setTrainerOptions(result.trainers); if (result.trainers[0] && !result.trainers.some(item => item.id === recurring.trainerId)) setRecurring(current => ({ ...current, trainerId: result.trainers[0].id })); }).catch(() => setTrainerOptions([])); }, [token]);
  React.useEffect(() => { if (useMockData) { setAvailableClassTypes(classTypes); return; } getClassTypes(token).then(result => setAvailableClassTypes(result.class_types)).catch(() => setAvailableClassTypes([])); }, [token, useMockData]);

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

  const submitRecurring = async () => {
    const type = availableClassTypes.find(item => item.id === recurring.classTypeId);
    if (!type || recurring.weekdays.length === 0) return;
    const start = new Date();
    const [hours, minutes] = recurring.startTime.split(':').map(Number);
    start.setHours(hours, minutes, 0, 0);
    if (useMockData) {
      addRecurringSessions({ class_type_id: recurring.classTypeId, trainer_id: recurring.trainerId, weekdays: recurring.weekdays, start_time: start.toISOString(), duration_minutes: type.duration_minutes, weeks: recurring.weeks, description: recurring.description });
    } else {
      const end = new Date(start);
      end.setDate(end.getDate() + recurring.weeks * 7);
      await createRecurringSession(token, { class_type_id: recurring.classTypeId, trainer_id: recurring.trainerId, start_date: start.toISOString(), end_date: end.toISOString(), start_time: recurring.startTime, duration_minutes: type.duration_minutes, weekdays: recurring.weekdays, description: recurring.description });
      await useStore.getState().refreshSessions();
    }
    setShowRecurring(false);
  };

  const createClassType = async () => {
    const name = classTypeQuery.trim();
    if (!name || visibleClassTypes.some(item => item.name.toLowerCase() === name.toLowerCase())) return;
    const created = useMockData ? { id: `ct-custom-${Date.now()}`, name, description: '', duration_minutes: 60, max_capacity: 10, color_code: '#E11D48', is_mock: false, is_custom: true } : await createClassTypeApi(token, name);
    if (useMockData) classTypes.push(created);
    setAvailableClassTypes(current => [...current, created]);
    setRecurring({ ...recurring, classTypeId: created.id });
    setClassTypeQuery(created.name);
    setClassTypeDropdownOpen(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between"><div><h3 className="font-semibold text-gray-900">Повторяющееся занятие</h3><p className="text-xs text-gray-500">Создать занятия по выбранным дням недели</p></div><button onClick={() => setShowRecurring(!showRecurring)} className="bg-[#E11D48] text-white rounded-lg px-3 py-2 text-sm flex items-center gap-2"><Plus className="w-4 h-4" />Добавить</button></div>
        {showRecurring && <div className="mt-4 space-y-3"><div className="relative"><label className="block text-xs font-medium text-gray-600 mb-1">Занятие</label><div className="flex border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#E11D48]/20"><input className="min-w-0 flex-1 px-3 py-2 outline-none" value={classTypeQuery} placeholder="Введите или выберите занятие" onFocus={() => setClassTypeDropdownOpen(true)} onChange={e => { setClassTypeQuery(e.target.value); setClassTypeDropdownOpen(true); }} /><button type="button" aria-label="Открыть список занятий" onClick={() => setClassTypeDropdownOpen(open => !open)} className="px-3 border-l bg-gray-50 hover:bg-rose-50"><ChevronDown className={`w-4 h-4 transition-transform ${classTypeDropdownOpen ? 'rotate-180' : ''}`} /></button></div>{classTypeDropdownOpen && <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">{visibleClassTypes.filter(item => item.name.toLowerCase().includes(classTypeQuery.toLowerCase())).map(item => <button type="button" key={item.id} onClick={() => { setRecurring({ ...recurring, classTypeId: item.id }); setClassTypeQuery(item.name); setClassTypeDropdownOpen(false); }} className={`block w-full text-left px-3 py-2 hover:bg-rose-50 ${recurring.classTypeId === item.id ? 'bg-rose-50 font-medium' : ''}`}><span className="block text-sm">{item.name}</span><span className="block text-xs text-gray-500">{item.duration_minutes} мин · до {item.max_capacity} чел.</span></button>)}{visibleClassTypes.filter(item => item.name.toLowerCase().includes(classTypeQuery.toLowerCase())).length === 0 && <button type="button" onClick={createClassType} className="w-full text-left px-3 py-2 text-sm text-[#E11D48] hover:bg-rose-50">+ Создать новый вид занятия «{classTypeQuery}»</button>}</div>}</div><div className="grid md:grid-cols-4 gap-3"><select className="border rounded-lg px-3 py-2" value={recurring.trainerId} onChange={e => setRecurring({ ...recurring, trainerId: e.target.value })}>{trainerOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input type="time" className="border rounded-lg px-3 py-2" value={recurring.startTime} onChange={e => setRecurring({ ...recurring, startTime: e.target.value })} /><input type="number" min="1" max="52" className="border rounded-lg px-3 py-2" value={recurring.weeks} onChange={e => setRecurring({ ...recurring, weeks: Number(e.target.value) })} /><input className="border rounded-lg px-3 py-2" maxLength={1000} placeholder="Описание (необязательно)" value={recurring.description} onChange={e => setRecurring({ ...recurring, description: e.target.value })} /></div><div className="flex flex-wrap gap-2">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((label, index) => <label key={label} className="border rounded-lg px-3 py-2 text-sm"><input type="checkbox" className="mr-2" checked={recurring.weekdays.includes(index)} onChange={e => setRecurring({ ...recurring, weekdays: e.target.checked ? [...recurring.weekdays, index] : recurring.weekdays.filter(day => day !== index) })} />{label}</label>)}</div><button onClick={submitRecurring} disabled={!recurring.weekdays.length || !trainerOptions.length} className="bg-gray-900 text-white rounded-lg px-3 py-2 disabled:opacity-40">Создать занятия</button></div>}
      </div>
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
                        className={`w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors group ${session.is_cancelled ? 'opacity-60 line-through' : ''}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: classType?.color_code }}
                          />
                          <span className="text-xs font-semibold text-gray-800 truncate">
                            {classType?.name}{session.is_cancelled ? ' (отменено)' : ''}
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
