import { useState } from 'react';
import TagBadge from './TagBadge';
import KeyBadge from './KeyBadge';
import DurationDisplay from './DurationDisplay';
import type { Song } from '@/types';

export default function SongCard({ song, onEdit, onDelete }: { song: Song; onEdit: () => void; onDelete: () => void }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group border border-border rounded-xl p-4 bg-card hover:border-primary/30 active:border-primary/30 transition-colors space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate" style={{ fontFamily: 'Syne, sans-serif' }}>{song.title}</h3>
          <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
        </div>
        <div className="relative">
          {/* Always visible on mobile, hover on desktop */}
          <button className="w-9 h-9 flex items-center justify-center rounded-md sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-accent active:bg-accent text-muted-foreground" onClick={() => setShowMenu(!showMenu)}>⋮</button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg p-1.5 min-w-[9rem]">
                <button type="button" className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg active:bg-accent" onClick={() => { onEdit(); setShowMenu(false); }}>✏️ Edit</button>
                <button type="button" className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg active:bg-accent text-destructive" onClick={() => { onDelete(); setShowMenu(false); }}>🗑️ Delete</button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <KeyBadge musicKey={song.defaultKey} size="sm" />
        <DurationDisplay seconds={song.defaultDuration} />
        {song.versions.length > 0 && <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{song.versions.length} ver.</span>}
      </div>
      {song.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">{song.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}</div>
      )}
      {(song.audioLink || song.chartLink || song.boardTapeLink || song.choreoVideoLink) && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {song.audioLink && <a href={song.audioLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground active:text-primary hover:text-primary py-1">🎧 Audio ↗</a>}
          {song.chartLink && <a href={song.chartLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground active:text-primary hover:text-primary py-1">📄 Chart ↗</a>}
          {song.boardTapeLink && <a href={song.boardTapeLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground active:text-primary hover:text-primary py-1">🎛️ Board Tape ↗</a>}
          {song.choreoVideoLink && <a href={song.choreoVideoLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground active:text-primary hover:text-primary py-1">💃 Choreo ↗</a>}
        </div>
      )}
    </div>
  );
}
