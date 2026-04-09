import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGigStore } from '@/stores/gigStore';
import SetPanel from '@/components/features/SetPanel';
import SongPicker from '@/components/features/SongPicker';
import GigFormDialog from '@/components/features/GigFormDialog';
import { showToast } from '@/lib/toast';
import { updateGigDb, addSetDb } from '@/lib/db';

export default function GigBuilder() {
  const { gigId } = useParams<{ gigId: string }>();
  const navigate = useNavigate();
  const gig = useGigStore((s) => s.gigs.find((g) => g.id === gigId));
  const { updateGig, addSetLocal } = useGigStore();
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);

  if (!gig) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      <p className="text-muted-foreground">Gig not found</p>
      <Button variant="outline" onClick={() => navigate('/')}>Go to Dashboard</Button>
    </div>
  );

  const canEdit = !gig.isLocked;
  const effectiveActiveSetId = activeSetId || (gig.sets.length > 0 ? gig.sets[0].id : null);
  const activeSetName = gig.sets.find((s) => s.id === effectiveActiveSetId)?.name || 'No set selected';

  const handleLockToggle = async () => {
    try {
      await updateGigDb(gig.id, { is_locked: !gig.isLocked });
      updateGig(gig.id, { isLocked: !gig.isLocked });
      showToast(gig.isLocked ? 'Setlist unlocked' : 'Setlist locked');
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleCopyShareLink = () => {
    if (gig.shareToken) {
      navigator.clipboard.writeText(`${window.location.origin}/share/${gig.shareToken}`);
      showToast('Share link copied');
    }
  };

  const handleAddSet = async () => {
    try {
      const newSet = await addSetDb(gig.id, `Set ${gig.sets.length + 1}`, 45, gig.sets.length);
      addSetLocal(gig.id, newSet);
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleBufferChange = async (value: number) => {
    try {
      await updateGigDb(gig.id, { buffer_time: value });
      updateGig(gig.id, { bufferTime: value });
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const dateStr = new Date(gig.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-2 sm:space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
              <button className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground shrink-0" onClick={() => navigate('/')}>←</button>
              <h1 className="font-bold text-base sm:text-lg md:text-xl truncate" style={{ fontFamily: 'Syne, sans-serif' }}>{gig.name}</h1>
              {gig.isLocked && <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full shrink-0">🔒 Locked</span>}
              {gig.isLocked && <span className="sm:hidden text-amber-400 text-xs shrink-0">🔒</span>}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground ml-9 sm:ml-9">
              <span>{dateStr}</span><span className="truncate">{gig.venue}</span>
            </div>
          </div>

          {/* Desktop action buttons */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap shrink-0">
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleLockToggle}>{gig.isLocked ? '🔓 Unlock' : '🔒 Lock'}</Button>
            <Link to={`/gig/${gig.id}/live`}><Button variant="outline" size="sm" className="text-xs h-8">▶ Live</Button></Link>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleCopyShareLink}>🔗 Share</Button>
            <Link to={`/gig/${gig.id}/print`}><Button variant="outline" size="sm" className="text-xs h-8">🖨 Print</Button></Link>
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setEditDialogOpen(true)}>⚙ Edit</Button>
          </div>

          {/* Mobile: compact action menu */}
          <div className="sm:hidden relative shrink-0">
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground active:bg-accent" onClick={() => setShowActions(!showActions)}>⋯</button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg p-1.5 min-w-[11rem]">
                  <button type="button" className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg active:bg-accent" onClick={() => { handleLockToggle(); setShowActions(false); }}>{gig.isLocked ? '🔓 Unlock' : '🔒 Lock'}</button>
                  <Link to={`/gig/${gig.id}/live`} onClick={() => setShowActions(false)} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg active:bg-accent">▶ Live Mode</Link>
                  <button type="button" className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg active:bg-accent" onClick={() => { handleCopyShareLink(); setShowActions(false); }}>🔗 Share Link</button>
                  <Link to={`/gig/${gig.id}/print`} onClick={() => setShowActions(false)} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg active:bg-accent">🖨 Print</Link>
                  <div className="h-px bg-border my-1" />
                  <button type="button" className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg active:bg-accent" onClick={() => { setEditDialogOpen(true); setShowActions(false); }}>⚙ Edit Gig</button>
                </div>
              </>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3 ml-9 sm:ml-9">
            <Label className="text-xs text-muted-foreground">Buffer:</Label>
            <Input type="number" value={gig.bufferTime} onChange={(e) => handleBufferChange(parseInt(e.target.value) || 0)} className="w-16 h-8 text-xs font-mono text-center" min={0} max={120} />
            <span className="text-xs text-muted-foreground">sec</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 pb-24 lg:pb-6">
          {gig.sets.map((set) => (
            <SetPanel key={set.id} set={set} gigId={gig.id} allSets={gig.sets} bufferTime={gig.bufferTime}
              canEdit={canEdit} isActive={set.id === effectiveActiveSetId}
              onActivate={() => setActiveSetId(set.id)} onAddSong={() => { setActiveSetId(set.id); setPickerOpen(true); }} />
          ))}
          {canEdit && <button className="w-full py-3.5 rounded-xl border border-dashed border-border text-muted-foreground active:text-primary active:border-primary/30 hover:text-primary hover:border-primary/30 transition-colors text-sm font-medium" onClick={handleAddSet}>+ Add New Set</button>}
          {gig.sets.length === 0 && (
            <div className="text-center py-12 sm:py-16 border border-dashed border-border rounded-xl">
              <p className="text-3xl mb-3 opacity-30">🎵</p>
              <p className="text-sm text-muted-foreground mb-3">No sets yet.</p>
              {canEdit && <Button size="sm" className="h-9 min-w-[44px]" onClick={handleAddSet}>+ Add Set</Button>}
            </div>
          )}
        </div>

        {/* Desktop song picker sidebar */}
        {canEdit && (
          <div className="hidden lg:flex w-80 flex-col border-l border-border shrink-0">
            <SongPicker gigId={gig.id} activeSetId={effectiveActiveSetId} activeSetName={activeSetName} allSets={gig.sets} />
          </div>
        )}
      </div>

      {/* Mobile song picker overlay */}
      {canEdit && pickerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/80" onClick={() => setPickerOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-background border-l border-border shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-border safe-area-top">
              <span className="text-sm font-semibold">Song Picker</span>
              <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent active:bg-accent" onClick={() => setPickerOpen(false)}>✕</button>
            </div>
            <div className="h-[calc(100%-49px)]">
              <SongPicker gigId={gig.id} activeSetId={effectiveActiveSetId} activeSetName={activeSetName} allSets={gig.sets} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      {canEdit && !pickerOpen && (
        <div className="lg:hidden fixed bottom-6 right-4 z-40 safe-area-bottom">
          <button className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center text-2xl font-bold active:scale-95 transition-transform" onClick={() => setPickerOpen(true)}>+</button>
        </div>
      )}

      <GigFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} gig={gig} />
    </div>
  );
}
