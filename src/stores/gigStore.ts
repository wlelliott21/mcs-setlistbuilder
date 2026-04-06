import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Gig, GigSet, SetlistEntry } from '@/types';
import { MOCK_GIGS } from '@/constants/mockData';
import { generateId } from '@/lib/helpers';
import { DEFAULT_BUFFER_TIME } from '@/constants/config';

interface GigState {
  gigs: Gig[];
  addGig: (gig: Omit<Gig, 'id' | 'createdAt' | 'isLocked'>) => string;
  updateGig: (id: string, updates: Partial<Gig>) => void;
  deleteGig: (id: string) => void;
  addSet: (gigId: string, data?: Partial<GigSet>) => void;
  removeSet: (gigId: string, setId: string) => void;
  updateSet: (gigId: string, setId: string, updates: Partial<GigSet>) => void;
  addSongToSet: (gigId: string, setId: string, entry: Omit<SetlistEntry, 'id'>) => void;
  removeSongFromSet: (gigId: string, setId: string, entryId: string) => void;
  moveSongToSet: (gigId: string, fromSetId: string, toSetId: string, entryId: string) => void;
  reorderSongsInSet: (gigId: string, setId: string, entries: SetlistEntry[]) => void;
  updateSetlistEntry: (gigId: string, setId: string, entryId: string, updates: Partial<SetlistEntry>) => void;
  toggleLock: (gigId: string) => void;
  setBufferTime: (gigId: string, seconds: number) => void;
}

const mapGigSets = (
  state: { gigs: Gig[] },
  gigId: string,
  fn: (sets: GigSet[]) => GigSet[]
) => ({
  gigs: state.gigs.map((g) => (g.id === gigId ? { ...g, sets: fn(g.sets) } : g)),
});

const mapSet = (sets: GigSet[], setId: string, fn: (s: GigSet) => GigSet) =>
  sets.map((s) => (s.id === setId ? fn(s) : s));

export const useGigStore = create<GigState>()(
  persist(
    (set) => ({
      gigs: MOCK_GIGS,

      addGig: (data) => {
        const id = generateId();
        set((st) => ({
          gigs: [...st.gigs, { ...data, id, isLocked: false, createdAt: new Date().toISOString() }],
        }));
        return id;
      },

      updateGig: (id, updates) =>
        set((st) => ({ gigs: st.gigs.map((g) => (g.id === id ? { ...g, ...updates } : g)) })),

      deleteGig: (id) => set((st) => ({ gigs: st.gigs.filter((g) => g.id !== id) })),

      addSet: (gigId, data) =>
        set((st) =>
          mapGigSets(st, gigId, (sets) => [
            ...sets,
            {
              id: generateId(),
              name: data?.name || `Set ${sets.length + 1}`,
              targetDuration: data?.targetDuration || 45,
              entries: [],
              collapsed: false,
              ...data,
            },
          ])
        ),

      removeSet: (gigId, setId) =>
        set((st) => mapGigSets(st, gigId, (sets) => sets.filter((s) => s.id !== setId))),

      updateSet: (gigId, setId, updates) =>
        set((st) => mapGigSets(st, gigId, (sets) => mapSet(sets, setId, (s) => ({ ...s, ...updates })))),

      addSongToSet: (gigId, setId, entry) =>
        set((st) =>
          mapGigSets(st, gigId, (sets) =>
            mapSet(sets, setId, (s) => ({ ...s, entries: [...s.entries, { ...entry, id: generateId() }] }))
          )
        ),

      removeSongFromSet: (gigId, setId, entryId) =>
        set((st) =>
          mapGigSets(st, gigId, (sets) =>
            mapSet(sets, setId, (s) => ({ ...s, entries: s.entries.filter((e) => e.id !== entryId) }))
          )
        ),

      moveSongToSet: (gigId, fromSetId, toSetId, entryId) =>
        set((st) => {
          const gig = st.gigs.find((g) => g.id === gigId);
          const entry = gig?.sets.find((s) => s.id === fromSetId)?.entries.find((e) => e.id === entryId);
          if (!entry) return st;
          return mapGigSets(st, gigId, (sets) =>
            sets.map((s) => {
              if (s.id === fromSetId) return { ...s, entries: s.entries.filter((e) => e.id !== entryId) };
              if (s.id === toSetId) return { ...s, entries: [...s.entries, entry] };
              return s;
            })
          );
        }),

      reorderSongsInSet: (gigId, setId, entries) =>
        set((st) => mapGigSets(st, gigId, (sets) => mapSet(sets, setId, (s) => ({ ...s, entries })))),

      updateSetlistEntry: (gigId, setId, entryId, updates) =>
        set((st) =>
          mapGigSets(st, gigId, (sets) =>
            mapSet(sets, setId, (s) => ({
              ...s,
              entries: s.entries.map((e) => (e.id === entryId ? { ...e, ...updates } : e)),
            }))
          )
        ),

      toggleLock: (gigId) =>
        set((st) => ({ gigs: st.gigs.map((g) => (g.id === gigId ? { ...g, isLocked: !g.isLocked } : g)) })),

      setBufferTime: (gigId, seconds) =>
        set((st) => ({ gigs: st.gigs.map((g) => (g.id === gigId ? { ...g, bufferTime: seconds } : g)) })),
    }),
    { name: 'setlist-gigs' }
  )
);
