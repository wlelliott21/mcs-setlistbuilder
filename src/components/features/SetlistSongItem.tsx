import { useState } from 'react';
import { useSongStore } from '@/stores/songStore';
import { useGigStore } from '@/stores/gigStore';
import { getEffectiveKey, getEffectiveDuration, getEffectiveNotes, getVersionName, formatDuration } from '@/lib/helpers';
import { updateEntryDb, deleteEntryDb, moveEntryToSetDb } from '@/lib/db';
import { showToast } from '@/lib/toast';
import { MUSICAL_KEYS } from '@/types';
import type { SetlistEntry, GigSet } from '@/types';
import TagBadge from '@/components/features/TagBadge';
import { cn } from '@/lib/utils';

interface Props {
  entry: SetlistEntry;
  index: number;
  gigId: string;
  setId: string;
  otherSets: GigSet[];
  isLocked: boolean;
  canEdit: boolean;
  isDuplicate: boolean;
}

export default function SetlistSongItem({ entry, index, gigId, setId, otherSets, isLocked, canEdit, isDuplicate }: Props) {
  const songs = useSongStore((s) => s.songs);
  const { removeEntryLocal, moveEntryLocal, updateEntryLocal } = useGigStore();
  const [expanded, setExpanded] = useState(false);
  const [showKeyPicker, setShowKeyPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const song = songs.find((s) => s.id === entry.songId);

  if (!song) {
    return <div className="flex items-center gap-2 px-3 py-2 text-xs text-destructive bg-destructive/10 rounded-lg">⚠️ Unknown song (deleted)</div>;
  }

  const effectiveKey = getEffectiveKey(song, entry.versionId, entry.keyOverride);
  const effectiveDur = getEffectiveDuration(song, entry.versionId);
  const versionName = getVersionName(song, entry.versionId);
  const notes = getEffectiveNotes(song, entry.versionId);
  const hasLinks = !!(song.audioLink || song.chartLink);
  const hasDetails = hasLinks || !!notes || song.tags.length > 0;

  const handleKeyChange = async (key: string) => {
    updateEntryLocal(gigId, setId, entry.id, { keyOverride: key });
    setShowKeyPicker(false);
    try { await updateEntryDb(entry.id, { key_override: key }); }
    catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleVersionChange = async (versionId?: string) => {
    updateEntryLocal(gigId, setId, entry.id, { versionId });
    setShowMenu(false);
    try { await updateEntryDb(entry.id, { version_id: versionId || null }); }
    catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleRemove = async () => {
    removeEntryLocal(gigId, setId, entry.id);
    setShowMenu(false);
    try { await deleteEntryDb(entry.id); }
    catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleMoveTo = async (toSetId: string) => {
    const targetSet = otherSets.find((s) => s.id === toSetId);
    const sortOrder = targetSet ? targetSet.entries.length : 0;
    moveEntryLocal(gigId, setId, toSetId, entry.id, entry);
    setShowMenu(false);
    try { await moveEntryToSetDb(entry.id, toSetId, sortOrder); }
    catch (err: any) { showToast(err.message, 'error'); }
  };

  return (
    <div className={cn(
      'rounded-lg transition-colors group relative bg-card/50 hover:bg-card border border-transparent hover:border-border',
      isDuplicate && 'border-amber-500/30 bg-amber-500/5',
      expanded && 'border-border bg-card'
    )}>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="text-[11px] text-muted-foreground font-mono w-5 text-right shrink-0">{index + 1}</span>
        <button type="button" className="flex-1 min-w-0 text-left cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">{song.title}</span>
            {versionName && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{versionName}</span>}
            {isDuplicate && <span className="text-amber-400 text-xs">⚠</span>}
            {hasDetails && <span className="text-muted-foreground/50 text-xs">{expanded ? '▲' : '▼'}</span>}
          </div>
          <span className="text-[11px] text-muted-foreground truncate block">{song.artist}</span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit ? (
            <div className="relative">
              <button type="button" onClick={() => setShowKeyPicker(!showKeyPicker)}
                className="h-6 min-w-[3rem] px-1.5 text-[11px] font-mono font-semibold bg-primary/10 border border-primary/20 text-primary rounded flex items-center justify-center gap-1">
                {effectiveKey} ▾
              </button>
              {showKeyPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowKeyPicker(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg p-1 max-h-48 overflow-y-auto w-20">
                    {MUSICAL_KEYS.map((k) => (
                      <button key={k} type="button"
                        className={cn('block w-full text-left px-2 py-1 text-xs font-mono rounded hover:bg-accent', effectiveKey === k && 'bg-accent font-bold')}
                        onClick={() => handleKeyChange(k)}>{k}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <span className="px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-primary/10 text-primary rounded">{effectiveKey}</span>
          )}
          <span className="text-[11px] font-mono text-muted-foreground w-10 text-right">{formatDuration(effectiveDur)}</span>
          {canEdit && (
            <div className="relative">
              <button className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent text-muted-foreground text-xs" onClick={() => setShowMenu(!showMenu)}>⋮</button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg p-1 min-w-[10rem]">
                    {song.versions.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">Version</div>
                        <button type="button" className="block w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent"
                          onClick={() => handleVersionChange(undefined)}>Default {!entry.versionId && '✓'}</button>
                        {song.versions.map((v) => (
                          <button key={v.id} type="button" className="block w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent"
                            onClick={() => handleVersionChange(v.id)}>{v.name} {entry.versionId === v.id && '✓'}</button>
                        ))}
                        <div className="h-px bg-border my-1" />
                      </>
                    )}
                    {otherSets.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">Move to</div>
                        {otherSets.map((st) => (
                          <button key={st.id} type="button" className="block w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent pl-4"
                            onClick={() => handleMoveTo(st.id)}>{st.name}</button>
                        ))}
                        <div className="h-px bg-border my-1" />
                      </>
                    )}
                    <button type="button" className="block w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent text-destructive"
                      onClick={handleRemove}>🗑️ Remove</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {expanded && hasDetails && (
        <div className="px-3 pb-3 pt-1 ml-7 space-y-2.5 border-t border-border/50">
          {hasLinks && (
            <div className="flex flex-wrap items-center gap-2">
              {song.audioLink && (
                <a href={song.audioLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                  🎧 {song.audioLink.includes('spotify') ? 'Spotify' : song.audioLink.includes('youtube') ? 'YouTube' : 'Listen'} ↗
                </a>
              )}
              {song.chartLink && (
                <a href={song.chartLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                  📄 {song.chartLink.includes('dropbox') ? 'Dropbox Chart' : 'View Chart'} ↗
                </a>
              )}
            </div>
          )}
          {song.tags.length > 0 && <div className="flex flex-wrap gap-1">{song.tags.map((t) => <TagBadge key={t} tag={t} />)}</div>}
          {notes && <div className="flex items-start gap-1.5 text-xs text-muted-foreground">📝 {notes}</div>}
        </div>
      )}
    </div>
  );
}
