import { Link } from 'react-router-dom';
import { useSongStore } from '@/stores/songStore';
import { calculateSetDuration, formatDuration } from '@/lib/helpers';
import type { Gig } from '@/types';

export default function GigCard({ gig }: { gig: Gig }) {
  const songs = useSongStore((s) => s.songs);
  const totalEntries = gig.sets.reduce((sum, st) => sum + st.entries.length, 0);
  const totalSecs = gig.sets.reduce((sum, st) => sum + calculateSetDuration(st, songs, gig.bufferTime).total, 0);
  const dateStr = new Date(gig.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="border border-border rounded-xl p-4 sm:p-5 bg-card hover:border-primary/30 active:border-primary/30 transition-colors group flex flex-col gap-3 sm:gap-4">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm sm:text-base truncate" style={{ fontFamily: 'Syne, sans-serif' }}>{gig.name}</h3>
          {gig.isLocked && <span className="text-amber-400 text-xs shrink-0">🔒</span>}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground flex-wrap">
          <span>📅 {dateStr}</span>
          <span className="truncate">📍 {gig.venue}</span>
        </div>
        {gig.client && <p className="text-[11px] sm:text-xs text-muted-foreground">👤 {gig.client}</p>}
      </div>
      <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-muted-foreground">
        <span>{gig.sets.length} sets</span>
        <span>{totalEntries} songs</span>
        <span>{formatDuration(totalSecs)}</span>
      </div>
      <div className="flex items-center gap-2 pt-0.5 sm:pt-1">
        <Link to={`/gig/${gig.id}`} className="flex-1">
          <button className="w-full text-xs h-10 sm:h-8 rounded-md font-medium bg-secondary text-secondary-foreground active:bg-secondary/80 hover:bg-secondary/80 transition-colors">Open</button>
        </Link>
        <Link to={`/gig/${gig.id}/live`}>
          <button className="text-xs h-10 sm:h-8 px-4 sm:px-3 rounded-md font-medium border border-input bg-background active:bg-accent hover:bg-accent transition-colors">Live</button>
        </Link>
      </div>
    </div>
  );
}
