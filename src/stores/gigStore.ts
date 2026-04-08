import { create } from 'zustand';
import type { Gig, GigSet, SetlistEntry } from '@/types';

interface GigState {
  gigs: Gig[];
  setGigs: (gigs: Gig[]) => void;
  addGig: (gig: Gig) => void;
  updateGig: (id: string, updates: Partial<Gig>) => void;
  deleteGig: (id: string) => void;
  // Local-only state mutations (after DB writes succeed)
  updateGigSets: (gigId: string, sets: GigSet[]) => void;
  addSetLocal: (gigId: string, gigSet: GigSet) => void;
  removeSetLocal: (gigId: string, setId: string) => void;
  updateSetLocal: (gigId: string, setId: string, updates: Partial<GigSet>) => void;
  addEntryLocal: (gigId: string, setId: string, entry: SetlistEntry) => void;
  removeEntryLocal: (gigId: string, setId: string, entryId: string) => void;
  updateEntryLocal: (gigId: string, setId: string, entryId: string, updates: Partial<SetlistEntry>) => void;
  reorderEntriesLocal: (gigId: string, setId: string, entries: SetlistEntry[]) => void;
  moveEntryLocal: (gigId: string, fromSetId: string, toSetId: string, entryId: string, entry: SetlistEntry) => void;
  clear: () => void;
}

const mapGigSets = (gigs: Gig[], gigId: string, fn: (sets: GigSet[]) => GigSet[]) =>
  gigs.map((g) => (g.id === gigId ? { ...g, sets: fn(g.sets) } : g));

const mapSet = (sets: GigSet[], setId: string, fn: (s: GigSet) => GigSet) =>
  sets.map((s) => (s.id === setId ? fn(s) : s));

export const useGigStore = create<GigState>((set) => ({
  gigs: [],
  setGigs: (gigs) => set({ gigs }),
  addGig: (gig) => set((st) => ({ gigs: [...st.gigs, gig] })),
  updateGig: (id, updates) =>
    set((st) => ({ gigs: st.gigs.map((g) => (g.id === id ? { ...g, ...updates } : g)) })),
  deleteGig: (id) => set((st) => ({ gigs: st.gigs.filter((g) => g.id !== id) })),
  updateGigSets: (gigId, sets) =>
    set((st) => ({ gigs: st.gigs.map((g) => (g.id === gigId ? { ...g, sets } : g)) })),
  addSetLocal: (gigId, gigSet) =>
    set((st) => ({ gigs: mapGigSets(st.gigs, gigId, (sets) => [...sets, gigSet]) })),
  removeSetLocal: (gigId, setId) =>
    set((st) => ({ gigs: mapGigSets(st.gigs, gigId, (sets) => sets.filter((s) => s.id !== setId)) })),
  updateSetLocal: (gigId, setId, updates) =>
    set((st) => ({ gigs: mapGigSets(st.gigs, gigId, (sets) => mapSet(sets, setId, (s) => ({ ...s, ...updates }))) })),
  addEntryLocal: (gigId, setId, entry) =>
    set((st) => ({ gigs: mapGigSets(st.gigs, gigId, (sets) => mapSet(sets, setId, (s) => ({ ...s, entries: [...s.entries, entry] }))) })),
  removeEntryLocal: (gigId, setId, entryId) =>
    set((st) => ({ gigs: mapGigSets(st.gigs, gigId, (sets) => mapSet(sets, setId, (s) => ({ ...s, entries: s.entries.filter((e) => e.id !== entryId) }))) })),
  updateEntryLocal: (gigId, setId, entryId, updates) =>
    set((st) => ({ gigs: mapGigSets(st.gigs, gigId, (sets) => mapSet(sets, setId, (s) => ({ ...s, entries: s.entries.map((e) => (e.id === entryId ? { ...e, ...updates } : e)) }))) })),
  reorderEntriesLocal: (gigId, setId, entries) =>
    set((st) => ({ gigs: mapGigSets(st.gigs, gigId, (sets) => mapSet(sets, setId, (s) => ({ ...s, entries }))) })),
  moveEntryLocal: (gigId, fromSetId, toSetId, entryId, entry) =>
    set((st) => ({
      gigs: mapGigSets(st.gigs, gigId, (sets) =>
        sets.map((s) => {
          if (s.id === fromSetId) return { ...s, entries: s.entries.filter((e) => e.id !== entryId) };
          if (s.id === toSetId) return { ...s, entries: [...s.entries, entry] };
          return s;
        })
      ),
    })),
  clear: () => set({ gigs: [] }),
}));
