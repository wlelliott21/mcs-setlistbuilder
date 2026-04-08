import { create } from 'zustand';
import type { Song } from '@/types';

interface SongState {
  songs: Song[];
  setSongs: (songs: Song[]) => void;
  addSong: (song: Song) => void;
  updateSong: (id: string, updates: Partial<Song>) => void;
  deleteSong: (id: string) => void;
  clear: () => void;
}

export const useSongStore = create<SongState>((set) => ({
  songs: [],
  setSongs: (songs) => set({ songs }),
  addSong: (song) => set((st) => ({ songs: [song, ...st.songs] })),
  updateSong: (id, updates) =>
    set((st) => ({ songs: st.songs.map((s) => (s.id === id ? { ...s, ...updates } : s)) })),
  deleteSong: (id) => set((st) => ({ songs: st.songs.filter((s) => s.id !== id) })),
  clear: () => set({ songs: [] }),
}));
