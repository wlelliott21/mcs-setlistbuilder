import type { Song, GigSet, Tag } from '@/types';

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function parseDuration(str: string): number {
  const parts = str.split(':');
  if (parts.length === 2) {
    return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
  }
  return parseInt(str) || 0;
}

export function getEffectiveKey(song: Song, versionId?: string, keyOverride?: string): string {
  if (keyOverride) return keyOverride;
  if (versionId) {
    const v = song.versions.find((x) => x.id === versionId);
    if (v?.key) return v.key;
  }
  return song.defaultKey;
}

export function getEffectiveDuration(song: Song, versionId?: string): number {
  if (versionId) {
    const v = song.versions.find((x) => x.id === versionId);
    if (v?.duration) return v.duration;
  }
  return song.defaultDuration;
}

export function getEffectiveNotes(song: Song, versionId?: string): string {
  if (versionId) {
    const v = song.versions.find((x) => x.id === versionId);
    if (v?.notes) return v.notes;
  }
  return song.notes || '';
}

export function getVersionName(song: Song, versionId?: string): string | null {
  if (!versionId) return null;
  return song.versions.find((x) => x.id === versionId)?.name || null;
}

export function calculateSetDuration(
  set: GigSet,
  songs: Song[],
  bufferTime: number
): { total: number; target: number; remaining: number; percentage: number } {
  const durations = set.entries.map((e) => {
    const song = songs.find((s) => s.id === e.songId);
    return song ? getEffectiveDuration(song, e.versionId) : 0;
  });
  const totalSong = durations.reduce((a, b) => a + b, 0);
  const buffers = set.entries.length > 1 ? (set.entries.length - 1) * bufferTime : 0;
  const total = totalSong + buffers;
  const target = set.targetDuration * 60;
  return { total, target, remaining: target - total, percentage: target > 0 ? Math.min((total / target) * 100, 100) : 0 };
}

const TAG_ENERGY: Record<Tag, number> = {
  'High Energy': 5, 'Dance Floor': 4, 'Encore': 4, 'Corporate': 3,
  'Cake Cutting': 2, 'First Dance': 2, 'Dinner': 1, 'Slow': 1,
};

export function getSongEnergy(song: Song): number {
  if (song.tags.length === 0) return 3;
  return Math.round(song.tags.reduce((sum, t) => sum + (TAG_ENERGY[t] || 3), 0) / song.tags.length);
}

export function getSmartSuggestions(
  currentSet: GigSet, allSets: GigSet[], songs: Song[], count = 5
): Song[] {
  const usedIds = new Set(allSets.flatMap((s) => s.entries.map((e) => e.songId)));
  const available = songs.filter((s) => !usedIds.has(s.id));
  if (currentSet.entries.length === 0) return available.slice(0, count);
  const lastEntry = currentSet.entries[currentSet.entries.length - 1];
  const lastSong = songs.find((s) => s.id === lastEntry.songId);
  if (!lastSong) return available.slice(0, count);
  const lastEnergy = getSongEnergy(lastSong);
  const scored = available.map((song) => {
    const diff = Math.abs(getSongEnergy(song) - lastEnergy);
    let score = diff === 1 ? 3 : diff === 0 ? 1 : diff === 2 ? 2 : 0;
    score += song.tags.filter((t) => lastSong.tags.includes(t)).length * 0.5;
    if (song.artist === lastSong.artist) score -= 2;
    return { song, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.song);
}

export function findDuplicatesAcrossSets(sets: GigSet[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const set of sets) {
    for (const e of set.entries) {
      const arr = map.get(e.songId) || [];
      if (!arr.includes(set.id)) arr.push(set.id);
      map.set(e.songId, arr);
    }
  }
  const dupes = new Map<string, string[]>();
  map.forEach((ids, songId) => { if (ids.length > 1) dupes.set(songId, ids); });
  return dupes;
}
