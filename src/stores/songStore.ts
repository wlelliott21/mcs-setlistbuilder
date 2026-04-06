import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song, SongVersion } from '@/types';
import { MOCK_SONGS } from '@/constants/mockData';
import { generateId } from '@/lib/helpers';

interface SongState {
  songs: Song[];
  addSong: (song: Omit<Song, 'id' | 'createdAt'>) => void;
  updateSong: (id: string, updates: Partial<Song>) => void;
  deleteSong: (id: string) => void;
  addVersion: (songId: string, version: Omit<SongVersion, 'id'>) => void;
  deleteVersion: (songId: string, versionId: string) => void;
}

export const useSongStore = create<SongState>()(
  persist(
    (set) => ({
      songs: MOCK_SONGS,
      addSong: (data) =>
        set((st) => ({
          songs: [...st.songs, { ...data, id: generateId(), createdAt: new Date().toISOString() }],
        })),
      updateSong: (id, updates) =>
        set((st) => ({ songs: st.songs.map((s) => (s.id === id ? { ...s, ...updates } : s)) })),
      deleteSong: (id) =>
        set((st) => ({ songs: st.songs.filter((s) => s.id !== id) })),
      addVersion: (songId, version) =>
        set((st) => ({
          songs: st.songs.map((s) =>
            s.id === songId ? { ...s, versions: [...s.versions, { ...version, id: generateId() }] } : s
          ),
        })),
      deleteVersion: (songId, versionId) =>
        set((st) => ({
          songs: st.songs.map((s) =>
            s.id === songId ? { ...s, versions: s.versions.filter((v) => v.id !== versionId) } : s
          ),
        })),
    }),
    { name: 'setlist-songs' }
  )
);
