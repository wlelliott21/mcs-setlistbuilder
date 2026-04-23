import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGigStore } from '@/stores/gigStore';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { createGig, updateGigDb, deleteGigDb } from '@/lib/db';
import { GIG_TEMPLATES, DEFAULT_BUFFER_TIME } from '@/constants/config';
import { showToast } from '@/lib/toast';
import type { Gig } from '@/types';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; gig?: Gig | null; }
interface SetForm { name: string; targetDuration: number; }

export default function GigFormDialog({ open, onOpenChange, gig }: Props) {
  const navigate = useNavigate();
  const { addGig, updateGig, deleteGig } = useGigStore();
  const { user } = useAuth();
  const { activeOwnerId } = useWorkspaceStore();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [client, setClient] = useState('');
  const [notes, setNotes] = useState('');
  const [template, setTemplate] = useState('custom');
  const [sets, setSets] = useState<SetForm[]>([{ name: 'Set 1', targetDuration: 45 }, { name: 'Set 2', targetDuration: 45 }]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (gig) {
      setName(gig.name); setDate(gig.date); setVenue(gig.venue); setClient(gig.client || ''); setNotes(gig.notes || '');
      setTemplate('custom');
      setSets(gig.sets.map((s) => ({ name: s.name, targetDuration: s.targetDuration })));
    } else {
      setName(''); setDate(''); setVenue(''); setClient(''); setNotes(''); setTemplate('custom');
      setSets([{ name: 'Set 1', targetDuration: 45 }, { name: 'Set 2', targetDuration: 45 }]);
    }
    setConfirmDelete(false);
  }, [gig, open]);

  const handleTemplateChange = (val: string) => {
    setTemplate(val);
    if (val !== 'custom') {
      const t = GIG_TEMPLATES.find((x) => x.id === val);
      if (t) setSets(t.sets.map((s) => ({ ...s })));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !venue.trim() || !date) { showToast('Name, date, and venue are required', 'error'); return; }
    if (!user) return;
    setSaving(true);
    const effectiveUserId = activeOwnerId || user.id;

    try {
      if (gig) {
        await updateGigDb(gig.id, { name: name.trim(), date, venue: venue.trim(), client: client.trim() || null, notes: notes.trim() || null });
        updateGig(gig.id, { name: name.trim(), date, venue: venue.trim(), client: client.trim() || undefined, notes: notes.trim() || undefined });
        showToast('Gig updated');
      } else {
        const newGig = await createGig(effectiveUserId, {
          name: name.trim(), date, venue: venue.trim(), client: client.trim() || undefined,
          notes: notes.trim() || undefined, bufferTime: DEFAULT_BUFFER_TIME,
          sets: sets.map((s) => ({ name: s.name, targetDuration: s.targetDuration })),
        });
        addGig(newGig);
        showToast('Gig created');
        navigate(`/gig/${newGig.id}`);
      }
      onOpenChange(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!gig) return;
    setSaving(true);
    try {
      await deleteGigDb(gig.id);
      deleteGig(gig.id);
      showToast('Gig deleted');
      onOpenChange(false);
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Syne, sans-serif' }}>{gig ? 'Edit Gig' : 'Create New Gig'}</DialogTitle>
          <DialogDescription className="sr-only">{gig ? 'Edit gig details' : 'Create a new gig'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label>Gig Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Johnson Wedding" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Venue *</Label><Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue name" /></div>
          </div>
          <div className="space-y-1.5"><Label>Client</Label><Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client name (optional)" /></div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Load-in time, special requests…" rows={2} /></div>
          {!gig && (
            <>
              <div className="h-px bg-border" />
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Template</Label>
                  <Select value={template} onValueChange={handleTemplateChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom (empty sets)</SelectItem>
                      {GIG_TEMPLATES.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Sets</Label>
                  {sets.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input value={s.name} onChange={(e) => setSets((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="flex-1 h-8 text-sm" />
                      <div className="flex items-center gap-1">
                        <Input type="number" value={s.targetDuration} onChange={(e) => setSets((prev) => prev.map((x, j) => j === i ? { ...x, targetDuration: parseInt(e.target.value) || 30 } : x))} className="w-16 h-8 text-sm font-mono text-center" />
                        <span className="text-xs text-muted-foreground">min</span>
                      </div>
                      {sets.length > 1 && <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground" onClick={() => setSets((prev) => prev.filter((_, j) => j !== i))}>✕</button>}
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSets((prev) => [...prev, { name: `Set ${prev.length + 1}`, targetDuration: 45 }])}>+ Add Set</Button>
                </div>
              </div>
            </>
          )}
          {gig && (
            <div className="pt-2 border-t border-border">
              {!confirmDelete ? (
                <button className="text-xs text-destructive hover:underline" onClick={() => setConfirmDelete(true)}>Delete this gig</button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-destructive">Are you sure?</span>
                  <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={handleDelete} disabled={saving}>Delete</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : gig ? 'Save Changes' : 'Create Gig'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
