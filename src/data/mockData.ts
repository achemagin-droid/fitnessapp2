import { Trainer, ClassType, ClassSession, Client, Booking, Pass } from '../types';
import { addHours, addDays, startOfWeek, setHours, setMinutes } from 'date-fns';

export const trainers: Trainer[] = [
  { id: 't1', name: 'Марта', description: 'Йога, Пилатес, Растяжка', is_active: true },
  { id: 't2', name: 'Алексей', description: 'Силовые тренировки, Кроссфит', is_active: true },
  { id: 't3', name: 'Елена', description: 'Танцы, Zumba, Stretching', is_active: true },
];

export const classTypes: ClassType[] = [
  { id: 'ct1', name: 'Йога', description: 'Хатха-йога для всех уровней', duration_minutes: 60, max_capacity: 12, color_code: '#10B981', is_mock: true },
  { id: 'ct2', name: 'Пилатес', description: 'Укрепление мышечного корсета', duration_minutes: 55, max_capacity: 10, color_code: '#8B5CF6', is_mock: true },
  { id: 'ct3', name: 'Силовая', description: 'Тренировка с весом', duration_minutes: 60, max_capacity: 8, color_code: '#F59E0B', is_mock: true },
  { id: 'ct4', name: 'Растяжка', description: 'Гибкость и мобильность', duration_minutes: 45, max_capacity: 15, color_code: '#EC4899', is_mock: true },
  { id: 'ct5', name: 'Zumba', description: 'Танцевальный фитнес', duration_minutes: 60, max_capacity: 20, color_code: '#3B82F6', is_mock: true },
  { id: 'ct6', name: 'Кроссфит', description: 'Функциональный тренинг', duration_minutes: 60, max_capacity: 8, color_code: '#EF4444', is_mock: true },
];

function generateSessions(): ClassSession[] {
  const sessions: ClassSession[] = [];
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  
  const schedule: { day: number; hour: number; classTypeId: string; trainerId: string }[] = [
    { day: 0, hour: 8, classTypeId: 'ct1', trainerId: 't1' },
    { day: 0, hour: 10, classTypeId: 'ct3', trainerId: 't2' },
    { day: 0, hour: 18, classTypeId: 'ct4', trainerId: 't1' },
    { day: 0, hour: 19, classTypeId: 'ct5', trainerId: 't3' },
    { day: 1, hour: 9, classTypeId: 'ct2', trainerId: 't1' },
    { day: 1, hour: 11, classTypeId: 'ct6', trainerId: 't2' },
    { day: 1, hour: 18, classTypeId: 'ct1', trainerId: 't1' },
    { day: 1, hour: 20, classTypeId: 'ct3', trainerId: 't2' },
    { day: 2, hour: 8, classTypeId: 'ct4', trainerId: 't3' },
    { day: 2, hour: 10, classTypeId: 'ct1', trainerId: 't1' },
    { day: 2, hour: 17, classTypeId: 'ct5', trainerId: 't3' },
    { day: 2, hour: 19, classTypeId: 'ct6', trainerId: 't2' },
    { day: 3, hour: 9, classTypeId: 'ct2', trainerId: 't1' },
    { day: 3, hour: 11, classTypeId: 'ct3', trainerId: 't2' },
    { day: 3, hour: 18, classTypeId: 'ct1', trainerId: 't1' },
    { day: 3, hour: 20, classTypeId: 'ct4', trainerId: 't3' },
    { day: 4, hour: 8, classTypeId: 'ct1', trainerId: 't1' },
    { day: 4, hour: 10, classTypeId: 'ct6', trainerId: 't2' },
    { day: 4, hour: 17, classTypeId: 'ct5', trainerId: 't3' },
    { day: 4, hour: 19, classTypeId: 'ct2', trainerId: 't1' },
    { day: 5, hour: 10, classTypeId: 'ct1', trainerId: 't1' },
    { day: 5, hour: 12, classTypeId: 'ct5', trainerId: 't3' },
    { day: 6, hour: 10, classTypeId: 'ct4', trainerId: 't3' },
    { day: 6, hour: 12, classTypeId: 'ct2', trainerId: 't1' },
  ];

  let id = 1;
  for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
    for (const item of schedule) {
      const date = addDays(weekStart, item.day + weekOffset * 7);
      const startTime = setMinutes(setHours(date, item.hour), 0);
      const classType = classTypes.find(ct => ct.id === item.classTypeId)!;
      const endTime = addHours(startTime, classType.duration_minutes / 60);
      
      sessions.push({
        id: `s${id++}`,
        class_type_id: item.classTypeId,
        trainer_id: item.trainerId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        is_active: true,
      });
    }
  }

  return sessions;
}

export const sessions: ClassSession[] = generateSessions();

export const initialClients: Client[] = [
  { id: 'c1', first_name: 'Анна', last_name: 'Петрова', phone: '+79161234567', email: 'anna@mail.ru', telegram_id: '@anna_p', notification_preference: 'telegram' },
  { id: 'c2', first_name: 'Дмитрий', last_name: 'Козлов', phone: '+79171234567', email: 'dima@mail.ru', notification_preference: 'email' },
  { id: 'c3', first_name: 'Ольга', last_name: 'Сидорова', phone: '+79181234567', telegram_id: '@olga_s', notification_preference: 'telegram' },
  { id: 'c4', first_name: 'Иван', last_name: 'Новиков', phone: '+79191234567', email: 'ivan@mail.ru', notification_preference: 'email' },
  { id: 'c5', first_name: 'Мария', last_name: 'Волкова', phone: '+79201234567', telegram_id: '@maria_v', notification_preference: 'telegram' },
];

export const initialBookings: Booking[] = [
  { id: 'b1', client_id: 'c1', session_id: 's1', status: 'confirmed', booked_at: new Date().toISOString() },
  { id: 'b2', client_id: 'c2', session_id: 's1', status: 'confirmed', booked_at: new Date().toISOString() },
  { id: 'b3', client_id: 'c3', session_id: 's1', status: 'confirmed', booked_at: new Date().toISOString() },
  { id: 'b4', client_id: 'c4', session_id: 's2', status: 'confirmed', booked_at: new Date().toISOString() },
  { id: 'b5', client_id: 'c5', session_id: 's2', status: 'confirmed', booked_at: new Date().toISOString() },
  { id: 'b6', client_id: 'c1', session_id: 's3', status: 'confirmed', booked_at: new Date().toISOString() },
  { id: 'b7', client_id: 'c3', session_id: 's4', status: 'confirmed', booked_at: new Date().toISOString() },
  { id: 'b8', client_id: 'c2', session_id: 's5', status: 'confirmed', booked_at: new Date().toISOString() },
];

export const initialPasses: Pass[] = [
  { id: 'p1', client_id: 'c1', total_visits: 12, remaining_visits: 8, start_date: new Date().toISOString(), end_date: addDays(new Date(), 30).toISOString(), status: 'active', created_at: new Date().toISOString() },
  { id: 'p2', client_id: 'c2', total_visits: 8, remaining_visits: 5, start_date: new Date().toISOString(), end_date: addDays(new Date(), 30).toISOString(), status: 'active', created_at: new Date().toISOString() },
  { id: 'p3', client_id: 'c3', total_visits: 20, remaining_visits: 15, start_date: new Date().toISOString(), end_date: addDays(new Date(), 60).toISOString(), status: 'active', created_at: new Date().toISOString() },
  { id: 'p4', client_id: 'c4', total_visits: 10, remaining_visits: 3, start_date: new Date().toISOString(), end_date: addDays(new Date(), 30).toISOString(), status: 'active', created_at: new Date().toISOString() },
  { id: 'p5', client_id: 'c5', total_visits: 8, remaining_visits: 0, start_date: addDays(new Date(), -30).toISOString(), end_date: new Date().toISOString(), status: 'exhausted', created_at: addDays(new Date(), -30).toISOString() },
];
