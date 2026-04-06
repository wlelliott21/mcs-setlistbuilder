import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGigStore } from '@/stores/gigStore';
import { useSongStore } from '@/stores/songStore';
import { getEffectiveKey, getEffectiveNotes, getVersionName } from '@/lib/helpers';
import { cn } from '@/lib/utils';

interface LiveItem { entryId: string; songId: string; versionId?: string; keyOverride?: string; setName: string; setIndex: number; indexInSet: number; totalInSet: number; }

export default function LiveMode() {
  const { gigId } = useParams<{ gigId: string }>();
  const navigate = useNavigate();
  const gig = useGigStore((s) => s.gigs.find((g) => g.id === gigId));
  const songs = useSongStore((s) => s.songs);
  const [current, setCurrent] = useState(0);
  const [showNotes, setShowNotes] = useState(true);

  const items = useMemo<LiveItem[]>(() => {
    if (!gig) return [];
    const result: LiveItem[] = [];
    gig.sets.forEach((set, si) => { set.entries.forEach((entry, ei) => { result.push({ entryId: entry.id, songId: entry.songId, versionId: entry.versionId, keyOverride: entry.keyOverride, setName: set.name, setIndex: si, indexInSet: ei, totalInSet: set.entries.length }); }); });
    return result;
  }, [gig]);

  const goNext = useCallback(() => setCurrent((c) => Math.min(c + 1, items.length - 1)), [items.length]);
  const goPrev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape') navigate(`/gig/${gigId}`);
      if (e.key === 'n') setShowNotes((v) => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, navigate, gigId]);

  if (!gig || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white gap-4">
        <p className="text-white/50">{!gig ? 'Gig not found' : 'No songs in this setlist'}</p>
        <button className="text-white/60 hover:text-white text-sm border border-white/20 px-4 py-2 rounded" onClick={() => navigate(gig ? `/gig/${gigId}` : '/')}>Go Back</button>
      </div>
    );
  }

  const item = items[current];
  const song = songs.find((s) => s.id === item.songId);
  const nextItem = current < items.length - 1 ? items[current + 1] : null;
  const nextSong = nextItem ? songs.find((s) => s.id === nextItem.songId) : null;
  const effectiveKey = song ? getEffectiveKey(song, item.versionId, item.keyOverride) : '?';
  const notes = song ? getEffectiveNotes(song, item.versionId) : '';
  const versionName = song ? getVersionName(song, item.versionId) : null;
  const isNewSet = current === 0 || items[current - 1].setIndex !== item.setIndex;
  const nextIsNewSet = nextItem ? nextItem.setIndex !== item.setIndex : false;
  const nextEffectiveKey = nextSong && nextItem ? getEffectiveKey(nextSong, nextItem.versionId, nextItem.keyOverride) : '';

  return (
    <div className="h-screen bg-black text-white flex flex-col select-none overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button className="text-white/60 hover:text-white text-sm" onClick={() => navigate(`/gig/${gigId}`)}>← Exit</button>
        <div className="text-center">
          <p className="text-xs text-white/40 font-medium">{gig.name}</p>
          <p className="text-[11px] text-white/30">{item.setName} — Song {item.indexInSet + 1} of {item.totalInSet}</p>
        </div>
        <button className="text-white/40 hover:text-white text-sm" onClick={() => setShowNotes((v) => !v)}>📝</button>
      </div>
      <div className="flex items-center justify-center gap-1 px-4 pb-2 shrink-0 flex-wrap">
        {items.map((_, i) => (
          <button key={i} type="button" onClick={() => setCurrent(i)}
            className={cn('rounded-full transition-all', i === current ? 'w-2.5 h-2.5 bg-amber-500' : i < current ? 'w-1.5 h-1.5 bg-white/30' : 'w-1.5 h-1.5 bg-white/10')} />
        ))}
      </div>
      {isNewSet && <div className="text-center py-2 shrink-0"><span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">{item.setName}</span></div>}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4 cursor-pointer" onClick={goNext}>
        <div className="text-center space-y-3 max-w-2xl">
          <h1 className="font-extrabold text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-none tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>{song?.title || 'Unknown'}</h1>
          {song && <p className="text-lg md:text-xl text-white/50">{song.artist}</p>}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className="font-mono font-bold text-2xl md:text-4xl text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">{effectiveKey}</span>
            {versionName && <span className="text-sm text-white/40 bg-white/5 px-3 py-1.5 rounded-lg">{versionName}</span>}
          </div>
          {showNotes && notes && <p className="text-sm md:text-base text-white/40 mt-4 max-w-md mx-auto leading-relaxed">{notes}</p>}
        </div>
      </div>
      {nextSong && (
        <div className="text-center pb-4 shrink-0">
          {nextIsNewSet && nextItem && <p className="text-[11px] text-white/20 mb-1">Next: {nextItem.setName}</p>}
          <p className="text-sm text-white/30">Next: <span className="text-white/50 font-medium">{nextSong.title}</span><span className="font-mono text-amber-500/60 ml-2">{nextEffectiveKey}</span></p>
        </div>
      )}
      {!nextSong && <div className="text-center pb-4 shrink-0"><p className="text-sm text-white/20 font-medium">End of Setlist</p></div>}
      <div className="flex items-center justify-between px-6 pb-6 shrink-0">
        <button className="text-white/40 hover:text-white px-4 py-2 disabled:opacity-20" onClick={goPrev} disabled={current === 0}>← Prev</button>
        <span className="text-xs text-white/20 font-mono">{current + 1} / {items.length}</span>
        <button className="text-white/40 hover:text-white px-4 py-2 disabled:opacity-20" onClick={goNext} disabled={current >= items.length - 1}>Next →</button>
      </div>
    </div>
  );
}
