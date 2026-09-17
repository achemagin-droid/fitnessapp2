const API_BASE = '/api';
import type { ClassSession } from './types';

export interface AuthResponse {
  username: string;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: 'include',
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'Ошибка запроса');
  }
  return response.json();
}

export const login = (username: string, password: string) =>
  request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
export const logout = () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' });
export const getMe = () => request<{ username: string }>('/auth/me');
export const getSessions = (from?: string, to?: string) => request<{ sessions: ClassSessionApi[] }>(`/sessions${from ? `?date_from=${from}&date_to=${to || from}` : ''}`);
export const createBooking = (data: BookingInput) => request<{ booking_id: string; status: string }>('/bookings', { method: 'POST', body: JSON.stringify(data) });
export const lookupClient = (phone: string) => request<ClientLookup>(`/clients/lookup?phone=${encodeURIComponent(phone)}`);

export const getTrainers = (token?: string) => request<{ trainers: TrainerRecord[] }>('/auth/trainers', {}, token);
export const createTrainer = (token: string | undefined, data: TrainerCreate) =>
  request<TrainerRecord>('/auth/trainers', { method: 'POST', body: JSON.stringify(data) }, token);
export const deleteTrainer = (token: string | undefined, id: string) =>
  request<{ ok: boolean }>(`/auth/trainers/${id}`, { method: 'DELETE' }, token);
export const getNotificationSettings = (token?: string) =>
  request<NotificationSettings>('/auth/settings/notifications', {}, token);
export const saveNotificationSettings = (token: string | undefined, data: NotificationSettingsInput) =>
  request<{ ok: boolean }>('/auth/settings/notifications', { method: 'PUT', body: JSON.stringify(data) }, token);
export const sendBroadcast = (token: string | undefined, message: string) =>
  request<{ ok: boolean; task_id: string }>('/admin/broadcast', { method: 'POST', body: JSON.stringify({ message }) }, token);
export const getAdminClients = (token?: string) => request<{ clients: AdminClient[] }>('/admin/clients', {}, token);
export const deleteAdminClient = (token: string | undefined, id: string) => request<{ ok: boolean }>(`/admin/clients/${id}`, { method: 'DELETE' }, token);

export interface TrainerRecord { id: string; name: string; description: string; username: string; }
export interface TrainerCreate { name: string; description: string; username: string; password: string; }
export interface NotificationSettings {
  telegram_bot_token_configured: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password_configured: boolean;
  smtp_from: string;
}
export interface NotificationSettingsInput {
  telegram_bot_token: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_from: string;
}
export interface ClassSessionApi { id: string; class_type_id: string; trainer_id: string; start_time: string; end_time: string; occupancy: number; max_capacity: number; class_name: string; trainer_name: string; description?: string; series_id?: string; is_cancelled?: boolean; cancellation_reason?: string; }
export interface BookingInput { client_phone: string; client_first_name: string; client_last_name?: string; session_id: string; notification_preference: string; telegram_id?: string; email?: string; }
export interface AdminClient { id: string; first_name: string; last_name: string; phone: string; email?: string; notification_preference: string; created_at?: string; }
export interface ClientLookup {
  found: boolean;
  client?: { id: string; first_name: string; last_name: string; phone: string; email?: string; telegram_id?: string; notification_preference: 'telegram' | 'email' | 'none' };
  pass?: { remaining: number; total: number; end_date: string } | null;
}
