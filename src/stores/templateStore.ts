import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SetlistTemplate, SetlistTemplateSet } from '@/types';
import { generateId } from '@/lib/helpers';

interface TemplateState {
  templates: SetlistTemplate[];
  addTemplate: (data: { name: string; description?: string; sets: SetlistTemplateSet[] }) => string;
  updateTemplate: (id: string, updates: Partial<Omit<SetlistTemplate, 'id' | 'createdAt'>>) => void;
  deleteTemplate: (id: string) => void;
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set) => ({
      templates: [],

      addTemplate: (data) => {
        const id = generateId();
        set((st) => ({
          templates: [
            ...st.templates,
            { ...data, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },

      updateTemplate: (id, updates) =>
        set((st) => ({
          templates: st.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTemplate: (id) =>
        set((st) => ({
          templates: st.templates.filter((t) => t.id !== id),
        })),
    }),
    { name: 'setlist-templates' }
  )
);
