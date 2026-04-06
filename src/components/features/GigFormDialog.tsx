import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGigStore } from '@/stores/gigStore';
import { useTemplateStore } from '@/stores/templateStore';
import { useSongStore } from '@/stores/songStore';
import { GIG_TEMPLATES, DEFAULT_BUFFER_TIME } from '@/constants/config';
import { generateId, formatDuration } from '@/lib/helpers';
import { showToast } from '@/lib/toast';
import type { Gig, SetlistTemplate } from '@/types';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; gig?: Gig | null; }
interface SetForm { name: string; targetDuration: number; }

export default function GigFormDialog({ open, onOpenChange, gig }: Props) {
  const navigate = useNavigate();
  const { addGig, updateGig } = useGigStore();
  const { templates: setlistTemplates } = useTemplateStore();
  const songs = useSongStore((s) => s.songs);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [client, setClient] = useState('');
  const [notes, setNotes] = useState('');
  const [template, setTemplate] = useState('custom');
  const [sets, setSets] = useState<SetForm[]>([{ name: 'Set 1', targetDuration: 45 }, { name: 'Set 2', targetDuration: 45 }]);
  const [selectedSetlistTemplate, setSelectedSetlistTemplate] = useState<SetlistTemplate | null>(null);

  useEffect(() => {
    if (gig) {
      setName(gig.name); setDate(gig.date); setVenue(gig.venue); setClient(gig.client || ''); setNotes(gig.notes || '');
      setTemplate(gig.template || 'custom');
      setSets(gig.sets.map((s) => ({ name: s.name, targetDuration: s.targetDuration })));
      setSelectedSetlistTemplate(null);
    } else {
      setName(''); setDate(''); setVenue(''); setClient(''); setNotes(''); setTemplate('custom');
      setSets([{ name: 'Set 1', targetDuration: 45 }, { name: 'Set 2', targetDuration: 45 }]);
      setSelectedSetlistTemplate(null);
    }
  }, [gig, open]);

  const handleTemplateChange = (val: string) => {
    setTemplate(val); setSelectedSetlistTemplate(null);
    if (val !== 'custom' && !val.startsWith('setlist:')) {
      const t = GIG_TEMPLATES.find((x) => x.id === val);
      if (t) setSets(t.sets.map((s) => ({ ...s })));
    }
    if (val.startsWith('setlist:')) {
      const tId = val.replace('setlist:', '');
      const st = setlistTemplates.find((x) => x.id === tId);
      if (st) { setSelectedSetlistTemplate(st); setSets(st.sets.map((s) => ({ name: s.name, targetDuration: s.targetDuration }))); }
    }
  };

  const handleSave = () => {
    if (!name.trim() || !venue.trim() || !date) { showToast('Name, date, and venue are required', 'error'); return; }
    if (gig) {
      updateGig(gig.id, { name: name.trim(), date, venue: venue.trim(), client: client.trim() || undefined, notes: notes.trim() || undefined, template });
      showToast('Gig updated'); onOpenChange(false);
    } else {
      const gigSets = selectedSetlistTemplate
        ? selectedSetlistTemplate.sets.map((s) => ({ id: generateId(), name: s.name, targetDuration: s.targetDuration, entries: s.entries.map((e) => ({ id: generateId(), songId: e.songId, versionId: e.versionId, keyOverride: e.keyOverride })), collapsed: false }))
        : sets.map((s) => ({ id: generateId(), name: s.name, targetDuration: s.targetDuration, entries: [], collapsed: false }));
      const id = addGig({ name: name.trim(), date, venue: venue.trim(), client: client.trim() || undefined, notes: notes.trim() || undefined, template, bufferTime: DEFAULT_BUFFER_TIME, sets: gigSets });
      showToast(selectedSetlistTemplate ? 'Gig created from setlist template' : 'Gig created');
      onOpenChange(false); navigate(`/gig/${id}`);
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
                      {setlistTemplates.length > 0 && (
                        <>
                          <div className="h-px bg-border my-1" />
                          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">📋 Saved Setlist Templates</div>
                          {setlistTemplates.map((st) => (
                            <SelectItem key={`setlist:${st.id}`} value={`setlist:${st.id}`}>
                              {st.name} ({st.sets.reduce((a, s) => a + s.entries.length, 0)} songs)
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {selectedSetlistTemplate && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                    <span className="text-xs font-semibold text-primary">📋 Setlist template: includes songs</span>
                    {selectedSetlistTemplate.sets.map((s, i) => {
                      const dur = s.entries.reduce((a, e) => { const song = songs.find((x) => x.id === e.songId); return a + (song?.defaultDuration || 0); }, 0);
                      return <div key={i} className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{s.name}</span> — {s.entries.length} songs · {formatDuration(dur)}</div>;
                    })}
                    {selectedSetlistTemplate.description && <p className="text-[11px] text-muted-foreground italic">{selectedSetlistTemplate.description}</p>}
                  </div>
                )}
                {!selectedSetlistTemplate && (
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
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{gig ? 'Save Changes' : 'Create Gig'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
