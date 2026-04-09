import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSongStore } from '@/stores/songStore';
import { useGigStore } from '@/stores/gigStore';
import GigCard from '@/components/features/GigCard';
import GigFormDialog from '@/components/features/GigFormDialog';

export default function Dashboard() {
  const songs = useSongStore((s) => s.songs);
  const gigs = useGigStore((s) => s.gigs);
  const [gigDialogOpen, setGigDialogOpen] = useState(false);

  const totalDurHours = Math.round((songs.reduce((a, s) => a + s.defaultDuration, 0) / 3600) * 10) / 10;
  const totalSets = gigs.reduce((a, g) => a + g.sets.length, 0);
  const sortedGigs = [...gigs].sort((a, b) => a.date.localeCompare(b.date));

  const stats = [
    { icon: '🎵', label: 'Songs', value: songs.length },
    { icon: '📅', label: 'Gigs', value: gigs.length },
    { icon: '🎼', label: 'Sets', value: totalSets },
    { icon: '⏱', label: 'Hours', value: totalDurHours },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-6 pb-24 sm:pb-6">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden h-36 sm:h-48 md:h-56 bg-gradient-to-r from-background via-card to-primary/10">
        <div className="relative flex flex-col justify-center h-full px-5 sm:px-6 md:px-10 max-w-xl">
          <h1 className="font-extrabold text-xl sm:text-2xl md:text-3xl tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Your Setlists, Ready to Perform</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">Build, manage, and perform setlists with confidence.</p>
          <div className="flex gap-2 mt-3 sm:mt-4">
            <Button onClick={() => setGigDialogOpen(true)} size="sm" className="h-9 min-w-[44px]">+ New Gig</Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {stats.map((s) => (
          <div key={s.label} className="border border-border rounded-xl p-3 sm:p-4 bg-card flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-base sm:text-lg">{s.icon}</div>
            <div>
              <p className="text-base sm:text-lg font-bold tabular-nums" style={{ fontFamily: 'Syne, sans-serif' }}>{s.value}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gigs */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-bold text-base sm:text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Gigs</h2>
          <Button variant="outline" size="sm" onClick={() => setGigDialogOpen(true)} className="text-xs h-9 min-w-[44px]">+ Create Gig</Button>
        </div>
        {sortedGigs.length > 0 ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">{sortedGigs.map((gig) => <GigCard key={gig.id} gig={gig} />)}</div>
        ) : (
          <div className="text-center py-12 sm:py-16 border border-dashed border-border rounded-xl">
            <p className="text-3xl mb-3 opacity-30">📅</p>
            <p className="text-sm text-muted-foreground mb-3">No gigs yet.</p>
            <Button onClick={() => setGigDialogOpen(true)} size="sm" className="h-9 min-w-[44px]">+ Create Gig</Button>
          </div>
        )}
      </div>
      <GigFormDialog open={gigDialogOpen} onOpenChange={setGigDialogOpen} />
    </div>
  );
}
