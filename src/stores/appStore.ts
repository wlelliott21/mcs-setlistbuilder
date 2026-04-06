import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@/types';

interface AppState {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      role: 'leader',
      setRole: (role) => set({ role }),
    }),
    { name: 'setlist-app' }
  )
);
