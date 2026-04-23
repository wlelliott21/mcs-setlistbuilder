export type Tag =
  | 'High Energy'
  | 'Dance Floor'
  | 'Slow'
  | 'Dinner'
  | 'First Dance'
  | 'Encore'
  | 'Corporate'
  | 'Cake Cutting';

export const ALL_TAGS: Tag[] = [
  'High Energy', 'Dance Floor', 'Slow', 'Dinner',
  'First Dance', 'Encore', 'Corporate', 'Cake Cutting',
];

export const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F',
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm',
  'F#m', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm',
] as const;

export type MusicalKey = (typeof MUSICAL_KEYS)[number];

export interface SongVersion {
  id: string;
  name: string;
  key?: string;
  duration?: number;
  notes?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  defaultKey: string;
  defaultDuration: number;
  audioLink?: string;
  chartLink?: string;
  boardTapeLink?: string;
  choreoVideoLink?: string;
  notes?: string;
  tags: Tag[];
  versions: SongVersion[];
  createdAt: string;
}

export interface SetlistEntry {
  id: string;
  songId: string;
  versionId?: string;
  keyOverride?: string;
}

export interface GigSet {
  id: string;
  name: string;
  targetDuration: number;
  entries: SetlistEntry[];
  collapsed?: boolean;
}

export interface Gig {
  id: string;
  name: string;
  date: string;
  venue: string;
  client?: string;
  notes?: string;
  bufferTime: number;
  isLocked: boolean;
  shareToken?: string;
  createdAt: string;
  sets: GigSet[];
}

export const TAG_COLORS: Record<Tag, string> = {
  'High Energy': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Dance Floor': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'Slow': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Dinner': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'First Dance': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Encore': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Corporate': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Cake Cutting': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export const TAG_DOT_COLORS: Record<Tag, string> = {
  'High Energy': 'bg-red-400',
  'Dance Floor': 'bg-violet-400',
  'Slow': 'bg-blue-400',
  'Dinner': 'bg-emerald-400',
  'First Dance': 'bg-pink-400',
  'Encore': 'bg-amber-400',
  'Corporate': 'bg-cyan-400',
  'Cake Cutting': 'bg-purple-400',
};

export interface GigTemplate {
  id: string;
  name: string;
  description: string;
  sets: { name: string; targetDuration: number }[];
}

export interface Collaborator {
  id: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  collaboratorId: string | null;
  collaboratorEmail: string;
  collaboratorName: string | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Workspace {
  ownerId: string;
  ownerName: string;
  isOwn: boolean;
}
