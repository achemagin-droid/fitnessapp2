import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client, Booking, Pass, ClassSession, BookingStatus, Trainer, ClassType } from '../types';
import { initialClients, initialBookings, initialPasses, sessions, initialClassTypes, initialTrainers } from '../data/mockData';

interface AppState {
  clients: Client[];
  bookings: Booking[];
  passes: Pass[];
  sessions: ClassSession[];
  trainers: Trainer[];
  classTypes: ClassType[];
  
  addClient: (client: Client) => void;
  findClientByPhone: (phone: string) => Client | undefined;
  getClientById: (id: string) => Client | undefined;
  
  addBooking: (booking: Booking) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  getBookingsForSession: (sessionId: string) => Booking[];
  getBookingsForClient: (clientId: string) => Booking[];
  getSessionOccupancy: (sessionId: string) => number;
  
  addPass: (pass: Pass) => void;
  getActivePassForClient: (clientId: string) => Pass | undefined;
  deductVisit: (clientId: string) => boolean;
  getAllPassesForClient: (clientId: string) => Pass[];
  
  getClassType: (classTypeId: string) => ClassType | undefined;
  
  // Session management
  addSession: (session: ClassSession) => void;
  updateSession: (sessionId: string, updates: Partial<ClassSession>) => void;
  removeSession: (sessionId: string) => void;
  
  // Trainer management
  addTrainer: (trainer: Trainer) => void;
  updateTrainer: (trainerId: string, updates: Partial<Trainer>) => void;
  removeTrainer: (trainerId: string) => void;
  
  // Class type management
  addClassType: (classType: ClassType) => void;
  updateClassType: (classTypeId: string, updates: Partial<ClassType>) => void;
  removeClassType: (classTypeId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: initialClients,
      bookings: initialBookings,
      passes: initialPasses,
      sessions: sessions,
      trainers: initialTrainers,
      classTypes: initialClassTypes,
      
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
      
      getClassType: (classTypeId) => get().classTypes.find(ct => ct.id === classTypeId),
      
      // Session management
      addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
      
      updateSession: (sessionId, updates) => set((state) => ({
        sessions: state.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s)
      })),
      
      removeSession: (sessionId) => set((state) => ({
        sessions: state.sessions.filter(s => s.id !== sessionId),
        bookings: state.bookings.filter(b => b.session_id !== sessionId)
      })),
      
      // Trainer management
      addTrainer: (trainer) => set((state) => ({ trainers: [...state.trainers, trainer] })),
      
      updateTrainer: (trainerId, updates) => set((state) => ({
        trainers: state.trainers.map(t => t.id === trainerId ? { ...t, ...updates } : t)
      })),
      
      removeTrainer: (trainerId) => set((state) => ({
        trainers: state.trainers.filter(t => t.id !== trainerId)
      })),
      
      // Class type management
      addClassType: (classType) => set((state) => ({ classTypes: [...state.classTypes, classType] })),
      
      updateClassType: (classTypeId, updates) => set((state) => ({
        classTypes: state.classTypes.map(ct => ct.id === classTypeId ? { ...ct, ...updates } : ct)
      })),
      
      removeClassType: (classTypeId) => set((state) => ({
        classTypes: state.classTypes.filter(ct => ct.id !== classTypeId),
        sessions: state.sessions.filter(s => s.class_type_id !== classTypeId)
      })),
    }),
    {
      name: 'checklis-booking-storage',
    }
  )
);
