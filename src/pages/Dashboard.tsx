import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSongStore } from '@/stores/songStore';
import { useGigStore } from '@/stores/gigStore';
import { useAppStore } from '@/stores/appStore';
import { useTemplateStore } from '@/stores/templateStore';
import GigCard from '@/components/features/GigCard';
import GigFormDialog from '@/components/features/GigFormDialog';
import TemplateManager from '@/components/features/TemplateManager';

export default function Dashboard() {
  const songs = useSongStore((s) => s.songs);
  const gigs = useGigStore((s) => s.gigs);
  const role = useAppStore((s) => s.role);
  const templates = useTemplateStore((s) => s.templates);
  const [gigDialogOpen, setGigDialogOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const totalDurHours = Math.round((songs.reduce((a, s) => a + s.defaultDuration, 0) / 3600) * 10) / 10;
  const totalSets = gigs.reduce((a, g) => a + g.sets.length, 0);
  const sortedGigs = [...gigs].sort((a, b) => a.date.localeCompare(b.date));

  const stats = [
    { icon: '🎵', label: 'Songs', value: songs.length },
    { icon: '📅', label: 'Gigs', value: gigs.length },
    { icon: '🎼', label: 'Sets', value: totalSets },
    { icon: '⏱', label: 'Hours of Music', value: totalDurHours },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="relative rounded-2xl overflow-hidden h-48 md:h-56 bg-gradient-to-r from-background via-card to-primary/10">
        <div className="relative flex flex-col justify-center h-full px-6 md:px-10 max-w-xl">
          <h1 className="font-extrabold text-2xl md:text-3xl tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Your Setlists, Ready to Perform</h1>
          <p className="text-sm text-muted-foreground mt-2">Build, manage, and perform setlists with confidence.</p>
          {role === 'leader' && (
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setGigDialogOpen(true)} size="sm">+ New Gig</Button>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="border border-border rounded-xl p-4 bg-card flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-lg">{s.icon}</div>
            <div>
              <p className="text-lg font-bold tabular-nums" style={{ fontFamily: 'Syne, sans-serif' }}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 border-b border-border">
        <button type="button" className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${!showTemplates ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => setShowTemplates(false)}>Gigs</button>
        <button type="button" className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${showTemplates ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => setShowTemplates(true)}>
          📋 Setlist Templates
          {templates.length > 0 && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-mono">{templates.length}</span>}
        </button>
      </div>
      {!showTemplates ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Gigs</h2>
            {role === 'leader' && <Button variant="outline" size="sm" onClick={() => setGigDialogOpen(true)} className="text-xs">+ Create Gig</Button>}
          </div>
          {sortedGigs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{sortedGigs.map((gig) => <GigCard key={gig.id} gig={gig} />)}</div>
          ) : (
            <div className="text-center py-16 border border-dashed border-border rounded-xl">
              <p className="text-3xl mb-3 opacity-30">📅</p>
              <p className="text-sm text-muted-foreground mb-3">No gigs yet.</p>
              {role === 'leader' && <Button onClick={() => setGigDialogOpen(true)} size="sm">+ Create Gig</Button>}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Setlist Templates</h2>
            <p className="text-xs text-muted-foreground">Save templates from the Gig Builder</p>
          </div>
          <TemplateManager />
        </div>
      )}
      <GigFormDialog open={gigDialogOpen} onOpenChange={setGigDialogOpen} />
    </div>
  );
}
