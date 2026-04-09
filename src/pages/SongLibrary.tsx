import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSongStore } from '@/stores/songStore';
import SongCard from '@/components/features/SongCard';
import SongFormDialog from '@/components/features/SongFormDialog';
import { ALL_TAGS, TAG_COLORS } from '@/types';
import type { Song, Tag } from '@/types';
import { cn } from '@/lib/utils';
import { deleteSongDb } from '@/lib/db';
import { showToast } from '@/lib/toast';

export default function SongLibrary() {
  const songs = useSongStore((s) => s.songs);
  const deleteSong = useSongStore((s) => s.deleteSong);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<Tag | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSong, setEditSong] = useState<Song | null>(null);

  const filtered = useMemo(() => {
    let result = songs;
    if (search.trim()) { const q = search.toLowerCase(); result = result.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)); }
    if (tagFilter) result = result.filter((s) => s.tags.includes(tagFilter));
    return result.sort((a, b) => a.title.localeCompare(b.title));
  }, [songs, search, tagFilter]);

  const handleEdit = (song: Song) => { setEditSong(song); setDialogOpen(true); };
  const handleDelete = async (song: Song) => {
    try {
      await deleteSongDb(song.id);
      deleteSong(song.id);
      showToast(`"${song.title}" removed`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };
  const handleNew = () => { setEditSong(null); setDialogOpen(true); };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 pb-24 sm:pb-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-lg sm:text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>Song Library</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{songs.length} songs</p>
        </div>
        <Button onClick={handleNew} size="sm" className="h-9 min-w-[44px]">+ Add Song</Button>
      </div>

      {/* Search */}
      <div className="space-y-2.5">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or artist…" className="h-10" />
        {/* Tag filter — horizontal scroll on mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide">
          <button type="button" onClick={() => setTagFilter(null)}
            className={cn('px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 min-h-[32px]', !tagFilter ? 'bg-primary/15 text-primary border-primary/30' : 'border-border text-muted-foreground active:text-foreground')}>All</button>
          {ALL_TAGS.map((tag) => (
            <button key={tag} type="button" onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={cn('px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 min-h-[32px]', tagFilter === tag ? TAG_COLORS[tag] : 'border-border text-muted-foreground active:text-foreground')}>{tag}</button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((song) => <SongCard key={song.id} song={song} onEdit={() => handleEdit(song)} onDelete={() => handleDelete(song)} />)}</div>
      ) : (
        <div className="text-center py-12 sm:py-16 border border-dashed border-border rounded-xl">
          <p className="text-3xl mb-3 opacity-30">🔍</p>
          <p className="text-sm text-muted-foreground">{songs.length === 0 ? 'Your library is empty.' : 'No songs match your search.'}</p>
        </div>
      )}
      <SongFormDialog open={dialogOpen} onOpenChange={setDialogOpen} song={editSong} />
    </div>
  );
}
