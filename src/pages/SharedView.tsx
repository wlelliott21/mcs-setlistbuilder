import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSharedGig } from '@/lib/db';
import { getEffectiveKey, getEffectiveDuration, getEffectiveNotes, getVersionName, formatDuration, calculateSetDuration } from '@/lib/helpers';
import KeyBadge from '@/components/features/KeyBadge';
import TagBadge from '@/components/features/TagBadge';
import type { Gig, Song } from '@/types';

export default function SharedView() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [gig, setGig] = useState<Gig | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchSharedGig(token)
      .then((result) => {
        if (result) { setGig(result.gig); setSongs(result.songs); }
      })
      .catch((err) => console.error('Failed to load shared gig:', err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <p className="text-3xl opacity-30">🎵</p>
        <p className="text-muted-foreground">This setlist could not be found.</p>
        <Link to="/" className="text-primary hover:underline text-sm">Go Home</Link>
      </div>
    );
  }

  const dateStr = new Date(gig.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">♪</span>
            <span className="text-xs text-muted-foreground font-medium">Setlist Builder</span>
          </div>
          <h1 className="font-extrabold text-2xl" style={{ fontFamily: 'Syne, sans-serif' }}>{gig.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>📅 {dateStr}</span>
            <span>📍 {gig.venue}</span>
            {gig.client && <span>👤 {gig.client}</span>}
          </div>
          {gig.notes && <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{gig.notes}</p>}
        </div>
        {gig.sets.map((set, si) => {
          const dur = calculateSetDuration(set, songs, gig.bufferTime);
          return (
            <div key={set.id} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{set.name}</h2>
                <span className="text-xs text-muted-foreground font-mono">⏱ {formatDuration(dur.total)} / {set.targetDuration}m</span>
              </div>
              <div className="space-y-2">
                {set.entries.map((entry, ei) => {
                  const song = songs.find((s) => s.id === entry.songId);
                  if (!song) return null;
                  const key = getEffectiveKey(song, entry.versionId, entry.keyOverride);
                  const duration = getEffectiveDuration(song, entry.versionId);
                  const entryNotes = getEffectiveNotes(song, entry.versionId);
                  const version = getVersionName(song, entry.versionId);
                  return (
                    <div key={entry.id} className="border border-border rounded-lg p-3 bg-card/50 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-mono">{ei + 1}.</span>
                            <span className="font-medium text-sm">{song.title}</span>
                            {version && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{version}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground ml-5">{song.artist}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <KeyBadge musicKey={key} />
                          <span className="text-xs font-mono text-muted-foreground">{formatDuration(duration)}</span>
                        </div>
                      </div>
                      {song.tags.length > 0 && <div className="flex flex-wrap gap-1 ml-5">{song.tags.map((t) => <TagBadge key={t} tag={t} />)}</div>}
                      {entryNotes && <div className="flex items-start gap-1.5 ml-5 text-xs text-muted-foreground">📝 {entryNotes}</div>}
                      {(song.audioLink || song.chartLink) && (
                        <div className="flex items-center gap-2 ml-5">
                          {song.audioLink && <a href={song.audioLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">🎧 Audio ↗</a>}
                          {song.chartLink && <a href={song.chartLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">📄 Chart ↗</a>}
                        </div>
                      )}
                    </div>
                  );
                })}
                {set.entries.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No songs in this set</p>}
              </div>
              {si < gig.sets.length - 1 && <div className="h-px bg-border mt-6" />}
            </div>
          );
        })}
        <div className="text-center py-8 text-xs text-muted-foreground">Powered by Setlist Builder</div>
      </div>
    </div>
  );
}
