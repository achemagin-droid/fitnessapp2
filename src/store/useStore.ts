import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client, Booking, Pass, ClassSession, BookingStatus, RecurringSessionInput } from '../types';
import { initialClients, initialBookings, initialPasses, sessions, classTypes } from '../data/mockData';
import { getSessions } from '../api';

interface AppState {
  // Data
  clients: Client[];
  bookings: Booking[];
  passes: Pass[];
  sessions: ClassSession[];
  useMockData: boolean;
  setMockData: (enabled: boolean) => void;
  addRecurringSessions: (input: RecurringSessionInput) => void;
  updateSession: (id: string, changes: Partial<ClassSession>, scope: 'single' | 'future') => void;
  cancelSession: (id: string, reason?: string, scope?: 'single' | 'future') => void;
  deleteSession: (id: string, scope?: 'single' | 'future') => void;
  deleteClient: (id: string) => void;
  refreshSessions: () => Promise<void>;
  
  // Client actions
  addClient: (client: Client) => void;
  findClientByPhone: (phone: string) => Client | undefined;
  getClientById: (id: string) => Client | undefined;
  
  // Booking actions
  addBooking: (booking: Booking) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  getBookingsForSession: (sessionId: string) => Booking[];
  getBookingsForClient: (clientId: string) => Booking[];
  getSessionOccupancy: (sessionId: string) => number;
  
  // Pass actions
  addPass: (pass: Pass) => void;
  getActivePassForClient: (clientId: string) => Pass | undefined;
  deductVisit: (clientId: string) => boolean;
  getAllPassesForClient: (clientId: string) => Pass[];
  
  // Helpers
  getClassType: (classTypeId: string) => typeof classTypes[0] | undefined;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: initialClients,
      bookings: initialBookings,
      passes: initialPasses,
      sessions: sessions,
      useMockData: true,
      setMockData: (enabled) => set({ useMockData: enabled, sessions: enabled ? sessions : [] }),
      addRecurringSessions: (input) => {
        const generated: ClassSession[] = [];
        const start = new Date(input.start_time);
        const end = new Date(start);
        end.setDate(end.getDate() + input.weeks * 7);
        for (const cursor = new Date(start); cursor < end; cursor.setDate(cursor.getDate() + 1)) {
          const mondayIndex = cursor.getDay() === 0 ? 6 : cursor.getDay() - 1;
          if (!input.weekdays.includes(mondayIndex)) continue;
          const itemStart = new Date(cursor);
          itemStart.setHours(start.getHours(), start.getMinutes(), 0, 0);
          const itemEnd = new Date(itemStart.getTime() + input.duration_minutes * 60000);
          generated.push({ id: `rec-${itemStart.getTime()}`, series_id: `series-${start.getTime()}`, class_type_id: input.class_type_id, trainer_id: input.trainer_id, start_time: itemStart.toISOString(), end_time: itemEnd.toISOString(), is_active: true, is_mock: true });
        }
        set(state => ({ sessions: [...state.sessions, ...generated] }));
      },
      updateSession: (id, changes, scope) => set(state => { const current = state.sessions.find(session => session.id === id); return { sessions: state.sessions.map(session => session.id === id || (scope === 'future' && current?.series_id && session.series_id === current.series_id && session.start_time >= current.start_time) ? { ...session, ...changes } : session) }; }),
      cancelSession: (id, reason, scope = 'single') => set(state => { const current = state.sessions.find(session => session.id === id); return { sessions: state.sessions.map(session => session.id === id || (scope === 'future' && current?.series_id && session.series_id === current.series_id && session.start_time >= current.start_time) ? { ...session, is_cancelled: true, cancellation_reason: reason } : session) }; }),
      deleteSession: (id, scope = 'single') => set(state => { const current = state.sessions.find(session => session.id === id); return { sessions: state.sessions.filter(session => !(session.id === id || (scope === 'future' && current?.series_id && session.series_id === current.series_id && session.start_time >= current.start_time))) }; }),
      deleteClient: (id) => set(state => ({ clients: state.clients.filter(client => client.id !== id), bookings: state.bookings.filter(booking => booking.client_id !== id), passes: state.passes.filter(pass => pass.client_id !== id) })),
      refreshSessions: async () => { const result = await getSessions(); set({ sessions: result.sessions.map(item => ({ ...item, is_active: true })) }); },
      
      addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
      
      findClientByPhone: (phone) => get().clients.find(c => c.phone === phone),
      
      getClientById: (id) => get().clients.find(c => c.id === id),
      
      addBooking: (booking) => set((state) => ({ bookings: [...state.bookings, booking] })),
      
      updateBookingStatus: (bookingId, status) => {
        const state = get();
        const booking = state.bookings.find(b => b.id === bookingId);
        if (!booking) return;
        
        set({
          bookings: state.bookings.map(b => 
            b.id === bookingId 
              ? { ...b, status, cancelled_at: ['cancelled_client', 'cancelled_admin'].includes(status) ? new Date().toISOString() : b.cancelled_at }
              : b
          )
        });
        
        // FIFO deduction on completed or no_show
        if (status === 'completed' || status === 'no_show') {
          get().deductVisit(booking.client_id);
        }
      },
      
      getBookingsForSession: (sessionId) => get().bookings.filter(b => b.session_id === sessionId && !['cancelled_client', 'cancelled_admin'].includes(b.status)),
      
      getBookingsForClient: (clientId) => get().bookings.filter(b => b.client_id === clientId),
      
      getSessionOccupancy: (sessionId) => get().bookings.filter(b => b.session_id === sessionId && !['cancelled_client', 'cancelled_admin'].includes(b.status)).length,
      
      addPass: (pass) => set((state) => ({ passes: [...state.passes, pass] })),
      
      getActivePassForClient: (clientId) => {
        const now = new Date();
        return get().passes
          .filter(p => p.client_id === clientId && p.status === 'active' && p.remaining_visits > 0 && new Date(p.end_date) > now)
          .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];
      },
      
      deductVisit: (clientId) => {
        const pass = get().getActivePassForClient(clientId);
        if (!pass) return false;
        
        set({
          passes: get().passes.map(p => {
            if (p.id === pass.id) {
              const newRemaining = p.remaining_visits - 1;
              return { ...p, remaining_visits: newRemaining, status: newRemaining === 0 ? 'exhausted' as const : p.status };
            }
            return p;
          })
        });
        return true;
      },
      
      getAllPassesForClient: (clientId) => get().passes.filter(p => p.client_id === clientId),
      
      getClassType: (classTypeId) => classTypes.find(ct => ct.id === classTypeId),
    }),
    {
      name: 'checklis-booking-storage',
    }
  )
);
