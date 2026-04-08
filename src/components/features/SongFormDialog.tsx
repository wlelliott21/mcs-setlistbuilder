import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSongStore } from '@/stores/songStore';
import { useAuth } from '@/hooks/useAuth';
import { createSong, updateSongDb, fetchSongs } from '@/lib/db';
import { formatDuration, parseDuration } from '@/lib/helpers';
import { MUSICAL_KEYS, ALL_TAGS, TAG_COLORS } from '@/types';
import type { Song, Tag } from '@/types';
import { cn } from '@/lib/utils';
import { showToast } from '@/lib/toast';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; song?: Song | null; }
interface VersionForm { id: string; name: string; key: string; duration: string; notes: string; }

const emptyForm = { title: '', artist: '', defaultKey: 'C', defaultDuration: '3:30', audioLink: '', chartLink: '', boardTapeLink: '', choreoVideoLink: '', notes: '', tags: [] as Tag[] };

export default function SongFormDialog({ open, onOpenChange, song }: Props) {
  const { updateSong, setSongs } = useSongStore();
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [versions, setVersions] = useState<VersionForm[]>([]);
  const [showKeyPicker, setShowKeyPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (song) {
      setForm({ title: song.title, artist: song.artist, defaultKey: song.defaultKey, defaultDuration: formatDuration(song.defaultDuration), audioLink: song.audioLink || '', chartLink: song.chartLink || '', boardTapeLink: song.boardTapeLink || '', choreoVideoLink: song.choreoVideoLink || '', notes: song.notes || '', tags: [...song.tags] });
      setVersions(song.versions.map((v) => ({ id: v.id, name: v.name, key: v.key || '', duration: v.duration ? formatDuration(v.duration) : '', notes: v.notes || '' })));
    } else { setForm(emptyForm); setVersions([]); }
  }, [song, open]);

  const toggleTag = (tag: Tag) => setForm((f) => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.artist.trim()) { showToast('Title and Artist are required', 'error'); return; }
    if (!user) return;
    setSaving(true);

    const versionData = versions.filter((v) => v.name.trim()).map((v) => ({
      id: v.id,
      name: v.name.trim(),
      key: v.key || undefined,
      duration: v.duration ? parseDuration(v.duration) : undefined,
      notes: v.notes || undefined,
    }));

    try {
      if (song) {
        const updates: Partial<Song> = {
          title: form.title.trim(), artist: form.artist.trim(), defaultKey: form.defaultKey,
          defaultDuration: parseDuration(form.defaultDuration),
          audioLink: form.audioLink || undefined, chartLink: form.chartLink || undefined,
          boardTapeLink: form.boardTapeLink || undefined, choreoVideoLink: form.choreoVideoLink || undefined,
          notes: form.notes || undefined, tags: form.tags, versions: versionData,
        };
        await updateSongDb(song.id, updates);
        // Refetch to get correct version IDs from DB
        const freshSongs = await fetchSongs(user.id);
        setSongs(freshSongs);
        showToast('Song updated');
      } else {
        await createSong(user.id, {
          title: form.title.trim(), artist: form.artist.trim(), defaultKey: form.defaultKey,
          defaultDuration: parseDuration(form.defaultDuration),
          audioLink: form.audioLink || undefined, chartLink: form.chartLink || undefined,
          boardTapeLink: form.boardTapeLink || undefined, choreoVideoLink: form.choreoVideoLink || undefined,
          notes: form.notes || undefined, tags: form.tags, versions: versionData,
        });
        const freshSongs = await fetchSongs(user.id);
        setSongs(freshSongs);
        showToast('Song added to library');
      }
      onOpenChange(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addVersionRow = () => setVersions((v) => [...v, { id: crypto.randomUUID(), name: '', key: '', duration: '', notes: '' }]);
  const updateVersion = (i: number, field: keyof VersionForm, value: string) => setVersions((v) => v.map((x, j) => j === i ? { ...x, [field]: value } : x));
  const removeVersion = (i: number) => setVersions((v) => v.filter((_, j) => j !== i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Syne, sans-serif' }}>{song ? 'Edit Song' : 'Add New Song'}</DialogTitle>
          <DialogDescription className="sr-only">{song ? 'Edit song details' : 'Add a new song'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Song title" /></div>
            <div className="space-y-1.5"><Label>Artist *</Label><Input value={form.artist} onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))} placeholder="Artist name" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Default Key</Label>
              <div className="relative">
                <button type="button" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" onClick={() => setShowKeyPicker(!showKeyPicker)}>
                  {form.defaultKey} <span className="opacity-50">▾</span>
                </button>
                {showKeyPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowKeyPicker(false)} />
                    <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-popover border border-border rounded-md shadow-lg p-1">
                      {MUSICAL_KEYS.map((k) => (
                        <button key={k} type="button" className={cn('block w-full text-left px-3 py-1.5 text-sm font-mono rounded hover:bg-accent', form.defaultKey === k && 'bg-accent font-bold')}
                          onClick={() => { setForm((f) => ({ ...f, defaultKey: k })); setShowKeyPicker(false); }}>{k}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-1.5"><Label>Duration (m:ss)</Label><Input value={form.defaultDuration} onChange={(e) => setForm((f) => ({ ...f, defaultDuration: e.target.value }))} placeholder="3:30" className="font-mono" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Audio Link</Label><Input value={form.audioLink} onChange={(e) => setForm((f) => ({ ...f, audioLink: e.target.value }))} placeholder="Spotify or YouTube URL" /></div>
            <div className="space-y-1.5"><Label>Chart Link</Label><Input value={form.chartLink} onChange={(e) => setForm((f) => ({ ...f, chartLink: e.target.value }))} placeholder="Dropbox or PDF URL" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Board Tape</Label><Input value={form.boardTapeLink} onChange={(e) => setForm((f) => ({ ...f, boardTapeLink: e.target.value }))} placeholder="Board tape URL" /></div>
            <div className="space-y-1.5"><Label>Choreo Video</Label><Input value={form.choreoVideoLink} onChange={(e) => setForm((f) => ({ ...f, choreoVideoLink: e.target.value }))} placeholder="Choreography video URL" /></div>
          </div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Performance notes, cues…" rows={2} /></div>
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={cn('px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all', form.tags.includes(tag) ? TAG_COLORS[tag] : 'border-border text-muted-foreground hover:border-muted-foreground/50')}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Versions</Label>
              <Button variant="ghost" size="sm" onClick={addVersionRow} className="text-xs h-7">+ Add Version</Button>
            </div>
            {versions.map((v, i) => (
              <div key={v.id} className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Input value={v.name} onChange={(e) => updateVersion(i, 'name', e.target.value)} placeholder="Version name" className="flex-1 h-8 text-sm" />
                  <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground" onClick={() => removeVersion(i)}>✕</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={v.key} onChange={(e) => updateVersion(i, 'key', e.target.value)} placeholder="Key override" className="h-8 text-sm font-mono" />
                  <Input value={v.duration} onChange={(e) => updateVersion(i, 'duration', e.target.value)} placeholder="Duration (m:ss)" className="h-8 text-sm font-mono" />
                </div>
                <Input value={v.notes} onChange={(e) => updateVersion(i, 'notes', e.target.value)} placeholder="Version notes" className="h-8 text-sm" />
              </div>
            ))}
            {versions.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No versions yet.</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : song ? 'Save Changes' : 'Add Song'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
