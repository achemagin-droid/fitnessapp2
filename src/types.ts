export interface Trainer {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface ClassType {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  max_capacity: number;
  color_code: string;
}

export interface ClassSession {
  id: string;
  class_type_id: string;
  trainer_id: string;
  start_time: string; // ISO string
  end_time: string;
  is_active: boolean;
  is_mock?: boolean;
}

export interface RecurringSessionInput {
  class_type_id: string;
  trainer_id: string;
  weekdays: number[];
  start_time: string;
  duration_minutes: number;
  weeks: number;
}

export type NotificationPreference = 'telegram' | 'email' | 'none';

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  telegram_id?: string;
  notification_preference: NotificationPreference;
}

export type BookingStatus = 'confirmed' | 'waitlist' | 'cancelled_client' | 'cancelled_admin' | 'completed' | 'no_show';

export interface Booking {
  id: string;
  client_id: string;
  session_id: string;
  status: BookingStatus;
  booked_at: string;
  cancelled_at?: string;
  notes?: string;
}

export interface Pass {
  id: string;
  client_id: string;
  total_visits: number;
  remaining_visits: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'exhausted';
  created_at: string;
}

export interface Notification {
  id: string;
  client_id: string;
  session_id?: string;
  type: 'reminder' | 'pass_activated' | 'booking_confirmed';
  channel: 'telegram' | 'email';
  sent_at: string;
  message: string;
}
