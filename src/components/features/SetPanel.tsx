import { useState, useEffect } from 'react';
import { useGigStore } from '@/stores/gigStore';
import { useSongStore } from '@/stores/songStore';
import { calculateSetDuration, formatDuration, findDuplicatesAcrossSets } from '@/lib/helpers';
import { updateSetDb, deleteSetDb, reorderEntriesDb } from '@/lib/db';
import { showToast } from '@/lib/toast';
import DurationBar from './DurationBar';
import SetlistSongItem from './SetlistSongItem';
import type { GigSet } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  set: GigSet;
  gigId: string;
  allSets: GigSet[];
  bufferTime: number;
  canEdit: boolean;
  isActive: boolean;
  onActivate: () => void;
  onAddSong: () => void;
}

export default function SetPanel({ set, gigId, allSets, bufferTime, canEdit, isActive, onActivate, onAddSong }: Props) {
  const songs = useSongStore((s) => s.songs);
  const { updateSetLocal, removeSetLocal, reorderEntriesLocal } = useGigStore();
  const [collapsed, setCollapsed] = useState(set.collapsed || false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(set.name);

  useEffect(() => { setNameVal(set.name); }, [set.name]);

  const dur = calculateSetDuration(set, songs, bufferTime);
  const isOver = dur.remaining < 0;
  const duplicates = findDuplicatesAcrossSets(allSets);
  const otherSets = allSets.filter((s) => s.id !== set.id);

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const newEntries = [...set.entries];
    [newEntries[index - 1], newEntries[index]] = [newEntries[index], newEntries[index - 1]];
    reorderEntriesLocal(gigId, set.id, newEntries);
    try {
      await reorderEntriesDb(newEntries.map((e, i) => ({ id: e.id, sort_order: i })));
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleMoveDown = async (index: number) => {
    if (index >= set.entries.length - 1) return;
    const newEntries = [...set.entries];
    [newEntries[index], newEntries[index + 1]] = [newEntries[index + 1], newEntries[index]];
    reorderEntriesLocal(gigId, set.id, newEntries);
    try {
      await reorderEntriesDb(newEntries.map((e, i) => ({ id: e.id, sort_order: i })));
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const saveName = async () => {
    if (nameVal.trim()) {
      updateSetLocal(gigId, set.id, { name: nameVal.trim() });
      try { await updateSetDb(set.id, { name: nameVal.trim() }); }
      catch (err: any) { showToast(err.message, 'error'); }
    }
    setEditingName(false);
  };

  const handleRemoveSet = async () => {
    removeSetLocal(gigId, set.id);
    try { await deleteSetDb(set.id); }
    catch (err: any) { showToast(err.message, 'error'); }
  };

  return (
    <div className={cn('border rounded-xl transition-colors', isActive ? 'border-primary/40 bg-primary/[0.02]' : 'border-border bg-card/30')} onClick={onActivate}>
      {/* Header */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3">
        <button type="button" onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }} className="text-muted-foreground active:text-foreground hover:text-foreground transition-colors text-sm min-w-[28px] min-h-[28px] flex items-center justify-center">
          {collapsed ? '▶' : '▼'}
        </button>
        <div className="flex-1 min-w-0">
          {editingName && canEdit ? (
            <div className="flex items-center gap-1">
              <input value={nameVal} onChange={(e) => setNameVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveName()} onBlur={saveName}
                className="h-8 text-sm font-bold w-full max-w-[12rem] rounded-md border border-input bg-background px-2" style={{ fontFamily: 'Syne, sans-serif' }} autoFocus />
            </div>
          ) : (
            <button type="button" className="font-bold text-sm active:text-primary hover:text-primary transition-colors text-left" style={{ fontFamily: 'Syne, sans-serif' }}
              onClick={(e) => { e.stopPropagation(); if (canEdit) setEditingName(true); }}>
              {set.name}
            </button>
          )}
        </div>
        {/* Stats: stacked on mobile, inline on desktop */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0 flex-wrap justify-end">
          <span className="font-mono text-[11px] sm:text-xs">
            <span className={cn(isOver ? 'text-red-400' : 'text-foreground')}>{formatDuration(dur.total)}</span>
            <span className="text-muted-foreground"> / {set.targetDuration}m</span>
          </span>
          <span className={cn('font-mono text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded hidden sm:inline-block', isOver ? 'bg-red-500/15 text-red-400' : dur.remaining < 300 ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400')}>
            {isOver ? '+' : ''}{formatDuration(Math.abs(dur.remaining))} {isOver ? 'over' : 'left'}
          </span>
          <span className="text-muted-foreground text-[11px] hidden sm:inline">{set.entries.length} songs</span>
          {canEdit && allSets.length > 1 && (
            <button className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded text-muted-foreground active:text-destructive hover:text-destructive hover:bg-accent transition-colors text-xs"
              onClick={(e) => { e.stopPropagation(); handleRemoveSet(); }}>✕</button>
          )}
        </div>
      </div>

      {/* Mobile-only summary row */}
      <div className="sm:hidden flex items-center gap-2 px-3 pb-1.5 text-[10px] text-muted-foreground">
        <span className={cn('font-mono px-1.5 py-0.5 rounded', isOver ? 'bg-red-500/15 text-red-400' : dur.remaining < 300 ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400')}>
          {isOver ? '+' : ''}{formatDuration(Math.abs(dur.remaining))} {isOver ? 'over' : 'left'}
        </span>
        <span>{set.entries.length} songs</span>
      </div>

      <DurationBar percentage={dur.percentage} isOver={isOver} className="mx-3 sm:mx-4" />

      {!collapsed && (
        <div className="px-2 sm:px-3 pb-3 pt-2 space-y-1">
          {set.entries.length > 0 ? (
            <div className="space-y-0.5">
              {set.entries.map((entry, i) => (
                <div key={entry.id} className="flex items-start gap-0.5">
                  {canEdit && (
                    <div className="flex flex-col gap-0.5 pt-2 shrink-0">
                      <button type="button" onClick={() => handleMoveUp(i)} disabled={i === 0}
                        className="w-7 h-7 sm:w-5 sm:h-5 flex items-center justify-center rounded text-muted-foreground active:text-foreground hover:text-foreground hover:bg-accent disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs">↑</button>
                      <button type="button" onClick={() => handleMoveDown(i)} disabled={i === set.entries.length - 1}
                        className="w-7 h-7 sm:w-5 sm:h-5 flex items-center justify-center rounded text-muted-foreground active:text-foreground hover:text-foreground hover:bg-accent disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs">↓</button>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <SetlistSongItem entry={entry} index={i} gigId={gigId} setId={set.id} otherSets={otherSets} isLocked={!canEdit} canEdit={canEdit} isDuplicate={duplicates.has(entry.songId)} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg">No songs yet — tap Add Song</div>
          )}
          {canEdit && (
            <button className="w-full text-xs h-10 sm:h-8 mt-2 rounded-md text-muted-foreground active:text-primary hover:text-primary border border-dashed border-border active:border-primary/30 hover:border-primary/30 transition-colors font-medium"
              onClick={(e) => { e.stopPropagation(); onAddSong(); }}>+ Add Song</button>
          )}
        </div>
      )}
    </div>
  );
}
