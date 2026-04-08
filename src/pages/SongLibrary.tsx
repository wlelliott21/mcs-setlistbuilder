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
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>Song Library</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{songs.length} songs</p>
        </div>
        <Button onClick={handleNew} size="sm">+ Add Song</Button>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or artist…" className="pl-3" />
        </div>
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => setTagFilter(null)}
            className={cn('px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors', !tagFilter ? 'bg-primary/15 text-primary border-primary/30' : 'border-border text-muted-foreground hover:text-foreground')}>All</button>
          {ALL_TAGS.map((tag) => (
            <button key={tag} type="button" onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={cn('px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors', tagFilter === tag ? TAG_COLORS[tag] : 'border-border text-muted-foreground hover:text-foreground')}>{tag}</button>
          ))}
        </div>
      </div>
      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((song) => <SongCard key={song.id} song={song} onEdit={() => handleEdit(song)} onDelete={() => handleDelete(song)} />)}</div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-3xl mb-3 opacity-30">🔍</p>
          <p className="text-sm text-muted-foreground">{songs.length === 0 ? 'Your library is empty.' : 'No songs match your search.'}</p>
        </div>
      )}
      <SongFormDialog open={dialogOpen} onOpenChange={setDialogOpen} song={editSong} />
    </div>
  );
}
