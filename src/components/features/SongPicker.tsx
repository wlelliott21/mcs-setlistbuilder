import { useState, useMemo } from 'react';
import { useSongStore } from '@/stores/songStore';
import { useGigStore } from '@/stores/gigStore';
import { getSmartSuggestions, formatDuration } from '@/lib/helpers';
import TagBadge from './TagBadge';
import { ALL_TAGS, TAG_COLORS } from '@/types';
import type { Tag, GigSet } from '@/types';
import { cn } from '@/lib/utils';
import { showToast } from '@/lib/toast';

interface Props {
  gigId: string;
  activeSetId: string | null;
  activeSetName: string;
  allSets: GigSet[];
}

export default function SongPicker({ gigId, activeSetId, activeSetName, allSets }: Props) {
  const songs = useSongStore((s) => s.songs);
  const { addSongToSet } = useGigStore();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<Tag | null>(null);

  const usedSongIds = useMemo(() => new Set(allSets.flatMap((s) => s.entries.map((e) => e.songId))), [allSets]);

  const filtered = useMemo(() => {
    let result = songs;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
    }
    if (tagFilter) result = result.filter((s) => s.tags.includes(tagFilter));
    return result;
  }, [songs, search, tagFilter]);

  const activeSet = allSets.find((s) => s.id === activeSetId);
  const suggestions = useMemo(() => {
    if (!activeSet) return [];
    return getSmartSuggestions(activeSet, allSets, songs);
  }, [activeSet, allSets, songs]);

  const handleAdd = (songId: string) => {
    if (!activeSetId) { showToast('Select a set first', 'error'); return; }
    if (usedSongIds.has(songId)) showToast('Song already in setlist — added anyway', 'warning');
    addSongToSet(gigId, activeSetId, { songId });
    showToast('Song added');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-3 shrink-0">
        <div className="text-xs font-medium text-muted-foreground">
          Adding to: <span className="text-primary font-semibold">{activeSetName || 'Select a set'}</span>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search songs…"
          className="w-full h-8 text-sm rounded-md border border-input bg-background px-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => setTagFilter(null)}
            className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors', !tagFilter ? 'bg-primary/15 text-primary border-primary/30' : 'border-border text-muted-foreground hover:text-foreground')}>
            All
          </button>
          {ALL_TAGS.map((tag) => (
            <button key={tag} type="button" onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors', tagFilter === tag ? TAG_COLORS[tag] : 'border-border text-muted-foreground hover:text-foreground')}>
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="h-px bg-border" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-0.5">
          {filtered.map((song) => {
            const inGig = usedSongIds.has(song.id);
            return (
              <div key={song.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{song.title}</span>
                    {inGig && <span className="text-amber-400 text-xs">⚠</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="truncate">{song.artist}</span>
                    <span className="font-mono">{song.defaultKey}</span>
                    <span className="font-mono">{formatDuration(song.defaultDuration)}</span>
                  </div>
                </div>
                <button className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/10 text-sm font-bold"
                  onClick={() => handleAdd(song.id)} disabled={!activeSetId}>+</button>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No songs match</p>}
        </div>
        {suggestions.length > 0 && (
          <div className="p-2 pt-0">
            <div className="h-px bg-border mb-2" />
            <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-amber-400">✨ Smart Suggestions</div>
            <div className="space-y-0.5">
              {suggestions.map((song) => (
                <div key={song.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors group">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{song.title}</span>
                    <span className="text-[11px] text-muted-foreground">{song.artist}</span>
                  </div>
                  <button className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 text-primary hover:bg-primary/10 text-sm font-bold"
                    onClick={() => handleAdd(song.id)} disabled={!activeSetId}>+</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
